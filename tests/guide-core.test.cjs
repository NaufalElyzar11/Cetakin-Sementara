const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../guide-core.js');
const data = require('../guide-data.js');
const products = require('../data/guide-products.json');
const apiProducts = require('../data/catalog-seed.json');
const root = path.resolve(__dirname, '..');

test('every sensor, driver and actuator in the supplied workbook has a guide', () => {
  const required = products.filter(p => /^(sensor|driver motor|aktuator|motor & servo)$/i.test(p.category || ''));
  assert.equal(required.length, 16);
  for (const p of required) assert.ok(core.forProduct(p), `No guide for ${p.id}: ${p.name}`);
});
test('SKU mapping is unique, references real workbook products, and excludes unrelated items', () => {
  const ids = core.guides.flatMap(g => g.products);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.ok(products.some(p => p.id === id));
  assert.equal(core.forProduct({id:'01-053',type:'robotika'}), null); // LED
  assert.equal(core.forProduct({id:'01-047',type:'robotika'}), null); // jumper
  assert.equal(core.forProduct({id:'01-044',type:'gantungan-kunci'}), null);
  assert.equal(core.forProduct({id:'unknown',type:'robotika'}), null);
  assert.equal(core.forProduct({id:'unknown',type:'robotika',guide_id:'hc-sr04'}).id,'hc-sr04');
  assert.equal(core.forProduct({id:'01-044',type:'robotika',guide_id:'invalid'}),null);
});
test('L298N variants share a guide, and discovery works by model, function and SKU', () => {
  for (const p of products.filter(({ id }) => ['01-037', '01-038'].includes(id))) {
    assert.equal(core.forProduct(p).id, 'l298n');
  }
  assert.equal(core.forProduct(apiProducts.find(({ id }) => id === '01-038')), null);
  assert.ok(core.filter({q:'SERVO'}).some(g=>g.id==='mg90s'));
  assert.deepEqual(core.filter({q:'01-044'}).map(g=>g.id),['hc-sr04']);
  assert.deepEqual(core.filter({q:'01-033'}).map(g=>g.id),['hc-sr501']);
  assert.ok(core.filter({q:'kelembapan tanah'}).some(g=>g.id==='kelembapan-tanah'));
  assert.equal(core.filter({q:'<script>alert(1)</script>'}).length,0);
  assert.ok(core.filter({group:'Sensor'}).every(g=>g.group==='Sensor'));
});
test('guide shop links resolve the intended model across API and workbook SKUs', () => {
  const oldIds = {
    '01-032': '01-033', '01-033': '01-034', '01-034': '01-035',
    '01-036': '01-037', '01-037': '01-038', '01-039': '01-040',
  };
  for (const guide of data.guides) {
    for (const { id } of guide.shopProducts) {
      assert.equal(core.resolveProduct(apiProducts, guide.id, id)?.id, id, `${guide.id} API`);
      assert.equal(core.resolveProduct(products, guide.id, id)?.id, oldIds[id] || id, `${guide.id} workbook`);
    }
  }
  const reusedId = { ...apiProducts.find(({ id }) => id === '01-033'), id: '01-032' };
  assert.equal(core.resolveProduct([reusedId], 'mq-2', '01-032'), null);
  assert.equal(core.resolveProduct(apiProducts, 'arduino-awal', '01-035'), null);
});
test('published HTML contains complete content without JavaScript and has no missing local targets', () => {
  const pages=['panduan.html',...data.guides.map(g=>`panduan/${g.id}.html`)];
  for (const page of pages) {
    const html=fs.readFileSync(path.join(root,page),'utf8');
    assert.match(html,/<html lang="id">/);
    const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(new Set(ids).size,ids.length,`Duplicate IDs: ${page}`);
    for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const target=m[1];
      if (target.startsWith('#')) assert.ok(ids.includes(target.slice(1)),`${page}: ${target}`);
      else if (!/^[a-z]+:/i.test(target)) assert.ok(fs.existsSync(path.resolve(root,path.dirname(page),target.split(/[?#]/)[0])),`${page}: ${target}`);
    }
  }
  for (const g of data.guides) {
    const html=fs.readFileSync(path.join(root,'panduan',g.id+'.html'),'utf8');
    for (const id of ['kenali','siapkan','wiring','langkah','masalah','lanjutan','referensi']) assert.ok(html.includes(`id="${id}"`));
    const linkedProducts = new Set([...html.matchAll(/href="\.\.\/produk\.html\?([^"]+)"/g)].map(([, query]) => {
      const params = new URLSearchParams(query.replace(/&amp;/g, '&'));
      assert.equal(params.get('panduan'), g.id);
      return params.get('id');
    }));
    assert.deepEqual(linkedProducts, new Set(g.shopProducts.map(({ id }) => id)), `Product links for ${g.id}`);
    assert.match(html,/<svg class="wiring-svg"/);
    assert.ok(g.steps.length>=4 && g.tips.length>=3 && g.sources.length);
    if (g.code) assert.ok(html.includes('id="main-code"'));
  }
});
test('main menu and catalogue detail offer guide entry points', () => {
  for (const file of ['index.html','robotika.html','produk.html','gantungan-kunci.html','clicker.html']) {
    const html=fs.readFileSync(path.join(root,file),'utf8');
    assert.ok((html.match(/href="\.\/panduan.html"/g)||[]).length>=2, file);
  }
  assert.match(fs.readFileSync(path.join(root,'produk.html'),'utf8'),/id="product-guide"/);
});
