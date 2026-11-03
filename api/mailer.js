'use strict';

const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { decryptSecret, escapeHtml } = require('./cryptoUtils');

const REQUEST_TYPE_LABELS = {
  bilgi: 'Ürün Hakkında Bilgi & Fiyat Al',
  proje: 'FPRS Proje Kaydı & Özel İskonto',
  bayi: 'Alt Bayilik / Partner Başvurusu',
  demo: '2-Wire / Teknik Demo Talebi'
};

// Pooled SMTP transporter cache (recreated automatically when settings change)
let cachedTransporter = null;
let cachedConfigSignature = '';

function invalidateMailTransporter() {
  if (cachedTransporter) {
    try {
      cachedTransporter.close();
    } catch (_err) {
      // ignore close error
    }
    cachedTransporter = null;
    cachedConfigSignature = '';
  }
}

function isMailSettingsConfigured(settingsDoc) {
  if (!settingsDoc) return false;
  return Boolean(
    settingsDoc.smtpHost &&
      settingsDoc.smtpPort &&
      settingsDoc.smtpFromAddress &&
      settingsDoc.smtpUser &&
      settingsDoc.smtpPassEnc
  );
}

function classifySmtpError(err) {
  const code = String(err?.code || '').toUpperCase();
  const responseCode = Number(err?.responseCode) || 0;
  const rawMsg = String(err?.response || err?.message || err || '');
  const lowerMsg = rawMsg.toLowerCase();

  // 1. TLS / Certificate verification failure (rejectUnauthorized is strictly true)
  if (
    code.includes('CERT') ||
    code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
    code === 'DEPTH_ZERO_SELF_SIGNED_CERT' ||
    code === 'SELF_SIGNED_CERT_IN_CHAIN' ||
    code === 'ERR_TLS_CERT_ALTNAME_INVALID' ||
    code === 'UNABLE_TO_GET_ISSUER_CERT' ||
    code === 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY' ||
    lowerMsg.includes('certificate') ||
    lowerMsg.includes('altnames') ||
    lowerMsg.includes('self signed')
  ) {
    const wrapped = new Error(`Sunucu sertifikası doğrulanamadı (${rawMsg.slice(0, 160)})`);
    wrapped.permanent = false;
    return wrapped;
  }

  // 2. Authentication error (535 / EAUTH)
  if (responseCode === 535 || code === 'EAUTH' || /\b535\b/.test(rawMsg)) {
    const wrapped = new Error(`Kullanıcı adı veya şifre hatalı (${rawMsg.slice(0, 160)})`);
    wrapped.permanent = false;
    return wrapped;
  }

  // 3. Permanent recipient / spam / policy rejection (550 / 554) -> DO NOT RETRY
  if (
    responseCode === 550 ||
    responseCode === 554 ||
    /\b(550|554)\b/.test(rawMsg)
  ) {
    const wrapped = new Error(
      `Alıcı sunucu reddetti (SPF/DKIM veya spam filtresi) (${rawMsg.slice(0, 180)})`
    );
    wrapped.permanent = true;
    return wrapped;
  }

  // 4. Connection / timeout / DNS / firewall errors
  if (
    code === 'ECONNECTION' ||
    code === 'ETIMEDOUT' ||
    code === 'ESOCKET' ||
    code === 'ENOTFOUND' ||
    code === 'ECONNREFUSED' ||
    code === 'EHOSTUNREACH' ||
    lowerMsg.includes('etimedout') ||
    lowerMsg.includes('econnrefused') ||
    lowerMsg.includes('connection timeout') ||
    lowerMsg.includes('greeting never received')
  ) {
    const wrapped = new Error(
      `Sunucuya bağlanılamadı (port/host/firewall) (${rawMsg.slice(0, 160)})`
    );
    wrapped.permanent = false;
    return wrapped;
  }

  // 5. 4xx temporary SMTP errors (retryable)
  if (
    (responseCode >= 400 && responseCode < 500) ||
    /\b4[0-9]{2}\b/.test(rawMsg)
  ) {
    const wrapped = new Error(`Geçici SMTP sunucu hatası (4xx): ${rawMsg.slice(0, 200)}`);
    wrapped.permanent = false;
    return wrapped;
  }

  const fallback = new Error(`SMTP gönderim hatası: ${rawMsg.slice(0, 220)}`);
  fallback.permanent = false;
  return fallback;
}

