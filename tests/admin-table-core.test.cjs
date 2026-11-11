'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../admin-table-core.js');

function order(index, values = {}) {
  return {
    id: `ORD-${String(index).padStart(3, '0')}`, date: '2026-11-10', customer: 'Pelanggan',
    productName: 'Clicker', quantity: 1, status: 'Proses', netBill: 100000,
    netPaid: 0, ...values
  };
}

test('Paging caps visible rows, sorts a copy and clamps after deletion or filtering', () => {
  const rows = Array.from({ length: 67 }, (_, index) => order(index));
  const original = structuredClone(rows);
  const first = core.selectRows(rows, 'orders');
  assert.equal(first.rows.length, 10);
  assert.equal(first.rows[0].id, 'ORD-066');
  assert.equal(first.pageCount, 7);
  assert.equal(first.start, 1);
  assert.equal(first.end, 10);

  const next = core.selectRows(rows, 'orders', { page: 2, pageSize: 25 });
  assert.equal(next.rows.length, 25);
  assert.equal(next.start, 26);
  assert.equal(next.end, 50);
  assert.equal(new Set([...first.rows, ...next.rows].map((row) => row.id)).size, 35);
  assert.equal(core.selectRows(rows, 'orders', { pageSize: 999 }).rows.length, 10);

  const shortened = core.selectRows(rows.slice(0, 11), 'orders', { page: 7 });
  assert.equal(shortened.page, 2);
  assert.equal(shortened.rows.length, 1);
  assert.equal(core.selectRows([], 'orders', { page: 7 }).page, 1);
  assert.deepEqual(rows, original);
});

test('Order search covers individual items, customer names and accents with combined date/status filters', () => {
  const rows = [
    order(1, { customer: 'André', items: [{ productName: 'Servo MG90S', productId: '01-023' }] }),
    order(2, { customer: 'Andre', status: 'Selesai', items: [{ productName: 'Servo SG90' }] }),
    order(3, { customer: 'Andre', date: '2026-10-31', items: [{ productName: 'Servo MG90S' }] })
  ];
  const result = core.selectRows(rows, 'orders', { q: 'andre mg90s', status: 'Proses', from: '2026-11-10', to: '2026-11-10' }, '2026-11');
  assert.deepEqual(result.rows.map((row) => row.id), ['ORD-001']);
  assert.equal(result.total, 3);
  assert.equal(result.periodCount, 2);
  assert.equal(core.selectRows(rows, 'orders', { q: '01-023' }).rows[0].id, 'ORD-001');
  assert.equal(core.selectRows(rows, 'orders', { from: '2026-11-11', to: '2026-11-01' }).invalidRange, true);
});

test('Payment filters preserve unpaid legacy orders, partial receipts, adjusted bills and cancelled refunds', () => {
  const rows = [
    order(1, { status: 'Selesai' }),
    order(2, { netPaid: 25000, remainingBill: 75000 }),
    order(3, { netPaid: 80000, effectiveBill: 80000, remainingBill: 0 }),
    order(4, { netPaid: 110000, overpaymentAmount: 10000, remainingBill: 0 }),
    order(5, { status: 'Batal', netPaid: 50000, effectiveBill: 0, overpaymentAmount: 50000, remainingBill: 0 }),
    order(6, { status: 'Batal', effectiveBill: 0, remainingBill: 0 })
  ];
  const ids = (payment) => core.selectRows(rows, 'orders', { payment }).rows.map((row) => row.id).sort();
  assert.deepEqual(ids('unpaid'), ['ORD-001']);
  assert.deepEqual(ids('partial'), ['ORD-002']);
  assert.deepEqual(ids('paid'), ['ORD-003']);
  assert.deepEqual(ids('overpaid'), ['ORD-004', 'ORD-005']);
  assert.deepEqual(ids('cancelled'), ['ORD-005', 'ORD-006']);
  assert.equal(core.paymentStatus(rows[5]), 'cancelled');
});

test('Mutations filter account on either side and compute full matching aggregate before paging', () => {
  const rows = Array.from({ length: 35 }, (_, index) => ({
    id: `TRX-${index}`, date: '2026-11-10', type: 'Pembayaran pelanggan',
    fromAccount: index % 2 ? 'Merchant' : 'Pelanggan', toAccount: index % 2 ? 'Bank usaha' : 'Merchant',
    orderId: 'ORD-3D-001', description: 'Clicker custom', amount: index + 1
  }));
  const result = core.selectRows(rows, 'mutations', { q: 'clicker 3d', type: 'Pembayaran pelanggan', account: 'Merchant', sort: 'amount-desc' });
  assert.equal(result.count, 35);
  assert.equal(result.rows.length, 10);
  assert.equal(result.rows[0].amount, 35);
  assert.equal(result.amount, 630);
  assert.equal(core.selectRows(rows, 'mutations', { account: 'Kas tunai' }).count, 0);
});

test('Wage worker names survive legacy values and month filtering uses record date', () => {
  const rows = [
    { id: 'UPH-1', date: '2026-11-01', completedDate: '2026-10-31', orderId: 'ORD-1', worker: 'Fadli', task: 'Post-processing', minutes: 30, amount: 5000 },
    { id: 'UPH-2', date: '2026-11-02', orderId: 'ORD-2', worker: 'Fadli', task: 'Slicing', minutes: 60, amount: 10000 },
    { id: 'UPH-3', date: '2026-10-31', orderId: 'ORD-3', worker: 'Saya', task: 'Slicing', minutes: 120, amount: 20000 }
  ];
  const result = core.selectRows(rows, 'wages', { worker: 'Fadli', sort: 'duration-desc' }, '2026-11');
  assert.deepEqual(result.rows.map((row) => row.id), ['UPH-2', 'UPH-1']);
  assert.equal(result.minutes, 90);
  assert.equal(result.amount, 15000);
  assert.equal(core.workerLabel('Fadli'), 'Fadli');
  assert.equal(core.selectRows(rows, 'wages', { q: 'naufal' }).rows[0].worker, 'Saya');
});

test('Navigation remains bounded with the first and last page available', () => {
  for (const page of [1, 2, 50, 99, 100]) {
    const numbers = core.pageNumbers(page, 100).filter((value) => value !== null);
    assert.ok(numbers.length <= 5);
    assert.ok(numbers.includes(page));
    assert.equal(numbers[0], 1);
    assert.equal(numbers.at(-1), 100);
  }
});
