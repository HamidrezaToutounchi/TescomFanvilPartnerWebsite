'use strict';

const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { ConfidentialClientApplication } = require('@azure/msal-node');
const { decryptSecret, escapeHtml } = require('./cryptoUtils');

const REQUEST_TYPE_LABELS = {
  bilgi: 'Ürün Hakkında Bilgi & Fiyat Al',
  proje: 'FPRS Proje Kaydı & Özel İskonto',
  bayi: 'Alt Bayilik / Partner Başvurusu',
  demo: '2-Wire / Teknik Demo Talebi'
};

// Cache MSAL ConfidentialClientApplication & token in memory
let cachedMsalKey = '';
let cachedMsalClient = null;
let cachedAccessToken = '';
let cachedTokenExpiresAt = 0;

function getMsalClient(tenantId, clientId, clientSecret) {
  const sig = crypto
    .createHash('sha256')
    .update(`${tenantId}:${clientId}:${clientSecret}`)
    .digest('hex');

  if (cachedMsalClient && cachedMsalKey === sig) {
    return cachedMsalClient;
  }

  cachedMsalClient = new ConfidentialClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      clientSecret
    }
  });
  cachedMsalKey = sig;
  cachedAccessToken = '';
  cachedTokenExpiresAt = 0;
  return cachedMsalClient;
}

async function acquireGraphToken(tenantId, clientId, clientSecret) {
  const now = Date.now();
  if (cachedAccessToken && cachedTokenExpiresAt - 60000 > now) {
    return cachedAccessToken;
  }

  const msalClient = getMsalClient(tenantId, clientId, clientSecret);
  let result;
  try {
    result = await msalClient.acquireTokenByClientCredential({
      scopes: ['https://graph.microsoft.com/.default']
    });
  } catch (err) {
    const rawMsg = err?.message || String(err);
    if (
      rawMsg.includes('AADSTS700016') ||
      rawMsg.includes('AADSTS7000215') ||
      rawMsg.includes('invalid_client') ||
      rawMsg.includes('unauthorized_client')
    ) {
      throw new Error(
        `Entra ID kimlik doğrulama hatası: Tenant ID, Client ID veya Client Secret hatalı ya da süresi dolmuş. (${rawMsg.slice(0, 180)})`
      );
    }
    throw new Error(`Microsoft Entra ID token alınamadı: ${rawMsg.slice(0, 220)}`);
  }

  if (!result || !result.accessToken) {
    throw new Error('Microsoft Graph erişim anahtarı (accessToken) alınamadı.');
  }

  cachedAccessToken = result.accessToken;
  cachedTokenExpiresAt = result.expiresOn
    ? new Date(result.expiresOn).getTime()
    : now + 50 * 60 * 1000;

  return cachedAccessToken;
}

function isMailSettingsConfigured(settingsDoc) {
  if (!settingsDoc) return false;
  if (settingsDoc.mode === 'smtp') {
    return Boolean(
      settingsDoc.smtpHost &&
        settingsDoc.smtpPort &&
        settingsDoc.smtpFromAddress &&
        settingsDoc.smtpUser &&
        settingsDoc.smtpPassEnc
    );
  }
  // default mode === 'graph'
  return Boolean(
    settingsDoc.tenantId &&
      settingsDoc.clientId &&
      settingsDoc.clientSecretEnc &&
      settingsDoc.graphFromAddress
  );
}

