(() => {
  'use strict';
  const C = window.CetakinClicker;
  if (!C) return;
  const $ = (id) => document.getElementById(id);
  let state = C.defaults(), active = 0, quantityInvalid = false, toastTimer;
  let linkError = '', retiredSymbolNotice = false;
  const unavailableSymbols = () => state.keys.reduce((slots, key, index) => {
    if (key.type === 'emoji' && !Object.prototype.hasOwnProperty.call(C.assets.emojis, key.value)) slots.push(index + 1);
    return slots;
  }, []);
  try { state = C.decode(location.hash) || state; retiredSymbolNotice = unavailableSymbols().length > 0; }
  catch (_) { linkError = 'Link desain tidak dapat dibaca. Silakan susun desain baru di bawah.'; }

  function announce(text) {
    $('builder-status').textContent = text;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('builder-status').textContent = ''; }, 4500);
  }
  function swatches(id, part, label) {
    $(id).innerHTML = Object.entries(C.COLORS).map(([key, color]) => `<button type="button" data-color-part="${part}" data-color="${key}" aria-label="${label}: ${color.label}" aria-pressed="false"><span class="swatch" style="background:${color.hex}" aria-hidden="true"></span><span>${color.label}</span></button>`).join('');
  }
  $('count-options').innerHTML = Object.entries(C.PRICES).map(([count, price]) => `<button type="button" data-count="${count}" aria-label="${count} tombol, ${C.rupiah(price)}" aria-pressed="false"><b>${count}</b><small>${price / 1000}k</small></button>`).join('');
  $('shape-options').innerHTML = Object.entries(C.assets.bases).map(([key, base]) => `<button type="button" data-shape="${key}" aria-pressed="false"><img src="./assets/clicker/base-${key}.svg" alt="" width="40" height="40"><span>${base.label}</span></button>`).join('');
  $('emoji-options').innerHTML = Object.entries(C.assets.emojis).map(([key, emoji]) => `<button type="button" data-emoji="${key}" aria-pressed="false"><img src="./assets/clicker/${key}.svg" alt="" width="42" height="42"><span>${emoji.label}</span></button>`).join('');
  $('font-options').innerHTML = Object.entries(C.FONTS).map(([key, label]) => `<button type="button" data-font="${key}" aria-pressed="false"><b class="font-${key}">AB</b><span>${label.replace(' ExtraBold', '').replace(' Bold', '')}</span></button>`).join('');
  $('price-list').innerHTML = Object.entries(C.PRICES).map(([count, amount]) => `<div><span>${count} tombol</span><b>${C.rupiah(amount)}</b></div>`).join('');
  swatches('base-colors', 'base', 'Warna base');
  swatches('cap-colors', 'cap', 'Warna keycap');
  swatches('ink-colors', 'ink', 'Warna huruf');

  function render(syncEditor = true) {
    const focusedSlot = document.activeElement?.dataset.slot;
    const key = state.keys[active], amount = C.price(state);
    const unavailable = unavailableSymbols();
    if (!unavailable.length) retiredSymbolNotice = false;
    $('link-notice').textContent = retiredSymbolNotice
      ? `Simbol pada tombol ${unavailable.join(', ')} di link ini sudah tidak tersedia. Pilih simbol baru untuk setiap tombol tersebut; detail desain lainnya tetap tersimpan.`
      : linkError;
    $('link-notice').hidden = !retiredSymbolNotice && !linkError;
    $('design-preview').innerHTML = C.preview(state);
    $('key-slots').innerHTML = state.keys.map((item, i) => `<button type="button" class="key-slot" data-slot="${i}" aria-label="Edit tombol ${i + 1}: ${C.escape(C.describe(item))}" aria-pressed="${i === active}"><small>${i + 1}</small><svg viewBox="-18 -19 36 38" fill-rule="evenodd" aria-hidden="true">${C.keyGraphic(item, state.font)}</svg></button>`).join('');
    if (focusedSlot !== undefined) $('key-slots').querySelector(`[data-slot="${focusedSlot}"]`)?.focus({ preventScroll: true });
    $('design-caption').textContent = `${state.keys.length} tombol · ${C.MODES[state.mode].label}`;
    $('editor-title').textContent = `Tombol ${active + 1} — ${C.describe(key)}`;
    $('letter-editor').hidden = key.type !== 'letter';
    $('emoji-editor').hidden = key.type !== 'emoji';
    const inkLabel = `Warna ${C.inkName(key)}`;
    $('ink-controls').hidden = false;
    $('ink-part-label').textContent = inkLabel;
    $('ink-colors').setAttribute('aria-label', `${inkLabel} tombol terpilih`);
    $('ink-colors').querySelectorAll('[data-color]').forEach((button) => button.setAttribute('aria-label', `${inkLabel}: ${C.COLORS[button.dataset.color].label}`));
    $('color-relief-note').hidden = key.cap !== key.ink;
    $('color-relief-note').textContent = key.type === 'emoji'
      ? 'Warna keycap dan simbol harus berbeda agar simbol terlihat. Pilih salah satu warna lain.'
      : 'Warna sama: huruf terlihat dari bentuk timbulnya. Pilih warna berbeda jika ingin tulisan lebih kontras.';
    if (syncEditor) $('single-letter').value = key.type === 'letter' ? key.value : '';
    $('quick-text').maxLength = state.keys.length;
    $('quick-text').placeholder = `Maksimal ${state.keys.length} huruf/angka`;
    $('cap-color-label').textContent = C.COLORS[key.cap].label;
    $('ink-color-label').textContent = C.COLORS[key.ink].label;
    $('base-color-label').textContent = C.COLORS[state.base].label;
    document.querySelectorAll('[data-count]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.count) === state.keys.length)));
    document.querySelectorAll('[data-mode]').forEach((b) => { b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)); b.disabled = state.keys.length === 1 && b.dataset.mode !== 'solid'; });
    document.querySelectorAll('[data-shape]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.shape === state.shape)));
    document.querySelectorAll('[data-font]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.font === state.font)));
    document.querySelectorAll('[data-key-type]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.keyType === key.type)));
    document.querySelectorAll('[data-emoji]').forEach((b) => b.setAttribute('aria-pressed', String(key.type === 'emoji' && b.dataset.emoji === key.value)));
    document.querySelectorAll('[data-color-part]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.color === (b.dataset.colorPart === 'base' ? state.base : key[b.dataset.colorPart]))));
    $('order-summary').textContent = `${state.keys.map(C.describe).join(' / ')} · ${C.MODES[state.mode].label} · ${C.assets.bases[state.shape].label} · base ${C.COLORS[state.base].label}`;
    $('order-total').textContent = C.rupiah(amount.total);
    $('mobile-total').textContent = C.rupiah(amount.total);
    $('unit-price').textContent = `${C.rupiah(amount.unit)} / pcs`;
    const errors = C.validate(state);
    if (quantityInvalid) errors.push('Jumlah produk harus bilangan bulat 1–99 pcs.');
    $('design-errors').hidden = !errors.length;
    $('design-errors').innerHTML = errors.length ? `<ul>${errors.map((error) => `<li>${C.escape(error)}</li>`).join('')}</ul>` : '';
    const order = $('order-now');
    if (errors.length) {
      order.removeAttribute('href'); order.setAttribute('aria-disabled', 'true');
      $('wa-message').value = 'Lengkapi desain terlebih dahulu:\n' + errors.join('\n');
    } else {
      const text = C.message(state, location.href);
      order.href = window.CetakinContact.url(text);
      order.target = '_blank'; order.rel = 'noopener noreferrer'; order.setAttribute('aria-disabled', 'false');
      $('wa-message').value = text;
    }
    try { history.replaceState(null, '', C.encode(state)); } catch (_) { /* Standalone file previews may restrict history. */ }
  }

  $('customizer').addEventListener('submit', (event) => event.preventDefault());
  $('customizer').addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    const data = button.dataset, key = state.keys[active];
    if (data.count) {
      const count = Number(data.count);
      state.keys = Array.from({ length: count }, (_, i) => state.keys[i] || C.makeKey());
      active = Math.min(active, count - 1);
      if (count === 1) state.mode = 'solid';
      $('quick-text').value = '';
    } else if (data.slot !== undefined) active = Number(data.slot);
    else if (data.mode) state.mode = data.mode;
    else if (data.shape) state.shape = data.shape;
    else if (data.font) state.font = data.font;
    else if (data.keyType) { key.type = data.keyType; key.value = data.keyType === 'emoji' ? C.DEFAULT_SYMBOL : ''; $('quick-text').value = ''; }
    else if (data.emoji) key.value = data.emoji;
    else if (data.colorPart) { if (data.colorPart === 'base') state.base = data.color; else key[data.colorPart] = data.color; }
    else return;
    render();
  });
  function selectPreviewKey(event) {
    const target = event.target.closest('[data-key-index]');
    if (!target) return;
    active = Number(target.dataset.keyIndex);
    render();
    $('key-slots').querySelector(`[data-slot="${active}"]`)?.focus({ preventScroll: true });
  }
  $('design-preview').addEventListener('click', selectPreviewKey);
  $('design-preview').addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectPreviewKey(event); } });
  $('single-letter').addEventListener('input', (event) => {
    const input = event.target, cleaned = input.value.toUpperCase().replace(/[^A-Z1-9]/g, '').slice(0, 1);
    if (input.value.toUpperCase() !== cleaned) announce('Karakter yang tersedia: A–Z dan angka 1–9.');
    input.value = cleaned; state.keys[active].value = cleaned; $('quick-text').value = ''; render(false);
  });
  $('quick-text').addEventListener('input', (event) => {
    const input = event.target, clean = input.value.toUpperCase().replace(/[^A-Z1-9]/g, '').slice(0, state.keys.length);
    if (input.value.toUpperCase() !== clean) announce('Gunakan A–Z dan angka 1–9. Spasi atau simbol tidak tersedia.');
    input.value = clean;
    state.keys.forEach((key, i) => { key.type = 'letter'; key.value = clean[i] || ''; });
    render();
  });
  $('apply-colors').addEventListener('click', () => {
    const source = state.keys[active];
    state.keys.forEach((key) => { key.cap = source.cap; key.ink = source.ink; });
    render(); announce('Warna keycap dan huruf/simbol diterapkan ke semua tombol.');
  });
  $('order-quantity').addEventListener('input', (event) => {
    const count = Number(event.target.value);
    quantityInvalid = !event.target.value || !Number.isInteger(count) || count < 1 || count > 99;
    event.target.setAttribute('aria-invalid', String(quantityInvalid));
    if (!quantityInvalid) state.quantity = count;
    render(false);
  });
  $('order-note').addEventListener('input', (event) => { state.note = event.target.value.slice(0, 300); render(false); });
  $('reset-design').addEventListener('click', () => {
    state = C.defaults(); active = 0; quantityInvalid = false; linkError = ''; retiredSymbolNotice = false;
    $('quick-text').value = ''; $('order-note').value = ''; $('order-quantity').value = '1'; $('order-quantity').setAttribute('aria-invalid', 'false');
    render(); announce('Desain dikembalikan ke contoh awal.');
  });
  $('order-now').addEventListener('click', (event) => { if ($('order-now').getAttribute('aria-disabled') === 'true') { event.preventDefault(); $('design-errors').scrollIntoView({ block: 'center' }); } });

  async function copy(text, fallback) {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const field = document.createElement('textarea'); field.value = text; field.style.cssText = 'position:fixed;left:-9999px'; document.body.appendChild(field); field.select();
        const success = document.execCommand('copy'); field.remove();
        if (!success) throw new Error('Clipboard unavailable');
      }
      announce('Berhasil disalin.');
    } catch (_) {
      $('wa-message').value = text; document.querySelector('.message-details').open = true;
      $('wa-message').focus(); $('wa-message').select(); announce(fallback);
    }
  }
  $('copy-design-link').addEventListener('click', () => copy(C.designUrl(state, location.href), 'Link ada di kolom chat pesanan. Pilih teks lalu salin secara manual.'));
  $('copy-order-text').addEventListener('click', () => copy($('wa-message').value, 'Pilih teks pesanan lalu salin secara manual.'));

  function exportSvg(snapshot) {
    const s = snapshot, amount = C.price(s), e = C.escape;
    const product = C.preview(s).replace('<svg ', '<svg x="70" y="210" width="610" height="1000" ');
    const rows = s.keys.map((key, i) => {
      const y = 465 + i * 75;
      const detail = `Keycap ${C.COLORS[key.cap].label} / ${C.inkName(key)} ${C.COLORS[key.ink].label}`;
      return `<text x="825" y="${y}" font-size="25" font-weight="700">${i + 1}. ${e(C.describe(key))}</text><text x="825" y="${y + 28}" font-size="19" fill="#5d6c77">${e(detail)}</text>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1400" viewBox="0 0 1800 1400"><rect width="1800" height="1400" fill="#f7f7f4"/><g font-family="Arial,sans-serif" fill="#17212b"><text x="75" y="85" font-size="26" font-weight="700" letter-spacing="3">CETAKIN / CLICKER CUSTOM</text><text x="75" y="157" font-size="51" font-weight="700">Desain pilihanmu.</text><rect x="65" y="205" width="635" height="1050" rx="26" fill="#dff2fa"/>${product}<text x="825" y="255" font-size="22" fill="#a34b0d">PRE-ORDER / ${s.keys.length} TOMBOL</text><text x="825" y="308" font-size="36" font-weight="700">${e(C.MODES[s.mode].label)} · ${e(C.assets.bases[s.shape].label)}</text><text x="825" y="356" font-size="24">Base ${e(C.COLORS[s.base].label)} / PETG</text><text x="825" y="395" font-size="22">Font: ${e(C.FONTS[s.font])}</text>${rows}<text x="825" y="1065" font-size="22">${s.quantity} pcs · ${C.rupiah(amount.unit)} / pcs</text><text x="825" y="1125" font-size="49" font-weight="700">Subtotal ${C.rupiah(amount.total)}</text><text x="825" y="1168" font-size="20" fill="#5d6c77">Belum termasuk ongkir. Desain dikonfirmasi admin.</text><text x="75" y="1315" font-size="19" fill="#5d6c77">Ilustrasi tampak atas, bukan foto / ukuran final. Urutan: dari gantungan ke bawah.</text><text x="75" y="1350" font-size="19" fill="#5d6c77">Lampirkan gambar ini bersama teks pesanan di WhatsApp.</text></g></svg>`;
  }
  function download(blob, filename) {
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  $('download-design').addEventListener('click', async () => {
    const errors = C.validate(state);
    if (errors.length || quantityInvalid) { announce('Lengkapi desain dan jumlah produk sebelum mengunduh.'); $('design-errors').scrollIntoView({ block: 'center' }); return; }
    const button = $('download-design'), snapshot = C.normalize(state);
    button.disabled = true;
    let source;
    try {
      source = URL.createObjectURL(new Blob([exportSvg(snapshot)], { type: 'image/svg+xml;charset=utf-8' }));
      const image = new Image();
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = source; });
      const canvas = document.createElement('canvas'); canvas.width = 1800; canvas.height = 1400;
      canvas.getContext('2d').drawImage(image, 0, 0);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('PNG export failed');
      download(blob, `Cetakin-clicker-${snapshot.keys.length}-tombol.png`);
      announce('Gambar diunduh. Lampirkan sendiri di chat WhatsApp.');
    } catch (_) { announce('Gambar gagal diunduh. Gunakan link desain atau salin teks pesanan.'); }
    finally { if (source) URL.revokeObjectURL(source); button.disabled = false; }
  });
  window.addEventListener('hashchange', () => {
    try { const decoded = C.decode(location.hash); if (decoded) { state = decoded; active = 0; quantityInvalid = false; linkError = ''; retiredSymbolNotice = unavailableSymbols().length > 0; $('order-quantity').value = String(state.quantity); $('order-note').value = state.note; $('quick-text').value = ''; $('order-quantity').setAttribute('aria-invalid', 'false'); render(); announce('Desain dari link dibuka.'); } }
    catch (_) { announce('Link desain tidak valid. Desain saat ini tetap tersedia.'); }
  });
  $('order-quantity').value = String(state.quantity); $('order-note').value = state.note;
  $('builder').hidden = false; $('mobile-order-bar').hidden = false;
  render();
})();
