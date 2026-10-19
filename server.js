'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { loadDb, saveDb, hashPassword } = require('./db.js');
const financeCore = require('./finance-core.js');

const PORT = Number(process.env.PORT) || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'cetakin-cloud-secret-key-2026-bjb';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

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

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(payload);
}

function readJsonBody(req, maxBytes = 6 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > maxBytes) {
        reject(new Error('Ukuran data melebihi batas (maks 6MB).'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (_) {
        reject(new Error('Format JSON tidak valid.'));
      }
    });
    req.on('error', reject);
  });
}

function getAuthUser(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return verifyToken(authHeader.slice(7).trim());
  }
  return null;
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

function toPublicCsv(catalog) {
  const headers = ['id', 'type', 'name', 'category', 'origin', 'price', 'stock', 'image_url', 'description', 'material', 'dimensions', 'weight_grams', 'active', 'featured', 'updated_at'];
  const esc = (val) => {
    const s = val === null || val === undefined ? '' : String(val);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(',')];
  for (const item of catalog) {
    const row = [
      item.id,
      item.type,
      item.name,
      item.category || '',
      item.origin || '',
      Math.max(1, Math.round(Number(item.price) || 1000)),
      Math.max(0, Math.round(Number(item.stock) || 0)),
      item.image_url || '',
      item.description || '',
      item.material || '',
      item.dimensions || '',
      item.weight_grams || '',
      item.active ? 'TRUE' : 'FALSE',
      item.featured ? 'TRUE' : 'FALSE',
      item.updated_at || ''
    ];
    lines.push(row.map(esc).join(','));
  }
  return lines.join('\n');
}

