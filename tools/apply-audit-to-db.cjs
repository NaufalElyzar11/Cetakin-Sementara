const fs = require('fs');
const path = require('path');

const presets = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'robotika-audited-presets.json'), 'utf8'));
const seedPath = path.join(__dirname, '..', 'data', 'catalog-seed.json');
const dbPath = path.join(__dirname, '..', 'data', 'cetakin-db.json');

const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

function findPreset(p) {
  const name = p.name;
  const nameLow = name.toLowerCase();

  if (p.id === '01-001' || p.id === '01-018') return presets.find(pr => pr.sku === 'UNO');
  if (p.id === '01-009' || nameLow.startsWith('esp32')) return presets.find(pr => pr.sku === 'ESP');
  if (p.id === '01-033' || nameLow.includes('hc-sr501') || nameLow.includes('pir motion')) return presets.find(pr => pr.sku === 'PIR');
  
  if (nameLow.includes('raindrops') || nameLow.includes('air hujan')) return presets.find(pr => pr.sku === 'RAIN');
  if (nameLow.includes('obstacle') || nameLow.includes('halangan')) return presets.find(pr => pr.sku === 'OBSTACLE');
  if (nameLow.includes('mpu6050')) return presets.find(pr => pr.sku === 'MPU');
  if (nameLow.includes('hc-sr04') || nameLow.includes('ultrasonic')) return presets.find(pr => pr.sku === 'HC');
  if (nameLow.includes('dht11')) return presets.find(pr => pr.sku === 'DHT11');
  if (nameLow.includes('dht22')) return presets.find(pr => pr.sku === 'DHT22');
  if (nameLow.includes('ldr')) return presets.find(pr => pr.sku === 'LDR');
  if (nameLow.includes('water level')) return presets.find(pr => pr.sku === 'WATER');
  if (nameLow.includes('mq-2') || nameLow.includes('mq2')) return presets.find(pr => pr.sku === 'MQ');
  if (nameLow.includes('soil')) return presets.find(pr => pr.sku === 'SOIL');
  if (nameLow.includes('flame infrared') || nameLow.includes('detector api')) return presets.find(pr => pr.sku === 'FLAME');
  if (nameLow.includes('bfd-1000') || nameLow.includes('5 channel infrared')) return presets.find(pr => pr.sku === 'BF');

  if (nameLow.includes('mega 2560')) return presets.find(pr => pr.sku === 'MEGA');
  if (nameLow.includes('nano v3')) return presets.find(pr => pr.sku === 'NANO');
  if (nameLow.includes('breadboard') || nameLow.includes('400p')) return presets.find(pr => pr.sku === 'BB');
  if (nameLow.includes('oled 0.96')) return presets.find(pr => pr.sku === 'OLED');
  if (nameLow.includes('dfplayer')) return presets.find(pr => pr.sku === 'DFPLAYER');
  
  if (nameLow.includes('xl4005')) return presets.find(pr => pr.sku === 'XL');
  if (nameLow.includes('lm2596')) return presets.find(pr => pr.sku === 'LM');
  if (nameLow.includes('mg90s')) return presets.find(pr => pr.sku === 'MG');
  if (nameLow.includes('sg90') || nameLow.includes('sg-90')) return presets.find(pr => pr.sku === 'SG');
  if (nameLow.includes('5a-driver') || nameLow.includes('board h-bridge 5a') || nameLow.includes('l298b')) return presets.find(pr => pr.sku === 'L298B');
  if (nameLow.includes('l298') || nameLow.includes('l298n')) return presets.find(pr => pr.sku === 'L298');
  if (nameLow.includes('kuning dan roda') || (nameLow.includes('motor') && nameLow.includes('roda'))) return presets.find(pr => pr.sku.toLowerCase() === 'motor' && pr.name.includes('Roda'));
  if (nameLow.includes('wheel') || nameLow.includes('roda rubber')) return presets.find(pr => pr.sku === 'WHEEL');
  if (nameLow.includes('motor dc gearbox')) return presets.find(pr => pr.sku === 'MOTOR');

  if (nameLow.includes('single layer 7x9cm') || nameLow.includes('7x9cm')) return presets.find(pr => pr.sku === 'PCB7');
  if (nameLow.includes('single layer 8x12cm') || nameLow.includes('8x12cm')) return presets.find(pr => pr.sku === 'PCB8');
  if (nameLow.includes('double layer 9x15cm') || nameLow.includes('9x15cm')) return presets.find(pr => pr.sku === 'PCB9');
  if (nameLow.includes('5x7cm')) return presets.find(pr => pr.sku === 'PCB5');
  if (nameLow.includes('4x6cm')) return presets.find(pr => pr.sku === 'PCB4');

  if (nameLow.includes('2x 18650')) return presets.find(pr => pr.sku === 'H2');
  if (nameLow.includes('3x 18650')) return presets.find(pr => pr.sku === 'H3');
  if (nameLow.includes('baterai') || nameLow.includes('visero')) return presets.find(pr => pr.sku === 'BAT');

  if (nameLow.includes('timah paragon')) return presets.find(pr => pr.sku === 'TIN');
  if (nameLow.includes('pembersih timah')) return presets.find(pr => pr.sku === 'CLEAN');
  if (nameLow.includes('spon') || nameLow.includes('sponge cleaner')) return presets.find(pr => pr.sku === 'SPONGE');
  if (nameLow.includes('amtech') || nameLow.includes('rma-223')) return presets.find(pr => pr.sku === 'FLUX2');
  if (nameLow.includes('flux')) return presets.find(pr => pr.sku === 'FLUX1');
  if (nameLow.includes('isolasi') || nameLow.includes('lakban')) return presets.find(pr => pr.sku === 'TAPE');

  if (nameLow.includes('header male') || nameLow.includes('headerm')) return presets.find(pr => pr.sku === 'HEADERM');
  if (nameLow.includes('header female') || nameLow.includes('headerf')) return presets.find(pr => pr.sku === 'HEADERF');
  if (nameLow.includes('push button 4p')) return presets.find(pr => pr.sku === 'PUSHS');
  if (nameLow.includes('omron') || nameLow.includes('b3f')) return presets.find(pr => pr.sku === 'SET_HITAM') || presets.find(pr => pr.sku.startsWith('SET_'));
  if (nameLow.includes('kcd11') || nameLow.includes('saklar rocker')) return presets.find(pr => pr.sku === 'SW');
  if (nameLow.includes('spacer') || nameLow.includes('standoff')) return presets.find(pr => pr.sku === 'SP20');
  if (nameLow.includes('led 3mm')) return presets.find(pr => pr.sku === 'LEDW' && pr.sellUnitQty === 1);

  if (nameLow.includes('heat shrink') || nameLow.includes('selongsong')) {
    if (nameLow.includes('14 mm') || nameLow.includes('14mm')) return presets.find(pr => pr.sku === 'HEAT14');
    if (nameLow.includes('10 mm') || nameLow.includes('10mm')) return presets.find(pr => pr.sku === 'HEAT10');
    if (nameLow.includes('8 mm') || nameLow.includes('8mm')) return presets.find(pr => pr.sku === 'HEAT8');
    if (nameLow.includes('6 mm') || nameLow.includes('6mm')) return presets.find(pr => pr.sku === 'HEAT6');
    if (nameLow.includes('4 mm') || nameLow.includes('4mm')) return presets.find(pr => pr.sku === 'HEAT4');
    if (nameLow.includes('3 mm') || nameLow.includes('3mm')) return presets.find(pr => pr.sku === 'HEAT3');
    if (nameLow.includes('2 mm') || nameLow.includes('2mm')) return presets.find(pr => pr.sku === 'HEAT2');
    if (nameLow.includes('1 mm') || nameLow.includes('1mm')) return presets.find(pr => pr.sku === 'HEAT1');
  }

  if (nameLow.includes('jumper')) {
    if (nameLow.includes('10 cm') || nameLow.includes('10cm')) {
      if (nameLow.includes('female to female')) return presets.find(pr => pr.sku === 'FF10' && pr.sellUnitQty === 1);
      if (nameLow.includes('male to female')) return presets.find(pr => pr.sku === 'MF10' && pr.sellUnitQty === 1);
      if (nameLow.includes('male to male')) return presets.find(pr => pr.sku === 'MM10' && pr.sellUnitQty === 1);
    } else if (nameLow.includes('20 cm') || nameLow.includes('20cm')) {
      if (nameLow.includes('female to female')) return presets.find(pr => pr.sku === 'J20FF' && pr.sellUnitQty === 1);
      if (nameLow.includes('male to female')) return presets.find(pr => pr.sku === 'J20MF' && pr.sellUnitQty === 1);
      if (nameLow.includes('male to male')) return presets.find(pr => pr.sku === 'J20MM' && pr.sellUnitQty === 1);
    } else if (nameLow.includes('30 cm') || nameLow.includes('30cm')) {
      if (nameLow.includes('female to female')) return presets.find(pr => pr.sku === 'FF30' && pr.sellUnitQty === 1);
      if (nameLow.includes('male to female')) return presets.find(pr => pr.sku === 'MF30' && pr.sellUnitQty === 1);
      if (nameLow.includes('male to male')) return presets.find(pr => pr.sku === 'MM30' && pr.sellUnitQty === 1);
    }
  }

  return null;
}

