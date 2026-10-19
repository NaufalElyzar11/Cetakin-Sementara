(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CetakinCatalog = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const REQUIRED = ['id', 'type', 'name', 'category', 'origin', 'price', 'stock', 'image_url', 'description', 'active'];
  const TYPES = ['robotika', 'gantungan-kunci'];
  const SORTS = ['featured', 'price-low', 'price-high', 'name'];
  const money = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

  function parseCSV(text) {
    text = String(text).replace(/^\uFEFF/, '');
    if (/^\s*</.test(text)) throw new Error('Sumber data mengembalikan halaman web, bukan CSV.');
    const rows = []; let row = [], field = '', quoted = false, afterQuote = false;
    const endField = () => { row.push(field); field = ''; afterQuote = false; };
    const endRow = () => { endField(); if (row.some((value) => value.trim() !== '')) rows.push(row); row = []; };
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (quoted) {
        if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (char === '"') { quoted = false; afterQuote = true; }
        else field += char;
      } else if (char === '"' && field === '' && !afterQuote) quoted = true;
      else if (char === ',') endField();
      else if (char === '\n' || char === '\r') { if (char === '\r' && text[i + 1] === '\n') i++; endRow(); }
      else if (afterQuote && char.trim()) throw new Error('Format CSV tidak valid setelah tanda kutip.');
      else if (!afterQuote) field += char;
    }
    if (quoted) throw new Error('Tanda kutip CSV belum ditutup.');
    if (field || row.length || afterQuote) endRow();
    if (!rows.length) throw new Error('CSV kosong.');
    const headers = rows.shift().map((value) => value.trim().toLowerCase());
    if (new Set(headers).size !== headers.length) throw new Error('Nama kolom CSV berulang.');
    if (REQUIRED.some((header) => !headers.includes(header))) throw new Error('Kolom katalog belum lengkap. Gunakan template Cetakin.');
    return rows.map((cells, index) => {
      if (cells.length !== headers.length) throw new Error(`Jumlah kolom pada baris ${index + 2} tidak sesuai.`);
      return Object.fromEntries(headers.map((header, i) => [header, cells[i].trim()]));
    });
  }

  function safeImage(value) {
    if (!value) return './assets/catalog/placeholder.svg';
    if (/^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,[a-zA-Z0-9+/=]+$/i.test(value)) return value;
    if (/^\.\/assets\/[a-zA-Z0-9_./-]+$/.test(value) && !value.includes('..')) return value;
    try { const url = new URL(value); if (url.protocol === 'https:' && !url.username && !url.password) return url.href; } catch (_) { /* use fallback */ }
    return './assets/catalog/placeholder.svg';
  }

  function productsFromCSV(text) {
    const seen = new Set(); const products = [];
    parseCSV(text).forEach((row, index) => {
      if (!['true', 'false'].includes(row.active.toLowerCase())) throw new Error(`active pada baris ${index + 2} harus TRUE atau FALSE.`);
      if (row.active.toLowerCase() === 'false') return;
      const integer = (value) => /^\d+$/.test(value) && Number.isSafeInteger(Number(value));
      if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(row.id) || seen.has(row.id)) throw new Error(`ID tidak valid atau berulang pada baris ${index + 2}.`);
      if (!TYPES.includes(row.type) || !row.name || !row.description) throw new Error(`Data produk pada baris ${index + 2} belum lengkap.`);
      if (!integer(row.price) || Number(row.price) <= 0 || Number(row.price) > Math.floor(Number.MAX_SAFE_INTEGER / 999) || !integer(row.stock)) throw new Error(`Harga/stok pada baris ${index + 2} harus bilangan bulat yang valid.`);
      const group = row.type === 'robotika' ? row.category : row.origin;
      if (!group) throw new Error(`Kategori atau asal desain kosong pada baris ${index + 2}.`);
      seen.add(row.id);
      products.push({ ...row, group, price: Number(row.price), stock: Number(row.stock), image: safeImage(row.image_url), featured: row.featured?.toLowerCase() === 'true' });
    });
    return products;
  }

  function filterProducts(products, filters) {
    const normalize = (text) => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('id');
    const q = normalize(filters.q || '').trim();
    const result = products.filter((product) =>
      (!filters.type || product.type === filters.type) &&
      (!filters.group || product.group === filters.group) &&
      (!filters.ready || product.stock > 0) &&
      (filters.min === null || filters.min === undefined || product.price >= filters.min) &&
      (filters.max === null || filters.max === undefined || product.price <= filters.max) &&
      (!q || normalize(`${product.name} ${product.id} ${product.group} ${product.description}`).includes(q))
    );
    const sort = SORTS.includes(filters.sort) ? filters.sort : 'featured';
    result.sort((a, b) => {
      if (sort === 'price-low') return a.price - b.price || a.name.localeCompare(b.name, 'id');
      if (sort === 'price-high') return b.price - a.price || a.name.localeCompare(b.name, 'id');
      if (sort === 'name') return a.name.localeCompare(b.name, 'id');
      return Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name, 'id');
    });
    return result;
  }

  function orderMessage(product, quantity, link, demo) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > Math.min(product.stock, 999)) throw new Error('Jumlah pesanan melebihi stok atau tidak valid.');
    const intro = demo ? 'Halo Kak, saya sedang mencoba contoh katalog Cetakin. Berikut simulasi pesanan saya:' : `Halo Kak, saya ingin memesan "${product.name}" dari Cetakin.`;
    return `${intro}\n\nProduk: ${product.name}\nKode: ${product.id}\nJumlah: ${quantity} pcs\nHarga satuan di katalog: ${money(product.price)}\nSubtotal produk: ${money(product.price * quantity)}\nTautan produk: ${link}\n\nMohon informasi total pembayaran termasuk ongkir dan langkah pemesanan selanjutnya. Terima kasih.`;
  }
  return { parseCSV, productsFromCSV, safeImage, filterProducts, orderMessage, money, SORTS };
});
