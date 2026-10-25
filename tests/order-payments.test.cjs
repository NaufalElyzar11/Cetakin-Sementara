'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Script } = require('node:vm');
const finance = require('../finance-core.js');
const { canAccessUnit } = require('../src/middleware/auth.js');

const controllerPath = path.join(__dirname, '../src/controllers/financeController.js');
const controllerSource = fs.readFileSync(controllerPath, 'utf8');
const owner = { role: 'owner', allowedUnits: ['3d-print', 'robotika'] };
const roboAdmin = { role: 'admin_robotika', allowedUnits: ['robotika'] };

function emptyDb() {
  return { settings: {}, orders: [], mutations: [], wages: [], allocations: [], catalog: [] };
}

// Exercise real controller code against an isolated state, never the business JSON/Supabase.
function apiFixture(initial = emptyDb()) {
  let db = structuredClone(initial);
  let saves = 0;
  const module = { exports: {} };
  const dependencies = {
    '../config/db.js': {
      loadDb: async () => db,
      saveDb: async (next) => { db = next; saves += 1; }
    },
    '../middleware/auth.js': { canAccessUnit },
    '../../finance-core.js': finance
  };
  const load = new Script(`(function(require, module, exports) {\n${controllerSource}\n})`, {
    filename: controllerPath
  }).runInThisContext();
  load((name) => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
    return dependencies[name];
  }, module, module.exports);

  return {
    get db() { return db; },
    get saves() { return saves; },
    async call(method, { body = {}, params = {}, user = owner } = {}) {
      const response = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(data) { this.body = data; return this; }
      };
      await module.exports[method]({ body, params, user, query: {} }, response, (error) => { throw error; });
      return response;
    }
  };
}

function order(id = 'ORD-ROBO-001', unit = 'robotika') {
  return {
    id, unit, date: '2026-10-23', completedDate: '2026-10-23',
    productName: 'Komponen uji', customer: 'Fixture', quantity: 3,
    netBill: 143550, initialHpp: 98338, status: 'Selesai'
  };
}

function payment(id, amount, orderId = 'ORD-ROBO-001', unit = 'robotika') {
  return {
    id, unit, date: '2026-10-23', type: 'Pembayaran pelanggan',
    orderId, amount, fromAccount: 'Pelanggan', toAccount: 'Merchant'
  };
}

function paidOrderBody(unit = 'robotika') {
  return {
    unit, date: '2026-10-23', productName: 'Komponen uji',
    items: [
      { productName: 'ESP32', quantity: 1, price: 93550, hpp: 65000 },
      { productName: 'Servo SG90', quantity: 2, price: 25000, hpp: 16669 }
    ],
    netBill: 143550, initialHpp: 98338, status: 'Selesai',
    autoRecordPayment: true, paymentAccount: 'Merchant', paidAmount: 143550
  };
}

test('Screenshot totals retain actual receipts and identify the Rp337100 excess', () => {
  const db = emptyDb();
  db.orders.push(order());
  db.mutations.push(payment('OLD', 337100), payment('NEW', 143550));
  const summary = finance.computeUnitSummary(db, 'robotika');
  const result = summary.orders[0];
  assert.equal(result.netPaid, 480650);
  assert.equal(result.netBill, 143550);
  assert.equal(result.profit, 45212);
  assert.equal(result.overpaymentAmount, 337100);
  assert.equal(result.dpHeld, 337100);
  assert.equal(result.remainingBill, 0);
});

test('New order skips a deleted ID still referenced by old receipts', async () => {
  const db = emptyDb();
  db.mutations.push(payment('OLD', 337100));
  const fixture = apiFixture(db);
  const response = await fixture.call('createOrder', { body: paidOrderBody(), user: roboAdmin });
  assert.equal(response.statusCode, 201);
  assert.equal(response.body.order.id, 'ORD-ROBO-002');
  assert.equal(response.body.order.quantity, 3);
  const summary = finance.computeUnitSummary(fixture.db, 'robotika');
  assert.equal(summary.orders[0].netPaid, 143550);
  assert.equal(summary.orders[0].overpaymentAmount, 0);
  assert.equal(summary.orders[0].profit, 45212);
  assert.equal(fixture.db.mutations[0].amount, 337100, 'Never erase historical money to fix an order link');
});

test('Order numbering uses the maximum active and historical suffix instead of row count', async () => {
  const db = emptyDb();
  db.orders.push(order('ORD-ROBO-001'), order('ORD-ROBO-003'));
  db.mutations.push(payment('OLD', 1000, 'ORD-ROBO-010'));
  db.wages.push({ id: 'WAGE', unit: 'robotika', orderId: 'ORD-ROBO-020' });
  const fixture = apiFixture(db);
  const response = await fixture.call('createOrder', { body: paidOrderBody() });
  assert.equal(response.statusCode, 201);
  assert.equal(response.body.order.id, 'ORD-ROBO-021');
  assert.equal(fixture.db.orderSequences.robotika, 21);
});