async function sendViaGraph(settingsDoc, { toAddresses, subject, html, replyTo }) {
  const tenantId = (settingsDoc.tenantId || '').trim();
  const clientId = (settingsDoc.clientId || '').trim();
  const fromAddress = (settingsDoc.graphFromAddress || '').trim();
  const fromName = (settingsDoc.graphFromName || 'Fanvil Gold Partner Portal').trim();

  if (!tenantId || !clientId || !settingsDoc.clientSecretEnc || !fromAddress) {
    throw new Error(
      'Microsoft 365 Graph API ayarları eksik (Tenant ID, Client ID, Client Secret ve Gönderen Adres zorunludur).'
    );
  }

  const clientSecret = decryptSecret(settingsDoc.clientSecretEnc);
  const accessToken = await acquireGraphToken(tenantId, clientId, clientSecret);

  const endpoint = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(fromAddress)}/sendMail`;

  const payload = {
    message: {
      subject,
      body: {
        contentType: 'HTML',
        content: html
      },
      from: {
        emailAddress: {
          name: fromName,
          address: fromAddress
        }
      },
      toRecipients: toAddresses.map((addr) => ({
        emailAddress: { address: addr }
      })),
      ...(replyTo
        ? {
            replyTo: [
              {
                emailAddress: { address: replyTo }
              }
            ]
          }
        : {})
    },
    saveToSentItems: true
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (response.status === 202 || response.ok) {
    return { ok: true, mode: 'graph' };
  }

  let errBodyText = '';
  try {
    errBodyText = await response.text();
  } catch (_e) {
    errBodyText = '';
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error(
      `Uygulama izni yok (${response.status}): Microsoft Graph > Application permission > Mail.Send + Admin Consent gerekli (veya ApplicationAccessPolicy bu gönderici adresine izin vermiyor). Detay: ${errBodyText.slice(0, 200)}`
    );
  }

  if (response.status === 429 || response.status >= 500) {
    const retryAfterHeader = response.headers.get('retry-after');
    const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null;
    const retryErr = new Error(
      `Microsoft Graph geçici hata döndü (HTTP ${response.status}). Outbox yeniden deneyecek. Detay: ${errBodyText.slice(0, 180)}`
    );
    if (retryAfterSeconds && Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
      retryErr.retryAfterSeconds = retryAfterSeconds;
    }
    throw retryErr;
  }

  throw new Error(
    `Microsoft Graph gönderim hatası (HTTP ${response.status}): ${errBodyText.slice(0, 240)}`
  );
}

async function sendViaSmtp(settingsDoc, { toAddresses, subject, html, text, replyTo }) {
  const host = (settingsDoc.smtpHost || 'smtp.office365.com').trim();
  const port = Number(settingsDoc.smtpPort) || 587;
  const isImplicitTls = settingsDoc.smtpSecurity === 'tls' || port === 465;
  const user = (settingsDoc.smtpUser || '').trim();
  const fromAddress = (settingsDoc.smtpFromAddress || user).trim();
  const fromName = (settingsDoc.smtpFromName || 'Fanvil Gold Partner Portal').trim();

  if (!host || !port || !user || !settingsDoc.smtpPassEnc || !fromAddress) {
    throw new Error(
      'SMTP ayarları eksik (Host, Port, Kullanıcı Adı, Şifre ve Gönderen Adres zorunludur).'
    );
  }

  const pass = decryptSecret(settingsDoc.smtpPassEnc);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: isImplicitTls,
    requireTLS: !isImplicitTls,
    auth: { user, pass },
    tls: {
      minVersion: 'TLSv1.2'
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000
  });

  try {
    await transporter.sendMail({
      from: `"${fromName.replace(/"/g, '')}" <${fromAddress}>`,
      to: toAddresses.join(', '),
      ...(replyTo ? { replyTo } : {}),
      subject,
      text: text || subject,
      html
    });
    return { ok: true, mode: 'smtp' };
  } catch (err) {
    const rawMsg = err?.message || String(err);
    if (
      rawMsg.includes('535 5.7.139') ||
      rawMsg.includes('550 5.7.30') ||
      rawMsg.includes('SmtpClientAuthenticationIsDisabled')
    ) {
      throw new Error(
        `SMTP AUTH bu mailbox'ta kapalı veya Basic Auth engellenmiş (${rawMsg.slice(0, 140)}). Lütfen Microsoft 365 – Graph API modunu kullanın.`
      );
    }
    throw new Error(`SMTP gönderim hatası: ${rawMsg.slice(0, 240)}`);
  }
}

async function sendMailWithSettings(settingsDoc, messageOptions) {
  if (!settingsDoc) {
    throw new Error('Mail ayarları henüz yapılandırılmamış.');
  }
  if (settingsDoc.mode === 'smtp') {
    return sendViaSmtp(settingsDoc, messageOptions);
  }
  return sendViaGraph(settingsDoc, messageOptions);
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
      <div style="font-size:12px;color:#fca5a5;font-weight:bold;text-transform:uppercase;letter-spacing:0.6px;">Fanvil Gold Partner Portal</div>
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
  isMailSettingsConfigured,
  sendMailWithSettings,
  buildLeadNotificationContent
};
