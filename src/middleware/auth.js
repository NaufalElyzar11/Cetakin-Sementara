'use strict';

const crypto = require('node:crypto');

const hosted = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
const configuredSecret = process.env.JWT_SECRET || '';
// Reject the old published fallback even if copied into hosting configuration.
const legacySecretHash = '17627a4c3c10f787c1d16a703c71a1d930b54660b4b1548deab81764afb7a894';
const validSecret = Buffer.byteLength(configuredSecret) >= 32 && crypto.createHash('sha256').update(configuredSecret).digest('hex') !== legacySecretHash;
const JWT_SECRET = validSecret ? configuredSecret : hosted ? null : crypto.randomBytes(32);

function createToken(user) {
  const payload = {
    username: user.username,
    name: user.name,
    role: user.role,
    allowedUnits: user.allowedUnits,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 hari
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token) {
  if (!JWT_SECRET || typeof token !== 'string') return null;
  const [data, sig, extra] = token.split('.');
  if (!data || !sig || extra !== undefined) return null;
  const expectedSig = Buffer.from(crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url'));
  const receivedSig = Buffer.from(sig);
  if (receivedSig.length !== expectedSig.length || !crypto.timingSafeEqual(receivedSig, expectedSig)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!Number.isFinite(payload.exp) || payload.exp < Date.now()) return null;
    return payload;
  } catch (_) {
    return null;
  }
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, error: 'Sesi berakhir atau belum login. Silakan login kembali.' });
  }
  const user = verifyToken(authHeader.slice(7).trim());
  if (!user) {
    return res.status(401).json({ ok: false, error: 'Token sesi tidak valid atau sudah kedaluwarsa.' });
  }
  req.user = user;
  next();
}

function canAccessUnit(user, unit) {
  if (!user) return false;
  if (user.role === 'owner') return true;
  return Array.isArray(user.allowedUnits) && user.allowedUnits.includes(unit);
}

function canManageCatalogType(user, type) {
  if (!user) return false;
  if (user.role === 'owner') return true;
  if (user.role === 'admin_3d' && type === 'gantungan-kunci') return true;
  if (user.role === 'admin_robotika' && type === 'robotika') return true;
  return false;
}

module.exports = {
  authConfigured: Boolean(JWT_SECRET),
  createToken,
  verifyToken,
  requireAuth,
  canAccessUnit,
  canManageCatalogType
};
