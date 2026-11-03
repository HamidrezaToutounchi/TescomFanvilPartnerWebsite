'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { z } = require('zod');

const {
  Lead,
  AllowedIp,
  AdminUser,
  MailSettings,
  MailRecipient,
  MailJob,
  AuditLog
} = require('./models');
const {
  encryptSecret,
  escapeHtml,
  escapeRegex,
  escapeCsvCell
} = require('./cryptoUtils');
const {
  getBootstrapIps,
  validateIpOrCidr,
  invalidateAllowedIpCache,
  requireAllowedIp
} = require('./ipAllowlist');
const { sendMailWithSettings } = require('./mailer');
const { enqueueLeadMailJob } = require('./outboxWorker');

const router = express.Router();

// ---------------------------------------------------------------------------
// Helper: Record Audit Log
// ---------------------------------------------------------------------------
async function writeAuditLog(req, action, details = '', explicitActor = null) {
  try {
    const actor =
      explicitActor || req.session?.adminUser?.username || 'anonymous';
    const ip = req.clientIpNormalized || req.ip || '';
    await AuditLog.create({
      actor: String(actor).slice(0, 80),
      action: String(action).slice(0, 80),
      details: String(details).slice(0, 1000),
      ip: String(ip).slice(0, 100),
      createdAt: new Date()
    });
  } catch (err) {
    console.error('[ERROR] Failed to write audit log:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Helper: Compute Graph Secret Expiry Warning (within 30 days)
// ---------------------------------------------------------------------------
async function getSecretExpiryWarning() {
  try {
    const doc = await MailSettings.findOne({ key: 'default' }).lean();
    if (!doc || !doc.secretExpiresAt) return null;
    const expiresAt = new Date(doc.secretExpiresAt);
    const diffMs = expiresAt.getTime() - Date.now();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (daysLeft <= 30) {
      return {
        expiresAt: expiresAt.toISOString(),
        daysLeft,
        expired: daysLeft <= 0
      };
    }
    return null;
  } catch (_err) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 1. Middleware Order: IP Allowlist -> Security Headers -> Origin Check
// ---------------------------------------------------------------------------
router.use(requireAllowedIp);

router.use((_req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// CSRF protection: Verify Origin header on all state-changing requests
router.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.get('origin') || '';
    const allowedOrigins = new Set([
      'https://fanvilpartner.com',
      'https://www.fanvilpartner.com'
    ]);
    if (process.env.PUBLIC_BASE_URL) {
      allowedOrigins.add(process.env.PUBLIC_BASE_URL.replace(/\/+$/, ''));
    }
    if (!origin || !allowedOrigins.has(origin)) {
      return res.status(403).json({
        ok: false,
        error: 'Geçersiz istek kaynağı (Origin doğrulaması başarısız).'
      });
    }
  }
  return next();
});

// ---------------------------------------------------------------------------
// 2. Auth Middlewares
// ---------------------------------------------------------------------------
function requireAuth(req, res, next) {
  if (!req.session || !req.session.adminUser) {
    return res.status(401).json({
      ok: false,
      error: 'Oturum süresi doldu veya giriş yapılmadı.'
    });
  }
  return next();
}

function requireAdminRole(req, res, next) {
  if (!req.session || !req.session.adminUser) {
    return res.status(401).json({
      ok: false,
      error: 'Giriş yapmanız gerekiyor.'
    });
  }
  if (req.session.adminUser.role !== 'admin') {
    return res.status(403).json({
      ok: false,
      error: 'Bu işlem için yönetici (admin) yetkisi gereklidir.'
    });
  }
  return next();
}

// ---------------------------------------------------------------------------
// 3. Login Rate Limiter (5 attempts per 15 minutes per IP)
// ---------------------------------------------------------------------------
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.clientIpNormalized || req.ip,
  message: {
    ok: false,
    error: 'Çok fazla başarısız giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.'
  }
});

// ---------------------------------------------------------------------------
// 4. Auth Endpoints
// ---------------------------------------------------------------------------
router.get('/me', async (req, res) => {
  const isAuthenticated = Boolean(req.session && req.session.adminUser);
  const secretWarning = isAuthenticated ? await getSecretExpiryWarning() : null;
  return res.json({
    ok: true,
    authenticated: isAuthenticated,
    user: isAuthenticated ? req.session.adminUser : null,
    clientIp: req.clientIpNormalized || req.ip,
    secretExpiryWarning: secretWarning
  });
});

const loginSchema = z
  .object({
    username: z.string().trim().min(1).max(60),
    password: z.string().min(1).max(200)
  })
  .strict();

router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: 'Kullanıcı adı ve şifre alanları zorunludur.'
      });
    }

    const username = parsed.data.username.toLowerCase();
    const password = parsed.data.password;

    const user = await AdminUser.findOne({ username });
    if (!user) {
      await writeAuditLog(req, 'login_failed', `Kullanıcı bulunamadı: ${username}`, username);
      return res.status(401).json({
        ok: false,
        error: 'Kullanıcı adı veya şifre hatalı.'
      });
    }

    // Check 30-minute account lockout after 10 failed attempts
    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      await writeAuditLog(
        req,
        'login_failed',
        `Kilitli hesaba giriş denemesi (${minutesLeft} dk kaldı)`,
        username
      );
      return res.status(423).json({
        ok: false,
        error: `Hesap çok fazla hatalı deneme nedeniyle kilitlendi. ${minutesLeft} dakika sonra tekrar deneyin.`
      });
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      const nextFailures = (user.failedAttempts || 0) + 1;
      const updateFields = { failedAttempts: nextFailures };
      if (nextFailures >= 10) {
        updateFields.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        updateFields.failedAttempts = 0;
      }
      await AdminUser.updateOne({ _id: user._id }, { $set: updateFields });
      await writeAuditLog(
        req,
        'login_failed',
        `Hatalı şifre denemesi (${nextFailures}/10)`,
        username
      );
      return res.status(401).json({
        ok: false,
        error: 'Kullanıcı adı veya şifre hatalı.'
      });
    }

    // Successful login: reset failedAttempts, update lastLoginAt & lastLoginIp
    const loginIp = req.clientIpNormalized || req.ip || '';
    await AdminUser.updateOne(
      { _id: user._id },
      {
        $set: {
          failedAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
          lastLoginIp: loginIp
        }
      }
    );

    const sessionUser = {
      id: String(user._id),
      username: user.username,
      role: user.role
    };

    req.session.regenerate((regenErr) => {
      if (regenErr) {
        console.error('[ERROR] Session regenerate error:', regenErr);
        return res.status(500).json({ ok: false, error: 'Oturum başlatılamadı.' });
      }
      req.session.adminUser = sessionUser;
      req.session.save(async (saveErr) => {
        if (saveErr) {
          console.error('[ERROR] Session save error:', saveErr);
          return res.status(500).json({ ok: false, error: 'Oturum kaydedilemedi.' });
        }
        await writeAuditLog(req, 'login_success', `Giriş başarılı (rol: ${user.role})`, user.username);
        const secretWarning = await getSecretExpiryWarning();
        return res.json({
          ok: true,
          user: sessionUser,
          clientIp: loginIp,
          secretExpiryWarning: secretWarning
        });
      });
    });
  } catch (err) {
    console.error('[ERROR] POST /api/admin/login:', err);
    return res.status(500).json({ ok: false, error: 'Sunucu hatası oluştu.' });
  }
});

