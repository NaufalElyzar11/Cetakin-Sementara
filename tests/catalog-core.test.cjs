const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../catalog-core.js');
const header = 'id,type,name,category,origin,price,stock,image_url,description,active';
const row = ['servo-mini', 'robotika', 'Servo Mini', 'Bracket', '', '25000', '3', '', 'Dudukan, untuk servo', 'TRUE'];
const csv = (rows) => header + '\r\n' + rows.map((r) => r.map((cell) => '"' + String(cell).replaceAll('"', '""') + '"').join(',')).join('\r\n');
const change = (index, value) => row.map((cell, i) => i === index ? value : cell);
const demo = core.productsFromCSV(fs.readFileSync(path.join(__dirname, '../data/products-demo.csv'), 'utf8'));

test('CSV handles BOM, commas, escaped quotes, CRLF and multiline descriptions', () => {
  const products = core.productsFromCSV('\uFEFF' + csv([change(8, 'Dudukan "mini", presisi\nIsi: 1 pcs')]) + '\r\n');
  assert.equal(products[0].description, 'Dudukan "mini", presisi\nIsi: 1 pcs');
  assert.equal(products[0].price, 25000);
  assert.equal(products[0].stock, 3);
  assert.equal(products[0].group, 'Bracket');
});

test('Invalid sources and ambiguous active inventory fail instead of offering wrong stock', () => {
  assert.throws(() => core.productsFromCSV('<html>Google login</html>'));
  assert.throws(() => core.parseCSV(header + '\n"not closed'));
  assert.throws(() => core.parseCSV(header + '\n"id"oops,'));
  assert.throws(() => core.parseCSV(header + ',id\n'));
  assert.throws(() => core.parseCSV('id,name\na,b'));
  assert.throws(() => core.parseCSV(header + '\na,b'));
  assert.throws(() => core.productsFromCSV(csv([row, row])));
  for (const invalid of [change(0, '../escape'), change(1, 'unknown'), change(3, ''), change(5, '25.000'), change(5, '0'), change(5, '9007199254740991'), change(6, '-1'), change(6, '1.5'), change(9, '')]) {
    assert.throws(() => core.productsFromCSV(csv([invalid])));
  }
  assert.equal(core.productsFromCSV(csv([change(6, '0')]))[0].stock, 0);
});

test('Inactive template rows stay hidden; keychains use origin, not category', () => {
  assert.deepEqual(core.productsFromCSV(fs.readFileSync(path.join(__dirname, '../data/products-template.csv'), 'utf8')), []);
  const dragon = demo.find((product) => product.id === 'contoh-toothless');
  assert.equal(dragon.group, 'How to Train Your Dragon');
  assert.equal(demo.filter((product) => product.type === 'robotika').length, 6);
  assert.equal(demo.filter((product) => product.type === 'gantungan-kunci').length, 6);
});

test('Filters compose type, keyword, group, price and availability; prices sort numerically', () => {
  assert.equal(core.filterProducts(demo, { type: 'gantungan-kunci', q: 'HOW TO TRAIN' })[0].id, 'contoh-toothless');
  const result = core.filterProducts(demo, { type: 'robotika', group: 'Dudukan & Bracket', ready: true, min: 20000, max: 30000 });
  assert.deepEqual(result.map((product) => product.id), ['contoh-bracket-motor']);
  assert.equal(core.filterProducts(demo, { type: 'robotika', ready: true }).length, 5);
  assert.equal(core.filterProducts(demo, { q: 'no-such-product' }).length, 0);
  assert.equal(core.filterProducts(demo, { type: 'robotika', sort: 'price-low' })[0].price, 8000);
  assert.equal(core.filterProducts(demo, { type: 'robotika', sort: 'price-high' })[0].price, 65000);
});

test('Image URLs cannot execute scripts or traverse local paths', () => {
  for (const value of ['javascript:alert(1)', 'data:image/svg+xml,test', 'http://example.com/a.png', './assets/../secret', 'https://user:password@example.com/a.jpg', '']) {
    assert.equal(core.safeImage(value), './assets/catalog/placeholder.svg');
  }
  assert.equal(core.safeImage('https://images.example.com/photo.webp?v=1'), 'https://images.example.com/photo.webp?v=1');
  assert.equal(core.safeImage('./assets/catalog/bracket.svg'), './assets/catalog/bracket.svg');
});

test('Order message carries exact item, quantity, amount and URL, with explicit demo mode', () => {
  const product = demo.find((item) => item.id === 'contoh-toothless');
  const url = 'https://cetakin.example/produk.html?id=contoh-toothless';
  const message = core.orderMessage(product, 2, url, false);
  assert.match(message, /saya ingin memesan "Toothless Mini"/);
  assert.match(message, /Jumlah: 2 pcs/);
  assert.ok(message.includes(core.money(50000)));
  assert.ok(message.includes(url));
  assert.doesNotMatch(message, /apakah.*stok|stok.*tersedia|simulasi/i);
  assert.match(core.orderMessage(product, 1, url, true), /simulasi pesanan/);
  for (const invalid of [0, -1, 1.5, 7, NaN]) assert.throws(() => core.orderMessage(product, invalid, url, false));
  assert.throws(() => core.orderMessage({ ...product, stock: 0 }, 1, url, false));
  assert.throws(() => core.orderMessage({ ...product, stock: 2000 }, 1000, url, false));
});
