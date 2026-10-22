'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const financeCore = require('../../finance-core.js');

const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'cetakin-db.json');
const SEED_FILE = path.join(DATA_DIR, 'catalog-seed.json');

// Konfigurasi Cloud Database Gratis (Supabase PostgreSQL atau Upstash/Vercel KV)
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_TABLE = process.env.SUPABASE_TABLE || 'cetakin_state';
const STATE_DOC_ID = process.env.CETAKIN_STATE_ID || 'main_state';

const KV_URL = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/+$/, '');
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';

function hashPassword(password) {
  return crypto.createHash('sha256').update(`cetakin_salt_${password}`).digest('hex');
}

function createInitialState() {
  let catalog = [];
  if (fs.existsSync(SEED_FILE)) {
    try {
      catalog = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
    } catch (e) {
      console.warn('[DB] Gagal membaca catalog-seed.json:', e.message);
    }
  }

  return {
    version: 3,
    updatedAt: new Date().toISOString(),
    users: [
      {
        username: 'owner',
        name: 'Naufal Elyzar (Super Owner)',
        role: 'owner',
        allowedUnits: ['3d-print', 'robotika'],
        passwordHash: hashPassword(process.env.OWNER_PASSWORD || 'cetakin123')
      },
      {
        username: 'admin3d',
        name: 'M. Fadlianur (Admin 3D Print)',
        role: 'admin_3d',
        allowedUnits: ['3d-print'],
        passwordHash: hashPassword(process.env.ADMIN3D_PASSWORD || 'print123')
      },
      {
        username: 'adminrobo',
        name: 'Partner Robotika (Admin Robotika)',
        role: 'admin_robotika',
        allowedUnits: ['robotika'],
        passwordHash: hashPassword(process.env.ADMINROBO_PASSWORD || 'robo123')
      }
    ],
    settings: { ...financeCore.DEFAULT_SETTINGS },
    catalog,
    orders: [
      {
        id: '01-03-0001',
        unit: '3d-print',
        date: '2026-10-15',
        completedDate: '2026-10-15',
        customer: 'Kawan Fadli 1',
        productName: 'Ganci kustom',
        quantity: 1,
        netBill: 12000,
        status: 'Selesai',
        initialHpp: 11600,
        wageInHpp: 300,
        proofUrl: '',
        notes: 'Pesanan 3D Print / Ganci kustom (dari Spreadsheet Keuangan)'
      },
      {
        id: '01-01-0001',
        unit: '3d-print',
        date: '2026-10-16',
        completedDate: '2026-10-16',
        customer: 'Gya',
        productName: 'Clicker nama',
        quantity: 1,
        netBill: 16300,
        status: 'Selesai',
        initialHpp: 16300,
        wageInHpp: 750,
        proofUrl: '',
        notes: 'Pesanan Clicker nama (dari Spreadsheet Keuangan)'
      },
      {
        id: '01-01-0002',
        unit: '3d-print',
        date: '2026-10-17',
        completedDate: '2026-10-17',
        customer: 'Nadia',
        productName: 'Clicker nama',
        quantity: 1,
        netBill: 21000,
        status: 'Selesai',
        initialHpp: 14479,
        wageInHpp: 750,
        proofUrl: '',
        notes: 'Pesanan Clicker nama (dari Spreadsheet Keuangan)'
      },
      {
        id: '01-03-0002',
        unit: '3d-print',
        date: '2026-10-18',
        completedDate: '2026-10-18',
        customer: 'Kawan Fadli 2',
        productName: 'Ganci Paus',
        quantity: 1,
        netBill: 17000,
        status: 'Selesai',
        initialHpp: 14320,
        wageInHpp: 280,
        proofUrl: '',
        notes: 'Pesanan 3D Print / Ganci Paus (dari Spreadsheet Keuangan)'
      }
    ],
    mutations: [],
    wages: [
      {
        id: 'UPH-0001',
        unit: '3d-print',
        date: '2026-10-15',
        orderId: '01-03-0001',
        worker: 'Teman',
        minutes: 5,
        ratePerHour: 10000,
        task: 'Pengerjaan Ganci kustom (Kawan Fadli 1)'
      },
      {
        id: 'UPH-0002',
        unit: '3d-print',
        date: '2026-10-16',
        orderId: '01-01-0001',
        worker: 'Saya',
        minutes: 5,
        ratePerHour: 10000,
        task: 'Pengerjaan Clicker nama (Gya)'
      },
      {
        id: 'UPH-0003',
        unit: '3d-print',
        date: '2026-10-17',
        orderId: '01-01-0002',
        worker: 'Saya',
        minutes: 5,
        ratePerHour: 10000,
        task: 'Pengerjaan Clicker nama (Nadia)'
      },
      {
        id: 'UPH-0004',
        unit: '3d-print',
        date: '2026-10-18',
        orderId: '01-03-0002',
        worker: 'Teman',
        minutes: 5,
        ratePerHour: 10000,
        task: 'Pengerjaan Ganci Paus (Kawan Fadli 2)'
      }
    ],
    allocations: []
  };
}

