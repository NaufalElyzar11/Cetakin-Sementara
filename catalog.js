(() => {
  'use strict';
  const core = window.CetakinCatalog;
  const config = window.CETAKIN_CONFIG.catalog;
  const page = document.body.dataset.page;
  const type = document.body.dataset.catalogType;
  const $ = (selector) => document.querySelector(selector);
  const state = { products: [], demo: !config.csvUrl.trim(), valid: false, loading: false, loadedAt: 0, attemptedAt: 0 };
  const PAGE_SIZE = 12;
  let limit = PAGE_SIZE;
  let currentProduct = null;
  const status = $('#data-status');
  const retry = $('#retry-data');
  $('#demo-notice').hidden = !state.demo;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function imageFor(product, lazy = true) {
    const image = el('img');
    image.src = product.image; image.alt = product.name;
    image.width = 640; image.height = 480;
    image.loading = lazy ? 'lazy' : 'eager'; image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';
    image.addEventListener('error', () => { image.src = './assets/catalog/placeholder.svg'; }, { once: true });
    return image;
  }
  function card(product) {
    const article = el('article', 'catalog-card');
    const link = el('a', 'catalog-card-link');
    link.href = `./produk.html?id=${encodeURIComponent(product.id)}`;
    const visual = el('div', 'catalog-card-visual');
    visual.append(imageFor(product));
    if (window.CetakinGuideCore?.forProduct(product)) visual.append(el('span', 'card-guide-badge', 'Panduan tersedia'));
    if (state.demo) visual.append(el('span', 'image-label', 'ILUSTRASI CONTOH'));
    const body = el('div', 'catalog-card-body');
    body.append(el('p', 'card-group', product.group), el('h2', 'card-name', product.name));
    const row = el('div', 'card-price-row');
    row.append(el('strong', '', core.money(product.price)), el('span', `stock-dot ${product.stock ? '' : 'sold-out'}`, product.stock ? `${product.stock} tersedia` : 'Habis'));
    body.append(row, el('span', 'card-details', 'Lihat detail'));
    link.append(visual, body); article.append(link);
    return article;
  }

  async function loadCatalog() {
    if (state.loading) return;
    state.loading = true; state.attemptedAt = Date.now();
    retry.hidden = true;
    status.textContent = state.loadedAt ? 'Memperbarui katalog…' : 'Memuat katalog…';
    if (page === 'product') updatePurchase();
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), config.timeoutMs || 12000);
    try {
      let text = '';
      let usedApi = false;
      if (config.apiUrl) {
        try {
          const apiRes = await fetch(config.apiUrl, { cache: 'no-store', signal: controller.signal });
          if (apiRes.ok) {
            const candidate = await apiRes.text();
            if (candidate && !/^\s*</.test(candidate)) {
              text = candidate;
              usedApi = true;
              state.demo = false;
              $('#demo-notice').hidden = true;
            }
          }
        } catch (_) { /* fallback to csvUrl */ }
      }
      if (!usedApi) {
        const source = state.demo ? config.demoUrl : config.csvUrl.trim();
        if (!state.demo && new URL(source).protocol !== 'https:') throw new Error('URL CSV harus HTTPS.');
        const response = await fetch(source, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        text = await response.text();
      }
      if (text.length > 5000000) throw new Error('Katalog melebihi batas ukuran.');
      state.products = core.productsFromCSV(text);
      state.valid = true; state.loadedAt = Date.now();
      status.textContent = state.demo ? 'Mode contoh · harga dan stok belum mewakili produk yang dijual.' : `Data dimuat pukul ${new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(state.loadedAt))}${usedApi ? ' · Sinkronisasi otomatis' : '. Pembaruan dari sumber dapat memiliki jeda.'}`;
      if (page === 'catalog') { populateGroups(); renderCatalog(); }
      else renderDetail();
    } catch (error) {
      state.valid = false;
      status.textContent = state.loadedAt ? 'Pembaruan katalog gagal. Data sebelumnya masih ditampilkan; pemesanan dinonaktifkan sampai data berhasil dimuat kembali.' : 'Katalog belum dapat dimuat. Silakan coba lagi atau hubungi kami melalui WhatsApp.';
      if (page === 'catalog' && !state.loadedAt) $('#result-count').textContent = 'Katalog belum tersedia';
      if (page === 'product' && !state.loadedAt) renderGuideFallback(true);
      retry.hidden = false;
      console.warn('Cetakin catalog:', error.message);
    } finally {
      clearTimeout(timeout); state.loading = false;
      $('#product-grid')?.setAttribute('aria-busy', 'false');
      if (page === 'product') updatePurchase();
    }
  }

  // Catalog state is kept in the URL so links and browser Back retain filters.
  const params = new URLSearchParams(location.search);
  if (page === 'catalog') {
    $('#search').value = (params.get('q') || '').slice(0, 200);
    $('#ready-stock').checked = params.get('stock') === 'ready';
    $('#sort').value = core.SORTS.includes(params.get('sort')) ? params.get('sort') : 'featured';
    for (const name of ['min', 'max']) {
      const value = params.get(name);
      if (value && /^\d+$/.test(value)) $(`#${name}-price`).value = value;
    }
    $('#group-filter').dataset.initial = params.get('group') || '';
  }
  function populateGroups() {
    const select = $('#group-filter');
    const previous = select.value || select.dataset.initial;
    const groups = [...new Set(state.products.filter((product) => product.type === type).map((product) => product.group))].sort((a, b) => a.localeCompare(b, 'id'));
    select.replaceChildren(new Option(type === 'robotika' ? 'Semua kategori' : 'Semua asal desain', ''));
    groups.forEach((group) => select.add(new Option(group, group)));
    select.value = groups.includes(previous) ? previous : '';
    delete select.dataset.initial;
  }
  function readFilters() {
    const numeric = (id) => { const value = $(id).value.trim(); return value && Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null; };
    return { type, q: $('#search').value, group: $('#group-filter').value, ready: $('#ready-stock').checked, sort: $('#sort').value, min: numeric('#min-price'), max: numeric('#max-price') };
  }
  function saveFilters(filters) {
    const query = new URLSearchParams();
    if (filters.q) query.set('q', filters.q);
    if (filters.group) query.set('group', filters.group);
    if (filters.ready) query.set('stock', 'ready');
    if (filters.sort !== 'featured') query.set('sort', filters.sort);
    for (const key of ['min', 'max']) if (filters[key] !== null) query.set(key, filters[key]);
    const queryString = query.toString();
    history.replaceState(null, '', `${location.pathname}${queryString ? `?${queryString}` : ''}`);
  }
  function renderCatalog() {
    const filters = readFilters();
    const invalidRange = filters.min !== null && filters.max !== null && filters.min > filters.max;
    $('#price-error').hidden = !invalidRange;
    $('#max-price').setAttribute('aria-invalid', String(invalidRange));
    const matches = invalidRange ? [] : core.filterProducts(state.products, filters);
    const grid = $('#product-grid'); grid.replaceChildren();
    matches.slice(0, limit).forEach((product) => grid.append(card(product)));
    $('#result-count').textContent = `${matches.length} produk${filters.q ? ` untuk “${filters.q}”` : ''}`;
    $('#empty-state').hidden = matches.length > 0;
    $('#load-more').hidden = matches.length <= limit;
    saveFilters(filters);
  }
  function resetFilters() {
    $('#search').value = ''; $('#group-filter').value = ''; $('#ready-stock').checked = false;
    $('#min-price').value = ''; $('#max-price').value = ''; $('#sort').value = 'featured';
    limit = PAGE_SIZE; if (state.valid || state.loadedAt) renderCatalog();
  }
  if (page === 'catalog') {
    $('#catalog-filters').addEventListener('submit', (event) => event.preventDefault());
    $('#catalog-filters').addEventListener('reset', (event) => { event.preventDefault(); resetFilters(); });
    $('#reset-empty').addEventListener('click', resetFilters);
    $('#catalog-filters').addEventListener('input', () => { limit = PAGE_SIZE; if (state.loadedAt) renderCatalog(); });
    $('#sort').addEventListener('change', () => { limit = PAGE_SIZE; if (state.loadedAt) renderCatalog(); });
    $('#load-more').addEventListener('click', () => { limit += PAGE_SIZE; renderCatalog(); });
  }

  function renderGuideFallback(show) {
    const link = $('#product-guide-fallback');
    if (!link) return;
    const guide = window.CetakinGuideCore?.forProduct({ id: params.get('id'), type: 'robotika' });
    link.hidden = !show || !guide;
    if (guide) {
      link.href = window.CetakinGuideCore.href(guide);
      $('#product-guide-fallback-title').textContent = `Panduan ${guide.title}`;
    } else link.removeAttribute('href');
  }

  function renderDetail() {
    const product = state.products.find((item) => item.id === params.get('id'));
    currentProduct = product || null;
    $('#product-detail').hidden = !product;
    $('#missing-product').hidden = Boolean(product);
    $('#related-section').hidden = !product;
    renderGuideFallback(!product);
    if (!product) { document.title = 'Produk belum ditemukan - Cetakin'; return; }
    const href = `./${product.type}.html`;
    $('#catalog-back').href = href;
    $('#catalog-back').textContent = product.type === 'robotika' ? 'Komponen Robotika' : 'Gantungan Kunci';
    $('#breadcrumb-product').textContent = product.name;
    $('#detail-group').textContent = product.group;
    $('#detail-name').textContent = product.name;
    $('#detail-sku').textContent = `KODE PRODUK / ${product.id.toUpperCase()}`;
    $('#detail-price').textContent = core.money(product.price);
    $('#detail-description').textContent = product.description;
    const guide = window.CetakinGuideCore?.forProduct(product);
    const guideLink = $('#product-guide');
    if (guideLink) {
      guideLink.hidden = !guide;
      if (guide) {
        guideLink.href = window.CetakinGuideCore.href(guide);
        $('#product-guide-title').textContent = `Panduan ${guide.title}`;
      } else guideLink.removeAttribute('href');
    }
    const image = $('#detail-image');
    image.onerror = () => { image.onerror = null; image.src = './assets/catalog/placeholder.svg'; };
    image.src = product.image; image.alt = product.name; image.referrerPolicy = 'no-referrer';
    $('#detail-image-label').hidden = !state.demo;
    $('#detail-stock').textContent = product.stock ? `${product.stock} tersedia` : 'Stok habis';
    $('#detail-stock').classList.toggle('is-empty', !product.stock);
    document.title = `${product.name} - Cetakin`;
    document.querySelector('meta[name="description"]').content = product.description.slice(0, 160);
    const specs = $('#detail-specs'); specs.replaceChildren();
    const entries = [[product.type === 'robotika' ? 'Kategori' : 'Asal desain', product.group], ['Material', product.material], ['Ukuran', product.dimensions], ['Berat produk', product.weight_grams ? `${product.weight_grams} g` : ''], ['Kode produk', product.id]];
    entries.filter(([, value]) => value).forEach(([label, value]) => { specs.append(el('dt', '', label), el('dd', '', value)); });
    const related = state.products.filter((item) => item.type === product.type && item.id !== product.id).sort((a, b) => Number(b.group === product.group) - Number(a.group === product.group)).slice(0, 3);
    $('#related-section').hidden = !related.length;
    $('#related-link').href = href;
    $('#related-grid').replaceChildren(...related.map(card));
    updatePurchase();
  }
  function updatePurchase() {
    const link = $('#product-order');
    if (!link || !currentProduct) return;
    const product = currentProduct;
    const input = $('#quantity');
    const max = Math.min(product.stock, 999);
    input.max = String(Math.max(1, max));
    const quantity = Number(input.value);
    const validQuantity = input.value.trim() !== '' && Number.isInteger(quantity) && quantity >= 1 && quantity <= max;
    const canBuy = state.valid && !state.loading && validQuantity && product.stock > 0;
    input.disabled = !state.valid || !product.stock;
    $('#minus-quantity').disabled = input.disabled || quantity <= 1;
    $('#plus-quantity').disabled = input.disabled || quantity >= max;
    $('#quantity-error').hidden = validQuantity || !product.stock;
    $('#quantity-error').textContent = `Masukkan jumlah 1–${max} pcs sesuai stok yang tersedia.`;
    input.setAttribute('aria-invalid', String(!validQuantity && product.stock > 0));
    $('#detail-subtotal').textContent = validQuantity ? core.money(product.price * quantity) : '-';
    link.setAttribute('aria-disabled', String(!canBuy)); link.tabIndex = 0;
    if (canBuy) {
      const productURL = new URL(`./produk.html?id=${encodeURIComponent(product.id)}`, location.href).href;
      link.href = window.CetakinContact.url(core.orderMessage(product, quantity, productURL, state.demo));
      link.target = '_blank'; link.rel = 'noopener noreferrer';
    } else link.removeAttribute('href');
    link.textContent = state.loading ? 'Memperbarui data…' : !state.valid ? 'Data belum tersedia' : !product.stock ? 'Stok habis' : state.demo ? 'Coba pesan WhatsApp ↗' : 'Beli via WhatsApp ↗';
    $('#purchase-note').textContent = state.demo ? 'Pesan percobaan diberi penanda simulasi. Harga dan stok ini hanya contoh.' : 'Stok belum dicadangkan sampai pesanan dikonfirmasi.';
  }
  if (page === 'product') {
    $('#quantity').addEventListener('input', updatePurchase);
    for (const [id, delta] of [['#minus-quantity', -1], ['#plus-quantity', 1]]) {
      $(id).addEventListener('click', () => {
        const current = Number($('#quantity').value) || 1;
        $('#quantity').value = Math.max(1, Math.min(currentProduct.stock, 999, current + delta));
        updatePurchase();
      });
    }
    $('#product-order').addEventListener('click', (event) => { if (event.currentTarget.getAttribute('aria-disabled') === 'true') event.preventDefault(); });
    $('#share-product').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        $('#share-status').textContent = 'Tautan produk disalin.';
        $('#share-product').textContent = 'Tautan disalin ✓';
        setTimeout(() => { $('#share-product').textContent = 'Salin tautan produk'; }, 2500);
      } catch (_) {
        $('#share-status').classList.remove('sr-only');
        $('#share-status').textContent = `Salin alamat ini: ${location.href}`;
      }
    });
  }
  retry.addEventListener('click', loadCatalog);
  if (!state.demo) {
    const interval = Math.max(30000, Number(config.refreshMs) || 60000);
    setInterval(() => { if (!document.hidden && Date.now() - state.attemptedAt >= interval) loadCatalog(); }, interval);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - state.attemptedAt >= interval) loadCatalog(); });
  }
  loadCatalog();
})();
