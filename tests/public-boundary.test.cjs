'use strict';

const { createServer, request } = require('node:http');
const { once } = require('node:events');
const test = require('node:test');
const assert = require('node:assert/strict');
const handleVercel = require('../api/index.js');

test('HTTP only exposes public storefront files and keeps API routes available', async (t) => {
  const server = createServer(handleVercel);
  t.after(() => server.close());
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const status = (path) => new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port: server.address().port, path, method: 'HEAD' }, (res) => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on('error', reject);
    req.end();
  });

  for (const path of [
    '/', '/robotika.html', '/produk.html?id=01-044', '/clicker.html', '/projek.html',
    '/panduan.html', '/panduan/hc-sr04.html', '/admin', '/admin.js', '/admin-table-core.js', '/finance-core.js',
    '/assets/clicker/Bungee-Regular.ttf', '/assets/projek/aac-result-720.webp', '/data/products-demo.csv',
    '/api/health', '/api/index.js/health'
  ]) {
    assert.equal(await status(path), 200, path);
  }

  for (const path of [
    '/data/cetakin-db.json', '/data/%63etakin-db.json', '/%64ata/cetakin-db.json',
    '//data/cetakin-db.json', '/data/catalog-seed.json', '/data/robotika-hpp-input.csv',
    '/data/robotika-audited-presets.json', '/src/config/finance-defaults.js',
    '/outputs/price-update-2026-11-05/database-original.json', '/.git/config',
    '/%73rc/config/db.js', '/package-lock.json', '/server.js', '/assets/../data/catalog-seed.json',
    '/assets/%2e%2e/data/catalog-seed.json', '/panduan/../server.js'
  ]) {
    assert.equal(await status(path), 404, path);
  }

  assert.equal(await status('/api/admin/catalog'), 401);
  assert.equal(await status('/api/index.js/admin/catalog'), 401);
});
