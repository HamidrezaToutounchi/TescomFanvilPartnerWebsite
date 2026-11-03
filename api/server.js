'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const { z } = require('zod');

const { Lead } = require('./models');
const {
  normalizeClientIp,
  isInternalDockerOrLoopbackIp,
  requireAllowedIp
} = require('./ipAllowlist');
const {
  enqueueLeadMailJob,
  startOutboxWorker,
  stopOutboxWorker
} = require('./outboxWorker');
const adminRoutes = require('./adminRoutes');

const PORT = Number(process.env.PORT) || 3000;
const MONGO_URI = process.env.MONGO_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://fanvilpartner.com';

if (!MONGO_URI) {
  console.error('[FATAL] MONGO_URI environment variable is required.');
  process.exit(1);
}

if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  console.error(
    '[FATAL] SESSION_SECRET environment variable is required (at least 32 characters).'
  );
  process.exit(1);
}

mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

// ---------------------------------------------------------------------------
// 1. Cryptographic RefCode Generator ("FVL-" + 8 uppercase alphanumeric)
// ---------------------------------------------------------------------------
const REF_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generateRefCode() {
  const bytes = crypto.randomBytes(8);
  let suffix = '';
  for (let i = 0; i < 8; i += 1) {
    suffix += REF_ALPHABET[bytes[i] % REF_ALPHABET.length];
  }
  return `FVL-${suffix}`;
}

// ---------------------------------------------------------------------------
// 2. NoSQL Key Sanitizer (strips keys starting with '$' or containing '.')
// ---------------------------------------------------------------------------
function sanitizeNoSqlKeys(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeNoSqlKeys);
  }
  if (value !== null && typeof value === 'object') {
    const cleaned = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('$') || k.includes('.')) {
        continue;
      }
      cleaned[k] = sanitizeNoSqlKeys(v);
    }
    return cleaned;
  }
  return value;
}

// ---------------------------------------------------------------------------
// 3. Strict Zod Validation Schema for Public Lead Form
// ---------------------------------------------------------------------------
const leadZodSchema = z
  .object({
    requestType: z.enum(['bilgi', 'proje', 'bayi', 'demo'], {
      errorMap: () => ({ message: 'Geçersiz başvuru türü seçildi.' })
    }),
    fullName: z
      .string()
      .trim()
      .min(2, 'Ad Soyad en az 2 karakter olmalıdır.')
      .max(120, 'Ad Soyad en fazla 120 karakter olabilir.'),
    company: z
      .string()
      .trim()
      .min(2, 'Firma / Kurum adı en az 2 karakter olmalıdır.')
      .max(120, 'Firma / Kurum adı en fazla 120 karakter olabilir.'),
    email: z
      .string()
      .trim()
      .email('Geçerli bir kurumsal e-posta adresi giriniz.')
      .max(254, 'E-posta adresi çok uzun.'),
    phone: z
      .string()
      .trim()
      .min(7, 'Telefon numarası en az 7 karakter olmalıdır.')
      .max(20, 'Telefon numarası en fazla 20 karakter olabilir.')
      .regex(/^[0-9+\s]+$/, 'Telefon numarası yalnızca rakam, + ve boşluk içerebilir.'),
    selectedProduct: z.string().trim().max(200).optional().default(''),
    quantity: z.string().trim().max(200).optional().default(''),
    pbxSystem: z.string().trim().max(200).optional().default(''),
    projectName: z.string().trim().max(200).optional().default(''),
    message: z.string().trim().max(3000).optional().default(''),
    cartSnapshot: z
      .array(
        z
          .object({
            model: z.string().trim().min(1).max(100),
            qty: z.number().int().min(1).max(10000)
          })
          .strict()
      )
      .max(50, 'Sepette en fazla 50 kalem olabilir.')
      .optional()
      .default([]),
    kvkkAccepted: z.literal(true, {
      errorMap: () => ({ message: 'KVKK aydınlatma metnini onaylamanız gerekmektedir.' })
    }),
    website: z.string().max(200).optional().default('')
  })
  .strict();

// ---------------------------------------------------------------------------
// 4. Express Application Setup
// ---------------------------------------------------------------------------
const app = express();

// Trust ONLY loopback & Docker internal private/uniquelocal proxies
// Prevents any external client from spoofing X-Forwarded-For
app.set('trust proxy', ['loopback', 'uniquelocal']);
app.disable('x-powered-by');

