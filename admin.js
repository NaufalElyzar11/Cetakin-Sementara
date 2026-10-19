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
    const headers = { ...(options.headers || {}) };
    if (state.token) headers.Authorization = `Bearer ${state.token}`;
    if (options.body && typeof options.body === 'object') {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      logout();
      throw new Error(data.error || 'Sesi berakhir, silakan login ulang.');
    }
    if (!res.ok || data.ok === false) {
      throw new Error(data.error || `Gagal menghubungi server (HTTP ${res.status})`);
    }
    return data;
  }

  // =========================================================
  // 1. AUTENTIKASI & ROLE GUARD
  // =========================================================
  $$('.role-pill-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.role-pill-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      $('#login-username').value = btn.dataset.fillUser || '';
      $('#login-password').value = btn.dataset.fillPass || '';
    });
  });

  $('#login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = $('#login-error');
    errEl.hidden = true;
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
      enterApp();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.hidden = false;
    }
  });

  function logout() {
    state.token = '';
    state.user = null;
    localStorage.removeItem('cetakin_token');
    $('#app-view').hidden = true;
    $('#login-view').hidden = false;
  }

  $('#logout-btn')?.addEventListener('click', logout);

  async function initSession() {
    const today = new Date().toISOString().slice(0, 10);
    if ($('#ord-date')) $('#ord-date').value = today;
    if ($('#mut-date')) $('#mut-date').value = today;
    if ($('#qp-date')) $('#qp-date').value = today;

    if (!state.token) return;
    try {
      const res = await apiFetch('./api/auth/me');
      state.user = res.user;
      enterApp();
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
    await Promise.all([loadDashboardData(), loadAdminCatalog()]);
    runAllCalculators();
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
    for (const adv of uData.advances) {
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
    const tbody = $('#orders-tbody');
    if (!tbody) return;
    tbody.replaceChildren();
    if (!orders.length) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--muted);">Belum ada pesanan tercatat pada divisi ini.</td></tr>`;
      return;
    }

    for (const o of orders) {
      const badgeClass = o.status === 'Selesai' ? 'badge-success' : o.status === 'Proses' ? 'badge-warn' : 'badge-danger';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <strong>${o.id}</strong>
          <div style="font-size:11px; color:var(--muted);">${o.date}</div>
        </td>
        <td>
          <strong>${o.productName}</strong>
          <div style="font-size:11px; color:var(--muted);">👤 ${o.customer}</div>
        </td>
        <td>${o.quantity} pcs</td>
        <td><strong>${money(o.netBill)}</strong></td>
        <td>${money(o.adjustedHpp)}</td>
        <td>
          <span style="color:${o.netPaid >= o.netBill ? '#16a34a' : '#d97706'}; font-weight:700;">${money(o.netPaid)}</span>
          ${o.remainingBill > 0 ? `<div style="font-size:10px; color:#dc2626;">Kurang ${money(o.remainingBill)}</div>` : ''}
        </td>
        <td><strong style="color:${o.profit >= 0 ? '#16a34a' : '#dc2626'};">${money(o.profit)}</strong></td>
        <td><span class="badge ${badgeClass}">${o.status}</span></td>
        <td>
          <div style="display:flex; gap:6px;">
            ${o.status !== 'Selesai' ? `<button type="button" class="btn btn-outline btn-sm" data-complete-order="${o.id}" title="Tandai Selesai">✓ Selesai</button>` : ''}
            <button type="button" class="btn btn-danger btn-sm" data-del-order="${o.id}" title="Hapus">🗑</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    }

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
        if (!confirm(`Hapus pesanan ${btn.dataset.delOrder}?`)) return;
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
    const rate = state.dashboard.settings?.laborRatePerHour || 15000;

    // Tampilkan ringkasan per order yang memiliki upah tercatat
    const withWages = uData.orders.filter((o) => o.recordedWage > 0);
    if (!withWages.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--muted);">Belum ada catatan jam kerja.</td></tr>`;
      return;
    }

    for (const o of withWages) {
      const estMins = Math.round((o.recordedWage / rate) * 60);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${o.id}</strong><div style="font-size:11px; color:var(--muted);">${o.date}</div></td>
        <td>Tim Produksi</td>
        <td>${estMins} mnt</td>
        <td><strong>${money(o.recordedWage)}</strong></td>
        <td><span class="badge badge-success">Masuk HPP</span></td>
      `;
      tbody.appendChild(tr);
    }
  }

  // =========================================================
  // 4. FORM INPUT PESANAN, MUTASI KAS, UPAH, & PENCAIRAN QRIS
  // =========================================================
  function populateOrderCatalogPicker() {
    const select = $('#ord-catalog-pick');
    if (!select) return;
    const targetType = state.activeUnit === 'robotika' ? 'robotika' : 'gantungan-kunci';
    const items = state.catalog.filter((p) => p.type === targetType);
    select.replaceChildren(new Option('-- Input Manual / Jasa Kustom --', ''));
    for (const item of items) {
      select.add(new Option(`[${item.id}] ${item.name} — Jual: ${money(item.price)} | HPP: ${money(item.cost_price || 0)} (Stok: ${item.stock})`, item.id));
    }
  }

  function syncCatalogOrderFields() {
    const prodId = $('#ord-catalog-pick').value;
    if (!prodId) return;
    const prod = state.catalog.find((p) => p.id === prodId);
    if (!prod) return;
    const qty = Math.max(1, Number($('#ord-qty').value) || 1);
    $('#ord-product-name').value = prod.name;
    $('#ord-netbill').value = prod.price * qty;
    $('#ord-hpp').value = (prod.cost_price || Math.round(prod.price * 0.6)) * qty;
  }

  $('#ord-catalog-pick')?.addEventListener('change', syncCatalogOrderFields);
  $('#ord-qty')?.addEventListener('input', syncCatalogOrderFields);

  $('#order-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const payAcc = $('#ord-pay-account').value;
      const netBill = Number($('#ord-netbill').value) || 0;
      const payload = {
        unit: state.activeUnit,
        date: $('#ord-date').value,
        customer: $('#ord-customer').value,
        productId: $('#ord-catalog-pick').value,
        productName: $('#ord-product-name').value,
        quantity: Number($('#ord-qty').value) || 1,
        netBill,
        initialHpp: Number($('#ord-hpp').value) || 0,
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
      $('#ord-product-name').value = '';
      $('#ord-catalog-pick').value = '';
      await Promise.all([loadDashboardData(), loadAdminCatalog()]);
    } catch (err) {
      showToast(err.message);
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

  function runRoboCalc() {
    if (!window.CetakinFinance) return;
    const settings = state.dashboard?.settings || window.CetakinFinance.DEFAULT_SETTINGS;
    const res = window.CetakinFinance.calculateRobotikaItem({
      units: $('#cr-units').value,
      buyPriceUnit: $('#cr-buy-unit').value,
      shippingAllocationUnit: $('#cr-ship-unit').value,
      packagingUnit: $('#cr-pack-unit').value,
      targetMargin: $('#cr-target-margin').value,
      sellingPriceUnit: $('#cr-sell-unit').value
    }, settings);

    state.lastRoboCalc = res;

    $('#cr-res-hpp-unit').textContent = money(res.hppUnit);
    $('#cr-res-suggested').textContent = money(res.suggestedPriceUnit);
    $('#cr-res-hpp-batch').textContent = money(res.hppBatch);
    $('#cr-res-profit').textContent = money(res.profitBatch);
  }

  function runAllCalculators() {
    runJasaPrintCalc();
    runClickerCalc();
    runRoboCalc();
  }

  $('#calc-jasa-form')?.addEventListener('input', runJasaPrintCalc);
  $('#calc-clicker-form')?.addEventListener('input', runClickerCalc);
  $('#calc-robo-form')?.addEventListener('input', runRoboCalc);

  // Tombol 1-Klik Salin Hasil Kalkulator ke Form Pesanan
  $('#cj-save-order-btn')?.addEventListener('click', () => {
    if (!state.lastJasaCalc) return;
    state.activeUnit = '3d-print';
    updateUnitButtons();
    $('#ord-product-name').value = `${$('#cj-name').value} (Layer ${state.lastJasaCalc.layer}mm · ${state.lastJasaCalc.billableGrams}g)`;
    $('#ord-qty').value = state.lastJasaCalc.units;
    $('#ord-netbill').value = state.lastJasaCalc.netRevenueBatch;
    $('#ord-hpp').value = state.lastJasaCalc.hppBatch;
    $('#ord-wage').value = state.lastJasaCalc.laborCost;
    switchTab('tab-ledger');
    showToast('Data HPP Jasa Print disalin ke form pesanan!');
  });

  $('#cc-save-order-btn')?.addEventListener('click', () => {
    if (!state.lastClickerCalc) return;
    state.activeUnit = '3d-print';
    updateUnitButtons();
    $('#ord-product-name').value = `Clicker Custom ${state.lastClickerCalc.buttons} Tombol`;
    $('#ord-qty').value = state.lastClickerCalc.units;
    $('#ord-netbill').value = state.lastClickerCalc.netRevenueBatch;
    $('#ord-hpp').value = state.lastClickerCalc.hppBatch;
    $('#ord-wage').value = state.lastClickerCalc.laborBatchCost;
    switchTab('tab-ledger');
    showToast('Data HPP Clicker disalin ke form pesanan!');
  });

  $('#cr-save-order-btn')?.addEventListener('click', () => {
    if (!state.lastRoboCalc) return;
    state.activeUnit = 'robotika';
    updateUnitButtons();
    $('#ord-product-name').value = $('#cr-name').value;
    $('#ord-qty').value = state.lastRoboCalc.units;
    $('#ord-netbill').value = state.lastRoboCalc.netRevenueBatch;
    $('#ord-hpp').value = state.lastRoboCalc.hppBatch;
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
            <span>Harga Jual Publik</span>
            <strong>${money(p.price)}</strong>
          </div>
          <div>
            <span>HPP / Modal Beli</span>
            <strong style="color:#0284c7;">${money(p.cost_price || 0)}</strong>
          </div>
        </div>

        <div class="admin-prod-controls">
          <div class="quick-stock-stepper" title="Ubah stok cepat">
            <button type="button" data-step-id="${p.id}" data-step="-1" aria-label="Kurangi stok">−</button>
            <span>${p.stock} pcs</span>
            <button type="button" data-step-id="${p.id}" data-step="1" aria-label="Tambah stok">+</button>
          </div>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn btn-outline btn-sm" data-toggle-active="${p.id}">
              ${p.active ? 'Sembunyikan' : 'Tampilkan'}
            </button>
            <button type="button" class="btn btn-dark btn-sm" data-edit-prod="${p.id}">Edit</button>
            <button type="button" class="btn btn-danger btn-sm" data-del-prod="${p.id}" title="Hapus Produk">🗑</button>
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

  initSession();
})();