router.post('/logout', requireAuth, async (req, res) => {
  const username = req.session?.adminUser?.username || 'unknown';
  await writeAuditLog(req, 'logout', 'Oturum kapatıldı', username);
  req.session.destroy(() => {
    res.clearCookie('fvl_admin', {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict'
    });
    return res.json({ ok: true });
  });
});

// ---------------------------------------------------------------------------
// 5. Leads Endpoints (List, CSV Export, Detail, Status, Notes, Resend Mail)
// ---------------------------------------------------------------------------
function buildLeadsFilter(query) {
  const filter = {};

  if (
    query.requestType &&
    ['bilgi', 'proje', 'bayi', 'demo'].includes(String(query.requestType))
  ) {
    filter.requestType = String(query.requestType);
  }

  if (
    query.status &&
    ['new', 'contacted', 'quoted', 'won', 'lost'].includes(String(query.status))
  ) {
    filter.status = String(query.status);
  }

  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) {
      const fromDate = new Date(`${String(query.from).slice(0, 10)}T00:00:00.000+03:00`);
      if (!Number.isNaN(fromDate.getTime())) {
        filter.createdAt.$gte = fromDate;
      }
    }
    if (query.to) {
      const toDate = new Date(`${String(query.to).slice(0, 10)}T23:59:59.999+03:00`);
      if (!Number.isNaN(toDate.getTime())) {
        filter.createdAt.$lte = toDate;
      }
    }
    if (Object.keys(filter.createdAt).length === 0) {
      delete filter.createdAt;
    }
  }

  if (query.q && typeof query.q === 'string' && query.q.trim()) {
    const safePattern = escapeRegex(query.q.trim().slice(0, 100));
    const regex = new RegExp(safePattern, 'i');
    filter.$or = [
      { fullName: regex },
      { company: regex },
      { email: regex },
      { phone: regex },
      { refCode: regex }
    ];
  }

  return filter;
}

