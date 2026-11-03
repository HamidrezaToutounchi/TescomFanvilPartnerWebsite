'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const ipaddr = require('ipaddr.js');
const { z } = require('zod');

const {
  Lead,
  AllowedIp,
  AdminUser,
  MailSettings,
  MailRecipient,
  MailJob,
  AuditLog,
  MailAttempt
} = require('./models');
const {
  encryptSecret,
  escapeHtml,
  escapeRegex,
  escapeCsvCell
} = require('./cryptoUtils');
const {
  getBootstrapIps,
  validateAllowedIpRule,
  invalidateAllowedIpCache,
  requireAllowedIp,
  assertSafeSmtpHost
} = require('./ipAllowlist');
const {
  invalidateMailTransporter,
  resolveSecurityForPort,
  verifySmtpConnection,
  sendMailWithSettings
} = require('./mailer');
const { enqueueLeadMailJob } = require('./outboxWorker');

const router = express.Router();

// Constant dummy hash computed once at startup to eliminate timing differences when username is not found
const DUMMY_BCRYPT_HASH = bcrypt.hashSync(
  'fanvil_dummy_timing_defense_password_2026_!@#',
  12
);

const ABSOLUTE_SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours

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

function destroySessionAndClearCookie(req, res, callback) {
  if (!req.session) {
    res.clearCookie('fvl_admin', {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict'
    });
    return callback();
  }
  req.session.destroy(() => {
    res.clearCookie('fvl_admin', {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict'
    });
    return callback();
  });
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
// 2. Auth Middlewares (DB verification + 8h absolute timeout + passwordChangedAt)
// ---------------------------------------------------------------------------
async function verifyActiveSession(req) {
  if (!req.session || !req.session.adminUser || !req.session.adminUser.id) {
    return { valid: false, reason: 'no_session' };
  }

  const loginAtMs = Number(req.session.loginAt) || 0;
  if (!loginAtMs || Date.now() - loginAtMs > ABSOLUTE_SESSION_TIMEOUT_MS) {
    return { valid: false, reason: 'absolute_timeout' };
  }

  if (!mongoose.Types.ObjectId.isValid(req.session.adminUser.id)) {
    return { valid: false, reason: 'invalid_user_id' };
  }

  const dbUser = await AdminUser.findById(req.session.adminUser.id, {
    role: 1,
    passwordChangedAt: 1,
    username: 1
  }).lean();

  if (!dbUser) {
    return { valid: false, reason: 'user_deleted' };
  }

  if (dbUser.passwordChangedAt) {
    const pwdChangedMs = new Date(dbUser.passwordChangedAt).getTime();
    if (!Number.isNaN(pwdChangedMs) && loginAtMs < pwdChangedMs) {
      return { valid: false, reason: 'password_changed' };
    }
  }

  if (dbUser.role !== req.session.adminUser.role) {
    req.session.adminUser.role = dbUser.role;
  }

  return { valid: true, user: req.session.adminUser };
}

async function requireAuth(req, res, next) {
  try {
    const check = await verifyActiveSession(req);
    if (!check.valid) {
      return destroySessionAndClearCookie(req, res, () =>
        res.status(401).json({
          ok: false,
          error: 'Oturum süresi doldu veya giriş yapılmadı.'
        })
      );
    }
    return next();
  } catch (err) {
    console.error('[ERROR] requireAuth check failed:', err.message);
    return res.status(500).json({ ok: false, error: 'Oturum doğrulanamadı.' });
  }
}

async function requireAdminRole(req, res, next) {
  try {
    const check = await verifyActiveSession(req);
    if (!check.valid) {
      return destroySessionAndClearCookie(req, res, () =>
        res.status(401).json({
          ok: false,
          error: 'Giriş yapmanız gerekiyor.'
        })
      );
    }
    if (req.session.adminUser.role !== 'admin') {
      return res.status(403).json({
        ok: false,
        error: 'Bu işlem için yönetici (admin) yetkisi gereklidir.'
      });
    }
    return next();
  } catch (err) {
    console.error('[ERROR] requireAdminRole check failed:', err.message);
    return res.status(500).json({ ok: false, error: 'Yetki doğrulanamadı.' });
  }
}

// ---------------------------------------------------------------------------
// 3. Rate Limiters
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

// Separate rate limit for SMTP verify & test endpoints: 5 requests per 10 minutes per user
const mailVerifyTestRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.session?.adminUser?.id ||
    req.session?.adminUser?.username ||
    req.clientIpNormalized ||
    req.ip,
  message: {
    ok: false,
    error:
      'Çok fazla SMTP bağlantı/test isteği gönderildi. Lütfen 10 dakika sonra tekrar deneyin.'
  }
});

