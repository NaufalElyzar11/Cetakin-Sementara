'use strict';

const crypto = require('node:crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'cetakin-cloud-secret-key-2026-bjb';

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
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp < Date.now()) return null;
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
  createToken,
  verifyToken,
  requireAuth,
  canAccessUnit,
  canManageCatalogType
};