function getOrCreateTransporter(settingsDoc) {
  const host = (settingsDoc.smtpHost || 'mail.dogrumail.com').trim();
  const port = Number(settingsDoc.smtpPort) || 587;
  const isImplicitTls = settingsDoc.smtpSecurity === 'tls' || port === 465;
  const user = (settingsDoc.smtpUser || '').trim();
  const fromAddress = (settingsDoc.smtpFromAddress || '').trim();

  if (!host || !port || !user || !settingsDoc.smtpPassEnc || !fromAddress) {
    throw new Error(
      'SMTP ayarları eksik (Host, Port, Kullanıcı Adı, Şifre ve Gönderen Adres zorunludur).'
    );
  }

  const pass = decryptSecret(settingsDoc.smtpPassEnc);

  const signature = crypto
    .createHash('sha256')
    .update(`${host}:${port}:${isImplicitTls ? 'tls' : 'starttls'}:${user}:${pass}`)
    .digest('hex');

  if (cachedTransporter && cachedConfigSignature === signature) {
    return cachedTransporter;
  }

  invalidateMailTransporter();

  cachedTransporter = nodemailer.createTransport({
    pool: true,
    maxConnections: 1,
    maxMessages: 50,
    host,
    port,
    secure: isImplicitTls,
    requireTLS: !isImplicitTls,
    auth: { user, pass },
    tls: {
      minVersion: 'TLSv1.2',
      servername: host
    },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 30000
  });

  cachedConfigSignature = signature;
  return cachedTransporter;
}

async function sendMailWithSettings(
  settingsDoc,
  { toAddresses, subject, html, text, replyTo },
  options = { verifyFirst: false }
) {
  if (!settingsDoc) {
    throw new Error('Mail ayarları henüz yapılandırılmamış.');
  }

  const fromAddress = (settingsDoc.smtpFromAddress || '').trim();
  const fromName = (settingsDoc.smtpFromName || 'Tescom Fanvil Partner').trim();

  let transporter;
  try {
    transporter = getOrCreateTransporter(settingsDoc);
  } catch (err) {
    throw classifySmtpError(err);
  }

  try {
    if (options && options.verifyFirst) {
      await transporter.verify();
    }

    await transporter.sendMail({
      from: `"${fromName.replace(/"/g, '')}" <${fromAddress}>`,
      to: toAddresses.join(', '),
      ...(replyTo ? { replyTo } : {}),
      subject,
      text: text || subject,
      html,
      headers: {
        'X-Auto-Response-Suppress': 'All',
        'Auto-Submitted': 'auto-generated'
      }
    });

    return { ok: true };
  } catch (err) {
    throw classifySmtpError(err);
  }
}

