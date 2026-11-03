'use strict';

const ipaddr = require('ipaddr.js');
const { AllowedIp } = require('./models');

const CACHE_TTL_MS = 30 * 1000; // 30 seconds
let cachedDbIps = null;
let cacheExpiresAt = 0;

function getBootstrapIps() {
  const raw = process.env.ADMIN_BOOTSTRAP_IPS || '188.124.10.58';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeClientIp(rawIp) {
  if (!rawIp) return '';
  const cleaned = String(rawIp).trim();
  try {
    if (ipaddr.isValid(cleaned)) {
      const parsed = ipaddr.process(cleaned);
      return parsed.toString();
    }
  } catch (_err) {
    // ignore parse error
  }
  return cleaned;
}

function validateIpOrCidr(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  try {
    if (trimmed.includes('/')) {
      const [addr, prefix] = ipaddr.parseCIDR(trimmed);
      const normalizedAddr =
        addr.kind() === 'ipv6' && addr.isIPv4MappedAddress()
          ? addr.toIPv4Address()
          : addr;
      return `${normalizedAddr.toString()}/${prefix}`;
    }
    if (ipaddr.isValid(trimmed)) {
      const parsed = ipaddr.process(trimmed);
      return parsed.toString();
    }
  } catch (_err) {
    return null;
  }
  return null;
}

function ipMatchesRule(clientIpStr, ruleStr) {
  try {
    if (!ipaddr.isValid(clientIpStr)) return false;
    const clientAddr = ipaddr.process(clientIpStr);

    if (ruleStr.includes('/')) {
      const [rangeAddr, prefix] = ipaddr.parseCIDR(ruleStr);
      const normalizedRange =
        rangeAddr.kind() === 'ipv6' && rangeAddr.isIPv4MappedAddress()
          ? rangeAddr.toIPv4Address()
          : rangeAddr;
      if (clientAddr.kind() !== normalizedRange.kind()) return false;
      return clientAddr.match([normalizedRange, prefix]);
    }

    if (!ipaddr.isValid(ruleStr)) return false;
    const ruleAddr = ipaddr.process(ruleStr);
    if (clientAddr.kind() !== ruleAddr.kind()) return false;
    return clientAddr.toString() === ruleAddr.toString();
  } catch (_err) {
    return false;
  }
}

function isInternalDockerOrLoopbackIp(rawIp) {
  try {
    const norm = normalizeClientIp(rawIp);
    if (!norm || !ipaddr.isValid(norm)) return false;
    const addr = ipaddr.process(norm);
    const range = addr.range();
    return (
      range === 'loopback' ||
      range === 'private' ||
      range === 'uniqueLocal' ||
      range === 'linkLocal'
    );
  } catch (_err) {
    return false;
  }
}

function invalidateAllowedIpCache() {
  cachedDbIps = null;
  cacheExpiresAt = 0;
}

async function getAllowedRules() {
  const now = Date.now();
  if (!cachedDbIps || now >= cacheExpiresAt) {
    try {
      const docs = await AllowedIp.find().sort({ createdAt: -1 }).lean();
      cachedDbIps = docs.map((d) => d.ip);
      cacheExpiresAt = now + CACHE_TTL_MS;
    } catch (err) {
      console.error('[ERROR] Failed to read allowed_ips from MongoDB:', err.message);
      cachedDbIps = cachedDbIps || [];
    }
  }
  const bootstrap = getBootstrapIps();
  return Array.from(new Set([...bootstrap, ...cachedDbIps]));
}

async function isClientIpAllowed(rawIp) {
  const clientIp = normalizeClientIp(rawIp);
  if (!clientIp) return false;
  const rules = await getAllowedRules();
  return rules.some((rule) => ipMatchesRule(clientIp, rule));
}

async function requireAllowedIp(req, res, next) {
  const clientIp = normalizeClientIp(req.ip);
  const allowed = await isClientIpAllowed(clientIp);
  if (!allowed) {
    console.warn(
      `[ADMIN_IP_DENIED] ip=${clientIp || 'unknown'} path=${req.originalUrl} time=${new Date().toISOString()}`
    );
    // Return 404 (NEVER 403) so the existence of /admin is hidden
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(404).json({ ok: false, error: 'Bulunamadı.' });
    }
    return res.status(404).type('text/plain').send('404 Not Found');
  }
  req.clientIpNormalized = clientIp;
  return next();
}

module.exports = {
  getBootstrapIps,
  normalizeClientIp,
  validateIpOrCidr,
  ipMatchesRule,
  isInternalDockerOrLoopbackIp,
  invalidateAllowedIpCache,
  isClientIpAllowed,
  requireAllowedIp
};
