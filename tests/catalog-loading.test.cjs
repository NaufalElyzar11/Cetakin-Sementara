const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const core = require('../catalog-core.js');

const script = fs.readFileSync(require.resolve('../catalog.js'), 'utf8');
const apiUrl = './api/catalog?format=csv';
const csvUrl = 'https://example.test/catalog.csv';
const csv = 'id,type,name,category,origin,price,stock,image_url,description,active\n' +
  '01-044,robotika,HC-SR04,Sensor,,20000,2,,Sensor jarak,TRUE';
const response = (text) => ({ ok: true, text: async () => text });
const settle = () => new Promise((resolve) => setImmediate(resolve));

function productPage(fetchProduct) {
  const elements = new Map();
  const calls = [];
  const deadlines = new Set();
  let now = Date.now();
  let refresh;

  function element() {
    return {
      hidden: true, value: '', classList: { toggle() {} }, listeners: {},
      addEventListener(event, handler) { this.listeners[event] = handler; },
      setAttribute(name, value) { this[name] = value; },
      removeAttribute(name) { delete this[name]; },
      append() {}, replaceChildren() {},
    };
  }
  function select(selector) {
    if (!elements.has(selector)) elements.set(selector, element());
    return elements.get(selector);
  }
  select('#quantity').value = '1';

  vm.runInNewContext(script, {
    window: {
      CetakinCatalog: core,
      CETAKIN_CONFIG: { catalog: { apiUrl, csvUrl, timeoutMs: 1000 } },
      CetakinContact: { url: () => 'https://example.test/order' },
      setTimeout(handler) { deadlines.add(handler); return handler; },
    },
    document: { body: { dataset: { page: 'product' } }, querySelector: select, createElement: element, addEventListener() {} },
    location: new URL('https://example.test/produk.html?id=01-044'),
    URL, URLSearchParams, AbortController,
    Date: class extends Date { static now() { return now; } },
    clearTimeout: (handler) => deadlines.delete(handler),
    setInterval: (handler) => { refresh = handler; },
    console: { warn() {} },
    fetch(url, { signal }) {
      calls.push({ url, signal });
      return fetchProduct(url, signal);
    },
  });
  return {
    select, calls, deadlines,
    refresh() { now += 60000; refresh(); },
  };
}

test('The catalog starts the CSV fallback with a fresh deadline after API timeout', async () => {
  const page = productPage(async (url, signal) => {
    if (url === apiUrl) return new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
    signal.throwIfAborted();
    return response(csv);
  });
  assert.equal(page.calls.length, 1);
  const [abortApi] = page.deadlines;
  abortApi();
  await settle();
  assert.deepEqual(page.calls.map(({ url }) => url), [apiUrl, csvUrl]);
  assert.equal(page.calls[0].signal.aborted, true);
  assert.equal(page.calls[1].signal.aborted, false);
  assert.equal(page.deadlines.size, 0);
  assert.equal(page.select('#detail-name').textContent, 'HC-SR04');
  assert.equal(page.select('#product-order')['aria-disabled'], 'false');
});

test('The catalog skips invalid API CSV and prevents orders from stale data until recovery', async () => {
  let fallbackFails = false;
  const page = productPage(async (url) => {
    if (url === apiUrl) return response(csv.replace(',Sensor,', ',,'));
    if (fallbackFails) return { ok: false, status: 503 };
    return response(csv);
  });
  await settle();
  assert.equal(page.select('#product-detail').hidden, false);
  assert.equal(page.select('#product-order')['aria-disabled'], 'false');

  fallbackFails = true;
  page.refresh();
  await settle();
  assert.match(page.select('#data-status').textContent, /Data sebelumnya masih ditampilkan/);
  assert.equal(page.select('#product-detail').hidden, false);
  assert.equal(page.select('#product-order')['aria-disabled'], 'true');
  assert.equal(page.select('#product-order').href, undefined);
  assert.equal(page.select('#retry-data').hidden, false);

  fallbackFails = false;
  await page.select('#retry-data').listeners.click();
  assert.equal(page.select('#retry-data').hidden, true);
  assert.equal(page.select('#product-order')['aria-disabled'], 'false');
});