function buildLeadNotificationContent(lead) {
  const publicBaseUrl = (process.env.PUBLIC_BASE_URL || 'https://fanvilpartner.com').replace(
    /\/+$/,
    ''
  );
  const adminLeadUrl = `${publicBaseUrl}/admin/leads/${lead._id}`;
  const requestLabel = REQUEST_TYPE_LABELS[lead.requestType] || lead.requestType;
  const formattedDate = new Date(lead.createdAt || Date.now()).toLocaleString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    dateStyle: 'medium',
    timeStyle: 'medium'
  });

  const subject = `Yeni Fanvil Lead – ${lead.refCode} – ${lead.company}`;

  const cartItems = Array.isArray(lead.cartSnapshot) ? lead.cartSnapshot : [];
  const cartText =
    cartItems.length > 0
      ? cartItems.map((item) => `- ${item.model}: ${item.qty} Adet`).join('\n')
      : 'Sepet boş';

  const cartHtml =
    cartItems.length > 0
      ? `<ul style="margin:0;padding-left:18px;">${cartItems
          .map(
            (item) =>
              `<li><strong>${escapeHtml(item.model)}</strong> — ${escapeHtml(item.qty)} Adet</li>`
          )
          .join('')}</ul>`
      : '<span style="color:#64748b;">Sepet boş</span>';

  const text = [
    `Yeni Fanvil Lead Kaydı (${lead.refCode})`,
    `=========================================`,
    `Referans Kodu : ${lead.refCode}`,
    `Talep Tipi    : ${requestLabel}`,
    `Ad Soyad      : ${lead.fullName}`,
    `Firma / Kurum : ${lead.company}`,
    `E-Posta       : ${lead.email}`,
    `Telefon       : ${lead.phone}`,
    `Ürün / Çözüm  : ${lead.selectedProduct || '-'}`,
    `Adet / Ölçek  : ${lead.quantity || '-'}`,
    `Santral (PBX) : ${lead.pbxSystem || '-'}`,
    `Proje Adı     : ${lead.projectName || '-'}`,
    `Tarih         : ${formattedDate} (Europe/Istanbul)`,
    ``,
    `Mesaj / Not:`,
    `${lead.message || '-'}`,
    ``,
    `Proje Teklif Sepeti:`,
    `${cartText}`,
    ``,
    `Yönetim Panelinde Görüntüle: ${adminLeadUrl}`
  ].join('\n');

  const rows = [
    ['Referans Kodu', `<strong>${escapeHtml(lead.refCode)}</strong>`],
    ['Talep Tipi', escapeHtml(requestLabel)],
    ['Ad Soyad', escapeHtml(lead.fullName)],
    ['Firma / Kurum', `<strong>${escapeHtml(lead.company)}</strong>`],
    [
      'E-Posta',
      `<a href="mailto:${escapeHtml(lead.email)}" style="color:#E60012;text-decoration:none;">${escapeHtml(lead.email)}</a>`
    ],
    ['Telefon', escapeHtml(lead.phone)],
    ['Ürün / Çözüm', escapeHtml(lead.selectedProduct || '-')],
    ['Adet / Ölçek', escapeHtml(lead.quantity || '-')],
    ['Santral (PBX)', escapeHtml(lead.pbxSystem || '-')],
    ['Proje Adı', escapeHtml(lead.projectName || '-')],
    [
      'Mesaj / Not',
      `<div style="white-space:pre-wrap;">${escapeHtml(lead.message || '-')}</div>`
    ],
    ['Teklif Sepeti', cartHtml],
    ['Tarih (İstanbul)', escapeHtml(formattedDate)]
  ];

  const html = `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
    <div style="background:#0f172a;color:#ffffff;padding:18px 24px;border-bottom:3px solid #E60012;">
      <div style="font-size:12px;color:#fca5a5;font-weight:bold;text-transform:uppercase;letter-spacing:0.6px;">Tescom Fanvil Partner</div>
      <h2 style="margin:6px 0 0;font-size:18px;">Yeni Kurumsal Talep: ${escapeHtml(lead.refCode)}</h2>
    </div>
    <div style="padding:24px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tbody>
          ${rows
            .map(
              ([label, val]) => `
            <tr>
              <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;width:160px;color:#475569;font-weight:bold;vertical-align:top;">${label}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#0f172a;vertical-align:top;">${val}</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
      <div style="margin-top:24px;text-align:center;">
        <a href="${escapeHtml(adminLeadUrl)}" style="display:inline-block;background:#E60012;color:#ffffff;font-weight:bold;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;">
          Admin Panelinde Lead Detayını Aç
        </a>
      </div>
    </div>
  </div>
</body>
</html>`;

  return {
    subject,
    text,
    html,
    replyTo: lead.email
  };
}

module.exports = {
  invalidateMailTransporter,
  isMailSettingsConfigured,
  sendMailWithSettings,
  buildLeadNotificationContent
};
