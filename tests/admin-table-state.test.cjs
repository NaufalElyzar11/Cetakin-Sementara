'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Script } = require('node:vm');
const core = require('../admin-table-core.js');

function tableFixture() {
  let focused = null;
  function node(tagName = 'DIV', dataset = {}) {
    return {
      tagName, dataset, value: '', children: [], attrs: {}, events: {}, disabled: false,
      addEventListener(name, handler) { this.events[name] = handler; },
      appendChild(child) { this.children.push(child); },
      replaceChildren(...children) { this.children = children; this.innerHTML = ''; },
      setAttribute(name, value) { this.attrs[name] = value; },
      hasAttribute(name) { return Object.hasOwn(this.attrs, name); },
      setCustomValidity(value) { this.validityMessage = value; },
      querySelectorAll() { return []; },
      focus() { focused = this; },
      closest() { return this; }
    };
  }
  const fields = Object.fromEntries(['q', 'status', 'payment', 'from', 'to', 'sort', 'pageSize'].map((field) => [field, node(['sort', 'pageSize', 'status', 'payment'].includes(field) ? 'SELECT' : 'INPUT', { tableFilter: field })]));
  const root = node('DIV', { adminTable: 'orders' });
  const form = node('FORM');
  const scroll = node();
  const pages = node();
  const previous = node('BUTTON', { pageAction: 'prev' });
  const next = node('BUTTON', { pageAction: 'next' });
  const summary = node();
  root.querySelector = (selector) => {
    const field = selector.match(/^\[data-table-filter="([^"]+)"\]$/)?.[1];
    if (field) return fields[field];
    const page = selector.match(/^\[data-page-number="(\d+)"\]$/)?.[1];
    if (page) return pages.children.find((child) => child.dataset.pageNumber === page);
    return { '[data-table-controls]': form, '[data-table-summary]': summary, '[data-table-total]': node(), '[data-table-pages]': pages, '[data-table-page-label]': node(), '.table-scroll-region': scroll }[selector] || null;
  };
  root.querySelectorAll = (selector) => selector === '[data-table-filter]' ? Object.values(fields) : selector === '[data-page-action]' ? [previous, next] : [];
  root.contains = () => true;
  const tbody = node('TBODY');
  const datalist = node('DATALIST');
  const source = fs.readFileSync(path.join(__dirname, '../admin.js'), 'utf8').replace('  initSession();', '  globalThis.tableTest = { state, getTableState, renderOrdersTable, renderActiveTable };\n  initSession();');
  const context = {
    document: {
      querySelector: (selector) => ({ '[data-admin-table="orders"]': root, '#orders-tbody': tbody, '#order-id-options': datalist }[selector] || null),
      querySelectorAll: (selector) => selector === '[data-admin-table]' ? [root] : [],
      createElement: (tag) => node(tag.toUpperCase())
    },
    localStorage: { getItem: () => null },
    window: { CetakinAdminTables: core }
  };
  new Script(source, { filename: 'admin.js' }).runInNewContext(context);
  const api = context.tableTest;
  const orders = Array.from({ length: 28 }, (_, index) => ({
    id: `ORD-${String(index).padStart(3, '0')}`, date: '2026-11-10', productName: `Produk ${index}`,
    customer: index === 27 ? '<img src=x onerror=alert(1)>' : 'Pelanggan', quantity: 1, netBill: 10000,
    netPaid: 0, remainingBill: 10000, adjustedHpp: 1000, profit: 0, status: 'Proses'
  }));
  api.state.dashboard = { units: { '3d-print': { orders }, robotika: { orders: [] } } };
  return { api, root, fields, next, tbody, datalist, summary, scroll, node, get focused() { return focused; } };
}

test('Actual renderer caps rows but keeps all orders for datalist and invoice lookup state', () => {
  const fixture = tableFixture();
  fixture.api.renderActiveTable('orders');
  assert.equal(fixture.tbody.children.length, 10);
  assert.equal(fixture.datalist.children.length, 28);
  assert.equal(fixture.api.state.dashboard.units['3d-print'].orders.length, 28);
  assert.match(fixture.tbody.children[0].innerHTML, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(fixture.tbody.children[0].innerHTML, /<img/);
  assert.match(fixture.summary.textContent, /1–10 dari 28 pesanan/);
  fixture.root.events.click({ target: fixture.next, preventDefault() {} });
  assert.equal(fixture.api.getTableState('orders').page, 2);
  assert.equal(fixture.tbody.children.length, 10);
  assert.match(fixture.summary.textContent, /11–20 dari 28 pesanan/);
});

test('Division filters remain independent, search resets paging and reset restores focus', () => {
  const fixture = tableFixture();
  fixture.api.renderActiveTable('orders');
  fixture.api.getTableState('orders').page = 3;
  fixture.fields.q.value = 'Produk 27';
  fixture.fields.q.events.input();
  assert.equal(fixture.tbody.children.length, 1);
  assert.equal(fixture.api.getTableState('orders').page, 1);
  fixture.api.state.activeUnit = 'robotika';
  fixture.api.renderActiveTable('orders');
  assert.equal(fixture.fields.q.value, '');
  assert.equal(fixture.root.dataset.empty, 'true');
  fixture.api.state.activeUnit = '3d-print';
  fixture.api.renderActiveTable('orders');
  assert.equal(fixture.fields.q.value, 'Produk 27');
  const reset = fixture.node('BUTTON');
  reset.attrs['data-table-reset'] = '';
  fixture.root.events.click({ target: reset, preventDefault() {} });
  assert.equal(fixture.fields.q.value, '');
  assert.equal(fixture.tbody.children.length, 10);
  assert.equal(fixture.focused, fixture.fields.q);
  fixture.fields.from.value = '2026-11-30';
  fixture.fields.from.events.input();
  fixture.fields.to.value = '2026-11-01';
  fixture.fields.to.events.input();
  assert.equal(fixture.root.dataset.empty, 'true');
  assert.match(fixture.summary.textContent, /Rentang tanggal tidak valid/);
  assert.equal(fixture.fields.from.attrs['aria-invalid'], 'true');
});

test('Moving to the final page restores keyboard focus from the disabled next button', () => {
  const fixture = tableFixture();
  fixture.api.renderActiveTable('orders');
  fixture.root.events.click({ target: fixture.next, preventDefault() {} });
  fixture.root.events.click({ target: fixture.next, preventDefault() {} });
  assert.equal(fixture.next.disabled, true);
  assert.equal(fixture.api.getTableState('orders').page, 3);
  assert.equal(fixture.focused.dataset.pageNumber, '3');
});

test('Displayed payable bills match sorting after refunds while retaining the original amount', () => {
  const fixture = tableFixture();
  const rows = fixture.api.state.dashboard.units['3d-print'].orders;
  rows.splice(0, rows.length,
    { ...rows[0], id: 'REFUND', netBill: 100000, effectiveBill: 20000, remainingBill: 20000 },
    { ...rows[1], id: 'REGULAR', netBill: 50000, effectiveBill: 50000, remainingBill: 50000 }
  );
  fixture.api.getTableState('orders').sort = 'amount-desc';
  fixture.api.renderActiveTable('orders');
  assert.match(fixture.tbody.children[0].innerHTML, /REGULAR/);
  const billCell = fixture.tbody.children[1].innerHTML.match(/data-label="Tagihan">([\s\S]*?)<\/td>/)[1];
  assert.match(billCell, /<strong>Rp\s*20\.000<\/strong>/);
  assert.match(billCell, /Awal Rp\s*100\.000/);
});
