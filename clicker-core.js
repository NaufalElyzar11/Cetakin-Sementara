(function (root, factory) {
  const assets = typeof module === 'object' && module.exports ? require('./clicker-assets.js') : root.CetakinClickerAssets;
  const api = factory(assets);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CetakinClicker = api;
})(typeof window !== 'undefined' ? window : globalThis, function (assets) {
  'use strict';
  const PRICES = Object.freeze({ 1: 14000, 2: 17000, 3: 21000, 4: 26000, 5: 30000, 6: 34000, 7: 37000 });
  const COLORS = Object.freeze({ white: { label: 'Putih', hex: '#F4F4EF' }, black: { label: 'Hitam', hex: '#24292E' }, blue: { label: 'Sky blue', hex: '#83CBE7' }, orange: { label: 'Orange', hex: '#EF8E3B' }, red: { label: 'Merah', hex: '#DE3636' } });
  const FONTS = Object.freeze({ nunito: 'Nunito ExtraBold', bungee: 'Bungee', dynapuff: 'DynaPuff Bold' });
  const MODES = Object.freeze({ solid: { label: 'Solid', pitch: 24 }, flexi: { label: 'Flexi', pitch: 33 }, compact: { label: 'Flexi compact', pitch: 26.5 } });
  const DEFAULT_SYMBOL = 'symbol-love';
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const choose = (object, key, fallback) => own(object, key) ? key : fallback;
  const rupiah = (amount) => `Rp${new Intl.NumberFormat('id-ID').format(amount)}`;
  const escape = (text) => String(text).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const makeKey = (value = '') => ({ type: 'letter', value, cap: 'white', ink: 'black' });
  function layout(state) {
    const profiles = assets.bases[state.shape].profiles;
    return state.keys.length === 1 ? profiles.single || profiles.solid : profiles[state.mode];
  }
  function defaults() {
    return { mode: 'compact', shape: 'round', base: 'blue', font: 'dynapuff', quantity: 1, note: '', keys: [...'ANA'].map(makeKey).concat({ ...makeKey(DEFAULT_SYMBOL), type: 'emoji', ink: 'orange' }) };
  }
  function normalize(input) {
    if (!input || typeof input !== 'object' || !Array.isArray(input.keys) || input.keys.length < 1 || input.keys.length > 7) throw new Error('Desain harus berisi 1–7 tombol.');
    const keys = input.keys.map((key) => {
      if (!key || typeof key !== 'object') throw new Error('Data tombol tidak valid.');
      const type = key.type === 'emoji' ? 'emoji' : 'letter';
      const value = String(key.value || '').toUpperCase();
      return { type, value: type === 'emoji' ? choose(assets.emojis, key.value, '') : (/^[A-Z1-9]$/.test(value) ? value : ''), cap: choose(COLORS, key.cap, 'white'), ink: choose(COLORS, key.ink, 'black') };
    });
    const quantity = Number(input.quantity);
    return { keys, mode: keys.length === 1 ? 'solid' : choose(MODES, input.mode, 'solid'), shape: choose(assets.bases, input.shape, 'round'), base: choose(COLORS, input.base, 'blue'), font: choose(FONTS, input.font, 'nunito'), quantity: Number.isInteger(quantity) && quantity >= 1 && quantity <= 99 ? quantity : 1, note: String(input.note || '').replace(/[\u0000-\u0008\u000b-\u001f]/g, '').slice(0, 300) };
  }
  function validate(state) {
    const errors = [];
    state.keys.forEach((key, i) => {
      if (key.type === 'letter' && !/^[A-Z1-9]$/.test(key.value)) errors.push(`Isi tombol ${i + 1} dengan huruf A–Z, angka 1–9, atau simbol.`);
      if (key.type === 'emoji' && !own(assets.emojis, key.value)) errors.push(`Pilih simbol yang tersedia untuk tombol ${i + 1}. Emoji versi lama sudah tidak digunakan.`);
      if (key.type === 'emoji' && key.cap === key.ink) errors.push(`Warna keycap dan simbol pada tombol ${i + 1} harus berbeda agar simbol inlay terlihat.`);
    });
    const pitch = layout(state).pitch;
    for (let i = 0; i < state.keys.length - 1; i++) {
      const a = state.keys[i], b = state.keys[i + 1];
      const bottom = a.type === 'emoji' && own(assets.emojis, a.value) ? Math.min(assets.emojis[a.value].bounds[1], assets.keycap.bounds[1]) : assets.keycap.bounds[1];
      const top = b.type === 'emoji' && own(assets.emojis, b.value) ? Math.max(assets.emojis[b.value].bounds[3], assets.keycap.bounds[3]) : assets.keycap.bounds[3];
      if (pitch + bottom - top < 1) errors.push(`Karakter pada tombol ${i + 1}–${i + 2} terlalu rapat untuk base ${MODES[state.mode].label}. Pilih Flexi atau ganti salah satu karakter.`);
    }
    return errors;
  }
  function price(state) { return { unit: PRICES[state.keys.length], total: PRICES[state.keys.length] * state.quantity }; }
  function describe(key) { return key.type === 'emoji' ? (own(assets.emojis, key.value) ? assets.emojis[key.value].label : 'Pilih simbol') : key.value || 'Belum diisi'; }
  function inkName(key) { return key.type === 'emoji' ? 'simbol' : 'huruf'; }
  function encode(state) {
    const s = normalize(state);
    return '#desain=' + encodeURIComponent(JSON.stringify([2, s.mode, s.shape, s.base, s.font, s.quantity, s.keys.map((k) => [k.type === 'emoji' ? 'e' : 'l', k.value, k.cap, k.ink]), s.note]));
  }
  function decode(hash) {
    if (!hash || !hash.startsWith('#desain=')) return null;
    if (hash.length > 12000) throw new Error('Tautan desain terlalu panjang.');
    const data = JSON.parse(decodeURIComponent(hash.slice(8)));
    if (!Array.isArray(data) || ![1, 2].includes(data[0]) || !Array.isArray(data[6])) throw new Error('Format tautan desain tidak didukung.');
    return normalize({ mode: data[1], shape: data[2], base: data[3], font: data[4], quantity: data[5], keys: data[6].map((k) => { if (!Array.isArray(k)) throw new Error('Data tombol tidak valid.'); return { type: k[0] === 'e' ? 'emoji' : 'letter', value: k[1], cap: k[2], ink: k[3] }; }), note: data[7] });
  }
  function designUrl(state, pageUrl) { const url = new URL(pageUrl); url.search = ''; url.hash = encode(state); return url.href; }
  function message(state, pageUrl) {
    const errors = validate(state);
    if (errors.length) throw new Error(errors[0]);
    const amount = price(state);
    const lines = ['Halo Kak Cetakin, saya ingin pre-order gantungan clicker keyboard custom.', '', `Jumlah tombol: ${state.keys.length} (huruf/angka/simbol)`, 'Urutan: dari dekat lubang gantungan ke bawah', `Susunan: ${state.keys.map(describe).join(' / ')}`, `Base: ${MODES[state.mode].label} - ${assets.bases[state.shape].label}`, `Warna base: ${COLORS[state.base].label}`, 'Bahan: PETG', `Font huruf/angka: ${FONTS[state.font]}`, '', 'Detail setiap tombol:'];
    state.keys.forEach((key, i) => {
      const detail = `${i + 1}. ${describe(key)} | keycap ${COLORS[key.cap].label} | ${inkName(key)} ${COLORS[key.ink].label}`;
      lines.push(detail);
    });
    lines.push('', `Jumlah produk: ${state.quantity} pcs (desain yang sama)`, `Harga per pcs: ${rupiah(amount.unit)}`, `Subtotal: ${rupiah(amount.total)} (belum termasuk ongkir)`);
    if (state.note.trim()) lines.push(`Catatan customer: ${state.note.trim()}`);
    if (pageUrl && /^https?:/.test(pageUrl)) lines.push('', `Lihat desain: ${designUrl(state, pageUrl)}`);
    lines.push('', 'Mohon konfirmasi desain, ongkir, dan estimasi pengerjaan pre-order sebelum diproses. Terima kasih.');
    return lines.join('\n');
  }
  function glyph(key, font) {
    if (!key.value) return '<text x="0" y="3" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#65717b">?</text>';
    const g = assets.glyphs[font][key.value];
    const relief = key.cap === key.ink ? ' stroke="#17212b" stroke-opacity=".2" stroke-width=".2" stroke-linejoin="round"' : '';
    return `<path d="${g.path}" fill="${COLORS[key.ink].hex}"${relief}/>`;
  }
  function keyGraphic(key, font) {
    const cap = `<path d="${assets.keycap.path}" transform="translate(0,1.1)" fill="#111a23" opacity=".2"/><path d="${assets.keycap.path}" fill="${COLORS[key.cap].hex}" stroke="#17212b" stroke-opacity=".18" stroke-width=".3"/><path d="${assets.keycap.face}" fill="none" stroke="#17212b" stroke-opacity=".08" stroke-width=".2"/>`;
    if (key.type === 'letter') return cap + glyph(key, font);
    if (!own(assets.emojis, key.value)) return cap + glyph({ ...key, value: '' }, font);
    const emoji = assets.emojis[key.value];
    return cap + `<path data-part="symbol" d="${emoji.outline}" fill="${COLORS[key.ink].hex}" fill-rule="evenodd"/>`;
  }
  function preview(state) {
    const profile = layout(state), pitch = profile.pitch, last = (state.keys.length - 1) * pitch, color = COLORS[state.base].hex;
    // The first housing already includes a connected, hollow CAD eyelet.
    const base = state.keys.map((_, i) => `<g transform="translate(0,${i * pitch})"><path d="${i === 0 ? profile.head : profile.path}" fill="${color}" stroke="#17212b" stroke-opacity=".25" stroke-width=".45"/></g>`).join('');
    const join = state.keys.slice(1).map((_, i) => state.mode === 'solid'
      ? `<rect x="${-profile.spineWidth / 2}" y="${i * pitch}" width="${profile.spineWidth}" height="${pitch}" fill="${color}"/>`
      : `<g><rect x="-3.5" y="${i * pitch + 9}" width="7" height="${pitch - 18}" rx="3.5" fill="${color}"/><ellipse cx="0" cy="${i * pitch + pitch / 2}" rx="4.8" ry="3.5" fill="${color}" stroke="#17212b" stroke-opacity=".3" stroke-width=".5"/><circle cx="0" cy="${i * pitch + pitch / 2}" r="1.2" fill="#17212b" fill-opacity=".35"/></g>`).join('');
    const feet = state.shape === 'feet' ? `<g fill="${color}" stroke="#17212b" stroke-opacity=".2" stroke-width=".4"><ellipse cx="-7" cy="${last + 16}" rx="5.4" ry="5.8"/><ellipse cx="7" cy="${last + 16}" rx="5.4" ry="5.8"/></g>` : '';
    const keys = state.keys.map((key, i) => `<g data-key-index="${i}" role="button" tabindex="0" aria-label="Edit tombol ${i + 1}: ${escape(describe(key))}" transform="translate(0,${i * pitch})" class="svg-key">${keyGraphic(key, state.font)}</g>`).join('');
    const ringY = profile.eyelet[1] - 8;
    const top = Math.min(-profile.headBounds[3], ringY - 9.8) - 5;
    const tail = state.keys[state.keys.length - 1];
    const keyBottom = tail.type === 'emoji' && own(assets.emojis, tail.value) ? Math.max(-assets.keycap.bounds[1], -assets.emojis[tail.value].bounds[1]) : -assets.keycap.bounds[1];
    const bottom = last + Math.max(-profile.bounds[1], keyBottom, state.shape === 'feet' ? 21.8 : 0) + 7;
    const left = Math.min(-34, profile.bounds[0] - 8), right = Math.max(34, profile.bounds[2] + 8);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${left} ${top} ${right - left} ${bottom - top}" class="clicker-svg" fill-rule="evenodd" aria-label="Ilustrasi susunan ${escape(state.keys.map(describe).join(', '))}"><title>Clicker custom Cetakin, urutan dari gantungan ke bawah</title><g data-part="keyring"><circle cx="0" cy="${ringY}" r="9" fill="none" stroke="#8b969e" stroke-width="1.6"/><circle cx="0" cy="${ringY}" r="7.5" fill="none" stroke="#d0d7db" stroke-width=".7"/></g><g transform="translate(0,1.8)" opacity=".15">${join}${base}${feet}</g>${join}${base}${feet}${keys}</svg>`;
  }
  return { PRICES, COLORS, FONTS, MODES, DEFAULT_SYMBOL, assets, defaults, makeKey, normalize, layout, validate, price, describe, inkName, encode, decode, designUrl, message, keyGraphic, preview, rupiah, escape };
});