// Allowed Host header set derived from PUBLIC_BASE_URL
const ALLOWED_HOSTS = new Set(['fanvilpartner.com', 'www.fanvilpartner.com']);
try {
  const parsedUrl = new URL(PUBLIC_BASE_URL);
  if (parsedUrl.hostname) {
    ALLOWED_HOSTS.add(parsedUrl.hostname.toLowerCase());
    if (!parsedUrl.hostname.startsWith('www.')) {
      ALLOWED_HOSTS.add(`www.${parsedUrl.hostname.toLowerCase()}`);
    }
  }
} catch (_e) {
  // ignore URL parse error
}

// Host Header Validation (EK 2 - B.3)
app.use((req, res, next) => {
  // Exempt internal Docker healthcheck on /api/health
  if (
    req.method === 'GET' &&
    req.path === '/api/health' &&
    isInternalDockerOrLoopbackIp(req.socket?.remoteAddress)
  ) {
    return next();
  }

  const rawHost = (req.headers.host || '').split(':')[0].trim().toLowerCase();
  if (!rawHost || !ALLOWED_HOSTS.has(rawHost)) {
    return res.status(404).end();
  }
  return next();
});

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

const ALLOWED_ORIGINS = new Set([
  'https://fanvilpartner.com',
  'https://www.fanvilpartner.com',
  PUBLIC_BASE_URL.replace(/\/+$/, '')
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS_NOT_ALLOWED'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Accept'],
    maxAge: 86400
  })
);

app.use(express.json({ limit: '20kb' }));

app.use((req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeNoSqlKeys(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeNoSqlKeys(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeNoSqlKeys(req.params);
  }
  next();
});

const leadsRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => normalizeClientIp(req.ip) || req.ip,
  message: {
    ok: false,
    error: 'Çok fazla talep gönderdiniz. Lütfen 15 dakika sonra tekrar deneyin.'
  }
});

// ---------------------------------------------------------------------------
// 5. Public Health & Lead Capture Endpoints
// ---------------------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  if (!isConnected) {
    return res.status(503).json({ ok: false, mongo: 'disconnected' });
  }
  return res.status(200).json({ ok: true, mongo: 'connected' });
});

app.post('/api/leads', leadsRateLimiter, async (req, res) => {
  try {
    // 1. Honeypot check: if 'website' is filled by a bot, return 200 OK silently without saving
    if (
      req.body &&
      typeof req.body.website === 'string' &&
      req.body.website.trim().length > 0
    ) {
      return res.status(200).json({
        ok: true,
        refCode: generateRefCode()
      });
    }

    // 2. Strict Zod schema validation
    const parsed = leadZodSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0]?.message || 'Geçersiz form verisi.';
      return res.status(400).json({
        ok: false,
        error: firstIssue
      });
    }

    if (mongoose.connection.readyState !== 1) {
      console.error('[ERROR] Lead submission attempted while MongoDB is disconnected.');
      return res.status(503).json({
        ok: false,
        error: 'Veritabanı bağlantısı geçici olarak kullanılamıyor. Lütfen biraz sonra tekrar deneyin.'
      });
    }

    const validData = parsed.data;
    const clientIp = String(normalizeClientIp(req.ip) || req.ip || '').slice(0, 100);
    const userAgent = String(req.get('user-agent') || '').slice(0, 300);

    // 3. Save with refCode collision retry (max 3 attempts)
    let savedLead = null;
    let lastErr = null;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const candidateRefCode = generateRefCode();
      try {
        savedLead = await Lead.create({
          refCode: candidateRefCode,
          requestType: validData.requestType,
          fullName: validData.fullName,
          company: validData.company,
          email: validData.email,
          phone: validData.phone,
          selectedProduct: validData.selectedProduct,
          quantity: validData.quantity,
          pbxSystem: validData.pbxSystem,
          projectName: validData.projectName,
          message: validData.message,
          cartSnapshot: validData.cartSnapshot,
          kvkkAccepted: validData.kvkkAccepted,
          status: 'new',
          isRead: false,
          notes: [],
          ip: clientIp,
          userAgent,
          createdAt: new Date()
        });
        break;
      } catch (err) {
        lastErr = err;
        if (err && err.code === 11000 && attempt < 3) {
          continue;
        }
        throw err;
      }
    }

    if (!savedLead) {
      throw lastErr || new Error('Failed to generate unique refCode');
    }

    // 4. Enqueue Outbox Mail Job asynchronously (NEVER blocks or fails lead creation)
    enqueueLeadMailJob(savedLead._id).catch((mailErr) => {
      console.error('[WARN] Outbox enqueue failed:', mailErr.message);
    });

    return res.status(201).json({
      ok: true,
      refCode: savedLead.refCode
    });
  } catch (err) {
    console.error('[ERROR] POST /api/leads failed:', err);
    return res.status(500).json({
      ok: false,
      error: 'Talebiniz kaydedilirken bir sunucu hatası oluştu. Lütfen tekrar deneyin.'
    });
  }
});

