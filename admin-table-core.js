(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CetakinAdminTables = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const PAGE_SIZES = [10, 25, 50];
  const SORTS = ['date-desc', 'date-asc', 'amount-desc', 'amount-asc', 'duration-desc'];
  const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
  const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('id');

  function createState() {
    return { q: '', status: '', payment: '', type: '', account: '', worker: '', from: '', to: '', sort: 'date-desc', pageSize: 10, page: 1 };
  }

  function paymentStatus(order) {
    const bill = order.status === 'Batal' ? 0 : Math.max(0, number(order.effectiveBill ?? order.netBill));
    const paid = Math.max(0, number(order.netPaid));
    const remaining = Math.max(0, number(order.remainingBill ?? (bill - paid)));
    if (number(order.overpaymentAmount) > 0 || paid > bill) return 'overpaid';
    if (order.status === 'Batal') return 'cancelled';
    if (remaining <= 0) return 'paid';
    return paid > 0 ? 'partial' : 'unpaid';
  }

  function workerLabel(worker) {
    if (worker === 'Saya') return 'Saya (Naufal)';
    return String(worker || 'Tanpa nama');
  }

  function searchContent(row, kind) {
    if (kind === 'orders') {
      const items = Array.isArray(row.items) ? row.items.map((item) => `${item.productName || ''} ${item.productId || ''}`).join(' ') : '';
      return [row.id, row.customer, row.productName, row.productId, row.notes, row.status, items].join(' ');
    }
    if (kind === 'mutations') return [row.id, row.type, row.description, row.orderId, row.fromAccount, row.toAccount, row.advanceCode].join(' ');
    return [row.id, row.orderId, workerLabel(row.worker), row.task].join(' ');
  }

  function matchesFilters(row, kind, filters, terms, month) {
    const date = String(row.date || '').slice(0, 10);
    if (month && !date.startsWith(month)) return false;
    if (filters.from && date < filters.from) return false;
    if (filters.to && (!date || date > filters.to)) return false;
    if (kind === 'orders' && filters.status && row.status !== filters.status) return false;
    if (kind === 'orders' && filters.payment === 'cancelled' && row.status !== 'Batal') return false;
    if (kind === 'orders' && filters.payment && filters.payment !== 'cancelled' && paymentStatus(row) !== filters.payment) return false;
    if (kind === 'mutations' && filters.type && row.type !== filters.type) return false;
    if (kind === 'mutations' && filters.account && row.fromAccount !== filters.account && row.toAccount !== filters.account) return false;
    if (kind === 'wages' && filters.worker && row.worker !== filters.worker) return false;
    const content = normalize(searchContent(row, kind));
    return terms.every((term) => content.includes(term));
  }

  function amount(row, kind) {
    if (kind === 'orders') return row.status === 'Batal' ? 0 : Math.max(0, number(row.effectiveBill ?? row.netBill));
    return number(row.amount);
  }

  function selectRows(rows, kind, filters = {}, month = '') {
    const terms = normalize(filters.q).trim().split(/\s+/).filter(Boolean);
    const invalidRange = Boolean(filters.from && filters.to && filters.from > filters.to);
    const filtered = invalidRange ? [] : rows.filter((row) => matchesFilters(row, kind, filters, terms, month));
    const sort = SORTS.includes(filters.sort) ? filters.sort : 'date-desc';
    filtered.sort((a, b) => {
      const byDate = String(a.date || '').localeCompare(String(b.date || ''));
      const byId = String(a.id || '').localeCompare(String(b.id || ''), 'id', { numeric: true });
      if (sort === 'date-asc') return byDate || byId;
      if (sort === 'amount-asc') return amount(a, kind) - amount(b, kind) || -byDate || -byId;
      if (sort === 'amount-desc') return amount(b, kind) - amount(a, kind) || -byDate || -byId;
      if (sort === 'duration-desc') return number(b.minutes) - number(a.minutes) || -byDate || -byId;
      return -byDate || -byId;
    });

    const pageSize = PAGE_SIZES.includes(Number(filters.pageSize)) ? Number(filters.pageSize) : 10;
    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const requestedPage = Math.floor(Number(filters.page)) || 1;
    const page = Math.min(pageCount, Math.max(1, requestedPage));
    const offset = (page - 1) * pageSize;
    return {
      rows: filtered.slice(offset, offset + pageSize),
      count: filtered.length,
      total: rows.length,
      periodCount: month ? rows.filter((row) => String(row.date || '').startsWith(month)).length : rows.length,
      page,
      pageCount,
      pageSize,
      start: filtered.length ? offset + 1 : 0,
      end: Math.min(offset + pageSize, filtered.length),
      amount: filtered.reduce((sum, row) => sum + amount(row, kind), 0),
      remaining: kind === 'orders' ? filtered.reduce((sum, row) => sum + Math.max(0, number(row.remainingBill)), 0) : 0,
      minutes: kind === 'wages' ? filtered.reduce((sum, row) => sum + number(row.minutes), 0) : 0,
      invalidRange
    };
  }

  function pageNumbers(page, pageCount) {
    const candidates = new Set([1, pageCount, page - 1, page, page + 1]);
    const numbers = [...candidates].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b);
    const result = [];
    for (const n of numbers) {
      if (result.length && n > result[result.length - 1] + 1) result.push(null);
      result.push(n);
    }
    return result;
  }

  return { createState, selectRows, paymentStatus, workerLabel, pageNumbers, PAGE_SIZES };
});
