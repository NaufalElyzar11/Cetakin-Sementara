'use strict';

const { loadDb, saveDb } = require('../config/db.js');
const { canManageCatalogType } = require('../middleware/auth.js');

const PUBLIC_FIELDS = ['id', 'type', 'name', 'category', 'origin', 'price', 'stock', 'image_url', 'description', 'material', 'dimensions', 'weight_grams', 'active', 'featured', 'updated_at'];

function productGroup(item) {
  return String((item.type === 'robotika' ? item.category : item.origin) ?? '').trim();
}

function missingGroup(res, type) {
  return res.status(400).json({
    ok: false,
    error: type === 'robotika' ? 'Kategori robotika wajib diisi.' : 'Asal desain/seri ganci wajib diisi.'
  });
}

function toPublicCsv(catalog) {
  const esc = (val) => {
    const s = val === null || val === undefined ? '' : String(val);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [PUBLIC_FIELDS.join(',')];
  for (const item of catalog) {
    const row = {
      ...item,
      price: Math.max(1, Math.round(Number(item.price) || 1000)),
      stock: Math.max(0, Math.round(Number(item.stock) || 0)),
      active: 'TRUE',
      featured: item.featured ? 'TRUE' : 'FALSE'
    };
    lines.push(PUBLIC_FIELDS.map((key) => esc(row[key])).join(','));
  }
  return lines.join('\n');
}

async function getPublicCatalog(req, res, next) {
  try {
    const db = await loadDb();
    // Skip old incomplete rows without taking the rest of the storefront offline.
    const publicItems = (db.catalog || [])
      .filter((item) => item.active && productGroup(item))
      .map((item) => ({
        ...Object.fromEntries(PUBLIC_FIELDS.map((key) => [key, item[key]])),
        group: productGroup(item)
      }));

    res.setHeader('Cache-Control', 'no-store');
    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      return res.send(toPublicCsv(publicItems));
    }

    return res.json({ ok: true, products: publicItems, updatedAt: db.updatedAt });
  } catch (err) {
    next(err);
  }
}

async function getAdminCatalog(req, res, next) {
  try {
    const db = await loadDb();
    const user = req.user;
    const items = (db.catalog || []).filter((item) => {
      if (user.role === 'owner') return true;
      if (user.role === 'admin_3d') return item.type === 'gantungan-kunci';
      if (user.role === 'admin_robotika') return item.type === 'robotika';
      return false;
    });
    return res.json({ ok: true, products: items });
  } catch (err) {
    next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    const db = await loadDb();
    const user = req.user;
    const body = req.body || {};
    const type = body.type === 'gantungan-kunci' ? 'gantungan-kunci' : 'robotika';

    if (!canManageCatalogType(user, type)) {
      return res.status(403).json({ ok: false, error: 'Anda tidak memiliki akses untuk menambah produk di kategori ini.' });
    }

    const id = String(body.id || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!id) {
      return res.status(400).json({ ok: false, error: 'Kode/ID produk wajib diisi (huruf/angka/strip).' });
    }
    if ((db.catalog || []).some((p) => p.id === id)) {
      return res.status(400).json({ ok: false, error: `Kode produk "${id}" sudah digunakan. Gunakan kode lain.` });
    }

    const name = String(body.name || '').trim();
    if (!name) {
      return res.status(400).json({ ok: false, error: 'Nama produk wajib diisi.' });
    }

    const groupVal = productGroup({ ...body, type });
    if (!groupVal) return missingGroup(res, type);

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
      description: String(body.description ?? '').trim() || name,
      material: String(body.material || '').trim(),
      dimensions: String(body.dimensions || '').trim(),
      weight_grams: body.weight_grams !== '' && body.weight_grams !== undefined ? String(body.weight_grams).trim() : '',
      active: Boolean(body.active !== undefined ? body.active : true),
      featured: Boolean(body.featured),
      updated_at: new Date().toISOString().slice(0, 10)
    };

    db.catalog.unshift(newProduct);
    await saveDb(db);
    return res.status(201).json({ ok: true, product: newProduct });
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const db = await loadDb();
    const user = req.user;
    const targetId = req.params.id;
    const idx = (db.catalog || []).findIndex((p) => p.id === targetId);

    if (idx === -1) {
      return res.status(404).json({ ok: false, error: 'Produk tidak ditemukan.' });
    }

    const existing = db.catalog[idx];
    if (!canManageCatalogType(user, existing.type)) {
      return res.status(403).json({ ok: false, error: 'Anda tidak memiliki akses untuk mengubah produk di kategori ini.' });
    }

    const body = req.body || {};
    const nextType = body.type ? (body.type === 'gantungan-kunci' ? 'gantungan-kunci' : 'robotika') : existing.type;
    if (!canManageCatalogType(user, nextType)) {
      return res.status(403).json({ ok: false, error: 'Anda tidak memiliki akses ke kategori tujuan.' });
    }

    const name = String(body.name ?? existing.name ?? '').trim();
    if (!name) return res.status(400).json({ ok: false, error: 'Nama produk wajib diisi.' });

    const groupVal = productGroup({
      type: nextType,
      category: body.category ?? existing.category,
      origin: body.origin ?? existing.origin
    });
    if (!groupVal) return missingGroup(res, nextType);

    const updated = {
      ...existing,
      type: nextType,
      name,
      category: nextType === 'robotika' ? groupVal : '',
      origin: nextType === 'gantungan-kunci' ? groupVal : '',
      price: body.price !== undefined ? Math.max(100, Math.round(Number(body.price) || 0)) : existing.price,
      cost_price: body.cost_price !== undefined ? Math.max(0, Math.round(Number(body.cost_price) || 0)) : (existing.cost_price || 0),
      stock: body.stock !== undefined ? Math.max(0, Math.round(Number(body.stock) || 0)) : existing.stock,
      image_url: body.image_url !== undefined ? String(body.image_url).trim() : existing.image_url,
      description: String(body.description ?? existing.description ?? '').trim() || name,
      material: body.material !== undefined ? String(body.material).trim() : existing.material,
      dimensions: body.dimensions !== undefined ? String(body.dimensions).trim() : existing.dimensions,
      weight_grams: body.weight_grams !== undefined ? String(body.weight_grams).trim() : existing.weight_grams,
      active: body.active !== undefined ? Boolean(body.active) : existing.active,
      featured: body.featured !== undefined ? Boolean(body.featured) : existing.featured,
      updated_at: new Date().toISOString().slice(0, 10)
    };

    db.catalog[idx] = updated;
    await saveDb(db);
    return res.json({ ok: true, product: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const db = await loadDb();
    const user = req.user;
    const targetId = req.params.id;
    const idx = (db.catalog || []).findIndex((p) => p.id === targetId);

    if (idx === -1) {
      return res.status(404).json({ ok: false, error: 'Produk tidak ditemukan.' });
    }
    if (!canManageCatalogType(user, db.catalog[idx].type)) {
      return res.status(403).json({ ok: false, error: 'Anda tidak memiliki akses untuk menghapus produk di kategori ini.' });
    }

    db.catalog.splice(idx, 1);
    await saveDb(db);
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPublicCatalog,
  getAdminCatalog,
  createProduct,
  updateProduct,
  deleteProduct
};
