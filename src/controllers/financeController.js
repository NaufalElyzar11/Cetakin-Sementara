'use strict';

const { loadDb, saveDb } = require('../config/db.js');
const { canAccessUnit } = require('../middleware/auth.js');
const financeCore = require('../../finance-core.js');

function orderSequenceFromId(id, prefix) {
  const value = String(id || '');
  if (!value.startsWith(prefix)) return 0;
  const suffix = value.slice(prefix.length);
  if (!/^\d+$/.test(suffix)) return 0;
  const sequence = Number(suffix);
  return Number.isSafeInteger(sequence) ? sequence : 0;
}

function highestOrderSequence(db, unit, prefix) {
  const savedSequence = Number(db.orderSequences?.[unit]);
  let highest = Number.isSafeInteger(savedSequence) && savedSequence > 0 ? savedSequence : 0;
  for (const order of db.orders || []) {
    highest = Math.max(highest, orderSequenceFromId(order.id, prefix));
  }
  // Mutasi dan upah tetap menjadi jejak ID pesanan yang sudah dihapus.
  for (const entry of [...(db.mutations || []), ...(db.wages || [])]) {
    highest = Math.max(highest, orderSequenceFromId(entry.orderId, prefix));
  }
  return highest;
}

function rememberOrderSequence(db, unit, sequence) {
  if (!db.orderSequences || typeof db.orderSequences !== 'object' || Array.isArray(db.orderSequences)) {
    db.orderSequences = {};
  }
  db.orderSequences[unit] = sequence;
}

async function getDashboard(req, res, next) {
  try {
    const db = await loadDb();
    const user = req.user;
    const filterMonth = req.query.month || '';

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

    return res.json(result);
  } catch (err) {
    next(err);
  }
}

async function createOrder(req, res, next) {
  try {
    const db = await loadDb();
    const user = req.user;
    const body = req.body || {};
    const unit = body.unit === 'robotika' ? 'robotika' : '3d-print';

    if (!canAccessUnit(user, unit)) {
      return res.status(403).json({ ok: false, error: 'Anda tidak memiliki akses ke divisi ini.' });
    }

    const prefix = unit === '3d-print' ? 'ORD-3D-' : 'ORD-ROBO-';
    const sequence = highestOrderSequence(db, unit, prefix);
    const id = String(body.id || '').trim() || `${prefix}${String(sequence + 1).padStart(3, '0')}`;

    if ((db.orders || []).some((o) => o.id === id)) {
      return res.status(400).json({ ok: false, error: `ID Pesanan "${id}" sudah ada.` });
    }
    if ([...(db.mutations || []), ...(db.wages || [])].some((entry) => entry.orderId === id)) {
      return res.status(400).json({ ok: false, error: 'ID pesanan pernah digunakan dalam riwayat mutasi atau upah. Gunakan ID baru.' });
    }

    const netBill = Math.max(0, Math.round(Number(body.netBill) || 0));
    const initialHpp = Math.max(0, Math.round(Number(body.initialHpp) || 0));
    const wageInHpp = Math.max(0, Math.round(Number(body.wageInHpp) || 0));
    const status = ['Proses', 'Selesai', 'Batal'].includes(body.status) ? body.status : 'Proses';
    const date = body.date || new Date().toISOString().slice(0, 10);
    const completedDate = status === 'Selesai' ? (body.completedDate || date) : (body.completedDate || '');

    const rawItems = Array.isArray(body.items) && body.items.length > 0 ? body.items : null;
    const items = rawItems
      ? rawItems.map((it) => {
          const itQty = Math.max(1, Math.round(Number(it.quantity) || 1));
          const itPrice = Math.max(0, Math.round(Number(it.price) || 0));
          const itHpp = Math.max(0, Math.round(Number(it.hpp) || 0));
          return {
            productId: String(it.productId || '').trim(),
            productName: String(it.productName || 'Komponen').trim(),
            quantity: itQty,
            price: itPrice,
            hpp: itHpp,
            subtotal: Math.max(0, Math.round(Number(it.subtotal) || (itQty * itPrice)))
          };
        })
      : [{
          productId: String(body.productId || '').trim(),
          productName: String(body.productName || 'Pesanan').trim(),
          quantity: Math.max(1, Math.round(Number(body.quantity) || 1)),
          price: Math.max(0, Math.round(Number(body.price || (Number(body.netBill) || 0) / (Number(body.quantity) || 1)))),
          hpp: Math.max(0, Math.round(Number(body.hpp || (Number(body.initialHpp) || 0) / (Number(body.quantity) || 1)))),
          subtotal: Math.max(0, Math.round(Number(body.netBill) || 0))
        }];

    const totalQuantity = items.reduce((sum, it) => sum + it.quantity, 0);
    const summaryProductName = String(body.productName || '').trim() || items.map((it) => `${it.productName} (${it.quantity}x)`).join(', ');

    const newOrder = {
      id,
      unit,
      date,
      completedDate,
      customer: String(body.customer || 'Pelanggan').trim(),
      productName: summaryProductName,
      productId: items[0]?.productId || String(body.productId || '').trim(),
      quantity: totalQuantity,
      netBill,
      status,
      initialHpp,
      wageInHpp,
      proofUrl: String(body.proofUrl || '').trim(),
      notes: String(body.notes || '').trim(),
      items
    };

    if (body.deductStock) {
      for (const it of items) {
        if (it.productId) {
          const prod = (db.catalog || []).find((p) => p.id === it.productId);
          if (prod) {
            prod.stock = Math.max(0, (Number(prod.stock) || 0) - it.quantity);
            prod.updated_at = date;
          }
        }
      }
    }

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
    rememberOrderSequence(db, unit, Math.max(sequence, orderSequenceFromId(id, prefix)));
    await saveDb(db);
    return res.status(201).json({ ok: true, order: newOrder });
  } catch (err) {
    next(err);
  }
}