async function handleApi(req, res, urlObj) {
  const pathname = urlObj.pathname;
  const method = req.method;
  const db = await loadDb();

  // 1. Public Catalog Endpoint (Menyembunyikan HPP / cost_price dari publik)
  if (pathname === '/api/catalog' && method === 'GET') {
    const format = urlObj.searchParams.get('format');
    if (format === 'csv') {
      const csv = toPublicCsv(db.catalog || []);
      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      return res.end(csv);
    }
    const publicItems = (db.catalog || [])
      .filter((item) => item.active)
      .map(({ cost_price, ...rest }) => ({
        ...rest,
        group: rest.type === 'robotika' ? rest.category : rest.origin
      }));
    return sendJson(res, 200, { ok: true, products: publicItems, updatedAt: db.updatedAt });
  }

  // 2. Auth Login
  if (pathname === '/api/auth/login' && method === 'POST') {
    try {
      const { username, password } = await readJsonBody(req);
      const user = (db.users || []).find((u) => u.username === String(username || '').trim().toLowerCase());
      if (!user || user.passwordHash !== hashPassword(String(password || ''))) {
        return sendJson(res, 401, { ok: false, error: 'Username atau password salah.' });
      }
      const token = createToken(user);
      return sendJson(res, 200, {
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
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  // Semua endpoint di bawah ini wajib autentikasi
  const user = getAuthUser(req);
  if (!user) {
    return sendJson(res, 401, { ok: false, error: 'Sesi berakhir atau belum login. Silakan login kembali.' });
  }

  if (pathname === '/api/auth/me' && method === 'GET') {
    return sendJson(res, 200, { ok: true, user });
  }

  // Ganti Password
  if (pathname === '/api/auth/password' && method === 'POST') {
    try {
      const { oldPassword, newPassword, targetUsername } = await readJsonBody(req);
      const target = (user.role === 'owner' && targetUsername) ? targetUsername : user.username;
      const uRecord = (db.users || []).find((u) => u.username === target);
      if (!uRecord) return sendJson(res, 404, { ok: false, error: 'User tidak ditemukan.' });
      if (user.role !== 'owner' && uRecord.passwordHash !== hashPassword(String(oldPassword || ''))) {
        return sendJson(res, 400, { ok: false, error: 'Password lama tidak sesuai.' });
      }
      if (!newPassword || String(newPassword).length < 4) {
        return sendJson(res, 400, { ok: false, error: 'Password baru minimal 4 karakter.' });
      }
      uRecord.passwordHash = hashPassword(String(newPassword));
      await saveDb(db);
      return sendJson(res, 200, { ok: true, message: `Password untuk ${uRecord.username} berhasil diperbarui.` });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  // 3. Admin Catalog CRUD (Termasuk HPP / cost_price & produk nonaktif)
  if (pathname === '/api/admin/catalog' && method === 'GET') {
    const items = (db.catalog || []).filter((item) => {
      if (user.role === 'owner') return true;
      if (user.role === 'admin_3d') return item.type === 'gantungan-kunci';
      if (user.role === 'admin_robotika') return item.type === 'robotika';
      return false;
    });
    return sendJson(res, 200, { ok: true, products: items });
  }

  if (pathname === '/api/admin/catalog' && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const type = body.type === 'gantungan-kunci' ? 'gantungan-kunci' : 'robotika';
      if (!canManageCatalogType(user, type)) {
        return sendJson(res, 403, { ok: false, error: 'Anda tidak memiliki akses untuk menambah produk di kategori ini.' });
      }
      const id = String(body.id || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
      if (!id) return sendJson(res, 400, { ok: false, error: 'Kode/ID produk wajib diisi (huruf/angka/strip).' });
      if ((db.catalog || []).some((p) => p.id === id)) {
        return sendJson(res, 400, { ok: false, error: `Kode produk "${id}" sudah digunakan. Gunakan kode lain.` });
      }
      const name = String(body.name || '').trim();
      if (!name) return sendJson(res, 400, { ok: false, error: 'Nama produk wajib diisi.' });
      const groupVal = type === 'robotika' ? String(body.category || '').trim() : String(body.origin || '').trim();
      if (!groupVal) {
        return sendJson(res, 400, { ok: false, error: type === 'robotika' ? 'Kategori robotika wajib diisi.' : 'Asal desain/seri ganci wajib diisi.' });
      }

      const newProduct = {
        id,
        type,
        name,
        category: type === 'robotika' ? groupVal : '',
        origin: type === 'gantungan-kunci' ? groupVal : '',
        price: Math.max(100, Math.round(Number(body.price) || 0)),
        cost_price: Math.max(0, Math.round(Number(body.cost_price) || 0)),
        stock: Math.max(0, Math.round(Number(body.stock) || 0)),
        image_url: String(body.image_url || '').trim(),
        description: String(body.description || name).trim(),
        material: String(body.material || '').trim(),
        dimensions: String(body.dimensions || '').trim(),
        weight_grams: body.weight_grams !== '' && body.weight_grams !== undefined ? String(body.weight_grams).trim() : '',
        active: Boolean(body.active !== undefined ? body.active : true),
        featured: Boolean(body.featured),
        updated_at: new Date().toISOString().slice(0, 10)
      };

      db.catalog.unshift(newProduct);
      await saveDb(db);
      return sendJson(res, 201, { ok: true, product: newProduct });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  if (pathname.startsWith('/api/admin/catalog/') && (method === 'PUT' || method === 'DELETE')) {
    const targetId = decodeURIComponent(pathname.slice('/api/admin/catalog/'.length));
    const idx = (db.catalog || []).findIndex((p) => p.id === targetId);
    if (idx === -1) return sendJson(res, 404, { ok: false, error: 'Produk tidak ditemukan.' });
    const existing = db.catalog[idx];

    if (!canManageCatalogType(user, existing.type)) {
      return sendJson(res, 403, { ok: false, error: 'Anda tidak memiliki akses untuk mengubah produk di kategori ini.' });
    }

    if (method === 'DELETE') {
      db.catalog.splice(idx, 1);
      await saveDb(db);
      return sendJson(res, 200, { ok: true });
    }

    try {
      const body = await readJsonBody(req);
      const nextType = body.type ? (body.type === 'gantungan-kunci' ? 'gantungan-kunci' : 'robotika') : existing.type;
      if (!canManageCatalogType(user, nextType)) {
        return sendJson(res, 403, { ok: false, error: 'Anda tidak memiliki akses ke kategori tujuan.' });
      }

      const updated = {
        ...existing,
        type: nextType,
        name: body.name !== undefined ? String(body.name).trim() : existing.name,
        category: nextType === 'robotika' ? String(body.category ?? existing.category ?? '').trim() : '',
        origin: nextType === 'gantungan-kunci' ? String(body.origin ?? existing.origin ?? '').trim() : '',
        price: body.price !== undefined ? Math.max(100, Math.round(Number(body.price) || 0)) : existing.price,
        cost_price: body.cost_price !== undefined ? Math.max(0, Math.round(Number(body.cost_price) || 0)) : (existing.cost_price || 0),
        stock: body.stock !== undefined ? Math.max(0, Math.round(Number(body.stock) || 0)) : existing.stock,
        image_url: body.image_url !== undefined ? String(body.image_url).trim() : existing.image_url,
        description: body.description !== undefined ? String(body.description).trim() : existing.description,
        material: body.material !== undefined ? String(body.material).trim() : existing.material,
        dimensions: body.dimensions !== undefined ? String(body.dimensions).trim() : existing.dimensions,
        weight_grams: body.weight_grams !== undefined ? String(body.weight_grams).trim() : existing.weight_grams,
        active: body.active !== undefined ? Boolean(body.active) : existing.active,
        featured: body.featured !== undefined ? Boolean(body.featured) : existing.featured,
        updated_at: new Date().toISOString().slice(0, 10)
      };

      db.catalog[idx] = updated;
      await saveDb(db);
      return sendJson(res, 200, { ok: true, product: updated });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  // 4. Endpoint Dashboard & Keuangan (Ringkasan + Pesanan + Mutasi + Upah + Rekonsiliasi QRIS)
  if (pathname === '/api/finance/dashboard' && method === 'GET') {
    const filterMonth = urlObj.searchParams.get('month') || '';
    const result = {
      ok: true,
      user,
      settings: db.settings || financeCore.DEFAULT_SETTINGS,
      units: {}
    };

    if (canAccessUnit(user, '3d-print')) {
      result.units['3d-print'] = financeCore.computeUnitSummary(db, '3d-print', filterMonth || null);
    }
    if (canAccessUnit(user, 'robotika')) {
      result.units['robotika'] = financeCore.computeUnitSummary(db, 'robotika', filterMonth || null);
    }
    if (user.role === 'owner') {
      result.sharedQris = financeCore.computeSharedQrisReconciliation(db);
    }

    return sendJson(res, 200, result);
  }

  // 5. Tambah / Update / Hapus Pesanan (Order)
  if (pathname === '/api/finance/orders' && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const unit = body.unit === 'robotika' ? 'robotika' : '3d-print';
      if (!canAccessUnit(user, unit)) {
        return sendJson(res, 403, { ok: false, error: 'Anda tidak memiliki akses ke divisi ini.' });
      }

      const prefix = unit === '3d-print' ? 'ORD-3D-' : 'ORD-ROBO-';
      const existingCount = (db.orders || []).filter((o) => o.unit === unit).length;
      const id = String(body.id || '').trim() || `${prefix}${String(existingCount + 1).padStart(3, '0')}`;
      if ((db.orders || []).some((o) => o.id === id)) {
        return sendJson(res, 400, { ok: false, error: `ID Pesanan "${id}" sudah ada.` });
      }

      const quantity = Math.max(1, Math.round(Number(body.quantity) || 1));
      const netBill = Math.max(0, Math.round(Number(body.netBill) || 0));
      const initialHpp = Math.max(0, Math.round(Number(body.initialHpp) || 0));
      const wageInHpp = Math.max(0, Math.round(Number(body.wageInHpp) || 0));
      const status = ['Proses', 'Selesai', 'Batal'].includes(body.status) ? body.status : 'Proses';
      const date = body.date || new Date().toISOString().slice(0, 10);
      const completedDate = status === 'Selesai' ? (body.completedDate || date) : (body.completedDate || '');

      const newOrder = {
        id,
        unit,
        date,
        completedDate,
        customer: String(body.customer || 'Pelanggan').trim(),
        productName: String(body.productName || 'Pesanan').trim(),
        productId: String(body.productId || '').trim(),
        quantity,
        netBill,
        status,
        initialHpp,
        wageInHpp,
        proofUrl: String(body.proofUrl || '').trim(),
        notes: String(body.notes || '').trim()
      };

      // Opsional: kurangi stok katalog otomatis jika memilih produk dari katalog
      if (body.deductStock && newOrder.productId) {
        const prod = (db.catalog || []).find((p) => p.id === newOrder.productId);
        if (prod) {
          prod.stock = Math.max(0, (Number(prod.stock) || 0) - quantity);
          prod.updated_at = date;
        }
      }

      // Opsional: langsung catat pembayaran pelanggan (misal lunas via QRIS / Tunai / Bank)
      if (body.autoRecordPayment && Number(body.paidAmount) > 0) {
        const payAccount = ['Merchant', 'Bank usaha', 'Kas tunai'].includes(body.paymentAccount)
          ? body.paymentAccount
          : 'Merchant';
        const trxPrefix = unit === '3d-print' ? 'TRX-3D-' : 'TRX-ROBO-';
        const trxCount = (db.mutations || []).filter((m) => m.unit === unit).length;
        db.mutations.push({
          id: `${trxPrefix}${String(trxCount + 1).padStart(3, '0')}-${Date.now().toString().slice(-3)}`,
          unit,
          date,
          type: 'Pembayaran pelanggan',
          orderId: id,
          description: `Pembayaran ${newOrder.productName} (${newOrder.customer})`,
          fromAccount: 'Pelanggan',
          toAccount: payAccount,
          amount: Math.round(Number(body.paidAmount)),
          party: '',
          fundPot: 'Operasional',
          allocationMonth: '',
          proofUrl: newOrder.proofUrl
        });
      }

      // Opsional: langsung catat upah kerja aktif jika 3D Print
      if (unit === '3d-print' && body.autoRecordWage && Number(body.activeMinutes) > 0) {
        const uphCount = (db.wages || []).filter((w) => w.unit === unit).length;
        db.wages.push({
          id: `UPH-3D-${String(uphCount + 1).padStart(3, '0')}-${Date.now().toString().slice(-3)}`,
          unit: '3d-print',
          date,
          orderId: id,
          worker: body.worker === 'Partner' ? 'Partner' : 'Saya',
          minutes: Math.round(Number(body.activeMinutes)),
          ratePerHour: Number(db.settings?.laborRatePerHour) || 15000,
          task: `Pengerjaan ${newOrder.productName}`
        });
      }

      db.orders.unshift(newOrder);
      await saveDb(db);
      return sendJson(res, 201, { ok: true, order: newOrder });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  if (pathname.startsWith('/api/finance/orders/') && (method === 'PUT' || method === 'DELETE')) {
    const orderId = decodeURIComponent(pathname.slice('/api/finance/orders/'.length));
    const idx = (db.orders || []).findIndex((o) => o.id === orderId);
    if (idx === -1) return sendJson(res, 404, { ok: false, error: 'Pesanan tidak ditemukan.' });
    const existing = db.orders[idx];

    if (!canAccessUnit(user, existing.unit)) {
      return sendJson(res, 403, { ok: false, error: 'Akses ditolak.' });
    }

    if (method === 'DELETE') {
      db.orders.splice(idx, 1);
      await saveDb(db);
      return sendJson(res, 200, { ok: true });
    }

    try {
      const body = await readJsonBody(req);
      const nextStatus = body.status || existing.status;
      const updated = {
        ...existing,
        customer: body.customer !== undefined ? String(body.customer).trim() : existing.customer,
        productName: body.productName !== undefined ? String(body.productName).trim() : existing.productName,
        quantity: body.quantity !== undefined ? Math.max(1, Math.round(Number(body.quantity))) : existing.quantity,
        netBill: body.netBill !== undefined ? Math.max(0, Math.round(Number(body.netBill))) : existing.netBill,
        initialHpp: body.initialHpp !== undefined ? Math.max(0, Math.round(Number(body.initialHpp))) : existing.initialHpp,
        wageInHpp: body.wageInHpp !== undefined ? Math.max(0, Math.round(Number(body.wageInHpp))) : existing.wageInHpp,
        status: nextStatus,
        completedDate: nextStatus === 'Selesai' && !existing.completedDate ? new Date().toISOString().slice(0, 10) : (body.completedDate ?? existing.completedDate),
        notes: body.notes !== undefined ? String(body.notes).trim() : existing.notes
      };
      db.orders[idx] = updated;
      await saveDb(db);
      return sendJson(res, 200, { ok: true, order: updated });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  // 6. Tambah / Hapus Mutasi Kas (Termasuk Pencairan QRIS & Bagi Laba)
  if (pathname === '/api/finance/mutations' && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const unit = body.unit === 'robotika' ? 'robotika' : '3d-print';
      if (!canAccessUnit(user, unit)) {
        return sendJson(res, 403, { ok: false, error: 'Anda tidak memiliki akses ke divisi ini.' });
      }
      const amount = Math.round(Number(body.amount) || 0);
      if (amount <= 0) return sendJson(res, 400, { ok: false, error: 'Nominal mutasi harus lebih besar dari Rp 0.' });

      const trxPrefix = unit === '3d-print' ? 'TRX-3D-' : 'TRX-ROBO-';
      const count = (db.mutations || []).filter((m) => m.unit === unit).length;
      const id = String(body.id || '').trim() || `${trxPrefix}${String(count + 1).padStart(3, '0')}-${Date.now().toString().slice(-3)}`;

      const newMutation = {
        id,
        unit,
        date: body.date || new Date().toISOString().slice(0, 10),
        type: String(body.type || 'Pembayaran pelanggan').trim(),
        orderId: String(body.orderId || '').trim(),
        description: String(body.description || '').trim(),
        fromAccount: String(body.fromAccount || 'Pelanggan').trim(),
        toAccount: String(body.toAccount || 'Merchant').trim(),
        amount,
        party: String(body.party || '').trim(),
        advanceCode: String(body.advanceCode || '').trim(),
        fundPot: String(body.fundPot || 'Operasional').trim(),
        allocationMonth: String(body.allocationMonth || '').trim(),
        proofUrl: String(body.proofUrl || '').trim()
      };

      db.mutations.unshift(newMutation);
      await saveDb(db);
      return sendJson(res, 201, { ok: true, mutation: newMutation });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  if (pathname.startsWith('/api/finance/mutations/') && method === 'DELETE') {
    const trxId = decodeURIComponent(pathname.slice('/api/finance/mutations/'.length));
    const idx = (db.mutations || []).findIndex((m) => m.id === trxId);
    if (idx === -1) return sendJson(res, 404, { ok: false, error: 'Mutasi tidak ditemukan.' });
    if (!canAccessUnit(user, db.mutations[idx].unit)) {
      return sendJson(res, 403, { ok: false, error: 'Akses ditolak.' });
    }
    db.mutations.splice(idx, 1);
    await saveDb(db);
    return sendJson(res, 200, { ok: true });
  }

  // 7. Endpoint Khusus Pencairan 1 QRIS Bersama (Otomatis membagi payout Merchant -> Bank usaha untuk 3D Print & Robotika)
  if (pathname === '/api/finance/qris-payout' && method === 'POST') {
    if (user.role !== 'owner') {
      return sendJson(res, 403, { ok: false, error: 'Hanya Super Owner yang dapat mencatat pencairan gabungan 1 QRIS.' });
    }
    try {
      const body = await readJsonBody(req);
      const date = body.date || new Date().toISOString().slice(0, 10);
      const amount3D = Math.max(0, Math.round(Number(body.amount3D) || 0));
      const amountRobo = Math.max(0, Math.round(Number(body.amountRobo) || 0));
      const mdrFee3D = Math.max(0, Math.round(Number(body.mdrFee3D) || 0));
      const mdrFeeRobo = Math.max(0, Math.round(Number(body.mdrFeeRobo) || 0));

      if (amount3D <= 0 && amountRobo <= 0) {
        return sendJson(res, 400, { ok: false, error: 'Masukkan nominal pencairan minimal pada salah satu bisnis.' });
      }

      const created = [];
      if (amount3D > 0) {
        const net3D = Math.max(0, amount3D - mdrFee3D);
        if (net3D > 0) {
          const m1 = {
            id: `TRX-3D-PAYOUT-${Date.now().toString().slice(-4)}`,
            unit: '3d-print',
            date,
            type: 'Transfer internal',
            orderId: '',
            description: 'Pencairan Saldo QRIS Bersama ke Bank Usaha (Porsi 3D Print)',
            fromAccount: 'Merchant',
            toAccount: 'Bank usaha',
            amount: net3D,
            party: '',
            advanceCode: '',
            fundPot: 'Operasional',
            allocationMonth: '',
            proofUrl: ''
          };
          db.mutations.unshift(m1);
          created.push(m1);
        }
        if (mdrFee3D > 0) {
          const f1 = {
            id: `TRX-3D-MDR-${Date.now().toString().slice(-4)}`,
            unit: '3d-print',
            date,
            type: 'Biaya di luar HPP',
            orderId: '',
            description: 'Potongan MDR QRIS (Porsi 3D Print)',
            fromAccount: 'Merchant',
            toAccount: 'Pemasok',
            amount: mdrFee3D,
            party: '',
            advanceCode: '',
            fundPot: 'Operasional',
            allocationMonth: '',
            proofUrl: ''
          };
          db.mutations.unshift(f1);
          created.push(f1);
        }
      }

      if (amountRobo > 0) {
        const netRobo = Math.max(0, amountRobo - mdrFeeRobo);
        if (netRobo > 0) {
          const m2 = {
            id: `TRX-ROBO-PAYOUT-${Date.now().toString().slice(-4)}`,
            unit: 'robotika',
            date,
            type: 'Transfer internal',
            orderId: '',
            description: 'Pencairan Saldo QRIS Bersama ke Bank Usaha (Porsi Robotika)',
            fromAccount: 'Merchant',
            toAccount: 'Bank usaha',
            amount: netRobo,
            party: '',
            advanceCode: '',
            fundPot: 'Operasional',
            allocationMonth: '',
            proofUrl: ''
          };
          db.mutations.unshift(m2);
          created.push(m2);
        }
        if (mdrFeeRobo > 0) {
          const f2 = {
            id: `TRX-ROBO-MDR-${Date.now().toString().slice(-4)}`,
            unit: 'robotika',
            date,
            type: 'Biaya di luar HPP',
            orderId: '',
            description: 'Potongan MDR QRIS (Porsi Robotika)',
            fromAccount: 'Merchant',
            toAccount: 'Pemasok',
            amount: mdrFeeRobo,
            party: '',
            advanceCode: '',
            fundPot: 'Operasional',
            allocationMonth: '',
            proofUrl: ''
          };
          db.mutations.unshift(f2);
          created.push(f2);
        }
      }

      await saveDb(db);
      return sendJson(res, 201, { ok: true, created });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  // 8. Catatan Upah Kerja (Wages)
  if (pathname === '/api/finance/wages' && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const unit = body.unit === 'robotika' ? 'robotika' : '3d-print';
      if (!canAccessUnit(user, unit)) {
        return sendJson(res, 403, { ok: false, error: 'Akses ditolak.' });
      }
      const minutes = Math.max(0, Math.round(Number(body.minutes) || 0));
      const ratePerHour = Math.max(0, Math.round(Number(body.ratePerHour) || db.settings?.laborRatePerHour || 15000));
      const newWage = {
        id: `UPH-${Date.now().toString().slice(-5)}`,
        unit,
        date: body.date || new Date().toISOString().slice(0, 10),
        orderId: String(body.orderId || '').trim(),
        worker: body.worker === 'Partner' ? 'Partner' : 'Saya',
        minutes,
        ratePerHour,
        task: String(body.task || 'Pekerjaan produksi').trim()
      };
      db.wages.unshift(newWage);
      await saveDb(db);
      return sendJson(res, 201, { ok: true, wage: newWage });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  if (pathname.startsWith('/api/finance/wages/') && method === 'DELETE') {
    const wageId = decodeURIComponent(pathname.slice('/api/finance/wages/'.length));
    const idx = (db.wages || []).findIndex((w) => w.id === wageId);
    if (idx === -1) return sendJson(res, 404, { ok: false, error: 'Data upah tidak ditemukan.' });
    if (!canAccessUnit(user, db.wages[idx].unit)) return sendJson(res, 403, { ok: false, error: 'Akses ditolak.' });
    db.wages.splice(idx, 1);
    await saveDb(db);
    return sendJson(res, 200, { ok: true });
  }

  // 9. Pengaturan Parameter & Saldo Awal
  if (pathname === '/api/finance/settings' && method === 'PUT') {
    if (user.role !== 'owner') {
      return sendJson(res, 403, { ok: false, error: 'Hanya Super Owner yang dapat mengubah pengaturan parameter usaha.' });
    }
    try {
      const body = await readJsonBody(req);
      db.settings = {
        ...(db.settings || financeCore.DEFAULT_SETTINGS),
        ...body
      };
      await saveDb(db);
      return sendJson(res, 200, { ok: true, settings: db.settings });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  return sendJson(res, 404, { ok: false, error: 'Endpoint API tidak ditemukan.' });
}

function serveStaticFile(req, res, urlObj) {
  let reqPath = decodeURIComponent(urlObj.pathname);
  if (reqPath === '/') reqPath = '/index.html';
  if (reqPath === '/admin' || reqPath === '/admin/') reqPath = '/admin.html';

  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const fullPath = path.join(__dirname, safePath);

  // Blokir akses langsung ke file sensitif backend
  const forbiddenFiles = ['cetakin-db.json', 'server.js', 'db.js', '.env'];
  if (forbiddenFiles.some((f) => fullPath.endsWith(f))) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('403 Forbidden');
  }

  if (!fullPath.startsWith(__dirname) || !fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('404 Halaman atau berkas tidak ditemukan');
  }

  const ext = path.extname(fullPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(fullPath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('500 Internal Server Error');
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (urlObj.pathname.startsWith('/api/')) {
      return await handleApi(req, res, urlObj);
    }
    return serveStaticFile(req, res, urlObj);
  } catch (err) {
    console.error('[SERVER ERROR]', err);
    sendJson(res, 500, { ok: false, error: 'Terjadi kesalahan internal pada server.' });
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Cetakin Cloud Server aktif di http://localhost:${PORT}`);
    console.log(`📦 Katalog Publik : http://localhost:${PORT}/robotika.html`);
    console.log(`🔐 Portal Admin   : http://localhost:${PORT}/admin.html`);
    console.log(`====================================================`);
  });
}

module.exports = { server };
