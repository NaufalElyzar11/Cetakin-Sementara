(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const money = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v) || 0);
  const pct = (v) => `${((Number(v) || 0) * 100).toFixed(1)}%`;

  const state = {
    token: localStorage.getItem('cetakin_token') || '',
    user: null,
    activeUnit: '3d-print',
    activeTab: 'tab-dashboard',
    filterMonth: '',
    dashboard: null,
    catalog: [],
    lastJasaCalc: null,
    lastClickerCalc: null,
    lastRoboCalc: null
  };

  function showToast(msg) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => { el.hidden = true; }, 3200);
  }

  async function apiFetch(url, options = {}) {
    const targetUrl = url.startsWith('./api/') ? url.replace('./api/', '/api/') : url;
    const headers = { ...(options.headers || {}) };
    if (state.token) headers.Authorization = `Bearer ${state.token}`;
    if (options.body && typeof options.body === 'object') {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }
    let res;
    try {
      res = await fetch(targetUrl, { ...options, headers });
    } catch (_) {
      throw new Error('Server backend belum menyala. Jalankan "node server.js" lalu buka http://localhost:8080/admin.html');
    }
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && !url.includes('/api/auth/login')) {
      logout();
      throw new Error(data.error || 'Sesi berakhir, silakan login ulang.');
    }
    if (res.status === 404 || res.status === 405 || res.status === 501) {
      throw new Error(
        data.error ||
        'API tidak ditemukan (HTTP ' + res.status + '). Pastikan Anda menjalankan "node server.js" (bukan python http.server / Live Server) dan membuka http://localhost:8080/admin.html'
      );
    }
    if (!res.ok || data.ok === false) {
      throw new Error(data.error || `Gagal menghubungi server (HTTP ${res.status})`);
    }
    return data;
  }

  // =========================================================
  // 1. AUTENTIKASI & ROLE GUARD
  // =========================================================
  $('#login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = $('#login-error');
    const submitBtn = $('#login-submit-btn');
    errEl.hidden = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Memproses Login...';
    }
    try {
      const username = $('#login-username').value.trim();
      const password = $('#login-password').value;
      const res = await apiFetch('./api/auth/login', {
        method: 'POST',
        body: { username, password }
      });
      state.token = res.token;
      state.user = res.user;
      localStorage.setItem('cetakin_token', res.token);
      await enterApp();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.hidden = false;
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Masuk ke Dashboard ↗';
      }
    }
  });

  function logout() {
    state.token = '';
    state.user = null;
    localStorage.removeItem('cetakin_token');
    if ($('#login-username')) $('#login-username').value = '';
    if ($('#login-password')) $('#login-password').value = '';
    $('#app-view').hidden = true;
    $('#login-view').hidden = false;
  }

  $('#logout-btn')?.addEventListener('click', logout);

  async function initSession() {
    const today = new Date().toISOString().slice(0, 10);
    if ($('#ord-date')) $('#ord-date').value = today;
    if ($('#mut-date')) $('#mut-date').value = today;
    if ($('#qp-date')) $('#qp-date').value = today;
    renderOrderFormItems();

    if (!state.token) return;
    try {
      const res = await apiFetch('./api/auth/me');
      state.user = res.user;
      await enterApp();
    } catch (_) {
      logout();
    }
  }

  async function enterApp() {
    $('#login-view').hidden = true;
    $('#app-view').hidden = false;

    const u = state.user;
    const badge = $('#user-role-badge');
    badge.dataset.role = u.role;
    badge.textContent = u.role === 'owner'
      ? '👑 SUPER OWNER'
      : u.role === 'admin_3d'
        ? '🖨️ ADMIN 3D PRINT'
        : '🤖 ADMIN ROBOTIKA';

    // Konfigurasi Unit Switcher berdasarkan Role
    const switcher = $('#unit-switcher');
    if (u.role === 'owner') {
      switcher.hidden = false;
      $$('.unit-btn').forEach((btn) => { btn.hidden = false; });
    } else if (u.role === 'admin_3d') {
      state.activeUnit = '3d-print';
      $$('.unit-btn').forEach((btn) => {
        btn.hidden = btn.dataset.unit !== '3d-print';
      });
    } else if (u.role === 'admin_robotika') {
      state.activeUnit = 'robotika';
      $$('.unit-btn').forEach((btn) => {
        btn.hidden = btn.dataset.unit !== 'robotika';
      });
    }

    // Pengaturan khusus Super Owner
    if ($('#owner-settings-card')) {
      $('#owner-settings-card').hidden = u.role !== 'owner';
    }
    if ($('#pass-target-wrap')) {
      $('#pass-target-wrap').hidden = u.role !== 'owner';
    }

    updateUnitButtons();
    runAllCalculators();
    try {
      await Promise.all([loadDashboardData(), loadAdminCatalog()]);
    } catch (err) {
      showToast('Gagal memuat sebagian data: ' + err.message);
    }
  }

  function updateUnitButtons() {
    $$('.unit-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.unit === state.activeUnit);
    });
    const is3D = state.activeUnit === '3d-print';
    $('#active-unit-pill').textContent = is3D ? 'DIVISI 01 · JASA 3D PRINT & GANCI' : 'DIVISI 02 · KOMPONEN ROBOTIKA';
    $('#active-unit-title').textContent = is3D
      ? 'Laporan Keuangan Jasa 3D Print & Gantungan Kunci'
      : 'Laporan Keuangan Komponen Robotika';
    if ($('#ord-wage-field')) $('#ord-wage-field').hidden = !is3D;

    // Otomatis arahkan sub-kalkulator sesuai unit aktif
    switchCalcMode(is3D ? 'jasa-3d' : 'robotika');
  }

  $$('.unit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activeUnit = btn.dataset.unit;
      updateUnitButtons();
      renderDashboard();
      populateOrderCatalogPicker();
    });
  });

  // =========================================================
  // 2. NAVIGASI TAB (DESKTOP & MOBILE BOTTOM BAR)
  // =========================================================
  function switchTab(tabId) {
    state.activeTab = tabId;
    $$('.panel-section').forEach((sec) => {
      sec.classList.toggle('active', sec.id === tabId);
    });
    $$('.tab-btn, .mob-tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  $$('.tab-btn, .mob-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  $$('[data-goto-tab]').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.gotoTab));
  });

  $('#global-month-filter')?.addEventListener('change', async (e) => {
    state.filterMonth = e.target.value || '';
    await loadDashboardData();
  });

  // =========================================================
  // 3. DASHBOARD KEUANGAN & REKONSILIASI 1 QRIS BERSAMA
  // =========================================================
  async function loadDashboardData() {
    const query = state.filterMonth ? `?month=${encodeURIComponent(state.filterMonth)}` : '';
    const data = await apiFetch(`./api/finance/dashboard${query}`);
    state.dashboard = data;
    populateSettingsForm(data.settings);
    renderDashboard();
  }

  function renderDashboard() {
    if (!state.dashboard) return;
    const { sharedQris, units, user } = state.dashboard;

    // Render Banner 1 QRIS Bersama (Khusus Super Owner)
    const qrisBox = $('#shared-qris-box');
    if (user.role === 'owner' && sharedQris) {
      qrisBox.hidden = false;
      $('#qris-total-balance').textContent = money(sharedQris.totalMerchantBalance);
      $('#qris-3d-balance').textContent = money(sharedQris.unit3D.balance);
      $('#qris-3d-pct').textContent = pct(sharedQris.unit3D.sharePct);
      $('#qris-3d-inflow').textContent = `Total masuk QRIS 3D Print: ${money(sharedQris.unit3D.inflow)}`;

      $('#qris-robo-balance').textContent = money(sharedQris.unitRobotika.balance);
      $('#qris-robo-pct').textContent = pct(sharedQris.unitRobotika.sharePct);
      $('#qris-robo-inflow').textContent = `Total masuk QRIS Robotika: ${money(sharedQris.unitRobotika.inflow)}`;

      // Isi nilai default di modal pencairan QRIS
      $('#qp-amount-3d').value = Math.max(0, sharedQris.unit3D.balance);
      $('#qp-amount-robo').value = Math.max(0, sharedQris.unitRobotika.balance);
    } else {
      qrisBox.hidden = true;
    }

    const uData = units[state.activeUnit];
    if (!uData) return;

    // KPI Cards
    $('#kpi-revenue').textContent = money(uData.recognizedRevenue);
    $('#kpi-revenue-sub').textContent = `${uData.orders.filter((o) => o.status === 'Selesai').length} pesanan selesai`;
    $('#kpi-hpp').textContent = money(uData.recognizedHpp + uData.extraExpensesOutOfHpp);
    $('#kpi-hpp-sub').textContent = `HPP: ${money(uData.recognizedHpp)} · Luar HPP: ${money(uData.extraExpensesOutOfHpp)}`;
    $('#kpi-profit').textContent = money(uData.operatingProfit);
    const marginVal = uData.recognizedRevenue > 0 ? uData.operatingProfit / uData.recognizedRevenue : 0;
    $('#kpi-profit-sub').textContent = `Margin bersih: ${pct(marginVal)}`;
    $('#kpi-freecash').textContent = money(uData.suggestedAllocationBase);
    $('#kpi-freecash-sub').textContent = `Kas Cair Bank+Tunai: ${money(uData.liquidCash)}`;

    // Tabel Saldo Akun
    const accTbody = $('#account-balances-tbody');
    accTbody.replaceChildren();
    for (const [accName, acc] of Object.entries(uData.accountBalances)) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${accName}</strong> ${accName === 'Merchant' ? '<span class="badge badge-info">QRIS</span>' : ''}</td>
        <td>${money(acc.opening)}</td>
        <td style="color:#16a34a;">+${money(acc.inflow)}</td>
        <td style="color:#dc2626;">−${money(acc.outflow)}</td>
        <td><strong>${money(acc.balance)}</strong></td>
      `;
      accTbody.appendChild(tr);
    }

    $('#stat-dp-held').textContent = money(uData.totalCustomerDpHeld);
    $('#stat-unpaid-wage').textContent = money(uData.unpaidWages);
    $('#stat-min-reserve').textContent = money(uData.minReserve);

    // Tabel Pos Pembagian Laba
    const allocTbody = $('#allocation-tbody');
    allocTbody.replaceChildren();
    for (const item of uData.allocationBreakdown) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.pot}</strong></td>
        <td>${pct(item.rate)}</td>
        <td><strong>${money(item.amount)}</strong></td>
      `;
      allocTbody.appendChild(tr);
    }
    if (uData.remainderToReserve > 0) {
      const trRem = document.createElement('tr');
      trRem.innerHTML = `
        <td><em>Sisa batas cicilan / pembulatan (Masuk Cadangan)</em></td>
        <td>—</td>
        <td><strong>${money(uData.remainderToReserve)}</strong></td>
      `;
      allocTbody.appendChild(trRem);
    }

    // Tabel Talangan Alat & Modal
    const advTbody = $('#advances-tbody');
    advTbody.replaceChildren();
    let totalOpening = 0;
    let totalRepaid = 0;
    let totalRemaining = 0;
    for (const adv of uData.advances) {
      totalOpening += (adv.opening + adv.added);
      totalRepaid += adv.repaid;
      totalRemaining += adv.remaining;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="badge badge-warn">${adv.code}</span></td>
        <td><strong>${adv.owner}</strong></td>
        <td>${money(adv.opening + adv.added)}</td>
        <td style="color:#16a34a;">${money(adv.repaid)}</td>
        <td><strong>${money(adv.remaining)}</strong></td>
      `;
      advTbody.appendChild(tr);
    }
    if (uData.advances && uData.advances.length > 1) {
      const trTotal = document.createElement('tr');
      trTotal.style.fontWeight = '700';
      trTotal.style.background = '#f8fafc';
      trTotal.innerHTML = `
        <td><span class="badge badge-success">TL-GABUNGAN</span></td>
        <td><strong>Total (${state.activeUnit === '3d-print' ? 'Mesin & Modal' : 'Semua'})</strong></td>
        <td>${money(totalOpening)}</td>
        <td style="color:#16a34a;">${money(totalRepaid)}</td>
        <td><strong style="color:${totalRemaining > 0 ? '#d97706' : '#16a34a'};">${money(totalRemaining)}</strong></td>
      `;
      advTbody.appendChild(trTotal);
    }

    // Tabel Rekap Upah Kerja
    const wageSumTbody = $('#wages-summary-tbody');
    wageSumTbody.replaceChildren();
    for (const [worker, w] of Object.entries(uData.wageByWorker)) {
      const unpaid = Math.max(0, w.recorded - w.paid);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${worker === 'Saya' ? 'Saya (Naufal)' : 'Partner'}</strong></td>
        <td>${money(w.recorded)}</td>
        <td style="color:#16a34a;">${money(w.paid)}</td>
        <td><strong style="color:${unpaid > 0 ? '#dc2626' : '#16a34a'};">${money(unpaid)}</strong></td>
      `;
      wageSumTbody.appendChild(tr);
    }

    // Render Tabel Pesanan di Tab Ledger
    renderOrdersTable(uData.orders);
    renderMutationsTable(uData.mutations);
    renderWagesTable(state.dashboard);
  }

  function renderOrdersTable(orders) {
    const datalist = $('#order-id-options');
    if (datalist) {
      datalist.replaceChildren();
      for (const o of orders) {
        const opt = document.createElement('option');
        opt.value = o.id;
        opt.label = `${o.productName} (${o.customer}) — Tagihan: ${money(o.netBill)}`;
        datalist.appendChild(opt);
      }
    }
    const tbody = $('#orders-tbody');
    if (!tbody) return;
    tbody.replaceChildren();
    if (!orders.length) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--muted);">Belum ada pesanan tercatat pada divisi ini.</td></tr>`;
      return;
    }

    for (const o of orders) {
      const badgeClass = o.status === 'Selesai' ? 'badge-success' : o.status === 'Proses' ? 'badge-warn' : 'badge-danger';
      const overpaymentAmount = Math.max(0, Number(o.overpaymentAmount ?? (Number(o.netPaid) - Number(o.netBill))) || 0);
      const paymentColor = overpaymentAmount > 0 || o.netPaid < o.netBill ? '#d97706' : '#16a34a';
      const tr = document.createElement('tr');
      const itemsCountBadge = (Array.isArray(o.items) && o.items.length > 1)
        ? `<div style="font-size:11px; color:#0284c7; font-weight:700; margin-top:2px;">📦 ${o.items.length} macam barang (${o.quantity} pcs total)</div>`
        : '';
      tr.innerHTML = `
        <td>
          <strong>${o.id}</strong>
          <div style="font-size:11px; color:var(--muted);">${o.date}</div>
        </td>
        <td>
          <strong>${escapeHtml(o.productName)}</strong>
          ${itemsCountBadge}
          <div style="font-size:11px; color:var(--muted);">👤 ${escapeHtml(o.customer)}</div>
        </td>
        <td>${o.quantity} pcs</td>
        <td><strong>${money(o.netBill)}</strong></td>
        <td>${money(o.adjustedHpp)}</td>
        <td>
          <span style="color:${paymentColor}; font-weight:700;">${money(o.netPaid)}</span>
          ${o.remainingBill > 0 ? `<div style="font-size:10px; color:#dc2626;">Kurang ${money(o.remainingBill)}</div>` : ''}
          ${overpaymentAmount > 0 ? `<div style="font-size:10px; color:#b45309;">Lebih ${money(overpaymentAmount)} · Periksa mutasi</div>` : ''}
        </td>
        <td><strong style="color:${o.profit >= 0 ? '#16a34a' : '#dc2626'};">${money(o.profit)}</strong></td>
        <td><span class="badge ${badgeClass}">${o.status}</span></td>
        <td>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" class="btn btn-dark btn-sm" data-invoice-order="${o.id}" title="Lihat &amp; Unduh Nota Pembeli (PDF/PNG)">🧾 Nota</button>
            ${o.status !== 'Selesai' ? `<button type="button" class="btn btn-outline btn-sm" data-complete-order="${o.id}" title="Tandai Selesai">✓ Selesai</button>` : ''}
            <button type="button" class="btn btn-danger btn-sm" data-del-order="${o.id}" title="Hapus">🗑</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    }

    tbody.querySelectorAll('[data-invoice-order]').forEach((btn) => {
      btn.addEventListener('click', () => {
        openInvoiceModal(btn.dataset.invoiceOrder);
      });
    });

    tbody.querySelectorAll('[data-complete-order]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await apiFetch(`./api/finance/orders/${encodeURIComponent(btn.dataset.completeOrder)}`, {
            method: 'PUT',
            body: { status: 'Selesai', completedDate: new Date().toISOString().slice(0, 10) }
          });
          showToast('Status pesanan diubah menjadi Selesai!');
          await loadDashboardData();
        } catch (err) {
          showToast(err.message);
        }
      });
    });

    tbody.querySelectorAll('[data-del-order]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm(`Hapus pesanan ${btn.dataset.delOrder}? Pesanan dengan mutasi/upah terkait harus dibatalkan atau catatan terkait ditangani terlebih dahulu.`)) return;
        try {
          await apiFetch(`./api/finance/orders/${encodeURIComponent(btn.dataset.delOrder)}`, { method: 'DELETE' });
          showToast('Pesanan dihapus.');
          await loadDashboardData();
        } catch (err) {
          showToast(err.message);
        }
      });
    });
  }

  function renderMutationsTable(mutations) {
    const tbody = $('#mutations-tbody');
    if (!tbody) return;
    tbody.replaceChildren();
    if (!mutations.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--muted);">Belum ada mutasi kas.</td></tr>`;
      return;
    }

    for (const m of mutations) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <strong>${m.id}</strong>
          <div style="font-size:11px; color:var(--muted);">${m.date}</div>
        </td>
        <td>
          <strong>${m.type}</strong>
          <div style="font-size:11px; color:var(--muted);">${m.description || ''} ${m.orderId ? `(${m.orderId})` : ''}</div>
        </td>
        <td>
          <span class="badge badge-info">${m.fromAccount} → ${m.toAccount}</span>
          ${m.advanceCode ? `<div style="font-size:10px; color:#92400e;">Talangan: ${m.advanceCode}</div>` : ''}
        </td>
        <td><strong>${money(m.amount)}</strong></td>
        <td>
          <button type="button" class="btn btn-danger btn-sm" data-del-mut="${m.id}">🗑</button>
        </td>
      `;
      tbody.appendChild(tr);
    }

    tbody.querySelectorAll('[data-del-mut]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm(`Hapus catatan mutasi ${btn.dataset.delMut}?`)) return;
        try {
          await apiFetch(`./api/finance/mutations/${encodeURIComponent(btn.dataset.delMut)}`, { method: 'DELETE' });
          showToast('Mutasi kas dihapus.');
          await loadDashboardData();
        } catch (err) {
          showToast(err.message);
        }
      });
    });
  }

  function renderWagesTable() {
    const tbody = $('#wages-tbody');
    if (!tbody || !state.dashboard) return;
    tbody.replaceChildren();
    // Ambil daftar pesanan untuk info upah
    const uData = state.dashboard.units[state.activeUnit];
    if (!uData) return;
    const wagesList = uData.wages || [];

    if (!wagesList.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--muted);">Belum ada catatan jam kerja tercatat.</td></tr>`;
      return;
    }

    for (const w of wagesList) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <strong>${w.orderId || '-'}</strong>
          <div style="font-size:11px; color:var(--muted);">${w.date}</div>
        </td>
        <td>
          <strong>${w.worker === 'Saya' ? 'Saya (Naufal)' : 'Partner'}</strong>
          ${w.task ? `<div style="font-size:11px; color:var(--muted);">${w.task}</div>` : ''}
        </td>
        <td>${w.minutes} mnt</td>
        <td><strong>${money(w.amount)}</strong></td>
        <td>
          <button type="button" class="btn btn-danger btn-sm" data-del-wage="${w.id}" title="Hapus catatan upah">🗑</button>
        </td>
      `;
      tbody.appendChild(tr);
    }

    tbody.querySelectorAll('[data-del-wage]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Hapus catatan jam kerja/upah ini?')) return;
        try {
          await apiFetch(`./api/finance/wages/${encodeURIComponent(btn.dataset.delWage)}`, { method: 'DELETE' });
          showToast('Catatan upah berhasil dihapus.');
          await loadDashboardData();
        } catch (err) {
          showToast(err.message);
        }
      });
    });
  }

  // =========================================================
  // 4. FORM INPUT PESANAN MULTI-ITEM, MUTASI KAS & UPAH
  // =========================================================
  state.orderFormItems = [
    { productId: '', productName: '', quantity: 1, price: 0, hpp: 0 }
  ];

  function getCatalogOptionsForUnit() {
    const targetType = state.activeUnit === 'robotika' ? 'robotika' : 'gantungan-kunci';
    return (state.catalog || []).filter((p) => p.type === targetType);
  }

  function renderOrderFormItems() {
    const container = $('#ord-items-container');
    if (!container) return;
    if (!state.orderFormItems || !state.orderFormItems.length) {
      state.orderFormItems = [{ productId: '', productName: '', quantity: 1, price: 0, hpp: 0 }];
    }

    const catalogItems = getCatalogOptionsForUnit();
    container.replaceChildren();

    state.orderFormItems.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'order-item-card';
      card.dataset.index = idx;

      const optionsHtml = [
        `<option value="">-- Ketik Manual / Jasa Kustom --</option>`,
        ...catalogItems.map(
          (c) => `<option value="${c.id}" ${c.id === item.productId ? 'selected' : ''}>[${c.id}] ${c.name} (Stok: ${c.stock}) — Jual: ${money(c.price)} | HPP: ${money(c.cost_price || 0)}</option>`
        )
      ].join('');

      const subtotal = Math.max(0, (Number(item.quantity) || 1) * (Number(item.price) || 0));

      card.innerHTML = `
        <div class="order-item-card-top">
          <span class="order-item-num">#${idx + 1}</span>
          <select class="ord-item-catalog" title="Pilih Cepat dari Katalog">
            ${optionsHtml}
          </select>
          <button type="button" class="btn btn-outline btn-sm ord-item-remove-btn" title="Hapus baris ini">✕</button>
        </div>
        <div class="order-item-card-grid">
          <div class="form-field">
            <label>Nama Barang / Komponen</label>
            <input type="text" class="ord-item-name" value="${escapeHtml(item.productName || '')}" placeholder="Contoh: Sensor Ultrasonik HC-SR04" required />
          </div>
          <div class="form-field">
            <label>Qty (pcs)</label>
            <input type="number" min="1" step="1" class="ord-item-qty" value="${item.quantity || 1}" required />
          </div>
          <div class="form-field">
            <label>Harga Satuan (Rp)</label>
            <input type="number" min="0" step="1" class="ord-item-price" value="${item.price ?? 0}" required />
          </div>
          <div class="form-field">
            <label>HPP Satuan (Rp)</label>
            <input type="number" min="0" step="1" class="ord-item-cost" value="${item.hpp ?? 0}" />
          </div>
          <div class="form-field">
            <label>Subtotal (Rp)</label>
            <div class="ord-item-subtotal-val">${money(subtotal)}</div>
          </div>
        </div>
      `;

      const catSelect = card.querySelector('.ord-item-catalog');
      const nameInput = card.querySelector('.ord-item-name');
      const qtyInput = card.querySelector('.ord-item-qty');
      const priceInput = card.querySelector('.ord-item-price');
      const costInput = card.querySelector('.ord-item-cost');
      const subtotalVal = card.querySelector('.ord-item-subtotal-val');
      const removeBtn = card.querySelector('.ord-item-remove-btn');

      catSelect?.addEventListener('change', () => {
        const prodId = catSelect.value;
        item.productId = prodId;
        if (prodId) {
          const prod = (state.catalog || []).find((p) => p.id === prodId);
          if (prod) {
            item.productName = prod.name;
            item.price = prod.price;
            item.hpp = prod.cost_price || 0;
            nameInput.value = prod.name;
            priceInput.value = prod.price;
            costInput.value = prod.cost_price || 0;
          }
        }
        recalcRow();
      });

      const recalcRow = () => {
        item.productName = nameInput.value.trim();
        item.quantity = Math.max(1, Math.round(Number(qtyInput.value) || 1));
        item.price = Math.max(0, Math.round(Number(priceInput.value) || 0));
        item.hpp = Math.max(0, Math.round(Number(costInput.value) || 0));
        subtotalVal.textContent = money(item.quantity * item.price);
        recalcOrderFormTotals();
      };

      nameInput?.addEventListener('input', () => {
        item.productName = nameInput.value;
        updateOrderSummaryFields();
      });
      qtyInput?.addEventListener('input', recalcRow);
      priceInput?.addEventListener('input', recalcRow);
      costInput?.addEventListener('input', recalcRow);

      removeBtn?.addEventListener('click', () => {
        if (state.orderFormItems.length > 1) {
          state.orderFormItems.splice(idx, 1);
        } else {
          state.orderFormItems = [{ productId: '', productName: '', quantity: 1, price: 0, hpp: 0 }];
        }
        renderOrderFormItems();
      });

      container.appendChild(card);
    });

    recalcOrderFormTotals();
  }

  function recalcOrderFormTotals() {
    let totalQty = 0;
    let totalBill = 0;
    let totalHpp = 0;

    for (const it of state.orderFormItems) {
      const q = Math.max(1, Math.round(Number(it.quantity) || 1));
      const p = Math.max(0, Math.round(Number(it.price) || 0));
      const h = Math.max(0, Math.round(Number(it.hpp) || 0));
      totalQty += q;
      totalBill += q * p;
      totalHpp += q * h;
    }

    const netbillInput = $('#ord-netbill');
    const hppInput = $('#ord-hpp');
    const summarySpan = $('#ord-items-calc-summary');
    const hiddenQty = $('#ord-qty');

    if (netbillInput) netbillInput.value = totalBill;
    if (hppInput) hppInput.value = totalHpp;
    if (hiddenQty) hiddenQty.value = totalQty;
    if (summarySpan) {
      summarySpan.textContent = `Total: ${totalQty} unit · Tagihan: ${money(totalBill)} · HPP: ${money(totalHpp)}`;
    }
    updateOrderSummaryFields();
  }

  function updateOrderSummaryFields() {
    const hiddenName = $('#ord-product-name');
    if (!hiddenName) return;
    const validNames = state.orderFormItems
      .filter((it) => it.productName)
      .map((it) => `${it.productName} (${it.quantity || 1}x)`);
    hiddenName.value = validNames.join(', ') || 'Pesanan Komponen';
  }

  function addOrderFormItem(initialData = {}) {
    state.orderFormItems.push({
      productId: initialData.productId || '',
      productName: initialData.productName || '',
      quantity: initialData.quantity || 1,
      price: initialData.price || 0,
      hpp: initialData.hpp || 0
    });
    renderOrderFormItems();
  }

  function setOrderFormItems(items) {
    if (!Array.isArray(items) || !items.length) {
      state.orderFormItems = [{ productId: '', productName: '', quantity: 1, price: 0, hpp: 0 }];
    } else {
      state.orderFormItems = items.map((it) => ({
        productId: it.productId || '',
        productName: it.productName || '',
        quantity: Math.max(1, Number(it.quantity) || 1),
        price: Math.max(0, Number(it.price) || 0),
        hpp: Math.max(0, Number(it.hpp) || 0)
      }));
    }
    renderOrderFormItems();
  }

  function populateOrderCatalogPicker() {
    renderOrderFormItems();
  }

  $('#btn-add-order-item')?.addEventListener('click', () => {
    addOrderFormItem();
  });

  let orderSubmissionPending = false;
  $('#order-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (orderSubmissionPending) return;
    orderSubmissionPending = true;
    const submitBtn = e.currentTarget.querySelector('button[type="submit"]');
    const submitLabel = submitBtn?.textContent;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Menyimpan Pesanan...';
    }
    try {
      const payAcc = $('#ord-pay-account').value;
      const netBill = Number($('#ord-netbill').value) || 0;
      const initialHpp = Number($('#ord-hpp').value) || 0;

      const items = state.orderFormItems.map((it) => {
        const q = Math.max(1, Math.round(Number(it.quantity) || 1));
        const p = Math.max(0, Math.round(Number(it.price) || 0));
        const h = Math.max(0, Math.round(Number(it.hpp) || 0));
        return {
          productId: it.productId || '',
          productName: it.productName || 'Komponen',
          quantity: q,
          price: p,
          hpp: h,
          subtotal: q * p
        };
      });

      const totalQuantity = items.reduce((sum, it) => sum + it.quantity, 0);
      const summaryProductName = items.map((it) => `${it.productName} (${it.quantity}x)`).join(', ') || 'Pesanan Komponen';

      const payload = {
        unit: state.activeUnit,
        date: $('#ord-date').value,
        customer: $('#ord-customer').value,
        items,
        productId: items[0]?.productId || '',
        productName: summaryProductName,
        quantity: totalQuantity,
        netBill,
        initialHpp,
        wageInHpp: state.activeUnit === '3d-print' ? (Number($('#ord-wage').value) || 0) : 0,
        status: $('#ord-status').value,
        deductStock: $('#ord-deduct-stock').checked,
        autoRecordPayment: payAcc !== 'NONE' && netBill > 0,
        paymentAccount: payAcc !== 'NONE' ? payAcc : 'Merchant',
        paidAmount: netBill
      };

      await apiFetch('./api/finance/orders', { method: 'POST', body: payload });
      showToast('✅ Pesanan & transaksi berhasil disimpan!');
      $('#ord-customer').value = '';
      setOrderFormItems([{ productId: '', productName: '', quantity: 1, price: 0, hpp: 0 }]);
      await Promise.all([loadDashboardData(), loadAdminCatalog()]);
    } catch (err) {
      showToast(err.message);
    } finally {
      orderSubmissionPending = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
      }
    }
  });

  // Otomatis sesuaikan Dari Akun & Ke Akun saat jenis transaksi dipilih
  $('#mut-type')?.addEventListener('change', (e) => {
    const t = e.target.value;
    if (t === 'Pembayaran pelanggan') {
      $('#mut-from').value = 'Pelanggan';
      $('#mut-to').value = 'Merchant';
    } else if (t === 'Transfer internal') {
      $('#mut-from').value = 'Merchant';
      $('#mut-to').value = 'Bank usaha';
    } else if (t === 'Pembelian bahan' || t === 'Biaya di luar HPP' || t === 'Biaya tercakup HPP') {
      $('#mut-from').value = 'Bank usaha';
      $('#mut-to').value = 'Pemasok';
    } else if (t === 'Cicilan talangan' || t === 'Bagi laba' || t === 'Bayar upah') {
      $('#mut-from').value = 'Bank usaha';
      $('#mut-to').value = 'Saya';
    } else if (t === 'Talangan masuk' || t === 'Setoran modal') {
      $('#mut-from').value = 'Saya';
      $('#mut-to').value = 'Bank usaha';
    }
  });

  $('#mutation-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const payload = {
        unit: state.activeUnit,
        date: $('#mut-date').value,
        type: $('#mut-type').value,
        fromAccount: $('#mut-from').value,
        toAccount: $('#mut-to').value,
        amount: Number($('#mut-amount').value) || 0,
        orderId: $('#mut-order-id').value.trim(),
        advanceCode: $('#mut-advance-code').value,
        party: $('#mut-to').value === 'Saya' || $('#mut-to').value === 'Partner' ? $('#mut-to').value : '',
        description: $('#mut-desc').value.trim()
      };
      await apiFetch('./api/finance/mutations', { method: 'POST', body: payload });
      showToast('✅ Mutasi kas berhasil dicatat!');
      $('#mut-amount').value = '';
      $('#mut-desc').value = '';
      $('#mut-order-id').value = '';
      await loadDashboardData();
    } catch (err) {
      showToast(err.message);
    }
  });

  $('#wage-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await apiFetch('./api/finance/wages', {
        method: 'POST',
        body: {
          unit: state.activeUnit,
          date: new Date().toISOString().slice(0, 10),
          orderId: $('#wage-order-id').value.trim(),
          worker: $('#wage-worker').value,
          minutes: Number($('#wage-minutes').value) || 0,
          task: $('#wage-task').value.trim()
        }
      });
      showToast('✅ Catatan jam kerja berhasil ditambahkan!');
      $('#wage-task').value = '';
      await loadDashboardData();
    } catch (err) {
      showToast(err.message);
    }
  });

  // Modal Pencairan 1 QRIS Bersama
  $('#open-qris-payout-btn')?.addEventListener('click', () => {
    $('#qris-payout-modal').hidden = false;
  });
  $('#close-qris-modal')?.addEventListener('click', () => {
    $('#qris-payout-modal').hidden = true;
  });

  $('#qris-payout-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await apiFetch('./api/finance/qris-payout', {
        method: 'POST',
        body: {
          date: $('#qp-date').value,
          amount3D: Number($('#qp-amount-3d').value) || 0,
          mdrFee3D: Number($('#qp-mdr-3d').value) || 0,
          amountRobo: Number($('#qp-amount-robo').value) || 0,
          mdrFeeRobo: Number($('#qp-mdr-robo').value) || 0
        }
      });
      $('#qris-payout-modal').hidden = true;
      showToast('✅ Pencairan 1 QRIS Bersama berhasil dibagi ke Bank Usaha 3D Print & Robotika!');
      await loadDashboardData();
    } catch (err) {
      showToast(err.message);
    }
  });

  // =========================================================
  // 5. KALKULATOR HPP (JASA 3D PRINT, CLICKER, & ROBOTIKA)
  // =========================================================
  function switchCalcMode(mode) {
    $$('.calc-mode-btn').forEach((btn) => {
      const isMatch = btn.dataset.calcMode === mode;
      btn.classList.toggle('btn-dark', isMatch);
      btn.classList.toggle('btn-outline', !isMatch);
    });
    $('#calc-box-jasa-3d').hidden = mode !== 'jasa-3d';
    $('#calc-box-clicker').hidden = mode !== 'clicker';
    $('#calc-box-robotika').hidden = mode !== 'robotika';
  }

  $$('.calc-mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchCalcMode(btn.dataset.calcMode));
  });

  function runJasaPrintCalc() {
    if (!window.CetakinFinance) return;
    const settings = state.dashboard?.settings || window.CetakinFinance.DEFAULT_SETTINGS;
    const res = window.CetakinFinance.calculateJasaPrint({
      units: $('#cj-units').value,
      layer: $('#cj-layer').value,
      petgGrams: $('#cj-petg').value,
      supportGrams: $('#cj-support').value,
      printHours: $('#cj-hours').value,
      activeHours: $('#cj-active-hours').value,
      packagingBatch: $('#cj-packaging').value,
      otherCost: $('#cj-other').value,
      discountBatch: $('#cj-discount').value,
      sellingPriceUnit: $('#cj-sell-unit').value
    }, settings);

    state.lastJasaCalc = res;

    $('#cj-res-suggested-unit').textContent = money(res.suggestedPriceUnit);
    $('#cj-res-batch-total').textContent = money(res.netRevenueBatch);
    $('#cj-res-hpp-batch').textContent = money(res.hppBatch);
    $('#cj-res-hpp-unit').textContent = money(res.hppUnit);
    $('#cj-res-breakeven').textContent = money(res.breakEvenUnit);
    $('#cj-res-grams').textContent = res.billableGrams;
    $('#cj-res-base-tariff').textContent = money(res.baseTariffBatch);
    $('#cj-res-profit').textContent = money(res.actualProfitBatch);
    $('#cj-res-margin').textContent = pct(res.actualMargin);

    $('#cj-res-fil').textContent = money(res.filamentCost);
    $('#cj-res-elec').textContent = money(res.electricityCost);
    $('#cj-res-mach').textContent = money(res.machineAndMaintenanceCost);
    $('#cj-res-labor').textContent = money(res.laborCost);
    $('#cj-res-fail').textContent = money(res.failureReserve);

    const statusBadge = $('#cj-res-status');
    statusBadge.textContent = res.tariffStatus;
    statusBadge.className = `badge ${res.tariffStatus === 'Memenuhi target' ? 'badge-success' : 'badge-warn'}`;
  }

  function runClickerCalc() {
    if (!window.CetakinFinance) return;
    const settings = state.dashboard?.settings || window.CetakinFinance.DEFAULT_SETTINGS;
    const res = window.CetakinFinance.calculateClicker({
      buttons: $('#cc-buttons').value,
      units: $('#cc-units').value,
      petgPerUnitGrams: $('#cc-petg').value,
      supportBatchGrams: $('#cc-support').value,
      printHoursBatch: $('#cc-print-hours').value,
      activeHoursBatch: $('#cc-active-hours').value,
      sellingPriceUnit: $('#cc-sell-unit').value
    }, settings);

    state.lastClickerCalc = res;

    $('#cc-res-suggested').textContent = money(res.suggestedPriceUnit);
    $('#cc-res-hpp-unit').textContent = money(res.hppUnit);
    $('#cc-res-hpp-batch').textContent = money(res.hppBatch);
    $('#cc-res-profit').textContent = money(res.profitBatch);
    $('#cc-res-switch').textContent = money(res.switchCostUnit);
    $('#cc-res-cord').textContent = money(res.cordCostUnit);
    $('#cc-res-ring').textContent = money(res.keychainCostUnit);
    $('#cc-res-pack').textContent = money(res.packagingCostUnit);
  }

  function populateRoboPresets() {
    const picker = $('#cr-preset-picker');
    if (!picker || !window.CetakinFinance?.ROBOTIKA_PRESETS) return;
    if (picker.dataset.populated === 'true') return;

    picker.replaceChildren();
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = '-- Mode Kustom / Pilih dari 94 Komponen Ter-Audit --';
    picker.appendChild(defaultOpt);

    for (let i = 0; i < window.CetakinFinance.ROBOTIKA_PRESETS.length; i++) {
      const p = window.CetakinFinance.ROBOTIKA_PRESETS[i];
      const opt = document.createElement('option');
      opt.value = i;
      const unitLabel = p.sellUnitQty > 1 ? ` (${p.sellUnitQty} pcs/paket)` : '';
      const flag = p.statusBiaya === 'BELUM MENUTUP' ? ' ⚠️ [RUGI]' : '';
      opt.textContent = `[${p.sku}] ${p.name}${unitLabel} — Jual: ${money(p.hargaJualUsulan)} | HPP: ${money(p.hppStok)}${flag}`;
      picker.appendChild(opt);
    }
    picker.dataset.populated = 'true';
  }

  function runRoboCalc() {
    if (!window.CetakinFinance) return;
    const settings = state.dashboard?.settings || window.CetakinFinance.DEFAULT_SETTINGS;
    const res = window.CetakinFinance.calculateRobotikaItem({
      units: $('#cr-units').value,
      buyPriceUnit: $('#cr-buy-unit').value,
      shippingAllocationUnit: $('#cr-ship-unit').value,
      packagingUnit: $('#cr-pack-unit').value,
      targetMargin: $('#cr-target-margin').value,
      sellingPriceUnit: $('#cr-sell-unit').value,
      sku: state.activeRoboPreset?.sku || '',
      name: $('#cr-name').value
    }, settings);

    state.lastRoboCalc = res;

    if ($('#cr-res-hpp-unit')) $('#cr-res-hpp-unit').textContent = money(res.baseHppUnit || res.buyPriceUnit);
    if ($('#cr-res-full-cost')) $('#cr-res-full-cost').textContent = money(res.fullCostUnit || res.hppUnit);
    if ($('#cr-res-suggested')) $('#cr-res-suggested').textContent = money(res.suggestedPriceUnit);
    if ($('#cr-res-hpp-batch')) $('#cr-res-hpp-batch').textContent = money(res.hppBatch);
    if ($('#cr-res-gross-profit')) $('#cr-res-gross-profit').textContent = money(res.grossProfitBatch);
    if ($('#cr-res-profit')) $('#cr-res-profit').textContent = money(res.profitBatch);

    const statusEl = $('#cr-res-status');
    if (statusEl) {
      if (res.costStatus === 'BELUM MENUTUP') {
        statusEl.textContent = `⚠️ BELUM MENUTUP (Rugi -${money(Math.abs(res.profitBatch))})`;
        statusEl.style.color = '#ef4444';
      } else {
        statusEl.textContent = `● MENUTUP + SURPLUS (+${money(res.profitBatch)})`;
        statusEl.style.color = '#4ade80';
      }
    }

    const banjar = state.activeRoboPreset?.acuanBanjar || res.competitorBanjar;
    const adawwino = state.activeRoboPreset?.acuanAdawwino || res.competitorAdawwino;
    if ($('#cr-res-banjar')) $('#cr-res-banjar').textContent = banjar ? money(banjar) : '-';
    if ($('#cr-res-adawwino')) $('#cr-res-adawwino').textContent = adawwino ? money(adawwino) : '-';

    const notesEl = $('#cr-res-notes');
    if (notesEl) {
      if (res.costStatus === 'BELUM MENUTUP') {
        notesEl.textContent = '⚠️ Peringatan Audit: Harga jual usulan masih di bawah biaya penuh pengadaan & kemasan. Diusulkan penyesuaian harga.';
        notesEl.style.color = '#f87171';
      } else if (state.activeRoboPreset?.catatan) {
        notesEl.textContent = state.activeRoboPreset.catatan;
        notesEl.style.color = '#94a3b8';
      } else {
        notesEl.textContent = `Margin Bersih: ${(res.actualMargin * 100).toFixed(1)}% setelah pemulihan biaya usaha tetap & kemasan`;
        notesEl.style.color = '#94a3b8';
      }
    }
  }

  function runAllCalculators() {
    populateRoboPresets();
    runJasaPrintCalc();
    runClickerCalc();
    runRoboCalc();
  }

  $$('.jasa-preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.preset;
      if (p === 'dino') {
        $('#cj-name').value = 'Ganci Dino';
        $('#cj-units').value = 1;
        $('#cj-layer').value = '0.20';
        $('#cj-petg').value = 12;
        $('#cj-support').value = 0;
        $('#cj-hours').value = 0.75;
        $('#cj-active-hours').value = 0.1;
        $('#cj-packaging').value = 0;
        $('#cj-other').value = 0;
        $('#cj-discount').value = 0;
        $('#cj-sell-unit').value = 12000;
      } else {
        $('#cj-name').value = 'Contoh: bracket robot';
        $('#cj-units').value = 4;
        $('#cj-layer').value = '0.20';
        $('#cj-petg').value = 180;
        $('#cj-support').value = 20;
        $('#cj-hours').value = 6;
        $('#cj-active-hours').value = 1.5;
        $('#cj-packaging').value = '';
        $('#cj-other').value = 3000;
        $('#cj-discount').value = 0;
        $('#cj-sell-unit').value = '';
      }
      runJasaPrintCalc();
    });
  });

  $('#cc-buttons')?.addEventListener('change', () => {
    const b = Math.min(7, Math.max(1, Math.floor(Number($('#cc-buttons').value) || 5)));
    const preset = window.CetakinFinance?.CLICKER_PRESETS?.[b];
    if (preset) {
      const units = Math.max(1, Math.floor(Number($('#cc-units').value) || 1));
      $('#cc-petg').value = preset.petgPerUnitGrams;
      $('#cc-support').value = preset.supportBatchGrams;
      $('#cc-print-hours').value = +(preset.printHoursBatch * units).toFixed(2);
      $('#cc-active-hours').value = +(preset.activeHoursBatch * units).toFixed(2);
      $('#cc-sell-unit').value = preset.sellingPriceUnit;
    }
    runClickerCalc();
  });

  $('#calc-jasa-form')?.addEventListener('input', runJasaPrintCalc);
  $('#calc-clicker-form')?.addEventListener('input', runClickerCalc);
  $('#calc-robo-form')?.addEventListener('input', runRoboCalc);

  $('#cr-preset-picker')?.addEventListener('change', (e) => {
    const idx = e.target.value;
    if (idx === '' || !window.CetakinFinance?.ROBOTIKA_PRESETS) {
      state.activeRoboPreset = null;
      return;
    }
    const p = window.CetakinFinance.ROBOTIKA_PRESETS[Number(idx)];
    if (!p) return;

    state.activeRoboPreset = p;
    $('#cr-name').value = p.name;
    $('#cr-units').value = p.sellUnitQty || 1;
    $('#cr-buy-unit').value = Math.round(p.hppStok);
    $('#cr-ship-unit').value = Math.round(p.alokasiBiayaUsaha);
    $('#cr-pack-unit').value = Math.round(p.kemasan);
    $('#cr-target-margin').value = 0.20;
    $('#cr-sell-unit').value = p.hargaJualUsulan;

    runRoboCalc();
  });

  // Tombol 1-Klik Salin Hasil Kalkulator ke Form Pesanan
  $('#cj-save-order-btn')?.addEventListener('click', () => {
    if (!state.lastJasaCalc) return;
    state.activeUnit = '3d-print';
    updateUnitButtons();
    const name = `${$('#cj-name').value} (Layer ${state.lastJasaCalc.layer}mm · ${state.lastJasaCalc.billableGrams}g)`;
    const units = state.lastJasaCalc.units || 1;
    const unitPrice = Math.round(state.lastJasaCalc.netRevenueBatch / units);
    const unitHpp = Math.round(state.lastJasaCalc.hppBatch / units);
    setOrderFormItems([{ productId: '', productName: name, quantity: units, price: unitPrice, hpp: unitHpp }]);
    $('#ord-wage').value = state.lastJasaCalc.laborCost;
    switchTab('tab-ledger');
    showToast('Data HPP Jasa Print disalin ke form pesanan!');
  });

  $('#cc-save-order-btn')?.addEventListener('click', () => {
    if (!state.lastClickerCalc) return;
    state.activeUnit = '3d-print';
    updateUnitButtons();
    const name = `Clicker Custom ${state.lastClickerCalc.buttons} Tombol`;
    const units = state.lastClickerCalc.units || 1;
    const unitPrice = Math.round(state.lastClickerCalc.netRevenueBatch / units);
    const unitHpp = Math.round(state.lastClickerCalc.hppBatch / units);
    setOrderFormItems([{ productId: '', productName: name, quantity: units, price: unitPrice, hpp: unitHpp }]);
    $('#ord-wage').value = state.lastClickerCalc.laborBatchCost;
    switchTab('tab-ledger');
    showToast('Data HPP Clicker disalin ke form pesanan!');
  });

  $('#cr-save-order-btn')?.addEventListener('click', () => {
    if (!state.lastRoboCalc) return;
    state.activeUnit = 'robotika';
    updateUnitButtons();
    const name = $('#cr-name').value;
    const units = state.lastRoboCalc.units || 1;
    const unitPrice = Math.round(state.lastRoboCalc.netRevenueBatch / units);
    const unitHpp = Math.round(state.lastRoboCalc.hppBatch / units);
    setOrderFormItems([{ productId: '', productName: name, quantity: units, price: unitPrice, hpp: unitHpp }]);
    switchTab('tab-ledger');
    showToast('Data HPP Robotika disalin ke form pesanan!');
  });

  // =========================================================
  // 6. CRUD KATALOG VISUAL (RAMAH MOBILE & ADMIN NON-IT)
  // =========================================================
  async function loadAdminCatalog() {
    const res = await apiFetch('./api/admin/catalog');
    state.catalog = res.products || [];
    renderAdminCatalog();
    populateOrderCatalogPicker();
  }

  function renderAdminCatalog() {
    const grid = $('#admin-catalog-grid');
    if (!grid) return;

    const q = ($('#cat-search')?.value || '').trim().toLowerCase();
    const typeFilter = $('#cat-type-filter')?.value || '';
    const statusFilter = $('#cat-status-filter')?.value || '';

    const filtered = state.catalog.filter((p) => {
      if (typeFilter && p.type !== typeFilter) return false;
      if (statusFilter === 'active' && !p.active) return false;
      if (statusFilter === 'inactive' && p.active) return false;
      if (q && !`${p.id} ${p.name} ${p.category || ''} ${p.origin || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });

    $('#cat-admin-count').textContent = `Menampilkan ${filtered.length} dari ${state.catalog.length} produk`;
    grid.replaceChildren();

    for (const p of filtered) {
      const card = document.createElement('article');
      card.className = `admin-prod-card ${p.active ? '' : 'inactive'}`;
      const groupName = p.type === 'robotika' ? (p.category || 'Robotika') : (p.origin || 'Ganci');
      const imgSrc = p.image_url || './assets/catalog/placeholder.svg';

      card.innerHTML = `
        <div class="admin-prod-top">
          <img class="admin-prod-img" src="${imgSrc}" alt="${p.name}" loading="lazy" onerror="this.src='./assets/catalog/placeholder.svg'" />
          <div class="admin-prod-meta">
            <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
              <span class="badge ${p.type === 'robotika' ? 'badge-info' : 'badge-warn'}">${p.id}</span>
              <span style="font-size:11px; color:var(--muted); font-weight:700;">${groupName}</span>
            </div>
            <h4 title="${p.name}">${p.name}</h4>
            <span class="badge ${p.active ? 'badge-success' : 'badge-danger'}">
              ${p.active ? '● Tampil di Web' : '○ Disembunyikan'}
            </span>
          </div>
        </div>

        <div class="admin-prod-prices">
          <div>
            <span>Harga Publik</span>
            <strong>${money(p.price)}</strong>
          </div>
          <div>
            <span>HPP Stok</span>
            <strong style="color:#0284c7;">${money(p.cost_price || 0)}</strong>
          </div>
          ${p.cost_full ? `
          <div>
            <span>Biaya Penuh</span>
            <strong style="color:#a855f7;">${money(p.cost_full)}</strong>
          </div>
          ` : ''}
        </div>
        ${p.cost_status === 'BELUM MENUTUP' || (p.cost_full && p.price < p.cost_full) ? `
          <div style="font-size:11px; color:#ef4444; font-weight:700; margin-top:4px;">
            ⚠️ Di bawah Biaya Penuh (Rugi Modal)
          </div>
        ` : ''}

        <div class="admin-prod-controls">
          <div class="admin-prod-controls-row">
            <div class="quick-stock-stepper" title="Ubah stok cepat">
              <button type="button" data-step-id="${p.id}" data-step="-1" aria-label="Kurangi stok">−</button>
              <span>${p.stock} pcs</span>
              <button type="button" data-step-id="${p.id}" data-step="1" aria-label="Tambah stok">+</button>
            </div>
            <button type="button" class="btn btn-outline btn-sm btn-vis-toggle" data-toggle-active="${p.id}" title="${p.active ? 'Sembunyikan dari web' : 'Tampilkan di web'}">
              ${p.active ? 'Sembunyikan' : 'Tampilkan'}
            </button>
          </div>
          <div class="admin-prod-actions-row">
            <button type="button" class="btn btn-dark btn-sm btn-edit-card" data-edit-prod="${p.id}">✏️ Edit</button>
            <button type="button" class="btn btn-danger btn-sm btn-del-card" data-del-prod="${p.id}" title="Hapus Produk">🗑️ Hapus</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    }

    // Event Listener Quick Stock (+/-)
    grid.querySelectorAll('[data-step-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const prod = state.catalog.find((item) => item.id === btn.dataset.stepId);
        if (!prod) return;
        const nextStock = Math.max(0, (Number(prod.stock) || 0) + Number(btn.dataset.step));
        try {
          await apiFetch(`./api/admin/catalog/${encodeURIComponent(prod.id)}`, {
            method: 'PUT',
            body: { stock: nextStock }
          });
          prod.stock = nextStock;
          renderAdminCatalog();
          showToast(`Stok ${prod.name} diperbarui menjadi ${nextStock} pcs`);
        } catch (err) {
          showToast(err.message);
        }
      });
    });

    // Event Listener Toggle Aktif / Sembunyikan
    grid.querySelectorAll('[data-toggle-active]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const prod = state.catalog.find((item) => item.id === btn.dataset.toggleActive);
        if (!prod) return;
        try {
          await apiFetch(`./api/admin/catalog/${encodeURIComponent(prod.id)}`, {
            method: 'PUT',
            body: { active: !prod.active }
          });
          prod.active = !prod.active;
          renderAdminCatalog();
          showToast(`${prod.name} sekarang ${prod.active ? 'ditampilkan di web' : 'disembunyikan'}`);
        } catch (err) {
          showToast(err.message);
        }
      });
    });

    // Event Listener Edit Produk
    grid.querySelectorAll('[data-edit-prod]').forEach((btn) => {
      btn.addEventListener('click', () => openProductModal(btn.dataset.editProd));
    });

    // Event Listener Hapus Produk
    grid.querySelectorAll('[data-del-prod]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const prod = state.catalog.find((item) => item.id === btn.dataset.delProd);
        if (!prod || !confirm(`Yakin ingin menghapus produk "${prod.name}" dari katalog?`)) return;
        try {
          await apiFetch(`./api/admin/catalog/${encodeURIComponent(prod.id)}`, { method: 'DELETE' });
          showToast('Produk dihapus dari katalog.');
          await loadAdminCatalog();
        } catch (err) {
          showToast(err.message);
        }
      });
    });
  }

  $('#cat-search')?.addEventListener('input', renderAdminCatalog);
  $('#cat-type-filter')?.addEventListener('change', renderAdminCatalog);
  $('#cat-status-filter')?.addEventListener('change', renderAdminCatalog);

  function syncProductModalType() {
    const t = $('#pf-type').value;
    $('#pf-category-wrap').hidden = t !== 'robotika';
    $('#pf-origin-wrap').hidden = t !== 'gantungan-kunci';
  }
  $('#pf-type')?.addEventListener('change', syncProductModalType);

  function openProductModal(editId = null) {
    const modal = $('#product-modal');
    modal.hidden = false;
    if (!editId) {
      $('#prod-modal-title').textContent = '➕ Tambah Produk Katalog Baru';
      $('#pf-edit-mode').value = 'create';
      $('#pf-id').disabled = false;
      const defaultType = state.user?.role === 'admin_3d' ? 'gantungan-kunci' : 'robotika';
      $('#pf-type').value = defaultType;
      const nextNum = state.catalog.filter((p) => p.type === defaultType).length + 1;
      $('#pf-id').value = `${defaultType === 'robotika' ? '01' : '02'}-${String(nextNum).padStart(3, '0')}`;
      $('#pf-name').value = '';
      $('#pf-category').value = 'Sensor';
      $('#pf-origin').value = 'Desain Cetakin';
      $('#pf-price').value = '';
      $('#pf-cost').value = '';
      if ($('#pf-cost-full')) $('#pf-cost-full').value = '';
      $('#pf-stock').value = 5;
      $('#pf-weight').value = '';
      $('#pf-material').value = defaultType === 'gantungan-kunci' ? 'PETG' : '';
      $('#pf-dimensions').value = '';
      $('#pf-image-url').value = '';
      $('#pf-desc').value = '';
      $('#pf-active').checked = true;
      $('#pf-featured').checked = false;
    } else {
      const prod = state.catalog.find((p) => p.id === editId);
      if (!prod) return;
      $('#prod-modal-title').textContent = `✏️ Edit Produk: ${prod.name}`;
      $('#pf-edit-mode').value = prod.id;
      $('#pf-id').value = prod.id;
      $('#pf-id').disabled = true;
      $('#pf-type').value = prod.type;
      $('#pf-name').value = prod.name;
      $('#pf-category').value = prod.category || '';
      $('#pf-origin').value = prod.origin || '';
      $('#pf-price').value = prod.price;
      $('#pf-cost').value = prod.cost_price || 0;
      if ($('#pf-cost-full')) $('#pf-cost-full').value = prod.cost_full || '';
      $('#pf-stock').value = prod.stock;
      $('#pf-weight').value = prod.weight_grams || '';
      $('#pf-material').value = prod.material || '';
      $('#pf-dimensions').value = prod.dimensions || '';
      $('#pf-image-url').value = prod.image_url || '';
      $('#pf-desc').value = prod.description || '';
      $('#pf-active').checked = Boolean(prod.active);
      $('#pf-featured').checked = Boolean(prod.featured);
    }
    syncProductModalType();
  }

  $('#add-product-btn')?.addEventListener('click', () => openProductModal(null));
  $('#close-prod-modal')?.addEventListener('click', () => { $('#product-modal').hidden = true; });
  $('#cancel-prod-modal')?.addEventListener('click', () => { $('#product-modal').hidden = true; });

  // Kompresi otomatis gambar saat Admin mengunggah foto dari kamera/galeri HP
  $('#pf-image-file')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_W = 720;
        const scale = img.width > MAX_W ? MAX_W / img.width : 1;
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/webp', 0.82);
        $('#pf-image-url').value = dataUrl;
        showToast('📸 Foto berhasil dikompres & siap disimpan!');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  $('#product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const mode = $('#pf-edit-mode').value;
    const payload = {
      id: $('#pf-id').value.trim(),
      type: $('#pf-type').value,
      name: $('#pf-name').value.trim(),
      category: $('#pf-category').value.trim(),
      origin: $('#pf-origin').value.trim(),
      price: Number($('#pf-price').value) || 0,
      cost_price: Number($('#pf-cost').value) || 0,
      cost_full: Number($('#pf-cost-full')?.value) || 0,
      stock: Number($('#pf-stock').value) || 0,
      weight_grams: $('#pf-weight').value.trim(),
      material: $('#pf-material').value.trim(),
      dimensions: $('#pf-dimensions').value.trim(),
      image_url: $('#pf-image-url').value.trim(),
      description: $('#pf-desc').value.trim(),
      active: $('#pf-active').checked,
      featured: $('#pf-featured').checked
    };

    try {
      if (mode === 'create') {
        await apiFetch('./api/admin/catalog', { method: 'POST', body: payload });
        showToast('✅ Produk baru berhasil ditambahkan ke katalog!');
      } else {
        await apiFetch(`./api/admin/catalog/${encodeURIComponent(mode)}`, { method: 'PUT', body: payload });
        showToast('✅ Perubahan produk berhasil disimpan!');
      }
      $('#product-modal').hidden = true;
      await loadAdminCatalog();
    } catch (err) {
      showToast(err.message);
    }
  });

  // =========================================================
  // 7. PENGATURAN PARAMETER USAHA & PASSWORD
  // =========================================================
  function populateSettingsForm(s) {
    if (!s || !$('#set-petg')) return;
    $('#set-petg').value = s.petgPerKg ?? 150000;
    $('#set-elec').value = s.electricityPerKwh ?? 1600;
    $('#set-power').value = s.printerPowerWatts ?? 250;
    $('#set-labor').value = s.laborRatePerHour ?? 15000;
    $('#set-switch').value = s.blueSwitchPerPcs ?? 1500;
    $('#set-ring').value = s.keychainRingPerPcs ?? 1500;
    $('#set-pack').value = s.packagingPerUnit ?? 2000;
    $('#set-minorder').value = s.jasaMinOrder ?? 15000;
    $('#set-reserve-3d').value = s.minCashReserve3D ?? 200000;
    $('#set-reserve-robo').value = s.minCashReserveRobo ?? 200000;
  }

  $('#settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const body = {
        petgPerKg: Number($('#set-petg').value) || 150000,
        electricityPerKwh: Number($('#set-elec').value) || 1600,
        printerPowerWatts: Number($('#set-power').value) || 250,
        laborRatePerHour: Number($('#set-labor').value) || 15000,
        blueSwitchPerPcs: Number($('#set-switch').value) || 1500,
        keychainRingPerPcs: Number($('#set-ring').value) || 1500,
        packagingPerUnit: Number($('#set-pack').value) || 2000,
        jasaMinOrder: Number($('#set-minorder').value) || 15000,
        minCashReserve3D: Number($('#set-reserve-3d').value) || 0,
        minCashReserveRobo: Number($('#set-reserve-robo').value) || 0
      };
      await apiFetch('./api/finance/settings', { method: 'PUT', body });
      showToast('✅ Parameter usaha berhasil diperbarui!');
      await loadDashboardData();
      runAllCalculators();
    } catch (err) {
      showToast(err.message);
    }
  });

  $('#password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('./api/auth/password', {
        method: 'POST',
        body: {
          targetUsername: $('#pass-target').value,
          oldPassword: $('#pass-old').value,
          newPassword: $('#pass-new').value
        }
      });
      $('#pass-old').value = '';
      $('#pass-new').value = '';
      showToast(res.message || 'Password berhasil diperbarui!');
    } catch (err) {
      showToast(err.message);
    }
  });

  // =========================================================
  // 8. GENERATOR NOTA PEMBELI (LIVE PREVIEW, PDF & PNG HD)
  // =========================================================
  const INDO_MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  function formatIndoDate(dateStr) {
    if (!dateStr) return '-';
    const parts = String(dateStr).slice(0, 10).split('-');
    if (parts.length !== 3) return dateStr;
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (!m || !d) return dateStr;
    return `${d} ${INDO_MONTHS[m - 1] || parts[1]} ${y}`;
  }

  function terbilangKata(n) {
    const num = Math.floor(Math.abs(Number(n) || 0));
    const angka = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    if (num < 12) return angka[num];
    if (num < 20) return `${terbilangKata(num - 10)} Belas`;
    if (num < 100) return `${terbilangKata(Math.floor(num / 10))} Puluh ${terbilangKata(num % 10)}`.trim();
    if (num < 200) return `Seratus ${terbilangKata(num - 100)}`.trim();
    if (num < 1000) return `${terbilangKata(Math.floor(num / 100))} Ratus ${terbilangKata(num % 100)}`.trim();
    if (num < 2000) return `Seribu ${terbilangKata(num - 1000)}`.trim();
    if (num < 1000000) return `${terbilangKata(Math.floor(num / 1000))} Ribu ${terbilangKata(num % 1000)}`.trim();
    if (num < 1000000000) return `${terbilangKata(Math.floor(num / 1000000))} Juta ${terbilangKata(num % 1000000)}`.trim();
    return `${terbilangKata(Math.floor(num / 1000000000))} Miliar ${terbilangKata(num % 1000000000)}`.trim();
  }

  function terbilangRupiah(n) {
    const val = Math.max(0, Math.round(Number(n) || 0));
    if (val === 0) return 'Nol Rupiah';
    return `${terbilangKata(val).replace(/\s+/g, ' ').trim()} Rupiah`;
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  let cachedLogoImg = null;
  function loadLogoImage() {
    if (cachedLogoImg) return Promise.resolve(cachedLogoImg);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        cachedLogoImg = img;
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = './assets/logo.png';
    });
  }

  function findOrderById(orderId) {
    const units = state.dashboard?.units || {};
    for (const uKey of Object.keys(units)) {
      const found = (units[uKey]?.orders || []).find((o) => o.id === orderId);
      if (found) return { order: found, unitData: units[uKey] };
    }
    return null;
  }

  function openInvoiceModal(orderId) {
    const match = findOrderById(orderId);
    if (!match) {
      showToast('Data pesanan tidak ditemukan.');
      return;
    }
    const { order, unitData } = match;
    state.activeInvoiceOrder = order;

    // Deteksi metode pembayaran dari mutasi terkait
    const relatedMut = (unitData.mutations || []).find(
      (m) => m.orderId === order.id && m.type === 'Pembayaran pelanggan'
    );
    let defaultMethod = 'QRIS Cetakin';
    if (relatedMut) {
      if (relatedMut.toAccount === 'Bank usaha') defaultMethod = 'Transfer Bank';
      else if (relatedMut.toAccount === 'Kas tunai') defaultMethod = 'Tunai (Cash)';
      else defaultMethod = 'QRIS Cetakin';
    }

    // Jika status pesanan sudah Selesai namun mutasi belum dicatat terpisah, default tampil Lunas agar nota pembeli rapi
    const defaultPaid = order.netPaid > 0
      ? order.netPaid
      : (order.status === 'Selesai' ? order.netBill : 0);

    const isRobo = order.unit === 'robotika';
    const prodMatch = (state.catalog || []).find(
      (p) => p.id === order.productId || p.name.toLowerCase() === order.productName.toLowerCase()
    );

    const defaultSpec = isRobo
      ? (prodMatch?.category ? `Kategori: ${prodMatch.category} · Kode: ${prodMatch.sku || prodMatch.id} · Lolos QC` : 'Komponen Elektronika & Robotika · Tested & QC Passed')
      : (prodMatch?.material ? `Material Cetak: ${prodMatch.material} · Presisi Tinggi` : 'Cetak 3D Presisi · Material PETG/PLA Berkualitas');

    const defaultNote = isRobo
      ? 'Terima kasih telah berbelanja komponen di Cetakin! Barang telah melalui pengecekan fisik. Panduan rangkaian pinout & contoh kode program tersedia gratis di website Cetakin (menu Panduan).'
      : 'Terima kasih telah mempercayakan pembuatan produk kustom & 3D print di Cetakin! Simpan produk di tempat teduh dan hindari suhu ekstrem (>70°C) agar presisi tetap terjaga.';

    $('#inv-customer').value = order.customer || 'Pelanggan';
    $('#inv-pay-method').value = defaultMethod;
    $('#inv-paid-amount').value = defaultPaid;
    $('#inv-discount').value = 0;
    $('#inv-shipping').value = 0;
    $('#inv-spec').value = (order.items && order.items.length > 1) ? '' : defaultSpec;
    $('#inv-note').value = defaultNote;

    $('#invoice-edit-panel').hidden = true;
    $('#invoice-modal').hidden = false;
    renderInvoicePreview();
  }

  function getInvoiceViewModel() {
    const order = state.activeInvoiceOrder;
    if (!order) return null;

    const isRobo = order.unit === 'robotika';
    const customer = ($('#inv-customer')?.value || order.customer || 'Pelanggan').trim();
    const payMethod = $('#inv-pay-method')?.value || 'QRIS Cetakin';
    const discount = Math.max(0, Math.round(Number($('#inv-discount')?.value) || 0));
    const shipping = Math.max(0, Math.round(Number($('#inv-shipping')?.value) || 0));
    const paidAmount = Math.max(0, Math.round(Number($('#inv-paid-amount')?.value) || 0));
    const customSpec = ($('#inv-spec')?.value || '').trim();
    const buyerNote = ($('#inv-note')?.value || '').trim();

    let items = [];
    if (Array.isArray(order.items) && order.items.length > 0) {
      items = order.items.map((it) => {
        const prodMatch = (state.catalog || []).find(
          (p) => p.id === it.productId || (it.productName && p.name.toLowerCase() === it.productName.toLowerCase())
        );
        let itemSpec = it.spec || '';
        if (!itemSpec && prodMatch) {
          itemSpec = isRobo
            ? (prodMatch.category ? `Kategori: ${prodMatch.category} · Kode: ${prodMatch.sku || prodMatch.id}` : '')
            : (prodMatch.material ? `Material: ${prodMatch.material}` : '');
        }
        if (customSpec && order.items.length === 1) {
          itemSpec = customSpec;
        }
        const q = Math.max(1, Number(it.quantity) || 1);
        const p = Math.max(0, Math.round(Number(it.price) || 0));
        const sub = Math.max(0, Math.round(Number(it.subtotal) || (q * p)));
        return {
          name: it.productName || 'Komponen',
          spec: itemSpec,
          qty: q,
          unitPrice: p,
          subtotal: sub
        };
      });
    } else {
      const q = Math.max(1, Number(order.quantity) || 1);
      const netBillBase = Math.max(0, Number(order.netBill) || 0);
      const p = Math.round(netBillBase / q);
      items = [{
        name: order.productName || 'Pesanan',
        spec: customSpec,
        qty: q,
        unitPrice: p,
        subtotal: netBillBase
      }];
    }

    const itemsSubtotalSum = items.reduce((sum, it) => sum + it.subtotal, 0);
    const netBillBase = Math.max(0, Number(order.netBill) || 0);
    const itemSubtotal = itemsSubtotalSum > 0 ? itemsSubtotalSum : (netBillBase + discount);
    const grandTotal = Math.max(0, itemSubtotal - discount + shipping);
    const remaining = Math.max(0, grandTotal - paidAmount);

    let payStatus = 'LUNAS';
    let payBadgeClass = 'paid';
    let payStampText = '✓ LUNAS (PAID)';
    if (order.status === 'Batal') {
      payStatus = 'BATAL';
      payBadgeClass = 'unpaid';
      payStampText = '✖ PESANAN DIBATALKAN';
    } else if (paidAmount >= grandTotal && grandTotal > 0) {
      payStatus = 'LUNAS';
      payBadgeClass = 'paid';
      payStampText = '✓ LUNAS (PAID)';
    } else if (paidAmount > 0 && paidAmount < grandTotal) {
      payStatus = 'DP / SEBAGIAN';
      payBadgeClass = 'partial';
      payStampText = '⏳ DP / BELUM LUNAS';
    } else {
      payStatus = 'BELUM DIBAYAR';
      payBadgeClass = 'unpaid';
      payStampText = '❗ BELUM DIBAYAR';
    }

    const invoiceNo = `INV/${(order.date || '2026-10').slice(0, 7).replace('-', '/')}/${order.id}`;

    return {
      order,
      isRobo,
      unit: order.unit,
      invoiceNo,
      orderDateFormatted: formatIndoDate(order.date),
      completedDateFormatted: order.completedDate ? formatIndoDate(order.completedDate) : (order.status === 'Selesai' ? formatIndoDate(order.date) : 'Sedang Diproses'),
      customer,
      productName: order.productName,
      items,
      spec: customSpec,
      qty: items.reduce((s, it) => s + it.qty, 0),
      unitPrice: items.length === 1 ? items[0].unitPrice : Math.round(itemSubtotal / (items.reduce((s, it) => s + it.qty, 0) || 1)),
      itemSubtotal,
      discount,
      shipping,
      grandTotal,
      paidAmount,
      remaining,
      payMethod,
      payStatus,
      payBadgeClass,
      payStampText,
      terbilang: `# ${terbilangRupiah(grandTotal)} #`,
      buyerNote
    };
  }

  function renderInvoicePreview() {
    const vm = getInvoiceViewModel();
    const paper = $('#invoice-paper');
    if (!vm || !paper) return;

    paper.dataset.unit = vm.unit;
    const divisionLabel = vm.isRobo
      ? '🤖 DIVISI KOMPONEN ELEKTRONIKA & ROBOTIKA'
      : '🖨️ DIVISI CETAK 3D & MERCHANDISE KUSTOM';
    const serviceCategoryName = vm.isRobo
      ? 'Penjualan Komponen Robotika & Sensor'
      : 'Jasa 3D Printing & Gantungan Kunci Kustom';

    paper.innerHTML = `
      <div class="inv-top-ribbon"></div>
      <div class="inv-body">
        <div class="inv-header">
          <div class="inv-brand-col">
            <div class="inv-brand-row">
              <img class="inv-logo" src="./assets/logo.png" alt="Cetakin" />
              <span class="inv-unit-pill">${divisionLabel}</span>
            </div>
            <p class="inv-studio-name">Cetakin</p>
            <p class="inv-studio-addr">
              Jl. Dahlina Raya III, Guntung Paikat, Kec. Banjarbaru Selatan<br />
              Kota Banjarbaru, Kalimantan Selatan 70714 · WA: 0858-2280-1431
            </p>
          </div>

          <div class="inv-doc-col">
            <h2 class="inv-doc-title">NOTA PEMBELIAN</h2>
            <div class="inv-doc-sub">OFFICIAL INVOICE &amp; RECEIPT</div>
            <div class="inv-doc-number">${escapeHtml(vm.invoiceNo)}</div>
            <div>
              <span class="inv-status-stamp ${vm.payBadgeClass}">${escapeHtml(vm.payStampText)}</span>
            </div>
          </div>
        </div>

        <div class="inv-meta-grid">
          <div class="inv-meta-card">
            <div class="inv-meta-label">Diterbitkan Untuk Pembeli</div>
            <h4 class="inv-customer-name">${escapeHtml(vm.customer)}</h4>
            <div class="inv-meta-rows">
              <div class="inv-meta-row">
                <span>Layanan Divisi</span>
                <strong>${escapeHtml(serviceCategoryName)}</strong>
              </div>
              <div class="inv-meta-row">
                <span>Status Pesanan</span>
                <strong>${escapeHtml(vm.order.status === 'Selesai' ? '✓ Selesai & Siap Diserahkan' : vm.order.status)}</strong>
              </div>
            </div>
          </div>

          <div class="inv-meta-card">
            <div class="inv-meta-label">Rincian Transaksi</div>
            <div class="inv-meta-rows" style="margin-top:4px;">
              <div class="inv-meta-row">
                <span>ID Pesanan</span>
                <strong>#${escapeHtml(vm.order.id)}</strong>
              </div>
              <div class="inv-meta-row">
                <span>Tanggal Pesanan</span>
                <strong>${escapeHtml(vm.orderDateFormatted)}</strong>
              </div>
              <div class="inv-meta-row">
                <span>Tanggal Selesai</span>
                <strong>${escapeHtml(vm.completedDateFormatted)}</strong>
              </div>
              <div class="inv-meta-row">
                <span>Metode Pembayaran</span>
                <strong>${escapeHtml(vm.payMethod)}</strong>
              </div>
            </div>
          </div>
        </div>

        <table class="inv-items-table">
          <thead>
            <tr>
              <th style="width:46px; text-align:center;">No</th>
              <th>Deskripsi Produk / Layanan</th>
              <th style="width:90px; text-align:center;">Jumlah</th>
              <th style="width:140px; text-align:right;">Harga Satuan</th>
              <th style="width:150px; text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${vm.items.map((it, idx) => `
              <tr>
                <td style="text-align:center; font-weight:700; color:#64748b;">${idx + 1}</td>
                <td>
                  <div class="inv-item-title">${escapeHtml(it.name)}</div>
                  ${it.spec ? `<div class="inv-item-spec">${escapeHtml(it.spec)}</div>` : ''}
                </td>
                <td style="text-align:center; font-weight:700;">${it.qty} pcs</td>
                <td style="text-align:right;">${money(it.unitPrice)}</td>
                <td style="text-align:right; font-weight:800; color:#0f172a;">${money(it.subtotal)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="inv-bottom-grid">
          <div>
            <div class="inv-terbilang-box">
              <span>Terbilang Dalam Rupiah</span>
              <strong>${escapeHtml(vm.terbilang)}</strong>
            </div>
            <div class="inv-notes-box">
              <strong>📌 Catatan &amp; Informasi Pembeli</strong>
              <div>${escapeHtml(vm.buyerNote)}</div>
            </div>
          </div>

          <div class="inv-summary-box">
            <div class="inv-sum-row">
              <span>Subtotal Pesanan</span>
              <strong>${money(vm.itemSubtotal)}</strong>
            </div>
            ${vm.discount > 0 ? `
              <div class="inv-sum-row" style="color:#16a34a;">
                <span>Potongan / Diskon</span>
                <strong>- ${money(vm.discount)}</strong>
              </div>
            ` : ''}
            ${vm.shipping > 0 ? `
              <div class="inv-sum-row">
                <span>Biaya Pengiriman / Tambahan</span>
                <strong>+ ${money(vm.shipping)}</strong>
              </div>
            ` : ''}
            <div class="inv-sum-row total">
              <span>TOTAL TAGIHAN</span>
              <strong>${money(vm.grandTotal)}</strong>
            </div>
            <div class="inv-sum-row" style="margin-top:6px;">
              <span>Telah Dibayar (${escapeHtml(vm.payMethod)})</span>
              <strong style="color:#15803d;">${money(vm.paidAmount)}</strong>
            </div>
            <div class="inv-sum-row" style="border-top:1px dashed #cbd5e1; margin-top:4px; padding-top:8px;">
              <span style="font-weight:700; color:#0f172a;">Sisa Tagihan</span>
              <strong style="color:${vm.remaining > 0 ? '#dc2626' : '#15803d'}; font-size:14px;">
                ${vm.remaining > 0 ? money(vm.remaining) : 'Rp 0 (LUNAS)'}
              </strong>
            </div>
          </div>
        </div>

        <div class="inv-footer">
          <div class="inv-footer-left">
            <strong style="color:#0f172a;">Terima kasih atas kepercayaan Anda berbelanja di Cetakin!</strong><br />
            Simpan nota ini sebagai bukti transaksi resmi. Untuk konsultasi cetak 3D lanjutan atau bantuan teknis komponen,<br />
            hubungi WhatsApp kami di <strong>0858-2280-1431</strong>.
          </div>
          <div class="inv-footer-sign">
            <div style="font-size:11px; color:#64748b; margin-bottom:4px;">Banjarbaru, ${escapeHtml(vm.completedDateFormatted !== 'Sedang Diproses' ? vm.completedDateFormatted : vm.orderDateFormatted)}</div>
            <div class="inv-stamp-seal">
              <img class="inv-stamp-logo" src="./assets/logo.png" alt="Cetakin" />
              <span class="inv-stamp-sub">★ TERVERIFIKASI RESMI ★</span>
            </div>
            <div style="font-size:12px; font-weight:800; color:#0f172a; margin-top:4px;">Tim Admin Cetakin</div>
          </div>
        </div>
      </div>
    `;
  }

  // Helper Canvas: Menggambar kotak bersudut membulat
  function drawRoundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  // Helper Canvas: Membungkus teks multiline
  function wrapCanvasText(ctx, text, maxWidth) {
    const words = String(text || '').split(/\s+/);
    const lines = [];
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [''];
  }

  // Merender Nota ke Canvas HD (1600px lebar) untuk ekspor PDF & PNG tajam
  async function renderInvoiceToCanvas(vm) {
    const logoImg = await loadLogoImage();
    const W = 1600;
    const padX = 80;
    const tableW = W - padX * 2;
    const thH = 66;

    // Canvas sementara untuk mengukur teks & kalkulasi tinggi dinamis
    const measureCanvas = document.createElement('canvas');
    const mCtx = measureCanvas.getContext('2d');

    const preparedItems = vm.items.map((it) => {
      mCtx.font = '800 26px Outfit, sans-serif';
      const titleLines = wrapCanvasText(mCtx, it.name, 680);
      mCtx.font = '500 20px "DM Sans", sans-serif';
      const specLines = it.spec ? wrapCanvasText(mCtx, it.spec, 680) : [];
      const textBlockH = titleLines.length * 32 + (specLines.length ? specLines.length * 26 + 6 : 0);
      const rowH = Math.max(76, textBlockH + 34);
      return { it, titleLines, specLines, rowH };
    });

    const totalRowsH = preparedItems.reduce((sum, p) => sum + p.rowH, 0);

    mCtx.font = '700 23px "DM Sans", sans-serif';
    const leftColW = 790;
    const terbLines = wrapCanvasText(mCtx, vm.terbilang, leftColW - 60);
    const terbBoxH = 66 + terbLines.length * 32;

    mCtx.font = '500 21px "DM Sans", sans-serif';
    const noteLines = wrapCanvasText(mCtx, vm.buyerNote, leftColW - 64);
    const noteBoxH = 74 + noteLines.length * 31;

    const leftColH = terbBoxH + 26 + noteBoxH;
    const sumBoxH = 340 + (vm.discount > 0 ? 42 : 0) + (vm.shipping > 0 ? 42 : 0);
    const bottomH = Math.max(leftColH, sumBoxH);

    const neededH = 550 + thH + totalRowsH + 42 + bottomH + 280;
    const H = Math.max(1920, Math.ceil(neededH));

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const accentMain = vm.isRobo ? '#0284c7' : '#ea580c';
    const accentDark = vm.isRobo ? '#0c4a6e' : '#0f172a';
    const accentSoftBg = vm.isRobo ? '#f0f9ff' : '#fff7ed';
    const accentSoftBorder = vm.isRobo ? '#bae6fd' : '#fed7aa';
    const accentText = vm.isRobo ? '#0369a1' : '#c2410c';

    // 1. Background Putih Bersih
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // 2. Top Ribbon Gradient
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    if (vm.isRobo) {
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.55, '#2563eb');
      grad.addColorStop(1, '#0ea5e9');
    } else {
      grad.addColorStop(0, '#ff6b2b');
      grad.addColorStop(0.55, '#ea580c');
      grad.addColorStop(1, '#f59e0b');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 18);

    let curY = 74;

    // 3. Header Kiri: Logo + Pill Divisi + Alamat
    let pillX = padX;
    if (logoImg && logoImg.naturalWidth > 0) {
      const logoH = 76;
      const logoW = (logoImg.naturalWidth / logoImg.naturalHeight) * logoH;
      ctx.drawImage(logoImg, padX, curY - 6, logoW, logoH);
      pillX = padX + logoW + 24;
    } else {
      ctx.font = '800 44px Outfit, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText('CETAKIN.', padX, curY + 46);
      pillX = padX + 230;
    }

    // Division Pill
    const divText = vm.isRobo
      ? 'DIVISI KOMPONEN ELEKTRONIKA & ROBOTIKA'
      : 'DIVISI CETAK 3D & MERCHANDISE KUSTOM';
    ctx.font = '800 18px Outfit, sans-serif';
    const pillW = ctx.measureText(divText).width + 36;
    drawRoundRect(ctx, pillX, curY + 12, pillW, 42, 21);
    ctx.fillStyle = accentSoftBg;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = accentSoftBorder;
    ctx.stroke();
    ctx.fillStyle = accentText;
    ctx.fillText(divText, pillX + 18, curY + 39);

    // Address Header
    ctx.font = '800 28px Outfit, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('Cetakin', padX, curY + 114);

    ctx.font = '500 22px "DM Sans", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Jl. Dahlina Raya III, Guntung Paikat, Kec. Banjarbaru Selatan', padX, curY + 148);
    ctx.fillText('Kota Banjarbaru, Kalimantan Selatan 70714 · WA: 0858-2280-1431', padX, curY + 180);

    // 4. Header Kanan: NOTA PEMBELIAN + No Nota + Status Stamp
    ctx.textAlign = 'right';
    ctx.font = '800 48px Outfit, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('NOTA PEMBELIAN', W - padX, curY + 42);

    ctx.font = '700 19px Outfit, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('OFFICIAL INVOICE & RECEIPT', W - padX, curY + 74);

    // Nomor Nota Box
    ctx.font = '700 25px Outfit, monospace';
    const invNoW = ctx.measureText(vm.invoiceNo).width + 44;
    drawRoundRect(ctx, W - padX - invNoW, curY + 92, invNoW, 48, 12);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.fillText(vm.invoiceNo, W - padX - 22, curY + 125);

    // Status Stamp Badge
    ctx.font = '800 22px Outfit, sans-serif';
    const stampW = ctx.measureText(vm.payStampText).width + 48;
    drawRoundRect(ctx, W - padX - stampW, curY + 154, stampW, 46, 23);
    if (vm.payBadgeClass === 'paid') {
      ctx.fillStyle = '#dcfce7';
      ctx.strokeStyle = '#86efac';
    } else if (vm.payBadgeClass === 'partial') {
      ctx.fillStyle = '#fef3c7';
      ctx.strokeStyle = '#fcd34d';
    } else {
      ctx.fillStyle = '#fee2e2';
      ctx.strokeStyle = '#fca5a5';
    }
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = vm.payBadgeClass === 'paid' ? '#15803d' : vm.payBadgeClass === 'partial' ? '#b45309' : '#b91c1c';
    ctx.fillText(vm.payStampText, W - padX - 24, curY + 185);
    ctx.textAlign = 'left';

    // Divider Line
    curY += 235;
    ctx.beginPath();
    ctx.moveTo(padX, curY);
    ctx.lineTo(W - padX, curY);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#f1f5f9';
    ctx.stroke();

    // 5. Dua Kartu Informasi Pembeli & Rincian Transaksi
    curY += 36;
    const cardGap = 32;
    const cardW = (W - padX * 2 - cardGap) / 2;
    const cardH = 230;

    // Card Kiri: Pembeli
    drawRoundRect(ctx, padX, curY, cardW, cardH, 22);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    ctx.font = '800 19px Outfit, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('DITERBITKAN UNTUK PEMBELI', padX + 32, curY + 42);

    ctx.font = '800 35px Outfit, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(vm.customer, padX + 32, curY + 92);

    const serviceCat = vm.isRobo ? 'Komponen Robotika & Sensor' : 'Jasa Cetak 3D & Merchandise';
    ctx.font = '500 22px "DM Sans", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Layanan Divisi', padX + 32, curY + 144);
    ctx.fillText('Status Pesanan', padX + 32, curY + 188);

    ctx.textAlign = 'right';
    ctx.font = '700 22px "DM Sans", sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(serviceCat, padX + cardW - 32, curY + 144);
    ctx.fillStyle = vm.order.status === 'Selesai' ? '#15803d' : '#d97706';
    ctx.fillText(vm.order.status === 'Selesai' ? '✓ Selesai & Siap Diserahkan' : vm.order.status, padX + cardW - 32, curY + 188);
    ctx.textAlign = 'left';

    // Card Kanan: Rincian Transaksi
    const rightCardX = padX + cardW + cardGap;
    drawRoundRect(ctx, rightCardX, curY, cardW, cardH, 22);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    ctx.font = '800 19px Outfit, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('RINCIAN TRANSAKSI', rightCardX + 32, curY + 42);

    const metaRows = [
      ['ID Pesanan', `#${vm.order.id}`],
      ['Tanggal Pesanan', vm.orderDateFormatted],
      ['Tanggal Selesai', vm.completedDateFormatted],
      ['Metode Pembayaran', vm.payMethod]
    ];
    let metaY = curY + 84;
    for (const [label, val] of metaRows) {
      ctx.font = '500 21px "DM Sans", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(label, rightCardX + 32, metaY);

      ctx.textAlign = 'right';
      ctx.font = '700 21px "DM Sans", sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(val, rightCardX + cardW - 32, metaY);
      ctx.textAlign = 'left';
      metaY += 36;
    }

    // 6. Tabel Daftar Item Pesanan
    curY += cardH + 40;

    // Table Outer Box
    drawRoundRect(ctx, padX, curY, tableW, thH + totalRowsH, 22);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    // Table Header
    ctx.save();
    drawRoundRect(ctx, padX, curY, tableW, thH + 20, 22);
    ctx.clip();
    ctx.fillStyle = accentDark;
    ctx.fillRect(padX, curY, tableW, thH);
    ctx.restore();

    ctx.font = '700 20px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('NO', padX + 32, curY + 41);
    ctx.fillText('DESKRIPSI PRODUK / LAYANAN', padX + 110, curY + 41);
    ctx.textAlign = 'center';
    ctx.fillText('JUMLAH', padX + 910, curY + 41);
    ctx.textAlign = 'right';
    ctx.fillText('HARGA SATUAN', padX + 1160, curY + 41);
    ctx.fillText('SUBTOTAL', W - padX - 36, curY + 41);
    ctx.textAlign = 'left';

    // Table Row Content Multi-Item
    let rowTopY = curY + thH;
    preparedItems.forEach((pi, idx) => {
      if (idx > 0) {
        ctx.beginPath();
        ctx.moveTo(padX, rowTopY);
        ctx.lineTo(padX + tableW, rowTopY);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#f1f5f9';
        ctx.stroke();
      }

      const itemTextY = rowTopY + 38;

      ctx.font = '700 24px "DM Sans", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(String(idx + 1), padX + 38, itemTextY);

      ctx.font = '800 26px Outfit, sans-serif';
      ctx.fillStyle = '#0f172a';
      let textY = itemTextY;
      for (const tl of pi.titleLines) {
        ctx.fillText(tl, padX + 110, textY);
        textY += 32;
      }

      ctx.font = '500 20px "DM Sans", sans-serif';
      ctx.fillStyle = '#64748b';
      for (const sl of pi.specLines) {
        ctx.fillText(sl, padX + 110, textY);
        textY += 28;
      }

      ctx.textAlign = 'center';
      ctx.font = '700 25px "DM Sans", sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(`${pi.it.qty} pcs`, padX + 910, itemTextY);

      ctx.textAlign = 'right';
      ctx.font = '600 25px "DM Sans", sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(money(pi.it.unitPrice), padX + 1160, itemTextY);

      ctx.font = '800 27px Outfit, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(money(pi.it.subtotal), W - padX - 36, itemTextY);
      ctx.textAlign = 'left';

      rowTopY += pi.rowH;
    });

    // 7. Bagian Bawah: Kiri (Terbilang & Catatan) | Kanan (Ringkasan Tagihan)
    curY += thH + totalRowsH + 42;
    const rightColW = tableW - leftColW - 44;
    const rightColX = padX + leftColW + 44;

    // Terbilang Box
    ctx.font = '700 23px "DM Sans", sans-serif';
    // Reuse the measurements above so canvas height and drawing stay consistent.

    drawRoundRect(ctx, padX, curY, leftColW, terbBoxH, 16);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.fillStyle = accentMain;
    ctx.fillRect(padX, curY, 10, terbBoxH);

    ctx.font = '800 18px Outfit, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('TERBILANG DALAM RUPIAH', padX + 32, curY + 36);

    ctx.font = 'italic 700 23px "DM Sans", sans-serif';
    ctx.fillStyle = '#0f172a';
    let ty = curY + 70;
    for (const line of terbLines) {
      ctx.fillText(line, padX + 32, ty);
      ty += 31;
    }

    // Notes Box
    const noteBoxY = curY + terbBoxH + 26;
    ctx.font = '500 21px "DM Sans", sans-serif';

    drawRoundRect(ctx, padX, noteBoxY, leftColW, noteBoxH, 18);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '800 20px Outfit, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('CATATAN & GARANSI LAYANAN CETAKIN', padX + 28, noteBoxY + 38);

    ctx.font = '500 21px "DM Sans", sans-serif';
    ctx.fillStyle = '#475569';
    let ny = noteBoxY + 74;
    for (const nl of noteLines) {
      ctx.fillText(nl, padX + 28, ny);
      ny += 30;
    }

    // Summary Box (Kanan)
    drawRoundRect(ctx, rightColX, curY, rightColW, sumBoxH, 22);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    let sy = curY + 48;
    const drawSumLine = (label, val, valColor = '#0f172a', isBold = false) => {
      ctx.font = `${isBold ? '700' : '500'} 23px "DM Sans", sans-serif`;
      ctx.fillStyle = '#475569';
      ctx.fillText(label, rightColX + 32, sy);

      ctx.textAlign = 'right';
      ctx.font = `700 24px "DM Sans", sans-serif`;
      ctx.fillStyle = valColor;
      ctx.fillText(val, rightColX + rightColW - 32, sy);
      ctx.textAlign = 'left';
      sy += 44;
    };

    drawSumLine('Subtotal Pesanan', money(vm.itemSubtotal));
    if (vm.discount > 0) {
      drawSumLine('Potongan / Diskon', `- ${money(vm.discount)}`, '#16a34a');
    }
    if (vm.shipping > 0) {
      drawSumLine('Biaya Pengiriman', `+ ${money(vm.shipping)}`);
    }

    // Highlighted Total Bar
    drawRoundRect(ctx, rightColX + 22, sy - 16, rightColW - 44, 72, 16);
    ctx.fillStyle = accentDark;
    ctx.fill();

    ctx.font = '800 24px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('TOTAL TAGIHAN', rightColX + 46, sy + 29);

    ctx.textAlign = 'right';
    ctx.font = '800 32px Outfit, sans-serif';
    ctx.fillStyle = vm.isRobo ? '#38bdf8' : '#fdba74';
    ctx.fillText(money(vm.grandTotal), rightColX + rightColW - 46, sy + 31);
    ctx.textAlign = 'left';

    sy += 96;
    drawSumLine(`Telah Dibayar (${vm.payMethod})`, money(vm.paidAmount), '#15803d');

    // Sisa Tagihan
    ctx.beginPath();
    ctx.setLineDash([6, 5]);
    ctx.moveTo(rightColX + 32, sy - 22);
    ctx.lineTo(rightColX + rightColW - 32, sy - 22);
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '800 24px Outfit, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('Sisa Tagihan', rightColX + 32, sy + 16);

    ctx.textAlign = 'right';
    ctx.font = '800 26px Outfit, sans-serif';
    ctx.fillStyle = vm.remaining > 0 ? '#dc2626' : '#15803d';
    ctx.fillText(vm.remaining > 0 ? money(vm.remaining) : 'Rp 0 (LUNAS)', rightColX + rightColW - 32, sy + 16);
    ctx.textAlign = 'left';

    // 8. Footer & Stempel Digital Resmi
    const footerY = H - 205;
    ctx.beginPath();
    ctx.moveTo(padX, footerY);
    ctx.lineTo(W - padX, footerY);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    ctx.font = '700 22px "DM Sans", sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('Terima kasih atas kepercayaan Anda berbelanja di Cetakin!', padX, footerY + 48);

    ctx.font = '500 20px "DM Sans", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Simpan nota ini sebagai bukti transaksi resmi. Untuk konsultasi cetak 3D atau bantuan komponen,', padX, footerY + 82);
    ctx.fillText('hubungi WhatsApp kami di 0858-2280-1431 · Jl. Dahlina Raya III, Banjarbaru Selatan.', padX, footerY + 112);

    // Signature & Rotated Official Stamp with Logo
    const signCenterX = W - padX - 180;
    ctx.textAlign = 'center';
    ctx.font = '500 20px "DM Sans", sans-serif';
    ctx.fillStyle = '#64748b';
    const signDate = vm.completedDateFormatted !== 'Sedang Diproses' ? vm.completedDateFormatted : vm.orderDateFormatted;
    ctx.fillText(`Banjarbaru, ${signDate}`, signCenterX, footerY + 32);

    ctx.save();
    ctx.translate(signCenterX, footerY + 88);
    ctx.rotate(-0.06);

    const sealW = 240;
    const sealH = 78;
    const sealR = 12;

    // Stamp outer box
    drawRoundRect(ctx, -sealW / 2, -sealH / 2, sealW, sealH, sealR);
    ctx.fillStyle = accentSoftBg;
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = accentMain;
    ctx.stroke();

    // Stamp inner dashed border
    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = accentMain;
    drawRoundRect(ctx, -sealW / 2 + 5, -sealH / 2 + 5, sealW - 10, sealH - 10, sealR - 3);
    ctx.stroke();
    ctx.restore();

    // Stamp Logo
    if (logoImg && logoImg.naturalWidth > 0) {
      const stampLogoH = 34;
      const stampLogoW = (logoImg.naturalWidth / logoImg.naturalHeight) * stampLogoH;
      ctx.drawImage(logoImg, -stampLogoW / 2, -sealH / 2 + 8, stampLogoW, stampLogoH);
    } else {
      ctx.font = '800 24px Outfit, sans-serif';
      ctx.fillStyle = accentText;
      ctx.fillText('CETAKIN', 0, -sealH / 2 + 30);
    }

    // Stamp Text
    ctx.font = '800 13px Outfit, sans-serif';
    ctx.fillStyle = accentText;
    ctx.fillText('★ TERVERIFIKASI RESMI ★', 0, sealH / 2 - 12);

    ctx.restore();

    ctx.font = '800 23px Outfit, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('Tim Admin Cetakin', signCenterX, footerY + 154);
    ctx.textAlign = 'left';

    return canvas;
  }

  // Konversi Canvas ke File PDF 1.4 Murni (Tanpa Library Eksternal)
  function canvasToPdfBlob(canvas) {
    const jpegUrl = canvas.toDataURL('image/jpeg', 0.95);
    const base64 = jpegUrl.split(',')[1];
    const binStr = atob(base64);
    const jpegBytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      jpegBytes[i] = binStr.charCodeAt(i);
    }

    const imgW = canvas.width;
    const imgH = canvas.height;
    // Ukuran halaman A4 Portrait (595.28 pt lebar, tinggi menyesuaikan rasio gambar)
    const pdfW = 595.28;
    const pdfH = Number(((imgH / imgW) * pdfW).toFixed(2));

    const enc = new TextEncoder();
    const chunks = [];
    const offsets = [0];
    let byteLen = 0;

    const pushStr = (s) => {
      const b = enc.encode(s);
      chunks.push(b);
      byteLen += b.length;
    };
    const pushBytes = (b) => {
      chunks.push(b);
      byteLen += b.length;
    };

    pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

    // Obj 1: Catalog
    offsets.push(byteLen);
    pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

    // Obj 2: Pages
    offsets.push(byteLen);
    pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

    // Obj 3: Page
    offsets.push(byteLen);
    pushStr(
      `3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /XObject << /Im0 4 0 R >> >> /MediaBox [0 0 ${pdfW} ${pdfH}] /Contents 5 0 R >>\nendobj\n`
    );

    // Obj 4: Image XObject (DCTDecode)
    offsets.push(byteLen);
    pushStr(
      `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
    );
    pushBytes(jpegBytes);
    pushStr('\nendstream\nendobj\n');

    // Obj 5: Page Content Stream
    const streamCmd = `q\n${pdfW} 0 0 ${pdfH} 0 0 cm\n/Im0 Do\nQ\n`;
    offsets.push(byteLen);
    pushStr(`5 0 obj\n<< /Length ${streamCmd.length} >>\nstream\n${streamCmd}endstream\nendobj\n`);

    // Xref Table
    const xrefPos = byteLen;
    pushStr('xref\n0 6\n0000000000 65535 f \n');
    for (let i = 1; i <= 5; i++) {
      pushStr(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
    }
    pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`);

    return new Blob(chunks, { type: 'application/pdf' });
  }

  function makeSafeFileName(vm, ext) {
    const cleanId = String(vm.order.id || 'ORD').replace(/[^a-zA-Z0-9_-]/g, '-');
    const cleanCust = String(vm.customer || 'Pelanggan')
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    return `Nota_Cetakin_${cleanId}_${cleanCust || 'Pelanggan'}.${ext}`;
  }

  function triggerBlobDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 500);
  }

  // Event Listeners Modal Nota
  $('#close-invoice-modal')?.addEventListener('click', () => {
    $('#invoice-modal').hidden = true;
  });

  $('#toggle-invoice-edit-btn')?.addEventListener('click', () => {
    const panel = $('#invoice-edit-panel');
    if (panel) panel.hidden = !panel.hidden;
  });

  $('#invoice-edit-panel')?.addEventListener('input', () => {
    renderInvoicePreview();
  });

  $('#download-invoice-pdf-btn')?.addEventListener('click', async () => {
    const vm = getInvoiceViewModel();
    if (!vm) return;
    const btn = $('#download-invoice-pdf-btn');
    const prevText = btn.textContent;
    try {
      btn.disabled = true;
      btn.textContent = '⏳ Menyiapkan PDF...';
      const canvas = await renderInvoiceToCanvas(vm);
      const pdfBlob = canvasToPdfBlob(canvas);
      const fileName = makeSafeFileName(vm, 'pdf');
      triggerBlobDownload(pdfBlob, fileName);
      showToast(`✅ Nota PDF (${fileName}) berhasil diunduh!`);
    } catch (err) {
      showToast('Gagal membuat PDF: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = prevText;
    }
  });

  $('#download-invoice-png-btn')?.addEventListener('click', async () => {
    const vm = getInvoiceViewModel();
    if (!vm) return;
    const btn = $('#download-invoice-png-btn');
    const prevText = btn.textContent;
    try {
      btn.disabled = true;
      btn.textContent = '⏳ Menyiapkan PNG...';
      const canvas = await renderInvoiceToCanvas(vm);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const fileName = makeSafeFileName(vm, 'png');
        triggerBlobDownload(blob, fileName);
        showToast(`🖼️ Gambar Nota (${fileName}) siap dikirim ke WA!`);
      }, 'image/png');
    } catch (err) {
      showToast('Gagal membuat gambar PNG: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = prevText;
    }
  });

  $('#print-invoice-btn')?.addEventListener('click', () => {
    const vm = getInvoiceViewModel();
    if (!vm) return;
    const prevTitle = document.title;
    document.title = makeSafeFileName(vm, 'pdf').replace(/\.pdf$/, '');
    document.body.classList.add('printing-invoice');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-invoice');
      document.title = prevTitle;
    }, 400);
  });

  initSession();
})();