function updateCatalogArray(arr) {
  let updatedCount = 0;
  for (const item of arr) {
    if (item.type !== 'robotika') continue;
    const pr = findPreset(item);
    if (!pr) continue;
    
    item.sku = pr.sku;
    item.cost_price = Math.round(pr.hppStok);
    item.cost_full = Math.round(pr.biayaPenuh);
    item.overhead_allocation = Math.round(pr.alokasiBiayaUsaha);
    item.packaging_cost = Math.round(pr.kemasan);
    item.suggested_price = pr.hargaJualUsulan;
    item.cost_status = pr.statusBiaya;
    if (pr.acuanBanjar) item.competitor_banjar = pr.acuanBanjar;
    if (pr.acuanAdawwino) item.competitor_adawwino = pr.acuanAdawwino;

    // Apply accurate audited pricing
    if (item.id === '01-014') {
      item.price = 13000; // fix typo 1300
    } else if (item.id === '01-009') {
      item.price = 93550; // audited usulan for ESP32
    } else if (item.id === '01-011') {
      item.price = 33100; // audited usulan for MG90S
    } else if (item.id === '01-057') {
      item.price = 1500; // audited usulan for Omron
    } else if (pr.sku.startsWith('HEAT') || pr.sku.startsWith('MM') || pr.sku.startsWith('MF') || pr.sku.startsWith('FF') || pr.sku.startsWith('J20')) {
      item.price = pr.hargaJualUsulan;
    }

    item.updated_at = '2026-10-22';
    updatedCount++;
  }
  return updatedCount;
}

const seedUpdated = updateCatalogArray(seed);
console.log('Updated catalog-seed.json items:', seedUpdated);
fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2), 'utf8');

if (db.catalog && Array.isArray(db.catalog)) {
  const dbUpdated = updateCatalogArray(db.catalog);
  console.log('Updated cetakin-db.json catalog items:', dbUpdated);
}

// Update settings in db
if (!db.settings) db.settings = {};
db.settings.openingAdvancesRobo = [
  {
    code: 'TL-ROBO-PENGADAAN',
    owner: 'Partner Robotika',
    amount: 4913449,
    note: 'Pengadaan barang O01–O25 (audited 19 Okt 2026)'
  },
  {
    code: 'TL-ROBO-OPERASIONAL',
    owner: 'Partner Robotika',
    amount: 100000,
    note: 'Estimasi nota dan stempel toko'
  }
];
db.settings.totalBusinessCostRobo = 646853;
db.updatedAt = new Date().toISOString();

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Saved cetakin-db.json with audited catalog and settings.');
