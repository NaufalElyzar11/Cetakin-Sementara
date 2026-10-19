'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const financeCore = require('./finance-core.js');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'cetakin-db.json');
const SEED_FILE = path.join(DATA_DIR, 'catalog-seed.json');

let firestoreClient = null;
const FIRESTORE_COLLECTION = process.env.FIRESTORE_COLLECTION || 'cetakin_erp';
const FIRESTORE_DOC = process.env.FIRESTORE_DOC || 'main_state';

// Try loading @google-cloud/firestore if available and configured
if (process.env.USE_FIRESTORE === 'true' || process.env.K_SERVICE) {
  try {
    const { Firestore } = require('@google-cloud/firestore');
    firestoreClient = new Firestore();
    console.log('[DB] Menggunakan Google Cloud Firestore sebagai penyimpanan utama.');
  } catch (err) {
    console.warn('[DB] @google-cloud/firestore tidak ditemukan atau gagal dimuat, beralih ke penyimpanan JSON lokal:', err.message);
  }
}

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

  const today = '2026-10-20';

  return {
    version: 1,
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
        name: 'Partner 3D Print (Admin 3D)',
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
        id: 'ORD-3D-001',
        unit: '3d-print',
        date: '2026-10-15',
        completedDate: '2026-10-16',
        customer: 'Rizky (Teknik)',
        productName: 'Cetak Bracket Robot 4 pcs (Layer 0.20mm)',
        quantity: 4,
        netBill: 120000,
        status: 'Selesai',
        initialHpp: 78511,
        wageInHpp: 22500,
        proofUrl: '',
        notes: 'Contoh order Jasa 3D Print dari kalkulator'
      },
      {
        id: 'ORD-3D-002',
        unit: '3d-print',
        date: '2026-10-18',
        completedDate: '2026-10-18',
        customer: 'Alya',
        productName: 'Clicker Custom 5 Tombol (CETAK)',
        quantity: 1,
        netBill: 35000,
        status: 'Selesai',
        initialHpp: 21500,
        wageInHpp: 3000,
        proofUrl: '',
        notes: 'Pembayaran via QRIS'
      },
      {
        id: 'ORD-ROBO-001',
        unit: 'robotika',
        date: '2026-10-17',
        completedDate: '2026-10-17',
        customer: 'Komunitas Robotika BJB',
        productName: 'Arduino Uno (2x) + Sensor Ultrasonic HC-SR04 (2x)',
        productId: '01-001',
        quantity: 2,
        netBill: 190000,
        status: 'Selesai',
        initialHpp: 123500,
        wageInHpp: 0,
        proofUrl: '',
        notes: 'Pembayaran via QRIS Bersama'
      }
    ],
    mutations: [
      {
        id: 'TRX-3D-001',
        unit: '3d-print',
        date: '2026-10-16',
        type: 'Pembayaran pelanggan',
        orderId: 'ORD-3D-001',
        description: 'Pelunasan Bracket Robot via QRIS',
        fromAccount: 'Pelanggan',
        toAccount: 'Merchant',
        amount: 120000,
        party: '',
        fundPot: 'Operasional',
        allocationMonth: '',
        proofUrl: ''
      },
      {
        id: 'TRX-3D-002',
        unit: '3d-print',
        date: '2026-10-18',
        type: 'Pembayaran pelanggan',
        orderId: 'ORD-3D-002',
        description: 'Pembayaran Clicker 5 Tombol via QRIS',
        fromAccount: 'Pelanggan',
        toAccount: 'Merchant',
        amount: 35000,
        party: '',
        fundPot: 'Operasional',
        allocationMonth: '',
        proofUrl: ''
      },
      {
        id: 'TRX-ROBO-001',
        unit: 'robotika',
        date: '2026-10-17',
        type: 'Pembayaran pelanggan',
        orderId: 'ORD-ROBO-001',
        description: 'Pembayaran Paket Arduino + Sensor via QRIS',
        fromAccount: 'Pelanggan',
        toAccount: 'Merchant',
        amount: 190000,
        party: '',
        fundPot: 'Operasional',
        allocationMonth: '',
        proofUrl: ''
      }
    ],
    wages: [
      {
        id: 'UPH-3D-001',
        unit: '3d-print',
        date: '2026-10-16',
        orderId: 'ORD-3D-001',
        worker: 'Saya',
        minutes: 90,
        ratePerHour: 15000,
        task: 'Slicing, persiapan print, & lepas support bracket'
      },
      {
        id: 'UPH-3D-002',
        unit: '3d-print',
        date: '2026-10-18',
        orderId: 'ORD-3D-002',
        worker: 'Saya',
        minutes: 12,
        ratePerHour: 15000,
        task: 'Rakit switch & tali clicker'
      }
    ],
    allocations: []
  };
}

let memoryCache = null;

async function loadDb() {
  if (firestoreClient) {
    try {
      const docRef = firestoreClient.collection(FIRESTORE_COLLECTION).doc(FIRESTORE_DOC);
      const snap = await docRef.get();
      if (snap.exists) {
        memoryCache = snap.data();
        return memoryCache;
      }
      const initial = createInitialState();
      await docRef.set(initial);
      memoryCache = initial;
      return memoryCache;
    } catch (err) {
      console.error('[DB] Gagal memuat dari Firestore, menggunakan fallback lokal:', err.message);
    }
  }

  if (memoryCache) return memoryCache;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      memoryCache = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      // Pastikan produk seed terisi bila kosong
      if (!Array.isArray(memoryCache.catalog) || memoryCache.catalog.length === 0) {
        const init = createInitialState();
        memoryCache.catalog = init.catalog;
      }
      return memoryCache;
    } catch (e) {
      console.warn('[DB] File cetakin-db.json rusak, membuat ulang state awal:', e.message);
    }
  }

  memoryCache = createInitialState();
  fs.writeFileSync(DB_FILE, JSON.stringify(memoryCache, null, 2));
  return memoryCache;
}

async function saveDb(newState) {
  newState.updatedAt = new Date().toISOString();
  memoryCache = newState;

  if (firestoreClient) {
    try {
      const docRef = firestoreClient.collection(FIRESTORE_COLLECTION).doc(FIRESTORE_DOC);
      await docRef.set(newState);
    } catch (err) {
      console.error('[DB] Gagal menyimpan ke Firestore:', err.message);
    }
  }

  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(newState, null, 2));
  } catch (err) {
    console.warn('[DB] Tidak dapat menulis file lokal (mungkin di lingkungan read-only):', err.message);
  }
  return newState;
}

module.exports = {
  loadDb,
  saveDb,
  hashPassword,
  createInitialState
};