// ---------------------------------------------------------------------------
// 4. Auth Endpoints
// ---------------------------------------------------------------------------
router.get('/me', async (req, res) => {
  try {
    if (!req.session || !req.session.adminUser) {
      return res.json({
        ok: true,
        authenticated: false,
        user: null,
        clientIp: req.clientIpNormalized || req.ip
      });
    }

    const check = await verifyActiveSession(req);
    if (!check.valid) {
      return destroySessionAndClearCookie(req, res, () =>
        res.json({
          ok: true,
          authenticated: false,
          user: null,
          clientIp: req.clientIpNormalized || req.ip
        })
      );
    }

    return res.json({
      ok: true,
      authenticated: true,
      user: check.user,
      clientIp: req.clientIpNormalized || req.ip
    });
  } catch (err) {
    console.error('[ERROR] GET /api/admin/me:', err.message);
    return res.status(500).json({ ok: false, error: 'Oturum bilgisi alınamadı.' });
  }
});

const loginSchema = z
  .object({
    username: z.string({ error: 'Kullanıcı adı zorunludur.' }).trim().min(1).max(60),
    password: z.string({ error: 'Şifre zorunludur.' }).min(1).max(200)
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
      // Perform constant-time dummy bcrypt compare to mitigate username enumeration via timing
      await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
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
    const loginNow = new Date();
    await AdminUser.updateOne(
      { _id: user._id },
      {
        $set: {
          failedAttempts: 0,
          lockedUntil: null,
          lastLoginAt: loginNow,
          lastLoginIp: loginIp
        }
      }
    );

    const sessionUser = {
      id: String(user._id),
      username: user.username,
      role: user.role
    };

    // Regenerate session ID on login to prevent session fixation
    req.session.regenerate((regenErr) => {
      if (regenErr) {
        console.error('[ERROR] Session regenerate error:', regenErr);
        return res.status(500).json({ ok: false, error: 'Oturum oluşturulamadı.' });
      }

      req.session.adminUser = sessionUser;
      req.session.loginAt = loginNow.getTime();

      req.session.save(async (saveErr) => {
        if (saveErr) {
          console.error('[ERROR] Session save error:', saveErr);
          return res.status(500).json({ ok: false, error: 'Oturum kaydedilemedi.' });
        }
        await writeAuditLog(
          req,
          'login_success',
          `Giriş başarılı (rol: ${user.role})`,
          user.username
        );
        return res.json({
          ok: true,
          user: sessionUser,
          clientIp: loginIp
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
  destroySessionAndClearCookie(req, res, () => res.json({ ok: true }));
});

// ---------------------------------------------------------------------------
// 5. Leads Endpoints (List, CSV Export Stream, Detail, Status, Notes, Resend Mail)
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

  if (
    query.captchaStatus &&
    ['passed', 'unverified', 'disabled'].includes(String(query.captchaStatus))
  ) {
    filter.captchaStatus = String(query.captchaStatus);
  }

  if (query.marketingConsent === 'true') {
    filter.marketingConsent = true;
  } else if (query.marketingConsent === 'false') {
    filter.marketingConsent = { $ne: true };
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
  let cursor = null;
  try {
    const filter = buildLeadsFilter(req.query);
    const filename = `fanvil-leads-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

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
      'KVKK Aydınlatma Tarihi',
      'KVKK Sürümü',
      'Ticari İleti Onayı',
      'Ticari İleti Onay Tarihi',
      'IP Adresi'
    ];

    // Write UTF-8 BOM + CSV Header Row
    res.write(`\uFEFF${headers.map(escapeCsvCell).join(',')}\r\n`);

    cursor = Lead.find(filter).sort({ createdAt: -1 }).lean().cursor();

    req.on('close', () => {
      if (cursor) {
        cursor.close().catch(() => {});
      }
    });

    let exportedCount = 0;
    for await (const l of cursor) {
      const dateStr = new Date(l.createdAt).toLocaleString('tr-TR', {
        timeZone: 'Europe/Istanbul'
      });
      const kvkkAtStr = l.kvkkAcceptedAt
        ? new Date(l.kvkkAcceptedAt).toLocaleString('tr-TR', {
            timeZone: 'Europe/Istanbul'
          })
        : dateStr;
      const kvkkVerStr = l.kvkkVersion || l.kvkkTextVersion || 'v1';
      const marketingStr = l.marketingConsent ? 'Evet' : 'Hayır';
      const marketingAtStr =
        l.marketingConsent && l.marketingConsentAt
          ? new Date(l.marketingConsentAt).toLocaleString('tr-TR', {
              timeZone: 'Europe/Istanbul'
            })
          : '';
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
        kvkkAtStr,
        kvkkVerStr,
        marketingStr,
        marketingAtStr,
        l.ip
      ];

      const chunk = `${row.map(escapeCsvCell).join(',')}\r\n`;
      if (!res.write(chunk)) {
        await new Promise((resolve) => res.once('drain', resolve));
      }
      exportedCount += 1;
    }

    await writeAuditLog(
      req,
      'csv_exported',
      `${exportedCount} adet lead CSV olarak dışa aktarıldı.`
    );

    return res.end();
  } catch (err) {
    console.error('[ERROR] GET /api/admin/leads/export.csv:', err);
    if (!res.headersSent) {
      return res.status(500).json({ ok: false, error: 'CSV dışa aktarma başarısız.' });
    }
    return res.end();
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
    status: z.enum(['new', 'contacted', 'quoted', 'won', 'lost'], {
      error: 'Geçersiz durum değeri.'
    })
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
    text: z
      .string({ error: 'Not boş olamaz.' })
      .trim()
      .min(1, { error: 'Not boş olamaz.' })
      .max(2000, { error: 'Not en fazla 2000 karakter olabilir.' })
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
// 6. Mail Settings Endpoints (Doğru Mail SMTP - role=admin ONLY)
// ---------------------------------------------------------------------------
const ALLOWED_SMTP_PORTS = [25, 465, 587, 2525];

const smtpHostZod = z
  .string({ error: 'SMTP sunucu adresi zorunludur.' })
  .trim()
  .toLowerCase()
  .min(1, { error: 'SMTP sunucu adresi zorunludur.' })
  .max(253, { error: 'SMTP sunucu adresi en fazla 253 karakter olabilir.' })
  .regex(/^[a-z0-9.-]+$/, {
    error: 'Geçerli bir SMTP sunucu adresi (hostname) giriniz; IP adresi kabul edilmez.'
  })
  .refine(
    (val) =>
      !ipaddr.isValid(val) &&
      !/^\d+(\.\d+){3}$/.test(val) &&
      !/^\d+$/.test(val) &&
      val.includes('.') &&
      !/\.[0-9]+$/.test(val) &&
      !val.startsWith('.') &&
      !val.endsWith('.'),
    {
      message: 'SMTP sunucu adresi olarak IP adresi kabul edilmez; geçerli bir hostname giriniz.'
    }
  );

const smtpPortZod = z
  .number({ error: 'SMTP portu yalnızca 25, 465, 587 veya 2525 olabilir.' })
  .int({ error: 'SMTP portu tam sayı olmalıdır.' })
  .refine((p) => ALLOWED_SMTP_PORTS.includes(p), {
    message: 'SMTP portu yalnızca 25, 465, 587 veya 2525 olabilir.'
  });

router.get('/mail-settings', requireAdminRole, async (_req, res) => {
  try {
    const [existingDoc, recentAttempts] = await Promise.all([
      MailSettings.findOne({ key: 'default' }).lean(),
      MailAttempt.find({}).sort({ createdAt: -1 }).limit(20).lean()
    ]);

    const doc = existingDoc || {
      smtpHost: 'mail.dogrumail.com',
      smtpPort: 587,
      smtpSecurity: 'starttls',
      smtpUser: '',
      smtpPassEnc: '',
      smtpFromAddress: '',
      smtpFromName: 'Tescom Fanvil Partner'
    };

    return res.json({
      ok: true,
      settings: {
        smtpHost: doc.smtpHost || 'mail.dogrumail.com',
        smtpPort: doc.smtpPort || 587,
        smtpSecurity: doc.smtpSecurity || 'starttls',
        smtpUser: doc.smtpUser || doc.smtpFromAddress || '',
        hasSmtpPassword: Boolean(doc.smtpPassEnc),
        smtpFromAddress: doc.smtpFromAddress || '',
        smtpFromName: doc.smtpFromName || 'Tescom Fanvil Partner',
        updatedAt: doc.updatedAt || null,
        updatedBy: doc.updatedBy || ''
      },
      recentAttempts
    });
  } catch (err) {
    console.error('[ERROR] GET /api/admin/mail-settings:', err);
    return res.status(500).json({ ok: false, error: 'Mail ayarları okunamadı.' });
  }
});

const mailSettingsZodSchema = z
  .object({
    smtpHost: smtpHostZod.default('mail.dogrumail.com'),
    smtpPort: smtpPortZod.default(587),
    smtpSecurity: z.enum(['starttls', 'tls']).optional().default('starttls'),
    smtpUser: z.string().trim().max(254).optional().default(''),
    // Do NOT apply .trim() to smtpPassword!
    smtpPassword: z.string().max(500).optional().default(''),
    smtpFromAddress: z
      .string({ error: 'Geçerli bir gönderen e-posta adresi giriniz.' })
      .trim()
      .email({ error: 'Geçerli bir gönderen e-posta adresi giriniz.' })
      .max(254),
    smtpFromName: z.string().trim().max(120).optional().default('Tescom Fanvil Partner')
  })
  .strict();

async function buildEffectiveSettingsFromFormOrDb(formData) {
  const existing = await MailSettings.findOne({ key: 'default' }).lean();

  const savedHost = String(existing?.smtpHost || 'mail.dogrumail.com')
    .trim()
    .toLowerCase();
  const savedPort = Number(existing?.smtpPort || 587);
  const savedFrom = String(existing?.smtpFromAddress || '').trim();
  const savedUser = String(existing?.smtpUser || savedFrom || '').trim();

  const incomingHost =
    formData.smtpHost !== undefined && String(formData.smtpHost).trim() !== ''
      ? String(formData.smtpHost).trim().toLowerCase()
      : savedHost;
  const incomingPort =
    formData.smtpPort !== undefined ? Number(formData.smtpPort) : savedPort;
  const incomingFrom =
    formData.smtpFromAddress !== undefined && String(formData.smtpFromAddress).trim() !== ''
      ? String(formData.smtpFromAddress).trim()
      : savedFrom;
  const incomingUser =
    formData.smtpUser !== undefined && String(formData.smtpUser).trim() !== ''
      ? String(formData.smtpUser).trim()
      : incomingFrom || savedUser;

  // Check if password is blank without trimming the password itself
  const hasNewPassword =
    typeof formData.smtpPassword === 'string' && formData.smtpPassword.trim() !== '';

  const hostChanged = incomingHost !== savedHost;
  const portChanged = incomingPort !== savedPort;
  const userChanged = incomingUser !== savedUser;

  if (!hasNewPassword && (hostChanged || portChanged || userChanged)) {
    const err = new Error('Sunucu veya kullanıcı değişti; şifreyi yeniden girin.');
    err.statusCode = 400;
    err.errorCode = 'PASSWORD_REQUIRED_ON_CHANGE';
    throw err;
  }

  const resolvedSec = resolveSecurityForPort(
    incomingPort,
    formData.smtpSecurity || existing?.smtpSecurity || 'starttls'
  );

  return {
    smtpHost: incomingHost,
    smtpPort: incomingPort,
    smtpSecurity: resolvedSec.mode,
    smtpUser: incomingUser,
    smtpFromAddress: incomingFrom,
    smtpFromName: (
      formData.smtpFromName ||
      existing?.smtpFromName ||
      'Tescom Fanvil Partner'
    ).trim(),
    plainPassword: hasNewPassword ? formData.smtpPassword : '',
    smtpPassEnc: hasNewPassword ? '' : existing?.smtpPassEnc || ''
  };
}

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

    const savedHost = String(existing?.smtpHost || 'mail.dogrumail.com')
      .trim()
      .toLowerCase();
    const savedPort = Number(existing?.smtpPort || 587);
    const savedUser = String(
      existing?.smtpUser || existing?.smtpFromAddress || ''
    ).trim();

    const nextHost = (data.smtpHost || 'mail.dogrumail.com').trim().toLowerCase();
    const nextPort = Number(data.smtpPort || 587);
    const nextUser = (data.smtpUser || data.smtpFromAddress).trim();

    // Do NOT apply .trim() to smtpPassword itself; only check if blank
    const hasNewPassword =
      typeof data.smtpPassword === 'string' && data.smtpPassword.trim() !== '';

    const hostChanged = nextHost !== savedHost;
    const portChanged = nextPort !== savedPort;
    const userChanged = nextUser !== savedUser;

    if (!hasNewPassword && (hostChanged || portChanged || userChanged)) {
      return res.status(400).json({
        ok: false,
        error: 'Sunucu veya kullanıcı değişti; şifreyi yeniden girin.'
      });
    }

    // Resolve DNS and block internal/loopback/private/reserved IPs (SSRF protection)
    await assertSafeSmtpHost(nextHost);

    const resolvedSec = resolveSecurityForPort(nextPort, data.smtpSecurity);

    const updateObj = {
      key: 'default',
      smtpHost: nextHost,
      smtpPort: nextPort,
      smtpSecurity: resolvedSec.mode,
      smtpUser: nextUser,
      smtpFromAddress: data.smtpFromAddress,
      smtpFromName: data.smtpFromName || 'Tescom Fanvil Partner',
      updatedAt: new Date(),
      updatedBy: req.session.adminUser.username
    };

    if (hasNewPassword) {
      updateObj.smtpPassEnc = encryptSecret(data.smtpPassword);
    } else if (existing?.smtpPassEnc) {
      updateObj.smtpPassEnc = existing.smtpPassEnc;
    } else {
      return res.status(400).json({
        ok: false,
        error: 'İlk kurulumda SMTP şifresi girilmesi zorunludur.'
      });
    }

    await MailSettings.findOneAndUpdate(
      { key: 'default' },
      { $set: updateObj },
      { upsert: true, new: true }
    );

    // Close existing pooled SMTP transporter so next send uses the updated config
    invalidateMailTransporter();

    await writeAuditLog(
      req,
      'mail_settings_updated',
      `SMTP mail ayarları güncellendi (${updateObj.smtpHost}:${updateObj.smtpPort}, ${updateObj.smtpSecurity.toUpperCase()}).`
    );

    return res.json({
      ok: true,
      hasSmtpPassword: Boolean(updateObj.smtpPassEnc),
      smtpSecurity: updateObj.smtpSecurity
    });
  } catch (err) {
    console.error('[ERROR] PUT /api/admin/mail-settings:', err.message);
    const status = err.statusCode === 400 ? 400 : 500;
    return res.status(status).json({
      ok: false,
      error: err.message || 'Mail ayarları kaydedilirken hata oluştu.'
    });
  }
});

const verifyFormSchema = z
  .object({
    smtpHost: smtpHostZod.optional(),
    smtpPort: smtpPortZod.optional(),
    smtpSecurity: z.enum(['starttls', 'tls']).optional().default('starttls'),
    smtpUser: z.string().trim().max(254).optional().default(''),
    // Do NOT apply .trim() to smtpPassword!
    smtpPassword: z.string().max(500).optional().default(''),
    smtpFromAddress: z.string().trim().max(254).optional().default(''),
    smtpFromName: z.string().trim().max(120).optional().default('Tescom Fanvil Partner')
  })
  .strict();

router.post(
  '/mail-settings/verify',
  requireAdminRole,
  mailVerifyTestRateLimiter,
  async (req, res) => {
    let attemptedHost = String(req.body?.smtpHost || 'mail.dogrumail.com').slice(0, 253);
    let attemptedPort = Number(req.body?.smtpPort) || 587;
    try {
      const parsed = verifyFormSchema.safeParse(req.body || {});
      if (!parsed.success) {
        const msg = parsed.error.issues?.[0]?.message || 'Geçersiz form verisi.';
        await writeAuditLog(
          req,
          'mail_verify_failed',
          `SMTP bağlantı doğrulaması reddedildi (${attemptedHost}:${attemptedPort}): ${msg}`
        );
        return res.status(400).json({
          ok: false,
          error: msg
        });
      }

      const effective = await buildEffectiveSettingsFromFormOrDb(parsed.data);
      attemptedHost = effective.smtpHost;
      attemptedPort = effective.smtpPort;

      const result = await verifySmtpConnection(effective);

      await writeAuditLog(
        req,
        'mail_verify',
        `SMTP bağlantı testi başarılı (${result.host}:${result.port} – ${result.security})`
      );

      return res.json({
        ok: true,
        message: `Bağlantı başarılı ✓ (${result.host}:${result.port} – ${result.security})`
      });
    } catch (err) {
      console.error('[ERROR] POST /api/admin/mail-settings/verify:', err.message);
      await writeAuditLog(
        req,
        'mail_verify_failed',
        `SMTP bağlantı testi başarısız (${attemptedHost}:${attemptedPort}): ${err.message}`
      );
      return res.status(400).json({
        ok: false,
        error: err.message || 'SMTP bağlantısı doğrulanamadı.',
        errorCode: err.errorCode || 'SMTP_ERROR'
      });
    }
  }
);

const testMailSchema = z
  .object({
    toEmail: z
      .string({ error: 'Geçerli bir alıcı e-posta adresi giriniz.' })
      .trim()
      .email({ error: 'Geçerli bir alıcı e-posta adresi giriniz.' })
      .max(254),
    smtpHost: smtpHostZod.optional(),
    smtpPort: smtpPortZod.optional(),
    smtpSecurity: z.enum(['starttls', 'tls']).optional(),
    smtpUser: z.string().trim().max(254).optional(),
    // Do NOT apply .trim() to smtpPassword!
    smtpPassword: z.string().max(500).optional(),
    smtpFromAddress: z.string().trim().max(254).optional(),
    smtpFromName: z.string().trim().max(120).optional()
  })
  .strict();

router.post(
  '/mail-settings/test',
  requireAdminRole,
  mailVerifyTestRateLimiter,
  async (req, res) => {
    let targetEmail = '';
    let attemptedHost = String(req.body?.smtpHost || 'mail.dogrumail.com').slice(0, 253);
    let attemptedPort = Number(req.body?.smtpPort) || 587;
    try {
      const parsed = testMailSchema.safeParse(req.body || {});
      if (!parsed.success) {
        const msg = parsed.error.issues?.[0]?.message || 'Geçerli bir e-posta giriniz.';
        await writeAuditLog(
          req,
          'mail_test_failed',
          `SMTP test maili reddedildi (${attemptedHost}:${attemptedPort}): ${msg}`
        );
        return res.status(400).json({
          ok: false,
          error: msg
        });
      }

      targetEmail = parsed.data.toEmail;
      const effective = await buildEffectiveSettingsFromFormOrDb(parsed.data);
      attemptedHost = effective.smtpHost;
      attemptedPort = effective.smtpPort;

      const nowStr = new Date().toLocaleString('tr-TR', {
        timeZone: 'Europe/Istanbul'
      });

      await sendMailWithSettings(
        effective,
        {
          toAddresses: [targetEmail],
          subject: `Tescom Fanvil Partner – SMTP Test Maili`,
          text: `Bu e-posta Tescom Fanvil Partner Admin Paneli üzerinden (${effective.smtpHost}:${effective.smtpPort}) kullanılarak ${nowStr} tarihinde test amacıyla gönderilmiştir.`,
          html: `<div style="font-family:Arial,sans-serif;padding:20px;border:1px solid #e2e8f0;border-radius:12px;">
          <h3 style="color:#0f172a;margin-top:0;">Tescom Fanvil Partner – SMTP Test Maili Başarılı ✓</h3>
          <p>Bu e-posta <strong>${escapeHtml(effective.smtpHost)}:${escapeHtml(effective.smtpPort)} (${escapeHtml(String(effective.smtpSecurity || 'starttls').toUpperCase())})</strong> üzerinden <strong>${escapeHtml(nowStr)}</strong> tarihinde başarıyla gönderilmiştir.</p>
        </div>`
        },
        { ephemeral: true }
      );

      await Promise.all([
        MailAttempt.create({
          recipient: targetEmail,
          status: 'sent',
          errorCode: '250 OK',
          errorMessage: 'Test maili gönderildi',
          refCode: 'TEST',
          createdAt: new Date()
        }),
        writeAuditLog(
          req,
          'mail_test_sent',
          `${targetEmail} adresine SMTP test maili gönderildi (${effective.smtpHost}:${effective.smtpPort}).`
        )
      ]);

      const recentAttempts = await MailAttempt.find({})
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      return res.json({
        ok: true,
        message: `Test e-postası başarıyla ${targetEmail} adresine gönderildi.`,
        recentAttempts
      });
    } catch (err) {
      console.error('[ERROR] POST /api/admin/mail-settings/test:', err.message);
      await writeAuditLog(
        req,
        'mail_test_failed',
        `SMTP test maili başarısız (${attemptedHost}:${attemptedPort} -> ${targetEmail || '-'}): ${err.message}`
      );
      if (targetEmail) {
        await MailAttempt.create({
          recipient: targetEmail,
          status: 'failed',
          errorCode: String(err.errorCode || 'SMTP_ERROR').slice(0, 100),
          errorMessage: String(err.message || 'Hata').slice(0, 1000),
          refCode: 'TEST',
          createdAt: new Date()
        }).catch(() => {});
      }
      const recentAttempts = await MailAttempt.find({})
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()
        .catch(() => []);
      return res.status(400).json({
        ok: false,
        error: err.message || 'Test maili gönderilemedi.',
        errorCode: err.errorCode || 'SMTP_ERROR',
        recentAttempts
      });
    }
  }
);

// ---------------------------------------------------------------------------
// 7. Recipients Endpoints (role=admin ONLY)
// ---------------------------------------------------------------------------
function isSenderTicketAddress(emailLower, settingsDoc) {
  const clean = String(emailLower || '').trim().toLowerCase();
  if (!clean) return false;
  if (clean.startsWith('support@')) return true;
  const fromLower = String(settingsDoc?.smtpFromAddress || '').trim().toLowerCase();
  const userLower = String(settingsDoc?.smtpUser || '').trim().toLowerCase();
  if (fromLower && clean === fromLower) return true;
  if (userLower && clean === userLower) return true;
  return false;
}

router.get('/recipients', requireAdminRole, async (_req, res) => {
  try {
    const [items, settingsDoc] = await Promise.all([
      MailRecipient.find().sort({ createdAt: -1 }).lean(),
      MailSettings.findOne({ key: 'default' }).lean()
    ]);
    return res.json({
      ok: true,
      items,
      senderAddress: settingsDoc?.smtpFromAddress || settingsDoc?.smtpUser || ''
    });
  } catch (err) {
    console.error('[ERROR] GET /api/admin/recipients:', err);
    return res.status(500).json({ ok: false, error: 'Alıcı listesi alınamadı.' });
  }
});

const recipientCreateSchema = z
  .object({
    email: z
      .string({ error: 'Geçerli bir e-posta giriniz.' })
      .trim()
      .email({ error: 'Geçerli bir e-posta giriniz.' })
      .max(254),
    name: z
      .string({ error: 'Ad en az 2 karakter olmalıdır.' })
      .trim()
      .min(2, { error: 'Ad en az 2 karakter olmalıdır.' })
      .max(120),
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
    const settingsDoc = await MailSettings.findOne({ key: 'default' }).lean();

    if (isSenderTicketAddress(emailLower, settingsDoc)) {
      return res.status(400).json({
        ok: false,
        error: 'Bu adres ticket sistemi tarafından okunuyor; her lead için ticket açılır.'
      });
    }

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
      note: "Sistem IP'si (silinemez)",
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
    ip: z.string({ error: 'Geçerli bir IP veya CIDR giriniz.' }).trim().min(3).max(64),
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

    const ruleCheck = validateAllowedIpRule(parsed.data.ip);
    if (!ruleCheck.ok) {
      return res.status(400).json({
        ok: false,
        error: ruleCheck.error
      });
    }

    const normalized = ruleCheck.normalized;
    const bootstrapIps = getBootstrapIps();
    if (bootstrapIps.includes(normalized)) {
      return res.status(400).json({
        ok: false,
        error: "Bu IP zaten sistem IP'si olarak kalıcı izinli listede bulunuyor."
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
        error: "Sistem IP'si (.env ADMIN_BOOTSTRAP_IPS) silinemez."
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
        error: "Sistem IP'si silinemez."
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
      .string({ error: 'Kullanıcı adı en az 3 karakter olmalıdır.' })
      .trim()
      .min(3, { error: 'Kullanıcı adı en az 3 karakter olmalıdır.' })
      .max(60)
      .regex(/^[a-zA-Z0-9._-]+$/, {
        error: 'Kullanıcı adı sadece harf, rakam, nokta, tire ve alt çizgi içerebilir.'
      }),
    password: z
      .string({ error: 'Şifre en az 12 karakter olmalıdır.' })
      .min(12, { error: 'Şifre en az 12 karakter olmalıdır.' })
      .max(200),
    role: z.enum(['admin', 'viewer'], { error: 'Geçersiz rol seçildi.' })
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

    // Delete all active sessions for the deleted user from admin_sessions collection
    try {
      const safeIdPattern = escapeRegex(String(id));
      await mongoose.connection.db.collection('admin_sessions').deleteMany({
        $or: [
          { session: { $regex: `"id"\\s*:\\s*"${safeIdPattern}"` } },
          { 'session.adminUser.id': String(id) }
        ]
      });
    } catch (sessErr) {
      console.error('[WARN] Failed to purge user sessions on delete:', sessErr.message);
    }

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
    currentPassword: z.string({ error: 'Mevcut şifre zorunludur.' }).min(1).max(200),
    newPassword: z
      .string({ error: 'Yeni şifre en az 12 karakter olmalıdır.' })
      .min(12, { error: 'Yeni şifre en az 12 karakter olmalıdır.' })
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

    const now = new Date();
    const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
    user.passwordHash = newHash;
    user.passwordChangedAt = now;
    await user.save();

    // Update current session's loginAt so this device remains active while other devices are logged out
    req.session.loginAt = now.getTime();
    await new Promise((resolve) => req.session.save(() => resolve()));

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
