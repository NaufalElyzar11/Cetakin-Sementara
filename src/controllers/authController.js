'use strict';

const { loadDb, saveDb, hashPassword } = require('../config/db.js');
const { createToken } = require('../middleware/auth.js');

async function login(req, res, next) {
  try {
    const db = await loadDb();
    const { username, password } = req.body || {};
    const user = (db.users || []).find(
      (u) => u.username === String(username || '').trim().toLowerCase()
    );

    if (!user || user.passwordHash !== hashPassword(String(password || ''))) {
      return res.status(401).json({ ok: false, error: 'Username atau password salah.' });
    }

    const token = createToken(user);
    return res.json({
      ok: true,
      token,
      user: {
        username: user.username,
        name: user.name,
        role: user.role,
        allowedUnits: user.allowedUnits
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res) {
  return res.json({ ok: true, user: req.user });
}

async function updatePassword(req, res, next) {
  try {
    const db = await loadDb();
    const user = req.user;
    const { oldPassword, newPassword, targetUsername } = req.body || {};
    const target = (user.role === 'owner' && targetUsername) ? targetUsername : user.username;
    const uRecord = (db.users || []).find((u) => u.username === target);

    if (!uRecord) {
      return res.status(404).json({ ok: false, error: 'User tidak ditemukan.' });
    }
    if (user.role !== 'owner' && uRecord.passwordHash !== hashPassword(String(oldPassword || ''))) {
      return res.status(400).json({ ok: false, error: 'Password lama tidak sesuai.' });
    }
    if (!newPassword || String(newPassword).length < 4) {
      return res.status(400).json({ ok: false, error: 'Password baru minimal 4 karakter.' });
    }

    uRecord.passwordHash = hashPassword(String(newPassword));
    await saveDb(db);
    return res.json({
      ok: true,
      message: `Password untuk akun "${uRecord.username}" berhasil diperbarui.`
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  getMe,
  updatePassword
};