router.get('/leads', requireAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = 25;
    const skip = (page - 1) * limit;

    const filter = buildLeadsFilter(req.query);

    const [total, items, unreadCount] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Lead.countDocuments({ isRead: false })
    ]);

    // Attach latest mail job status for each lead in current page
    const leadIds = items.map((l) => l._id);
    const jobs = await MailJob.find({ leadId: { $in: leadIds } })
      .sort({ createdAt: -1 })
      .lean();

    const jobMap = new Map();
    for (const j of jobs) {
      const key = String(j.leadId);
      if (!jobMap.has(key)) {
        jobMap.set(key, {
          status: j.status,
          attempts: j.attempts,
          lastError: j.lastError,
          sentAt: j.sentAt
        });
      }
    }

    const enrichedItems = items.map((item) => ({
      ...item,
      mailStatus: jobMap.get(String(item._id)) || null
    }));

    return res.json({
      ok: true,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      unreadCount,
      items: enrichedItems
    });
  } catch (err) {
    console.error('[ERROR] GET /api/admin/leads:', err);
    return res.status(500).json({ ok: false, error: 'Lead listesi alınamadı.' });
  }
});

router.get('/leads/export.csv', requireAuth, async (req, res) => {
  try {
    const filter = buildLeadsFilter(req.query);
    const leads = await Lead.find(filter).sort({ createdAt: -1 }).limit(10000).lean();

    await writeAuditLog(
      req,
      'csv_exported',
      `${leads.length} adet lead CSV olarak dışa aktarıldı.`
    );

    const headers = [
      'Referans Kodu',
      'Tarih (İstanbul)',
      'Durum',
      'Talep Tipi',
      'Ad Soyad',
      'Firma / Kurum',
      'E-Posta',
      'Telefon',
      'Ürün / Çözüm',
      'Adet / Ölçek',
      'Santral (PBX)',
      'Proje Adı',
      'Mesaj',
      'Sepet Kalemleri',
      'IP Adresi'
    ];

    const lines = [headers.map(escapeCsvCell).join(',')];

    for (const l of leads) {
      const dateStr = new Date(l.createdAt).toLocaleString('tr-TR', {
        timeZone: 'Europe/Istanbul'
      });
      const cartStr = Array.isArray(l.cartSnapshot)
        ? l.cartSnapshot.map((c) => `${c.model} (${c.qty} Adet)`).join(' | ')
        : '';

      const row = [
        l.refCode,
        dateStr,
        l.status,
        l.requestType,
        l.fullName,
        l.company,
        l.email,
        l.phone,
        l.selectedProduct,
        l.quantity,
        l.pbxSystem,
        l.projectName,
        l.message,
        cartStr,
        l.ip
      ];
      lines.push(row.map(escapeCsvCell).join(','));
    }

    // UTF-8 BOM (\uFEFF) so Microsoft Excel opens Turkish characters properly
    const csvContent = `\uFEFF${lines.join('\r\n')}`;
    const filename = `fanvil-leads-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('[ERROR] GET /api/admin/leads/export.csv:', err);
    return res.status(500).json({ ok: false, error: 'CSV dışa aktarma başarısız.' });
  }
});

router.get('/leads/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, error: 'Geçersiz lead ID.' });
    }

    const lead = await Lead.findByIdAndUpdate(
      id,
      { $set: { isRead: true } },
      { new: true }
    ).lean();

    if (!lead) {
      return res.status(404).json({ ok: false, error: 'Lead bulunamadı.' });
    }

    const mailJob = await MailJob.findOne({ leadId: lead._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      ok: true,
      lead,
      mailJob: mailJob || null
    });
  } catch (err) {
    console.error('[ERROR] GET /api/admin/leads/:id:', err);
    return res.status(500).json({ ok: false, error: 'Lead detayı alınamadı.' });
  }
});

const statusSchema = z
  .object({
    status: z.enum(['new', 'contacted', 'quoted', 'won', 'lost'])
  })
  .strict();

router.patch('/leads/:id/status', requireAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, error: 'Geçersiz lead ID.' });
    }

    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'Geçersiz durum değeri.' });
    }

    const lead = await Lead.findByIdAndUpdate(
      id,
      { $set: { status: parsed.data.status, isRead: true } },
      { new: true }
    ).lean();

    if (!lead) {
      return res.status(404).json({ ok: false, error: 'Lead bulunamadı.' });
    }

    await writeAuditLog(
      req,
      'lead_status_changed',
      `${lead.refCode} durumu '${parsed.data.status}' olarak güncellendi.`
    );

    return res.json({ ok: true, lead });
  } catch (err) {
    console.error('[ERROR] PATCH /api/admin/leads/:id/status:', err);
    return res.status(500).json({ ok: false, error: 'Durum güncellenemedi.' });
  }
});

const noteSchema = z
  .object({
    text: z.string().trim().min(1, 'Not boş olamaz.').max(2000, 'Not en fazla 2000 karakter olabilir.')
  })
  .strict();

router.post('/leads/:id/notes', requireAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, error: 'Geçersiz lead ID.' });
    }

    const parsed = noteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.issues?.[0]?.message || 'Geçersiz not.'
      });
    }

    const noteObj = {
      text: parsed.data.text,
      by: req.session.adminUser.username,
      at: new Date()
    };

    const lead = await Lead.findByIdAndUpdate(
      id,
      { $push: { notes: noteObj } },
      { new: true }
    ).lean();

    if (!lead) {
      return res.status(404).json({ ok: false, error: 'Lead bulunamadı.' });
    }

    await writeAuditLog(
      req,
      'lead_note_added',
      `${lead.refCode} kaydına iç not eklendi.`
    );

    return res.json({ ok: true, lead });
  } catch (err) {
    console.error('[ERROR] POST /api/admin/leads/:id/notes:', err);
    return res.status(500).json({ ok: false, error: 'Not eklenemedi.' });
  }
});

router.post('/leads/:id/resend-mail', requireAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, error: 'Geçersiz lead ID.' });
    }

    const lead = await Lead.findById(id).lean();
    if (!lead) {
      return res.status(404).json({ ok: false, error: 'Lead bulunamadı.' });
    }

    const job = await enqueueLeadMailJob(lead._id);
    await writeAuditLog(
      req,
      'lead_mail_resent',
      `${lead.refCode} için bildirim maili yeniden kuyruğa alındı.`
    );

    return res.json({
      ok: true,
      mailJob: job
    });
  } catch (err) {
    console.error('[ERROR] POST /api/admin/leads/:id/resend-mail:', err);
    return res.status(500).json({ ok: false, error: 'Mail kuyruğa alınamadı.' });
  }
});

// ---------------------------------------------------------------------------
// 6. Mail Settings Endpoints (role=admin ONLY)
// ---------------------------------------------------------------------------
router.get('/mail-settings', requireAdminRole, async (_req, res) => {
  try {
    let doc = await MailSettings.findOne({ key: 'default' }).lean();
    if (!doc) {
      doc = {
        mode: 'smtp',
        tenantId: '',
        clientId: '',
        clientSecretEnc: '',
        secretExpiresAt: null,
        graphFromAddress: '',
        graphFromName: 'Fanvil Gold Partner Portal',
        smtpHost: 'mail.dogrumail.com',
        smtpPort: 587,
        smtpSecurity: 'starttls',
        smtpUser: '',
        smtpPassEnc: '',
        smtpFromAddress: '',
        smtpFromName: 'Fanvil Gold Partner Portal'
      };
    }

    const secretWarning = await getSecretExpiryWarning();

    return res.json({
      ok: true,
      settings: {
        mode: doc.mode || 'smtp',
        tenantId: doc.tenantId || '',
        clientId: doc.clientId || '',
        hasClientSecret: Boolean(doc.clientSecretEnc),
        secretExpiresAt: doc.secretExpiresAt
          ? new Date(doc.secretExpiresAt).toISOString().slice(0, 10)
          : '',
        graphFromAddress: doc.graphFromAddress || '',
        graphFromName: doc.graphFromName || 'Fanvil Gold Partner Portal',
        smtpHost: doc.smtpHost || 'mail.dogrumail.com',
        smtpPort: doc.smtpPort || 587,
        smtpSecurity: doc.smtpSecurity || 'starttls',
        smtpUser: doc.smtpUser || '',
        hasSmtpPassword: Boolean(doc.smtpPassEnc),
        smtpFromAddress: doc.smtpFromAddress || '',
        smtpFromName: doc.smtpFromName || 'Fanvil Gold Partner Portal',
        updatedAt: doc.updatedAt || null,
        updatedBy: doc.updatedBy || ''
      },
      secretExpiryWarning: secretWarning
    });
  } catch (err) {
    console.error('[ERROR] GET /api/admin/mail-settings:', err);
    return res.status(500).json({ ok: false, error: 'Mail ayarları okunamadı.' });
  }
});

const mailSettingsZodSchema = z
  .object({
    mode: z.enum(['graph', 'smtp']),
    tenantId: z.string().trim().max(120).optional().default(''),
    clientId: z.string().trim().max(120).optional().default(''),
    clientSecret: z.string().max(500).optional().default(''),
    secretExpiresAt: z.string().trim().max(30).optional().default(''),
    graphFromAddress: z.string().trim().max(254).optional().default(''),
    graphFromName: z.string().trim().max(120).optional().default('Fanvil Gold Partner Portal'),
    smtpHost: z.string().trim().max(254).optional().default('smtp.office365.com'),
    smtpPort: z.number().int().min(1).max(65535).optional().default(587),
    smtpSecurity: z.enum(['starttls', 'tls']).optional().default('starttls'),
    smtpUser: z.string().trim().max(254).optional().default(''),
    smtpPassword: z.string().max(500).optional().default(''),
    smtpFromAddress: z.string().trim().max(254).optional().default(''),
    smtpFromName: z.string().trim().max(120).optional().default('Fanvil Gold Partner Portal')
  })
  .strict();

router.put('/mail-settings', requireAdminRole, async (req, res) => {
  try {
    const parsed = mailSettingsZodSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.issues?.[0]?.message || 'Geçersiz mail ayarları.'
      });
    }

    const data = parsed.data;
    const existing = await MailSettings.findOne({ key: 'default' });

    const updateObj = {
      key: 'default',
      mode: data.mode,
      tenantId: data.tenantId,
      clientId: data.clientId,
      secretExpiresAt: data.secretExpiresAt ? new Date(data.secretExpiresAt) : null,
      graphFromAddress: data.graphFromAddress,
      graphFromName: data.graphFromName || 'Fanvil Gold Partner Portal',
      smtpHost: data.smtpHost || 'smtp.office365.com',
      smtpPort: data.smtpPort || 587,
      smtpSecurity: data.smtpSecurity || 'starttls',
      smtpUser: data.smtpUser,
      smtpFromAddress: data.smtpFromAddress,
      smtpFromName: data.smtpFromName || 'Fanvil Gold Partner Portal',
      updatedAt: new Date(),
      updatedBy: req.session.adminUser.username
    };

    // Preserve existing encrypted secrets if password fields are left blank
    if (data.clientSecret && data.clientSecret.trim() !== '') {
      updateObj.clientSecretEnc = encryptSecret(data.clientSecret.trim());
    } else if (existing?.clientSecretEnc) {
      updateObj.clientSecretEnc = existing.clientSecretEnc;
    }

    if (data.smtpPassword && data.smtpPassword.trim() !== '') {
      updateObj.smtpPassEnc = encryptSecret(data.smtpPassword.trim());
    } else if (existing?.smtpPassEnc) {
      updateObj.smtpPassEnc = existing.smtpPassEnc;
    }

    await MailSettings.findOneAndUpdate(
      { key: 'default' },
      { $set: updateObj },
      { upsert: true, new: true }
    );

    await writeAuditLog(
      req,
      'mail_settings_updated',
      `Mail ayarları güncellendi (Mod: ${data.mode}).`
    );

    const secretWarning = await getSecretExpiryWarning();

    return res.json({
      ok: true,
      hasClientSecret: Boolean(updateObj.clientSecretEnc),
      hasSmtpPassword: Boolean(updateObj.smtpPassEnc),
      secretExpiryWarning: secretWarning
    });
  } catch (err) {
    console.error('[ERROR] PUT /api/admin/mail-settings:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Mail ayarları kaydedilirken hata oluştu.'
    });
  }
});

const testMailSchema = z
  .object({
    toEmail: z.string().trim().email('Geçerli bir alıcı e-posta adresi giriniz.').max(254)
  })
  .strict();

router.post('/mail-settings/test', requireAdminRole, async (req, res) => {
  try {
    const parsed = testMailSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.issues?.[0]?.message || 'Geçerli bir e-posta giriniz.'
      });
    }

    const settingsDoc = await MailSettings.findOne({ key: 'default' }).lean();
    if (!settingsDoc) {
      return res.status(400).json({
        ok: false,
        error: 'Önce mail ayarlarını kaydedin.'
      });
    }

    const nowStr = new Date().toLocaleString('tr-TR', {
      timeZone: 'Europe/Istanbul'
    });
    const modeLabel =
      settingsDoc.mode === 'smtp'
        ? 'SMTP (Nodemailer)'
        : 'Microsoft 365 – Graph API';

    await sendMailWithSettings(settingsDoc, {
      toAddresses: [parsed.data.toEmail],
      subject: `Fanvil Gold Partner Portal – Test Maili (${modeLabel})`,
      text: `Bu e-posta Fanvil Gold Partner Admin Paneli üzerinden ${modeLabel} kullanılarak ${nowStr} tarihinde test amacıyla gönderilmiştir.`,
      html: `<div style="font-family:Arial,sans-serif;padding:20px;border:1px solid #e2e8f0;border-radius:12px;">
        <h3 style="color:#0f172a;margin-top:0;">Fanvil Gold Partner Portal – Test Maili Başarılı ✓</h3>
        <p>Bu e-posta <strong>${escapeHtml(modeLabel)}</strong> yöntemiyle <strong>${escapeHtml(nowStr)}</strong> tarihinde başarıyla gönderilmiştir.</p>
      </div>`
    });

    await writeAuditLog(
      req,
      'mail_test_sent',
      `${parsed.data.toEmail} adresine test maili gönderildi (${settingsDoc.mode}).`
    );

    return res.json({
      ok: true,
      message: `Test e-postası (${modeLabel}) başarıyla ${parsed.data.toEmail} adresine gönderildi.`
    });
  } catch (err) {
    console.error('[ERROR] POST /api/admin/mail-settings/test:', err.message);
    return res.status(400).json({
      ok: false,
      error: err.message || 'Test maili gönderilemedi.'
    });
  }
});

// ---------------------------------------------------------------------------
// 7. Recipients Endpoints (role=admin ONLY)
// ---------------------------------------------------------------------------
router.get('/recipients', requireAdminRole, async (_req, res) => {
  try {
    const items = await MailRecipient.find().sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, items });
  } catch (err) {
    console.error('[ERROR] GET /api/admin/recipients:', err);
    return res.status(500).json({ ok: false, error: 'Alıcı listesi alınamadı.' });
  }
});

const recipientCreateSchema = z
  .object({
    email: z.string().trim().email('Geçerli bir e-posta giriniz.').max(254),
    name: z.string().trim().min(2, 'Ad en az 2 karakter olmalıdır.').max(120),
    active: z.boolean().optional().default(true),
    requestTypes: z
      .array(z.enum(['bilgi', 'proje', 'bayi', 'demo']))
      .optional()
      .default([])
  })
  .strict();

router.post('/recipients', requireAdminRole, async (req, res) => {
  try {
    const parsed = recipientCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.issues?.[0]?.message || 'Geçersiz alıcı bilgisi.'
      });
    }

    const emailLower = parsed.data.email.toLowerCase();
    const existing = await MailRecipient.findOne({ email: emailLower });
    if (existing) {
      return res.status(400).json({
        ok: false,
        error: 'Bu e-posta adresi zaten alıcı listesinde mevcut.'
      });
    }

    const item = await MailRecipient.create({
      email: emailLower,
      name: parsed.data.name,
      active: parsed.data.active,
      requestTypes: parsed.data.requestTypes,
      createdAt: new Date()
    });

    await writeAuditLog(req, 'recipient_added', `Alıcı eklendi: ${emailLower}`);
    return res.status(201).json({ ok: true, item });
  } catch (err) {
    console.error('[ERROR] POST /api/admin/recipients:', err);
    return res.status(500).json({ ok: false, error: 'Alıcı eklenemedi.' });
  }
});

const recipientUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    active: z.boolean().optional(),
    requestTypes: z.array(z.enum(['bilgi', 'proje', 'bayi', 'demo'])).optional()
  })
  .strict();

router.patch('/recipients/:id', requireAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, error: 'Geçersiz alıcı ID.' });
    }

    const parsed = recipientUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'Geçersiz güncelleme verisi.' });
    }

    const item = await MailRecipient.findByIdAndUpdate(
      id,
      { $set: parsed.data },
      { new: true }
    ).lean();

    if (!item) {
      return res.status(404).json({ ok: false, error: 'Alıcı bulunamadı.' });
    }

    await writeAuditLog(
      req,
      'recipient_updated',
      `Alıcı güncellendi: ${item.email} (aktif: ${item.active})`
    );
    return res.json({ ok: true, item });
  } catch (err) {
    console.error('[ERROR] PATCH /api/admin/recipients/:id:', err);
    return res.status(500).json({ ok: false, error: 'Alıcı güncellenemedi.' });
  }
});

router.delete('/recipients/:id', requireAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, error: 'Geçersiz alıcı ID.' });
    }

    const deleted = await MailRecipient.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ ok: false, error: 'Alıcı bulunamadı.' });
    }

    await writeAuditLog(req, 'recipient_deleted', `Alıcı silindi: ${deleted.email}`);
    return res.json({ ok: true });
  } catch (err) {
    console.error('[ERROR] DELETE /api/admin/recipients/:id:', err);
    return res.status(500).json({ ok: false, error: 'Alıcı silinemedi.' });
  }
});

// ---------------------------------------------------------------------------
// 8. Allowed IPs Endpoints (role=admin ONLY)
// ---------------------------------------------------------------------------
router.get('/allowed-ips', requireAdminRole, async (req, res) => {
  try {
    const bootstrapIps = getBootstrapIps();
    const dbDocs = await AllowedIp.find().sort({ createdAt: -1 }).lean();

    const systemItems = bootstrapIps.map((ip) => ({
      _id: `system-${ip}`,
      ip,
      note: 'Sistem IP\'si (silinemez)',
      createdBy: 'system (.env)',
      createdAt: null,
      isSystem: true
    }));

    const dbItems = dbDocs
      .filter((d) => !bootstrapIps.includes(d.ip))
      .map((d) => ({
        ...d,
        isSystem: false
      }));

    return res.json({
      ok: true,
      currentIp: req.clientIpNormalized || req.ip,
      items: [...systemItems, ...dbItems]
    });
  } catch (err) {
    console.error('[ERROR] GET /api/admin/allowed-ips:', err);
    return res.status(500).json({ ok: false, error: 'İzinli IP listesi alınamadı.' });
  }
});

const allowedIpCreateSchema = z
  .object({
    ip: z.string().trim().min(3).max(64),
    note: z.string().trim().max(200).optional().default('')
  })
  .strict();

router.post('/allowed-ips', requireAdminRole, async (req, res) => {
  try {
    const parsed = allowedIpCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: 'Geçerli bir IP veya CIDR giriniz.'
      });
    }

    const normalized = validateIpOrCidr(parsed.data.ip);
    if (!normalized) {
      return res.status(400).json({
        ok: false,
        error: 'Geçersiz IPv4, IPv6 veya CIDR formatı (Örn: 188.124.10.58 veya 10.0.0.0/24).'
      });
    }

    const bootstrapIps = getBootstrapIps();
    if (bootstrapIps.includes(normalized)) {
      return res.status(400).json({
        ok: false,
        error: 'Bu IP zaten sistem IP\'si olarak kalıcı izinli listede bulunuyor.'
      });
    }

    const existing = await AllowedIp.findOne({ ip: normalized });
    if (existing) {
      return res.status(400).json({
        ok: false,
        error: 'Bu IP / CIDR zaten listede mevcut.'
      });
    }

    const doc = await AllowedIp.create({
      ip: normalized,
      note: parsed.data.note,
      createdBy: req.session.adminUser.username,
      createdAt: new Date()
    });

    invalidateAllowedIpCache();
    await writeAuditLog(
      req,
      'ip_added',
      `İzinli IP eklendi: ${normalized} (${parsed.data.note || 'not yok'})`
    );

    return res.status(201).json({
      ok: true,
      item: { ...doc.toObject(), isSystem: false }
    });
  } catch (err) {
    console.error('[ERROR] POST /api/admin/allowed-ips:', err);
    return res.status(500).json({ ok: false, error: 'IP eklenemedi.' });
  }
});

router.delete('/allowed-ips/:id', requireAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    if (String(id).startsWith('system-')) {
      return res.status(400).json({
        ok: false,
        error: 'Sistem IP\'si (.env ADMIN_BOOTSTRAP_IPS) silinemez.'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, error: 'Geçersiz kayıt ID.' });
    }

    const doc = await AllowedIp.findById(id).lean();
    if (!doc) {
      return res.status(404).json({ ok: false, error: 'IP kaydı bulunamadı.' });
    }

    if (getBootstrapIps().includes(doc.ip)) {
      return res.status(400).json({
        ok: false,
        error: 'Sistem IP\'si silinemez.'
      });
    }

    await AllowedIp.findByIdAndDelete(id);
    invalidateAllowedIpCache();

    await writeAuditLog(req, 'ip_removed', `İzinli IP silindi: ${doc.ip}`);
    return res.json({ ok: true });
  } catch (err) {
    console.error('[ERROR] DELETE /api/admin/allowed-ips/:id:', err);
    return res.status(500).json({ ok: false, error: 'IP silinemedi.' });
  }
});

// ---------------------------------------------------------------------------
// 9. Admin Users Endpoints (role=admin ONLY)
// ---------------------------------------------------------------------------
router.get('/users', requireAdminRole, async (_req, res) => {
  try {
    const users = await AdminUser.find(
      {},
      { passwordHash: 0, failedAttempts: 0 }
    )
      .sort({ createdAt: 1 })
      .lean();
    return res.json({ ok: true, items: users });
  } catch (err) {
    console.error('[ERROR] GET /api/admin/users:', err);
    return res.status(500).json({ ok: false, error: 'Kullanıcı listesi alınamadı.' });
  }
});

const createUserSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'Kullanıcı adı en az 3 karakter olmalıdır.')
      .max(60)
      .regex(/^[a-zA-Z0-9._-]+$/, 'Kullanıcı adı sadece harf, rakam, nokta, tire ve alt çizgi içerebilir.'),
    password: z
      .string()
      .min(12, 'Şifre en az 12 karakter olmalıdır.')
      .max(200),
    role: z.enum(['admin', 'viewer'])
  })
  .strict();

router.post('/users', requireAdminRole, async (req, res) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.issues?.[0]?.message || 'Geçersiz kullanıcı verisi.'
      });
    }

    const username = parsed.data.username.toLowerCase();
    const existing = await AdminUser.findOne({ username });
    if (existing) {
      return res.status(400).json({
        ok: false,
        error: 'Bu kullanıcı adı zaten kullanılıyor.'
      });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const created = await AdminUser.create({
      username,
      passwordHash,
      role: parsed.data.role,
      createdAt: new Date()
    });

    await writeAuditLog(
      req,
      'user_added',
      `Yeni panel kullanıcısı eklendi: ${username} (rol: ${parsed.data.role})`
    );

    return res.status(201).json({
      ok: true,
      item: {
        _id: created._id,
        username: created.username,
        role: created.role,
        createdAt: created.createdAt,
        lastLoginAt: null,
        lastLoginIp: ''
      }
    });
  } catch (err) {
    console.error('[ERROR] POST /api/admin/users:', err);
    return res.status(500).json({ ok: false, error: 'Kullanıcı oluşturulamadı.' });
  }
});

router.delete('/users/:id', requireAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, error: 'Geçersiz kullanıcı ID.' });
    }

    if (String(req.session.adminUser.id) === String(id)) {
      return res.status(400).json({
        ok: false,
        error: 'Kendi aktif hesabınızı silemezsiniz.'
      });
    }

    const targetUser = await AdminUser.findById(id).lean();
    if (!targetUser) {
      return res.status(404).json({ ok: false, error: 'Kullanıcı bulunamadı.' });
    }

    if (targetUser.role === 'admin') {
      const adminCount = await AdminUser.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          ok: false,
          error: 'Sistemdeki son yönetici (admin) hesabı silinemez.'
        });
      }
    }

    await AdminUser.findByIdAndDelete(id);
    await writeAuditLog(
      req,
      'user_deleted',
      `Panel kullanıcısı silindi: ${targetUser.username} (rol: ${targetUser.role})`
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error('[ERROR] DELETE /api/admin/users/:id:', err);
    return res.status(500).json({ ok: false, error: 'Kullanıcı silinemedi.' });
  }
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z
      .string()
      .min(12, 'Yeni şifre en az 12 karakter olmalıdır.')
      .max(200)
  })
  .strict();

router.post('/users/change-password', requireAdminRole, async (req, res) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.issues?.[0]?.message || 'Geçersiz şifre bilgisi.'
      });
    }

    const user = await AdminUser.findById(req.session.adminUser.id);
    if (!user) {
      return res.status(404).json({ ok: false, error: 'Kullanıcı bulunamadı.' });
    }

    const match = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!match) {
      return res.status(400).json({
        ok: false,
        error: 'Mevcut şifreniz hatalı.'
      });
    }

    const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
    user.passwordHash = newHash;
    await user.save();

    await writeAuditLog(req, 'password_changed', 'Kullanıcı kendi şifresini güncelledi.');
    return res.json({ ok: true, message: 'Şifreniz başarıyla güncellendi.' });
  } catch (err) {
    console.error('[ERROR] POST /api/admin/users/change-password:', err);
    return res.status(500).json({ ok: false, error: 'Şifre değiştirilemedi.' });
  }
});

// ---------------------------------------------------------------------------
// 10. Audit Logs Endpoint (role=admin ONLY)
// ---------------------------------------------------------------------------
router.get('/audit-logs', requireAdminRole, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = 50;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      AuditLog.countDocuments({}),
      AuditLog.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return res.json({
      ok: true,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      items
    });
  } catch (err) {
    console.error('[ERROR] GET /api/admin/audit-logs:', err);
    return res.status(500).json({ ok: false, error: 'İşlem kayıtları alınamadı.' });
  }
});

module.exports = router;
