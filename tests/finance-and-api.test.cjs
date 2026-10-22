'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const finance = require('../finance-core.js');
const { server } = require('../server.js');

test('Kalkulator HPP Jasa 3D Print sesuai dengan baseline Excel (Bracket 4 pcs, 180g+20g, 6 jam, layer 0.20mm)', () => {
  const res = finance.calculateJasaPrint({
    units: 4,
    petgGrams: 180,
    supportGrams: 20,
    printHours: 6,
    activeHours: 1.5,
    otherCost: 3000,
    discountBatch: 0,
    layer: 0.20,
    sellingPriceUnit: 30000
  });

  assert.equal(res.billableGrams, 200);
  assert.equal(res.baseRatePerGram, 600);
  assert.equal(res.baseTariffBatch, 120000);
  assert.equal(res.suggestedPriceUnit, 30000);
  assert.equal(res.hppBatch, 72380);
  assert.equal(res.hppUnit, 18095);
  assert.equal(res.actualProfitBatch, 47620);
  assert.equal(res.tariffStatus, 'Memenuhi target');

  const dino = finance.calculateJasaPrint({
    units: 1,
    petgGrams: 12,
    supportGrams: 0,
    printHours: 0.75,
    activeHours: 0.1,
    packagingBatch: 0,
    otherCost: 0,
    discountBatch: 0,
    layer: 0.20,
    sellingPriceUnit: 12000
  });
  assert.equal(dino.hppBatch, 5143);
  assert.equal(dino.suggestedPriceUnit, 10000);
});

test('Kalkulator HPP Clicker 5 Tombol & Robotika menghasilkan HPP dan Harga Saran valid', () => {
  const clicker = finance.calculateClicker({
    buttons: 5,
    units: 1
  });
  assert.equal(clicker.hppUnit, 29616);
  assert.equal(clicker.suggestedPriceUnit, 43000);

  const robo = finance.calculateRobotikaItem({
    units: 10,
    buyPriceUnit: 48000,
    shippingAllocationUnit: 2500,
    packagingUnit: 1000,
    targetMargin: 0.30
  });
  assert.equal(robo.hppUnit, 51500);
  assert.equal(robo.hppBatch, 515000);
  assert.ok(robo.suggestedPriceUnit >= 73500);

  // Verifikasi 94 Preset Ter-Audit Robotika
  assert.equal(finance.ROBOTIKA_PRESETS.length, 94);

  // 1. Uno R3 (O18/O06)
  const uno = finance.calculateRobotikaItem({ presetSku: 'UNO' });
  assert.equal(uno.buyPriceUnit, 51819);
  assert.equal(uno.shippingAllocationUnit, 8694);
  assert.equal(uno.packagingUnit, 200);
  assert.equal(uno.fullCostUnit, 60713);
  assert.equal(uno.suggestedPriceUnit, 80000);
  assert.equal(uno.costStatus, 'MENUTUP + SURPLUS');

  // 2. ESP32 (O16)
  const esp = finance.calculateRobotikaItem({ presetSku: 'ESP' });
  assert.equal(esp.buyPriceUnit, 65000);
  assert.equal(esp.shippingAllocationUnit, 8808);
  assert.equal(esp.fullCostUnit, 74008);
  assert.equal(esp.suggestedPriceUnit, 93550);

  // 3. SP20 (Spacer 20mm flagged 'BELUM MENUTUP')
  const sp20 = finance.calculateRobotikaItem({ presetSku: 'SP20', sellingPriceUnit: 2050 });
  assert.equal(sp20.buyPriceUnit, 2937);
  assert.equal(sp20.fullCostUnit, 3137);
  assert.equal(sp20.costStatus, 'BELUM MENUTUP');
  assert.ok(sp20.profitBatch < 0);
});

test('API Server: Role Guard, CRUD Katalog, Keuangan 2 Divisi, dan Rekonsiliasi 1 QRIS Bersama', async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  try {
    // 1. Cek Katalog Publik CSV
    const pubCsvRes = await fetch(`${base}/api/catalog?format=csv`);
    assert.equal(pubCsvRes.status, 200);
    const csvText = await pubCsvRes.text();
    assert.ok(csvText.includes('id,type,name,category'));
    assert.ok(!csvText.includes('cost_price')); // HPP tidak boleh bocor ke publik

    // 2. Login sebagai Super Owner, Admin 3D, dan Admin Robotika
    const login = async (username, password) => {
      const r = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      return r.json();
    };

    const ownerAuth = await login('owner', 'cetakin123');
    const admin3dAuth = await login('admin3d', 'print123');
    const adminRoboAuth = await login('adminrobo', 'robo123');

    assert.equal(ownerAuth.ok, true);
    assert.equal(admin3dAuth.ok, true);
    assert.equal(adminRoboAuth.ok, true);

    // 3. Cek pembatasan Role pada Dashboard Keuangan
    const dash3D = await (await fetch(`${base}/api/finance/dashboard`, {
      headers: { Authorization: `Bearer ${admin3dAuth.token}` }
    })).json();
    assert.ok(dash3D.units['3d-print']);
    assert.equal(dash3D.units['robotika'], undefined); // Admin 3D tidak boleh melihat keuangan Robotika

    const dashRobo = await (await fetch(`${base}/api/finance/dashboard`, {
      headers: { Authorization: `Bearer ${adminRoboAuth.token}` }
    })).json();
    assert.ok(dashRobo.units['robotika']);
    assert.equal(dashRobo.units['3d-print'], undefined); // Admin Robotika tidak boleh melihat keuangan 3D Print

    const dashOwner = await (await fetch(`${base}/api/finance/dashboard`, {
      headers: { Authorization: `Bearer ${ownerAuth.token}` }
    })).json();
    assert.ok(dashOwner.units['3d-print']);
    assert.ok(dashOwner.units['robotika']);
    assert.ok(dashOwner.sharedQris);
    assert.ok(dashOwner.sharedQris.totalMerchantBalance > 0);

    // 4. Cek pembatasan Role pada CRUD Katalog
    const forbiddenCreate = await fetch(`${base}/api/admin/catalog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${admin3dAuth.token}`
      },
      body: JSON.stringify({
        id: 'test-forbidden-robo',
        type: 'robotika',
        name: 'Sensor Test',
        category: 'Sensor',
        price: 15000,
        stock: 5
      })
    });
    assert.equal(forbiddenCreate.status, 403); // Admin 3D ditolak membuat item Robotika

  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