// ---------------------------------------------------------------------------
// 6. Admin Session & API Routes (/api/admin/*)
// ---------------------------------------------------------------------------
const sessionMiddleware = session({
  name: 'fvl_admin',
  secret: SESSION_SECRET,
  proxy: true,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  store: MongoStore.create({
    mongoUrl: MONGO_URI,
    collectionName: 'admin_sessions',
    ttl: 8 * 60 * 60 // 8 hours
  }),
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 8 * 60 * 60 * 1000 // 8 hours
  }
});

app.use(
  '/api/admin',
  (req, _res, next) => {
    // External traffic is strictly HTTPS via tescom-nginx; ensure internal hop never downgrades proto
    req.headers['x-forwarded-proto'] = 'https';
    next();
  },
  sessionMiddleware,
  adminRoutes
);

// ---------------------------------------------------------------------------
// 7. Admin Panel Static SPA Serving (/admin & /admin/*)
//    Protected by IP Allowlist (returns 404 to unauthorized IPs!)
// ---------------------------------------------------------------------------
const adminDistDir = path.join(__dirname, 'public', 'admin');
const adminIndexHtml = path.join(adminDistDir, 'index.html');

app.use(
  '/admin',
  requireAllowedIp,
  (_req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 'no-store');
    next();
  },
  express.static(adminDistDir, {
    index: false,
    etag: false,
    lastModified: false
  })
);

app.get(['/admin', '/admin/*'], requireAllowedIp, (_req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Cache-Control', 'no-store');
  if (fs.existsSync(adminIndexHtml)) {
    return res.sendFile(adminIndexHtml);
  }
  return res.status(404).type('text/plain').send('404 Not Found');
});

// Reject all other routes with 404
app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Bulunamadı.' });
});

// Global error handler (never leak internal details)
app.use((err, _req, res, _next) => {
  if (err && err.message === 'CORS_NOT_ALLOWED') {
    return res.status(403).json({ ok: false, error: 'Erişim reddedildi.' });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ ok: false, error: 'Gönderilen veri boyutu çok büyük.' });
  }
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ ok: false, error: 'Geçersiz JSON formatı.' });
  }
  console.error('[ERROR] Unhandled express error:', err);
  return res.status(500).json({ ok: false, error: 'Beklenmeyen bir hata oluştu.' });
});

// ---------------------------------------------------------------------------
// 8. MongoDB Connection with Retry, Outbox Worker & Graceful Shutdown
// ---------------------------------------------------------------------------
let isShuttingDown = false;
let retryTimer = null;

async function connectWithRetry() {
  if (isShuttingDown) return;
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10
    });
    console.log('[INFO] Connected to MongoDB successfully.');
    startOutboxWorker();
  } catch (err) {
    console.error('[WARN] MongoDB connection failed, retrying in 4s:', err.message);
    if (!isShuttingDown) {
      retryTimer = setTimeout(connectWithRetry, 4000);
    }
  }
}

mongoose.connection.on('disconnected', () => {
  if (!isShuttingDown) {
    console.warn('[WARN] MongoDB disconnected. Attempting reconnect in 4s...');
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = setTimeout(connectWithRetry, 4000);
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[INFO] fanvil-api listening on port ${PORT}`);
  connectWithRetry();
});

async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[INFO] Received ${signal}. Starting graceful shutdown...`);

  stopOutboxWorker();
  if (retryTimer) {
    clearTimeout(retryTimer);
  }

  server.close(async () => {
    try {
      await mongoose.connection.close(false);
      console.log('[INFO] MongoDB connection closed cleanly.');
      process.exit(0);
    } catch (err) {
      console.error('[ERROR] Error closing MongoDB connection:', err);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error('[WARN] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
