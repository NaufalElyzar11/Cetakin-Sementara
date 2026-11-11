'use strict';

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./src/config/finance-defaults.js'));
  else root.CetakinFinance = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function createFinance({ CLICKER_PRESETS = {}, ROBOTIKA_PRESETS = [], DEFAULT_SETTINGS = null } = {}) {
  function ceilTo(value, step) {
    const s = Math.max(1, Number(step) || 1);
    return Math.ceil(value / s) * s;
  }

  /**
   * Kalkulator HPP Jasa 3D Print (Persis rumus Keuangan_dan_HPP_3D_Print.xlsm + edit_jasa.mjs)
   */
  function calculateJasaPrint(input, settings = DEFAULT_SETTINGS) {
    const cfg = { ...DEFAULT_SETTINGS, ...settings };
    const units = Math.max(1, Math.floor(Number(input.units) || 1));
    const petgGrams = Math.max(0, Number(input.petgGrams) || 0);
    const supportGrams = Math.max(0, Number(input.supportGrams) || 0);
    const printHours = Math.max(0, Number(input.printHours) || 0);
    const measuredKwh = input.measuredKwh !== '' && input.measuredKwh !== null && input.measuredKwh !== undefined
      ? Math.max(0, Number(input.measuredKwh))
      : null;
    const activeHours = Math.max(0, Number(input.activeHours) || 0);
    const packagingBatch = input.packagingBatch !== '' && input.packagingBatch !== null && input.packagingBatch !== undefined
      ? Math.max(0, Number(input.packagingBatch))
      : units * cfg.packagingPerUnit;
    const otherCost = Math.max(0, Number(input.otherCost) || 0);
    const discountBatch = Math.max(0, Number(input.discountBatch) || 0);
    const sellingPriceUnit = input.sellingPriceUnit !== '' && input.sellingPriceUnit !== null && input.sellingPriceUnit !== undefined
      ? Math.max(0, Number(input.sellingPriceUnit))
      : null;

    const layerKey = String(input.layer || '0.20');
    const rateInfo = cfg.layerRates[layerKey] || cfg.layerRates['0.20'];

    // 1. Biaya Bahan Baku (PETG)
    const billableGrams = petgGrams + supportGrams;
    const materialCostBatch = (billableGrams / 1000) * cfg.petgPerKg;

    // 2. Biaya Listrik
    const electricityCostBatch = measuredKwh !== null
      ? measuredKwh * cfg.electricityPerKwh
      : ((printHours * cfg.printerPowerWatts) / 1000) * cfg.electricityPerKwh;

    // 3. Penyusutan Mesin Printer
    const depreciationBatch = printHours * (cfg.printerCost / Math.max(1, cfg.printerLifespanHours));

    // 4. Perawatan Mesin
    const maintenanceBatch = printHours * cfg.maintenancePerHour;

    // 5. Biaya Tenaga Kerja (Waktu Aktif)
    const laborBatch = activeHours * cfg.laborRatePerHour;

    // 6. Subtotal & Cadangan Kegagalan
    const subtotalHpp = materialCostBatch + electricityCostBatch + depreciationBatch + maintenanceBatch + laborBatch + packagingBatch + otherCost;
    const failureReserveBatch = subtotalHpp * cfg.failureMarginRate;
    const hppBatch = subtotalHpp + failureReserveBatch;
    const hppUnit = hppBatch / units;

    // 7. Tarif Pembanding & Jasa Standar
    const comparePriceGram = rateInfo.compareRate;
    const baseRatePerGram = rateInfo.serviceRate;
    const comparePriceBatch = billableGrams * comparePriceGram;
    const baseTariffBatch = Math.max(cfg.jasaMinOrder, billableGrams * baseRatePerGram);

    // 8. Harga Saran & Impas
    const platformFactor = Math.max(0.01, 1 - cfg.platformFeeRate);
    const breakEvenUnit = (hppBatch + discountBatch) / (units * platformFactor);
    const targetNetMargin = Math.min(0.95, Math.max(0.01, Number(cfg.jasaTargetMargin) || 0.20));
    const hppTargetBatch = ceilTo(((hppBatch / (1 - targetNetMargin)) + discountBatch) / platformFactor, cfg.priceRounding);
    const suggestedPriceBatch = Math.max(baseTariffBatch, hppTargetBatch);
    const suggestedPriceUnit = Math.ceil(suggestedPriceBatch / units);

    // 9. Harga Aktif & Realisasi Laba
    const activeSellingUnit = sellingPriceUnit !== null && sellingPriceUnit > 0 ? sellingPriceUnit : suggestedPriceUnit;
    const netRevenueBatch = activeSellingUnit * units * platformFactor - discountBatch;
    const actualProfitBatch = netRevenueBatch - hppBatch;
    const actualProfitUnit = actualProfitBatch / units;
    const actualMargin = netRevenueBatch > 0 ? actualProfitBatch / netRevenueBatch : 0;

    let tariffStatus = 'Memenuhi target';
    if (netRevenueBatch < hppBatch) tariffStatus = 'Rugi';
    else if (actualMargin < targetNetMargin) tariffStatus = 'Di bawah target margin';

    return {
      units,
      layer: layerKey,
      petgGrams,
      supportGrams,
      billableGrams,
      printHours,
      activeHours,
      materialCostBatch: Math.round(materialCostBatch),
      electricityCostBatch: Math.round(electricityCostBatch),
      depreciationBatch: Math.round(depreciationBatch),
      maintenanceBatch: Math.round(maintenanceBatch),
      laborBatch: Math.round(laborBatch),
      packagingBatch: Math.round(packagingBatch),
      failureReserveBatch: Math.round(failureReserveBatch),
      hppBatch: Math.round(hppBatch),
      hppUnit: Math.round(hppUnit),
      comparePriceGram,
      baseRatePerGram,
      comparePriceBatch: Math.round(comparePriceBatch),
      baseTariffBatch: Math.round(baseTariffBatch),
      breakEvenUnit: Math.round(breakEvenUnit),
      suggestedPriceUnit: Math.round(suggestedPriceUnit),
      suggestedPriceBatch: Math.round(suggestedPriceBatch),
      activeSellingUnit: Math.round(activeSellingUnit),
      netRevenueBatch: Math.round(netRevenueBatch),
      actualProfitBatch: Math.round(actualProfitBatch),
      actualProfitUnit: Math.round(actualProfitUnit),
      actualMargin,
      tariffStatus
    };
  }

  /**
   * Kalkulator HPP Gantungan Kunci & Clicker Mekanikal (1-7 Tombol)
   */
  function calculateClicker(input, settings = DEFAULT_SETTINGS) {
    const cfg = { ...DEFAULT_SETTINGS, ...settings };
    const buttons = Math.min(7, Math.max(1, Math.floor(Number(input.buttons) || 1)));
    const preset = CLICKER_PRESETS[buttons] || {};
    const units = Math.max(1, Math.floor(Number(input.units) || 1));
    const petgPerUnitGrams = Math.max(0, Number(input.petgPerUnitGrams) || preset.petgPerUnitGrams || (buttons * 3.5 + 6));
    const supportBatchGrams = Math.max(0, Number(input.supportBatchGrams) || (preset.supportBatchGrams !== undefined ? preset.supportBatchGrams : 0));
    const printHoursBatch = Math.max(0, Number(input.printHoursBatch) || (units * (preset.printHoursBatch || (0.35 + buttons * 0.12))));
    const activeHoursBatch = Math.max(0, Number(input.activeHoursBatch) || (units * (preset.activeHoursBatch || 0.05)));
    const switchesPerUnit = input.switchesPerUnit !== undefined ? Math.max(0, Number(input.switchesPerUnit)) : buttons;
    const extraMaterialPerUnit = Math.max(0, Number(input.extraMaterialPerUnit) || 0);
    const discountBatch = Math.max(0, Number(input.discountBatch) || 0);
    const sellingPriceUnit = input.sellingPriceUnit !== '' && input.sellingPriceUnit !== null && input.sellingPriceUnit !== undefined
      ? Math.max(0, Number(input.sellingPriceUnit))
      : (preset.sellingPriceUnit || null);

    // Biaya komponen per unit (5-7 tombol memakai 2x tali sesuai rumus F19:H19 di Excel)
    const switchCostUnit = switchesPerUnit * cfg.blueSwitchPerPcs;
    const cordMultiplier = buttons >= 5 ? 2 : 1;
    const cordCostUnit = cordMultiplier * (cfg.cordRollPrice / Math.max(1, cfg.cordRollLengthCm)) * cfg.cordUsedPerClickerCm;
    const keychainCostUnit = Number(cfg.keychainRingPerPcs) || 0;
    const packagingCostUnit = Number(cfg.packagingPerUnit) || 0;
    const unitHardwareCost = switchCostUnit + cordCostUnit + keychainCostUnit + packagingCostUnit;

    // Biaya proses per batch
    const totalPetgGrams = petgPerUnitGrams * units + supportBatchGrams;
    const petgBatchCost = (totalPetgGrams / 1000) * cfg.petgPerKg;
    const electricityBatchCost = ((printHoursBatch * cfg.printerPowerWatts) / 1000) * cfg.electricityPerKwh;
    const depreciationBatchCost = printHoursBatch * (cfg.printerCost / Math.max(1, cfg.printerLifespanHours));
    const maintenanceBatchCost = printHoursBatch * cfg.maintenancePerHour;
    const laborBatchCost = activeHoursBatch * cfg.laborRatePerHour;
    const extraMaterialBatchCost = extraMaterialPerUnit * units;

    const baseHppBatch = unitHardwareCost * units + petgBatchCost + electricityBatchCost + depreciationBatchCost + maintenanceBatchCost + laborBatchCost + extraMaterialBatchCost;
    const failureReserveBatch = baseHppBatch * cfg.failureMarginRate;
    const totalHppBatch = baseHppBatch + failureReserveBatch;
    const hppUnit = totalHppBatch / units;

    const platformFactor = Math.max(0.01, 1 - cfg.platformFeeRate);
    const breakEvenUnit = (totalHppBatch + discountBatch) / (units * platformFactor);
    const targetMargin = Math.min(0.95, Math.max(0.01, Number(cfg.targetNetMargin) || 0.30));
    const suggestedPriceUnit = ceilTo(((totalHppBatch / (1 - targetMargin)) + discountBatch) / (units * platformFactor), cfg.priceRounding);

    const activeSellingUnit = sellingPriceUnit !== null && sellingPriceUnit > 0 ? sellingPriceUnit : suggestedPriceUnit;
    const netRevenueBatch = activeSellingUnit * units * platformFactor - discountBatch;
    const profitBatch = netRevenueBatch - totalHppBatch;
    const profitUnit = profitBatch / units;
    const actualMargin = netRevenueBatch > 0 ? profitBatch / netRevenueBatch : 0;

    return {
      buttons,
      units,
      switchesPerUnit,
      switchCostUnit: Math.round(switchCostUnit),
      cordCostUnit: Math.round(cordCostUnit),
      keychainCostUnit: Math.round(keychainCostUnit),
      packagingCostUnit: Math.round(packagingCostUnit),
      petgBatchCost: Math.round(petgBatchCost),
      electricityBatchCost: Math.round(electricityBatchCost),
      depreciationBatchCost: Math.round(depreciationBatchCost),
      maintenanceBatchCost: Math.round(maintenanceBatchCost),
      laborBatchCost: Math.round(laborBatchCost),
      baseHppBatch: Math.round(baseHppBatch),
      failureReserveBatch: Math.round(failureReserveBatch),
      hppBatch: Math.round(totalHppBatch),
      hppUnit: Math.round(hppUnit),
      breakEvenUnit: Math.round(breakEvenUnit),
      suggestedPriceUnit: Math.round(suggestedPriceUnit),
      activeSellingUnit: Math.round(activeSellingUnit),
      netRevenueBatch: Math.round(netRevenueBatch),
      profitBatch: Math.round(profitBatch),
      profitUnit: Math.round(profitUnit),
      actualMargin
    };
  }

  /**
   * Kalkulator HPP & Margin Komponen Robotika
   * Mendukung perhitungan HPP per unit dari kulakan batch (harga beli + alokasi biaya usaha + kemasan)
   * maupun pemanggilan langsung dari 94 Preset Ter-Audit.
   */
  function calculateRobotikaItem(input, settings = DEFAULT_SETTINGS) {
    const cfg = { ...DEFAULT_SETTINGS, ...settings };
    const units = Math.max(1, Math.floor(Number(input.units) || 1));

    // Optional preset lookup
    let preset = null;
    if (input.presetSku && Array.isArray(ROBOTIKA_PRESETS)) {
      preset = ROBOTIKA_PRESETS.find(p => p.sku === input.presetSku && (input.sellUnitQty ? p.sellUnitQty === Number(input.sellUnitQty) : true));
    }

    const buyPriceUnit = input.buyPriceUnit !== undefined && input.buyPriceUnit !== null && input.buyPriceUnit !== ''
      ? Math.max(0, Number(input.buyPriceUnit))
      : (preset ? preset.hppStok : 0);

    const shippingAllocationUnit = input.shippingAllocationUnit !== undefined && input.shippingAllocationUnit !== null && input.shippingAllocationUnit !== ''
      ? Math.max(0, Number(input.shippingAllocationUnit))
      : (preset ? preset.alokasiBiayaUsaha : 0);

    const packagingUnit = input.packagingUnit !== undefined && input.packagingUnit !== null && input.packagingUnit !== ''
      ? Math.max(0, Number(input.packagingUnit))
      : (preset ? preset.kemasan : 200);

    const otherCostBatch = Math.max(0, Number(input.otherCostBatch) || 0);
    const discountBatch = Math.max(0, Number(input.discountBatch) || 0);

    // HPP dasar stok vs Biaya penuh (full cost)
    const baseHppUnit = buyPriceUnit;
    const baseHppBatch = baseHppUnit * units;

    const fullCostUnit = buyPriceUnit + shippingAllocationUnit + packagingUnit + (otherCostBatch / units);
    const fullCostBatch = fullCostUnit * units;

    // Untuk kompatibilitas backward: hppUnit = fullCostUnit, hppBatch = fullCostBatch
    const hppUnit = fullCostUnit;
    const hppBatch = fullCostBatch;

    const targetMargin = Math.min(0.90, Math.max(0.01, Number(input.targetMargin) || 0.20));
    const suggestedPriceUnit = preset && (!input.targetMargin || Number(input.targetMargin) === 0.20) && preset.hargaJualUsulan
      ? preset.hargaJualUsulan
      : ceilTo(fullCostUnit / (1 - targetMargin), cfg.priceRounding || 50);

    const sellingPriceUnit = input.sellingPriceUnit !== '' && input.sellingPriceUnit !== null && input.sellingPriceUnit !== undefined
      ? Math.max(0, Number(input.sellingPriceUnit))
      : suggestedPriceUnit;

    const netRevenueBatch = sellingPriceUnit * units - discountBatch;
    const netRevenueUnit = netRevenueBatch / units;

    // Laba kotor (terhadap modal stok murni)
    const grossProfitBatch = netRevenueBatch - baseHppBatch;
    const grossProfitUnit = grossProfitBatch / units;
    const grossMargin = netRevenueBatch > 0 ? grossProfitBatch / netRevenueBatch : 0;

    // Laba bersih / sisa setelah biaya penuh (overhead + kemasan)
    const netProfitBatch = netRevenueBatch - fullCostBatch;
    const netProfitUnit = netProfitBatch / units;
    const netMargin = netRevenueBatch > 0 ? netProfitBatch / netRevenueBatch : 0;

    // Status penutupan biaya
    let costStatus = 'MENUTUP + SURPLUS';
    if (netProfitBatch < -1) {
      costStatus = 'BELUM MENUTUP';
    } else if (Math.abs(netProfitBatch) <= 1) {
      costStatus = 'IMPAS (BREAK-EVEN)';
    }

    return {
      units,
      sku: preset ? preset.sku : (input.sku || ''),
      name: preset ? preset.name : (input.name || ''),
      buyPriceUnit: Math.round(buyPriceUnit),
      shippingAllocationUnit: Math.round(shippingAllocationUnit),
      packagingUnit: Math.round(packagingUnit),
      baseHppUnit: Math.round(baseHppUnit),
      baseHppBatch: Math.round(baseHppBatch),
      fullCostUnit: Math.round(fullCostUnit),
      fullCostBatch: Math.round(fullCostBatch),
      hppUnit: Math.round(hppUnit),
      hppBatch: Math.round(hppBatch),
      breakEvenUnit: Math.ceil(fullCostUnit),
      suggestedPriceUnit: Math.round(suggestedPriceUnit),
      sellingPriceUnit: Math.round(sellingPriceUnit),
      netRevenueBatch: Math.round(netRevenueBatch),
      grossProfitBatch: Math.round(grossProfitBatch),
      grossProfitUnit: Math.round(grossProfitUnit),
      grossMargin,
      profitBatch: Math.round(netProfitBatch),
      profitUnit: Math.round(netProfitUnit),
      netProfitBatch: Math.round(netProfitBatch),
      netProfitUnit: Math.round(netProfitUnit),
      actualMargin: netMargin,
      netMargin,
      costStatus,
      competitorBanjar: preset?.acuanBanjar || null,
      competitorAdawwino: preset?.acuanAdawwino || null
    };
  }

  /**
   * Engine Pembukuan & Ringkasan per Unit Bisnis ('3d-print' atau 'robotika')
   * Mengimplementasikan logika akuntansi dari Keuangan_dan_HPP_3D_Print.xlsm
   */
  function computeUnitSummary(db, unit, filterMonth = null) {
    const settings = { ...DEFAULT_SETTINGS, ...(db.settings || {}) };
    const orders = (db.orders || []).filter((o) => o.unit === unit);
    const mutations = (db.mutations || []).filter((m) => m.unit === unit);
    const wages = (db.wages || []).filter((w) => w.unit === unit);
    const allocations = (db.allocations || []).filter((a) => a.unit === unit);

    const accounts = ['Merchant', 'Bank usaha', 'Kas tunai'];
    const openingMap = unit === '3d-print'
      ? (settings.openingBalances3D || DEFAULT_SETTINGS.openingBalances3D)
      : (settings.openingBalancesRobo || DEFAULT_SETTINGS.openingBalancesRobo);

    // 1. Hitung upah per pesanan
    const wageByOrder = {};
    let totalWagesRecorded = 0;
    const wageByWorker = { Saya: { recorded: 0, paid: 0 }, Partner: { recorded: 0, paid: 0 } };
    const enrichedWages = [];

    for (const w of wages) {
      const amount = Math.round(((Number(w.minutes) || 0) / 60) * (Number(w.ratePerHour) || settings.laborRatePerHour));
      wageByOrder[w.orderId] = (wageByOrder[w.orderId] || 0) + amount;
      totalWagesRecorded += amount;
      const workerKey = w.worker === 'Saya' ? 'Saya' : 'Partner';
      wageByWorker[workerKey].recorded += amount;
      enrichedWages.push({
        ...w,
        amount
      });
    }

    // 2. Hitung pembayaran pelanggan & retur per pesanan dari Mutasi
    const paidByOrder = {};
    const returnByOrder = {};
    const accountBalances = {};
    for (const acc of accounts) {
      accountBalances[acc] = {
        opening: Number(openingMap[acc]) || 0,
        inflow: 0,
        outflow: 0,
        balance: Number(openingMap[acc]) || 0
      };
    }

    let extraExpensesOutOfHpp = 0;
    let totalSalesReturns = 0;

    // Pelacakan talangan
    const advancesInit = unit === '3d-print'
      ? (settings.openingAdvances3D || DEFAULT_SETTINGS.openingAdvances3D)
      : (settings.openingAdvancesRobo || DEFAULT_SETTINGS.openingAdvancesRobo);

    const advancesMap = {};
    for (const adv of advancesInit) {
      advancesMap[adv.code] = {
        code: adv.code,
        owner: adv.owner,
        opening: Number(adv.amount) || 0,
        added: 0,
        repaid: 0,
        remaining: Number(adv.amount) || 0,
        note: adv.note || ''
      };
    }

    for (const m of mutations) {
      const amt = Math.max(0, Number(m.amount) || 0);
      if (accountBalances[m.toAccount]) {
        accountBalances[m.toAccount].inflow += amt;
        accountBalances[m.toAccount].balance += amt;
      }
      if (accountBalances[m.fromAccount]) {
        accountBalances[m.fromAccount].outflow += amt;
        accountBalances[m.fromAccount].balance -= amt;
      }

      if (m.type === 'Pembayaran pelanggan' && m.orderId) {
        paidByOrder[m.orderId] = (paidByOrder[m.orderId] || 0) + amt;
      } else if (m.type === 'Refund DP' && m.orderId) {
        paidByOrder[m.orderId] = (paidByOrder[m.orderId] || 0) - amt;
      } else if (m.type === 'Retur penjualan') {
        if (m.orderId) {
          paidByOrder[m.orderId] = (paidByOrder[m.orderId] || 0) - amt;
          returnByOrder[m.orderId] = (returnByOrder[m.orderId] || 0) + amt;
        }
        if (!filterMonth || (m.date && m.date.startsWith(filterMonth))) {
          totalSalesReturns += amt;
        }
      }

      if (m.type === 'Biaya di luar HPP') {
        if (!filterMonth || (m.date && m.date.startsWith(filterMonth))) {
          extraExpensesOutOfHpp += amt;
        }
      }

      if (m.type === 'Bayar upah') {
        const wKey = m.party === 'Saya' ? 'Saya' : 'Partner';
        wageByWorker[wKey].paid += amt;
      }

      // Talangan bertambah atau dicicil (mendukung kode gabungan TL-3D yang otomatis membagi porsi Mesin 6jt-an vs Modal 1jt)
      const isCombined3D = m.advanceCode === 'TL-3D' || m.advanceCode === 'TL-MESIN-MODAL' || m.advanceCode === 'TL-ALAT-MODAL';
      if (isCombined3D && advancesMap['TL-MESIN'] && advancesMap['TL-MODAL']) {
        const advMesin = advancesMap['TL-MESIN'];
        const advModal = advancesMap['TL-MODAL'];
        if (m.type === 'Cicilan talangan') {
          // Bagi cicilan proporsional sesuai sisa kewajiban riil (mesin 6.38jt vs modal 1jt)
          const remMesin = Math.max(0, advMesin.opening + advMesin.added - advMesin.repaid);
          const remModal = Math.max(0, advModal.opening + advModal.added - advModal.repaid);
          const totalRem = remMesin + remModal;
          if (totalRem > 0) {
            let mesinShare = Math.min(remMesin, Math.round(amt * (remMesin / totalRem)));
            let modalShare = Math.min(remModal, amt - mesinShare);
            if (amt - modalShare <= remMesin) {
              mesinShare = amt - modalShare;
            }
            advMesin.repaid += mesinShare;
            advModal.repaid += modalShare;
          } else {
            const mesinShare = Math.round(amt * (6383500 / 7383500));
            advMesin.repaid += mesinShare;
            advModal.repaid += (amt - mesinShare);
          }
        } else if (m.type === 'Talangan masuk' || m.fromAccount === 'Saya' || m.fromAccount === 'Teman' || m.fromAccount === 'Partner') {
          const mesinShare = Math.round(amt * (6383500 / 7383500));
          advMesin.added += mesinShare;
          advModal.added += (amt - mesinShare);
        }
      } else if (m.advanceCode && advancesMap[m.advanceCode]) {
        if (m.type === 'Cicilan talangan') {
          advancesMap[m.advanceCode].repaid += amt;
        } else if (m.type === 'Talangan masuk' || m.fromAccount === 'Saya' || m.fromAccount === 'Teman' || m.fromAccount === 'Partner') {
          advancesMap[m.advanceCode].added += amt;
        }
      }
    }

    for (const code of Object.keys(advancesMap)) {
      const a = advancesMap[code];
      a.remaining = Math.max(0, a.opening + a.added - a.repaid);
    }

    // 3. Evaluasi tiap pesanan
    let recognizedRevenue = 0;
    let recognizedHpp = 0;
    let totalCustomerDpHeld = 0;
    let totalReceivables = 0;

    const enrichedOrders = orders.map((o) => {
      const netBill = Math.max(0, Number(o.netBill) || 0);
      const initialHpp = Math.max(0, Number(o.initialHpp ?? o.hpp) || 0);
      const wageInHpp = Math.max(0, Number(o.wageInHpp) || 0);
      const recordedWage = wageByOrder[o.id] !== undefined ? wageByOrder[o.id] : wageInHpp;
      const adjustedHpp = unit === '3d-print' ? Math.max(0, initialHpp - wageInHpp + recordedWage) : initialHpp;
      const netPaid = paidByOrder[o.id] !== undefined ? paidByOrder[o.id] : Math.max(0, Number(o.netPaid) || 0);
      const orderReturn = returnByOrder[o.id] || 0;

      const effectiveBill = o.status === 'Batal' ? 0 : Math.max(0, netBill - orderReturn);
      const remainingBill = o.status === 'Batal' ? 0 : Math.max(0, effectiveBill - netPaid);
      const overpaymentAmount = Math.max(0, netPaid - effectiveBill);
      const dpHeld = o.status === 'Selesai'
        ? Math.max(0, netPaid - effectiveBill)
        : Math.max(0, netPaid);

      const completionDate = o.completedDate || o.date || '';
      const inPeriod = !filterMonth || completionDate.startsWith(filterMonth);

      const rev = (o.status === 'Selesai' && inPeriod) ? netBill : 0;
      const hpp = ((o.status === 'Selesai' || o.status === 'Batal') && inPeriod) ? adjustedHpp : 0;

      recognizedRevenue += rev;
      recognizedHpp += hpp;
      totalCustomerDpHeld += dpHeld;
      totalReceivables += remainingBill;

      return {
        ...o,
        recordedWage,
        adjustedHpp,
        netPaid,
        effectiveBill,
        overpaymentAmount,
        remainingBill,
        dpHeld,
        recognizedRevenue: rev,
        recognizedHpp: hpp,
        profit: rev - hpp
      };
    });

    const operatingProfit = recognizedRevenue - recognizedHpp - totalSalesReturns - extraExpensesOutOfHpp;
    const liquidCash = accountBalances['Bank usaha'].balance + accountBalances['Kas tunai'].balance;
    const merchantCash = accountBalances['Merchant'].balance;

    const unpaidWages = Math.max(0, wageByWorker.Saya.recorded - wageByWorker.Saya.paid) +
                        Math.max(0, wageByWorker.Partner.recorded - wageByWorker.Partner.paid);

    const minReserve = unit === '3d-print' ? Number(settings.minCashReserve3D || 0) : Number(settings.minCashReserveRobo || 0);
    const totalAllocatedSoFar = allocations.reduce((sum, a) => sum + (Number(a.baseAmount) || 0), 0);
    const unallocatedProfit = Math.max(0, operatingProfit - (filterMonth ? 0 : totalAllocatedSoFar));
    const freeCashForAllocation = Math.max(0, liquidCash - totalCustomerDpHeld - unpaidWages - minReserve);
    const suggestedAllocationBase = Math.max(0, Math.min(unallocatedProfit, freeCashForAllocation));

    // Hitung nominal per pos pembagian
    const rates = unit === '3d-print'
      ? (settings.allocationRates3D || DEFAULT_SETTINGS.allocationRates3D)
      : (settings.allocationRatesRobo || DEFAULT_SETTINGS.allocationRatesRobo);

    const breakdown = [];
    let allocatedSum = 0;
    for (const [potName, rate] of Object.entries(rates)) {
      let amount = Math.floor(suggestedAllocationBase * Number(rate));
      // Batasi cicilan mesin / modal sesuai sisa utang talangan
      if (unit === '3d-print' && potName === 'Cicilan mesin' && advancesMap['TL-MESIN']) {
        amount = Math.min(amount, advancesMap['TL-MESIN'].remaining);
      }
      if (unit === '3d-print' && potName === 'Cicilan modal' && advancesMap['TL-MODAL']) {
        amount = Math.min(amount, advancesMap['TL-MODAL'].remaining);
      }
      allocatedSum += amount;
      breakdown.push({ pot: potName, rate: Number(rate), amount });
    }
    const remainderToReserve = Math.max(0, suggestedAllocationBase - allocatedSum);

    return {
      unit,
      filterMonth,
      recognizedRevenue,
      recognizedHpp,
      totalSalesReturns,
      extraExpensesOutOfHpp,
      operatingProfit,
      accountBalances,
      liquidCash,
      merchantCash,
      totalCashIncludingMerchant: liquidCash + merchantCash,
      totalCustomerDpHeld,
      totalReceivables,
      unpaidWages,
      wageByWorker,
      advances: Object.values(advancesMap),
      minReserve,
      freeCashForAllocation,
      suggestedAllocationBase,
      allocationBreakdown: breakdown,
      remainderToReserve,
      orders: enrichedOrders,
      mutations,
      wages: enrichedWages
    };
  }

  /**
   * Rekonsiliasi 1 QRIS Bersama (Menggabungkan transaksi Merchant dari 3D Print & Robotika)
   */
  function computeSharedQrisReconciliation(db) {
    const s3d = computeUnitSummary(db, '3d-print');
    const sRobo = computeUnitSummary(db, 'robotika');

    const qris3D = s3d.accountBalances['Merchant'];
    const qrisRobo = sRobo.accountBalances['Merchant'];

    const totalMerchantBalance = qris3D.balance + qrisRobo.balance;
    const totalMerchantInflow = qris3D.inflow + qrisRobo.inflow;
    const share3DPct = totalMerchantBalance > 0 ? (qris3D.balance / totalMerchantBalance) : 0;
    const shareRoboPct = totalMerchantBalance > 0 ? (qrisRobo.balance / totalMerchantBalance) : 0;

    return {
      totalMerchantBalance,
      totalMerchantInflow,
      unit3D: {
        inflow: qris3D.inflow,
        outflow: qris3D.outflow,
        balance: qris3D.balance,
        sharePct: share3DPct
      },
      unitRobotika: {
        inflow: qrisRobo.inflow,
        outflow: qrisRobo.outflow,
        balance: qrisRobo.balance,
        sharePct: shareRoboPct
      }
    };
  }

  return {
    create: createFinance,
    CLICKER_PRESETS,
    ROBOTIKA_PRESETS,
    DEFAULT_SETTINGS,
    calculateJasaPrint,
    calculateClicker,
    calculateRobotikaItem,
    computeUnitSummary,
    computeSharedQrisReconciliation
  };
});