let memoryCache = null;
let memoryCacheMtime = 0;

// 1. Adapter Supabase REST API (Gratis 500MB tanpa kartu kredit)
async function loadFromSupabase() {
  const url = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${encodeURIComponent(STATE_DOC_ID)}&select=data`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });
  if (!res.ok) {
    throw new Error(`Supabase GET gagal (HTTP ${res.status}): ${await res.text()}`);
  }
  const rows = await res.json();
  if (Array.isArray(rows) && rows.length > 0 && rows[0].data) {
    return rows[0].data;
  }
  const initial = createInitialState();
  await saveToSupabase(initial);
  return initial;
}

async function saveToSupabase(stateData) {
  const url = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates'
    },
    body: JSON.stringify({
      id: STATE_DOC_ID,
      data: stateData,
      updated_at: stateData.updatedAt
    })
  });
  if (!res.ok) {
    throw new Error(`Supabase POST gagal (HTTP ${res.status}): ${await res.text()}`);
  }
}

// 2. Adapter Upstash Redis / Vercel KV REST API (Alternatif Gratis di tab Storage Vercel)
async function loadFromKv() {
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(STATE_DOC_ID)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  if (!res.ok) {
    throw new Error(`Vercel KV GET gagal (HTTP ${res.status})`);
  }
  const body = await res.json();
  if (body && body.result) {
    return typeof body.result === 'string' ? JSON.parse(body.result) : body.result;
  }
  const initial = createInitialState();
  await saveToKv(initial);
  return initial;
}

async function saveToKv(stateData) {
  const res = await fetch(`${KV_URL}/set/${encodeURIComponent(STATE_DOC_ID)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(stateData)
  });
  if (!res.ok) {
    throw new Error(`Vercel KV SET gagal (HTTP ${res.status})`);
  }
}

async function loadDb() {
  // Prioritas 1: Supabase Cloud Database (jika SUPABASE_URL & SUPABASE_KEY diatur)
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      memoryCache = await loadFromSupabase();
      return memoryCache;
    } catch (err) {
      console.error('[DB] Gagal memuat dari Supabase, menggunakan fallback:', err.message);
    }
  }

  // Prioritas 2: Vercel KV / Upstash Redis (jika KV_REST_API_URL diatur)
  if (KV_URL && KV_TOKEN) {
    try {
      memoryCache = await loadFromKv();
      return memoryCache;
    } catch (err) {
      console.error('[DB] Gagal memuat dari Vercel KV, menggunakan fallback:', err.message);
    }
  }

  // Prioritas 3: File JSON Lokal (untuk development di komputer lokal)
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (_) {}
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const stat = fs.statSync(DB_FILE);
      if (memoryCache && stat.mtimeMs === memoryCacheMtime) {
        return memoryCache;
      }
      memoryCache = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      memoryCacheMtime = stat.mtimeMs;
      if (!Array.isArray(memoryCache.catalog) || memoryCache.catalog.length === 0) {
        const init = createInitialState();
        memoryCache.catalog = init.catalog;
      }
      return memoryCache;
    } catch (e) {
      console.warn('[DB] File cetakin-db.json rusak, membuat ulang state awal:', e.message);
    }
  }

  if (memoryCache) return memoryCache;

  memoryCache = createInitialState();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryCache, null, 2));
    memoryCacheMtime = fs.statSync(DB_FILE).mtimeMs;
  } catch (_) {}
  return memoryCache;
}

async function saveDb(newState) {
  newState.updatedAt = new Date().toISOString();
  memoryCache = newState;

  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      await saveToSupabase(newState);
      return newState;
    } catch (err) {
      console.error('[DB] Gagal menyimpan ke Supabase:', err.message);
    }
  }

  if (KV_URL && KV_TOKEN) {
    try {
      await saveToKv(newState);
      return newState;
    } catch (err) {
      console.error('[DB] Gagal menyimpan ke Vercel KV:', err.message);
    }
  }

  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(newState, null, 2));
    memoryCacheMtime = fs.statSync(DB_FILE).mtimeMs;
  } catch (err) {
    console.warn('[DB] Tidak dapat menulis file lokal (read-only filesystem):', err.message);
  }
  return newState;
}

module.exports = {
  loadDb,
  saveDb,
  hashPassword,
  createInitialState
};