test('A permitted deletion preserves the next number even for a legacy unpaid order', async () => {
  const db = emptyDb();
  db.orders.push(order('ORD-ROBO-099'));
  const fixture = apiFixture(db);
  const removed = await fixture.call('deleteOrder', { params: { id: 'ORD-ROBO-099' } });
  assert.equal(removed.statusCode, 200);
  assert.equal(fixture.db.orders.length, 0);
  const created = await fixture.call('createOrder', { body: paidOrderBody() });
  assert.equal(created.body.order.id, 'ORD-ROBO-100');
});

test('Deleting and recreating a test order cannot merge its old payment into the new order', async () => {
  const fixture = apiFixture();
  const first = await fixture.call('createOrder', { body: paidOrderBody() });
  assert.equal(first.body.order.id, 'ORD-ROBO-001');
  const blocked = await fixture.call('deleteOrder', { params: { id: first.body.order.id } });
  assert.equal(blocked.statusCode, 409);
  assert.equal(fixture.db.orders.length, 1);
  assert.equal(fixture.db.mutations.length, 1);
  const paymentId = fixture.db.mutations[0].id;
  await fixture.call('deleteMutation', { params: { id: paymentId } });
  const removed = await fixture.call('deleteOrder', { params: { id: first.body.order.id } });
  assert.equal(removed.statusCode, 200);
  const second = await fixture.call('createOrder', { body: paidOrderBody() });
  assert.equal(second.body.order.id, 'ORD-ROBO-002');
  assert.equal(finance.computeUnitSummary(fixture.db, 'robotika').orders[0].netPaid, 143550);
});

test('Linked wages block deletion and remain untouched', async () => {
  const db = emptyDb();
  db.orders.push(order('ORD-3D-001', '3d-print'));
  db.wages.push({ id: 'UPH-001', unit: '3d-print', orderId: 'ORD-3D-001', minutes: 30 });
  const fixture = apiFixture(db);
  const response = await fixture.call('deleteOrder', { params: { id: 'ORD-3D-001' } });
  assert.equal(response.statusCode, 409);
  assert.equal(fixture.saves, 0);
  assert.deepEqual(fixture.db, db);
});

test('A custom order ID cannot adopt old mutation or wage references', async () => {
  for (const source of ['mutations', 'wages']) {
    const db = emptyDb();
    db[source].push({ id: 'HISTORY', unit: 'robotika', orderId: 'CUSTOM-OLD', amount: 1000 });
    const fixture = apiFixture(db);
    const response = await fixture.call('createOrder', { body: { ...paidOrderBody(), id: 'CUSTOM-OLD' } });
    assert.equal(response.statusCode, 400, source);
    assert.equal(fixture.saves, 0);
    assert.deepEqual(fixture.db, db);
  }
});

test('Robotika admins cannot attach mutations to unknown or other-division orders', async () => {
  const db = emptyDb();
  db.orders.push(order('ORD-3D-001', '3d-print'));
  for (const orderId of ['MISSING', 'ORD-3D-001']) {
    const fixture = apiFixture(db);
    const response = await fixture.call('createMutation', {
      user: roboAdmin, body: { unit: 'robotika', orderId, amount: 1000 }
    });
    assert.equal(response.statusCode, 400);
    assert.equal(response.body.error, 'Pesanan tidak ditemukan di divisi ini.');
    assert.equal(fixture.saves, 0);
  }
});

test('Partial payments, genuine overpayments and refunds remain accurate', async () => {
  const db = emptyDb();
  db.orders.push(order());
  const fixture = apiFixture(db);
  const add = async (type, amount) => {
    const response = await fixture.call('createMutation', {
      body: { unit: 'robotika', type, orderId: 'ORD-ROBO-001', amount }, user: roboAdmin
    });
    assert.equal(response.statusCode, 201);
    return finance.computeUnitSummary(fixture.db, 'robotika').orders[0];
  };
  const partial = await add('Pembayaran pelanggan', 100000);
  assert.equal(partial.netPaid, 100000);
  assert.equal(partial.remainingBill, 43550);
  assert.equal(partial.overpaymentAmount, 0);
  const overpaid = await add('Pembayaran pelanggan', 50000);
  assert.equal(overpaid.netPaid, 150000);
  assert.equal(overpaid.overpaymentAmount, 6450);
  const refunded = await add('Refund DP', 6450);
  assert.equal(refunded.netPaid, 143550);
  assert.equal(refunded.overpaymentAmount, 0);
});

test('Bill edits and cancelled orders preserve actual receipts and expose the excess', async () => {
  const db = emptyDb();
  db.orders.push(order());
  db.mutations.push(payment('PAID', 143550));
  const fixture = apiFixture(db);
  await fixture.call('updateOrder', { params: { id: 'ORD-ROBO-001' }, body: { netBill: 140000 } });
  let result = finance.computeUnitSummary(fixture.db, 'robotika').orders[0];
  assert.equal(result.netPaid, 143550);
  assert.equal(result.overpaymentAmount, 3550);
  await fixture.call('updateOrder', { params: { id: 'ORD-ROBO-001' }, body: { status: 'Batal' } });
  result = finance.computeUnitSummary(fixture.db, 'robotika').orders[0];
  assert.equal(result.effectiveBill, 0);
  assert.equal(result.overpaymentAmount, 143550);
  assert.equal(result.dpHeld, 143550);
  assert.equal(result.remainingBill, 0);
});