async function updateOrder(req, res, next) {
  try {
    const db = await loadDb();
    const user = req.user;
    const orderId = req.params.id;
    const idx = (db.orders || []).findIndex((o) => o.id === orderId);

    if (idx === -1) {
      return res.status(404).json({ ok: false, error: 'Pesanan tidak ditemukan.' });
    }
    const existing = db.orders[idx];
    if (!canAccessUnit(user, existing.unit)) {
      return res.status(403).json({ ok: false, error: 'Akses ditolak.' });
    }

    const body = req.body || {};
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
      notes: body.notes !== undefined ? String(body.notes).trim() : existing.notes,
      items: Array.isArray(body.items) ? body.items : existing.items
    };

    db.orders[idx] = updated;
    await saveDb(db);
    return res.json({ ok: true, order: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteOrder(req, res, next) {
  try {
    const db = await loadDb();
    const user = req.user;
    const orderId = req.params.id;
    const idx = (db.orders || []).findIndex((o) => o.id === orderId);

    if (idx === -1) return res.status(404).json({ ok: false, error: 'Pesanan tidak ditemukan.' });
    const order = db.orders[idx];
    if (!canAccessUnit(user, order.unit)) return res.status(403).json({ ok: false, error: 'Akses ditolak.' });

    const hasLinkedEntries = [...(db.mutations || []), ...(db.wages || [])]
      .some((entry) => entry.unit === order.unit && entry.orderId === orderId);
    if (hasLinkedEntries) {
      return res.status(409).json({
        ok: false,
        error: 'Pesanan belum bisa dihapus karena masih memiliki mutasi atau rekap upah terkait. Gunakan status Batal, atau tinjau dan selesaikan data terkait terlebih dahulu.'
      });
    }

    const prefix = order.unit === '3d-print' ? 'ORD-3D-' : 'ORD-ROBO-';
    rememberOrderSequence(db, order.unit, highestOrderSequence(db, order.unit, prefix));
    db.orders.splice(idx, 1);
    await saveDb(db);
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function createMutation(req, res, next) {
  try {
    const db = await loadDb();
    const user = req.user;
    const body = req.body || {};
    const unit = body.unit === 'robotika' ? 'robotika' : '3d-print';

    if (!canAccessUnit(user, unit)) {
      return res.status(403).json({ ok: false, error: 'Anda tidak memiliki akses ke divisi ini.' });
    }

    const orderId = String(body.orderId || '').trim();
    if (orderId && !(db.orders || []).some((order) => order.id === orderId && order.unit === unit)) {
      return res.status(400).json({ ok: false, error: 'Pesanan tidak ditemukan di divisi ini.' });
    }

    const amount = Math.round(Number(body.amount) || 0);
    if (amount <= 0) {
      return res.status(400).json({ ok: false, error: 'Nominal mutasi harus lebih besar dari Rp 0.' });
    }

    const trxPrefix = unit === '3d-print' ? 'TRX-3D-' : 'TRX-ROBO-';
    const count = (db.mutations || []).filter((m) => m.unit === unit).length;
    const id = String(body.id || '').trim() || `${trxPrefix}${String(count + 1).padStart(3, '0')}-${Date.now().toString().slice(-3)}`;

    const newMutation = {
      id,
      unit,
      date: body.date || new Date().toISOString().slice(0, 10),
      type: String(body.type || 'Pembayaran pelanggan').trim(),
      orderId,
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
    return res.status(201).json({ ok: true, mutation: newMutation });
  } catch (err) {
    next(err);
  }
}

async function deleteMutation(req, res, next) {
  try {
    const db = await loadDb();
    const user = req.user;
    const trxId = req.params.id;
    const idx = (db.mutations || []).findIndex((m) => m.id === trxId);

    if (idx === -1) return res.status(404).json({ ok: false, error: 'Mutasi tidak ditemukan.' });
    if (!canAccessUnit(user, db.mutations[idx].unit)) return res.status(403).json({ ok: false, error: 'Akses ditolak.' });

    db.mutations.splice(idx, 1);
    await saveDb(db);
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function processQrisPayout(req, res, next) {
  try {
    const db = await loadDb();
    const user = req.user;
    if (user.role !== 'owner') {
      return res.status(403).json({ ok: false, error: 'Hanya Super Owner yang dapat mencatat pencairan gabungan 1 QRIS.' });
    }

    const body = req.body || {};
    const date = body.date || new Date().toISOString().slice(0, 10);
    const amount3D = Math.max(0, Math.round(Number(body.amount3D) || 0));
    const amountRobo = Math.max(0, Math.round(Number(body.amountRobo) || 0));
    const mdrFee3D = Math.max(0, Math.round(Number(body.mdrFee3D) || 0));
    const mdrFeeRobo = Math.max(0, Math.round(Number(body.mdrFeeRobo) || 0));

    if (amount3D <= 0 && amountRobo <= 0) {
      return res.status(400).json({ ok: false, error: 'Masukkan nominal pencairan minimal pada salah satu bisnis.' });
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
    return res.status(201).json({ ok: true, created });
  } catch (err) {
    next(err);
  }
}

async function createWage(req, res, next) {
  try {
    const db = await loadDb();
    const user = req.user;
    const body = req.body || {};
    const unit = body.unit === 'robotika' ? 'robotika' : '3d-print';

    if (!canAccessUnit(user, unit)) {
      return res.status(403).json({ ok: false, error: 'Akses ditolak.' });
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
    return res.status(201).json({ ok: true, wage: newWage });
  } catch (err) {
    next(err);
  }
}

async function deleteWage(req, res, next) {
  try {
    const db = await loadDb();
    const user = req.user;
    const wageId = req.params.id;
    const idx = (db.wages || []).findIndex((w) => w.id === wageId);

    if (idx === -1) return res.status(404).json({ ok: false, error: 'Data upah tidak ditemukan.' });
    if (!canAccessUnit(user, db.wages[idx].unit)) return res.status(403).json({ ok: false, error: 'Akses ditolak.' });

    db.wages.splice(idx, 1);
    await saveDb(db);
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const db = await loadDb();
    const user = req.user;
    if (user.role !== 'owner') {
      return res.status(403).json({ ok: false, error: 'Hanya Super Owner yang dapat mengubah pengaturan parameter usaha.' });
    }

    const body = req.body || {};
    db.settings = {
      ...(db.settings || financeCore.DEFAULT_SETTINGS),
      ...body
    };
    await saveDb(db);
    return res.json({ ok: true, settings: db.settings });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  createOrder,
  updateOrder,
  deleteOrder,
  createMutation,
  deleteMutation,
  processQrisPayout,
  createWage,
  deleteWage,
  updateSettings
};
