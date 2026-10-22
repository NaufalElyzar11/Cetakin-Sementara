const fs = require('fs');
const path = require('path');

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const rows = [];
  // Data starts after headers. Row 5 (index 4) has columns
  for (let i = 4; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cells = [];
    let cur = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        if (inQuotes && line[c + 1] === '"') {
          cur += '"';
          c++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        cells.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    rows.push(cells);
  }
  return rows;
}

const csvPath = path.join(__dirname, '..', 'data', 'robotika-hpp-input.csv');
const rawText = fs.readFileSync(csvPath, 'utf8');
const rows = parseCsv(rawText);

const header = rows[0].map(h => h.trim());
console.log('Columns count:', header.length);

const items = [];
for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  if (!r[0]) continue;
  const sku = r[0].trim();
  const name = r[1].trim();
  const sellUnitQty = Number(r[2]) || 1;
  const hppStok = Number(r[3]) || 0;
  const alokasiBiayaUsaha = Number(r[4]) || 0;
  const kemasan = Number(r[5]) || 0;
  const biayaPenuh = Number(r[6]) || 0;
  const acuanBanjar = r[7] ? Number(r[7].replace(/[^\d.]/g, '')) || null : null;
  const acuanAdawwino = r[8] ? Number(r[8].replace(/[^\d.]/g, '')) || null : null;
  const hargaJualUsulan = Number(r[9]) || 0;
  const labaKotor = Number(r[10]) || 0;
  const sisaLabaBersih = Number(r[11]) || 0;
  const marginBersih = Number(r[12]) || 0;
  const penanda = (r[13] || '').trim();
  const catatan = (r[14] || '').trim();
  const sumberPembanding = (r[15] || '').trim();
  const hargaMinimum = Number(r[18]) || Math.ceil(biayaPenuh / 50) * 50;
  const statusBiaya = (r[19] || '').trim();

  items.push({
    sku,
    name,
    sellUnitQty,
    hppStok: Math.round(hppStok * 100) / 100,
    alokasiBiayaUsaha: Math.round(alokasiBiayaUsaha * 100) / 100,
    kemasan,
    biayaPenuh: Math.round(biayaPenuh * 100) / 100,
    acuanBanjar,
    acuanAdawwino,
    hargaJualUsulan,
    labaKotor: Math.round(labaKotor * 100) / 100,
    sisaLabaBersih: Math.round(sisaLabaBersih * 100) / 100,
    marginBersih: Math.round(marginBersih * 10000) / 10000,
    penanda,
    catatan,
    sumberPembanding,
    hargaMinimum,
    statusBiaya
  });
}

console.log('Parsed audited items count:', items.length);

const outJsonPath = path.join(__dirname, '..', 'data', 'robotika-audited-presets.json');
fs.writeFileSync(outJsonPath, JSON.stringify(items, null, 2), 'utf8');
console.log('Saved to', outJsonPath);
