(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CetakinFinance = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DEFAULT_SETTINGS = {
    // Parameter HPP 3D Print & Clicker (dari Pengaturan Excel Keuangan_dan_HPP_3D_Print.xlsm)
    petgPerKg: 140366.5,
    electricityPerKwh: 1600,
    printerPowerWatts: 150,
    printerCost: 6300000,
    printerLifespanHours: 5000,
    maintenancePerHour: 1000,
    laborRatePerHour: 15000,
    failureMarginRate: 0.10,
    targetNetMargin: 0.30,
    platformFeeRate: 0,
    priceRounding: 1000,
    packagingPerUnit: 700,
    blueSwitchPerPcs: 1500,
    keychainRingPerPcs: 1700,
    cordRollPrice: 16700,
    cordRollLengthCm: 400,
    cordUsedPerClickerCm: 55,

    // Parameter Khusus Jasa Print (dari edit_jasa.mjs)
    jasaTargetMargin: 0.20,
    jasaMinOrder: 15000,
    layerRates: {
      '0.30': { compareRate: 400, serviceRate: 350 },
      '0.28': { compareRate: 500, serviceRate: 450 },
      '0.20': { compareRate: 700, serviceRate: 600 },
      '0.16': { compareRate: 900, serviceRate: 800 },
      '0.12': { compareRate: 1000, serviceRate: 900 },
      '0.10': { compareRate: 1200, serviceRate: 1100 }
    },

    // Pengaturan Pembukuan 3D Print
    bookStartDate: '2026-09-28',
    driveFolderUrl: '',
    minCashReserve3D: 200000,
    openingBalances3D: {
      Merchant: 0,
      'Bank usaha': 0,
      'Kas tunai': 0
    },
    openingAdvances3D: [
      { code: 'TL-MESIN', owner: 'Partner 3D', amount: 6383500, note: 'Talangan mesin printer 3D (28 Sep 2026)' },
      { code: 'TL-MODAL', owner: 'Saya', amount: 1000000, note: 'Talangan modal awal 3D Print (28 Sep 2026)' }
    ],
    allocationRates3D: {
      'Cicilan mesin': 0.40,
      'Cicilan modal': 0.10,
      'Stok tambahan': 0.20,
      'Cadangan usaha': 0.10,
      'Laba Saya': 0.10,
      'Laba Partner 3D': 0.10
    },

    // Pengaturan Pembukuan Robotika
    minCashReserveRobo: 200000,
    openingBalancesRobo: {
      Merchant: 0,
      'Bank usaha': 0,
      'Kas tunai': 0
    },
    openingAdvancesRobo: [
      { code: 'TL-ROBO', owner: 'Partner Robotika', amount: 0, note: 'Talangan modal stok awal Robotika' }
    ],
    allocationRatesRobo: {
      'Pengembalian modal / cicilan': 0.10,
      'Stok tambahan': 0.20,
      'Cadangan usaha': 0.10,
      'Laba Saya': 0.30,
      'Laba Partner Robotika': 0.30
    },

    // Nama Partner (bisa diubah oleh Super Owner)
    ownerName: 'Naufal (Saya)',
    partner3DName: 'Partner 3D Print',
    partnerRoboName: 'Partner Robotika',
    qrisMdrRate: 0.007 // 0.7% default MDR QRIS jika ingin simulasi potongan
  };

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
    const layerKey = Number(input.layer || 0.20).toFixed(2);
    const layerObj = cfg.layerRates[layerKey] || cfg.layerRates['0.20'] || { compareRate: 700, serviceRate: 600 };

    const billableGrams = petgGrams + supportGrams;
    const filamentCost = (billableGrams / 1000) * cfg.petgPerKg;
    const kwhUsed = measuredKwh !== null ? measuredKwh : (printHours * cfg.printerPowerWatts) / 1000;
    const electricityCost = kwhUsed * cfg.electricityPerKwh;
    const machineDepreciationPerHour = cfg.printerCost / Math.max(1, cfg.printerLifespanHours);
    const machineAndMaintenanceCost = printHours * (machineDepreciationPerHour + cfg.maintenancePerHour);
    const laborCost = activeHours * cfg.laborRatePerHour;

    const baseCost = filamentCost + electricityCost + machineAndMaintenanceCost + laborCost + packagingBatch + otherCost;
    const failureReserve = baseCost * cfg.failureMarginRate;
    const hppBatch = baseCost + failureReserve;
    const hppUnit = hppBatch / units;

    const platformFactor = Math.max(0.01, 1 - cfg.platformFeeRate);
    const breakEvenUnit = (hppBatch + discountBatch) / (units * platformFactor);

    // Tarif dasar berdasarkan layer
    const baseRatePerGram = layerObj.serviceRate;
    const compareRatePerGram = layerObj.compareRate;
    const baseTariffBatch = baseRatePerGram * billableGrams;
    const baseTariffProfit = baseTariffBatch * platformFactor - discountBatch - hppBatch;

    // Harga saran memilih yang terbesar antara: Tarif Dasar Layer, Batas Margin Jasa, atau Minimum Order
    const targetMargin = Math.min(0.95, Math.max(0.01, Number(cfg.jasaTargetMargin) || 0.20));
    const marginProtectedBatch = (hppBatch / (1 - targetMargin) + discountBatch) / platformFactor;
    const minOrderBatch = Number(cfg.jasaMinOrder) || 15000;

    const rawSuggestedBatch = Math.max(baseTariffBatch, marginProtectedBatch, minOrderBatch);
    const suggestedPriceUnit = ceilTo(rawSuggestedBatch / units, cfg.priceRounding);
    const suggestedBatchTotal = suggestedPriceUnit * units;
    const effectiveRatePerGram = billableGrams > 0 ? suggestedBatchTotal / billableGrams : 0;

    // Status Tarif Dasar
    let tariffStatus = 'Memenuhi target';
    if (billableGrams <= 0 || printHours <= 0) {
      tariffStatus = 'Lengkapi berat & jam cetak';
    } else if (baseTariffProfit < 0 || (baseTariffBatch * platformFactor - discountBatch) <= 0) {
      tariffStatus = 'Tarif dasar rugi (otomatis dinaikkan ke harga saran)';
    } else if ((baseTariffProfit / (baseTariffBatch * platformFactor - discountBatch)) < targetMargin) {
      tariffStatus = 'Margin tarif dasar di bawah target (otomatis dinaikkan)';
    } else if (baseTariffBatch < minOrderBatch) {
      tariffStatus = 'Di bawah minimum order (pakai minimum order)';
    }

    const activeSellingUnit = sellingPriceUnit !== null && sellingPriceUnit > 0 ? sellingPriceUnit : suggestedPriceUnit;
    const netRevenueBatch = activeSellingUnit * units * platformFactor - discountBatch;
    const actualProfitBatch = netRevenueBatch - hppBatch;
    const actualMargin = netRevenueBatch > 0 ? actualProfitBatch / netRevenueBatch : 0;

    return {
      units,
      layer: layerKey,
      billableGrams,
      filamentCost: Math.round(filamentCost),
      electricityCost: Math.round(electricityCost),
      machineAndMaintenanceCost: Math.round(machineAndMaintenanceCost),
      laborCost: Math.round(laborCost),
      packagingBatch: Math.round(packagingBatch),
      otherCost: Math.round(otherCost),
      failureReserve: Math.round(failureReserve),
      hppBatch: Math.round(hppBatch),
      hppUnit: Math.round(hppUnit),
      breakEvenUnit: Math.round(breakEvenUnit),
      baseRatePerGram,
      compareRatePerGram,
      baseTariffBatch: Math.round(baseTariffBatch),
      baseTariffProfit: Math.round(baseTariffProfit),
      suggestedPriceUnit: Math.round(suggestedPriceUnit),
      suggestedBatchTotal: Math.round(suggestedBatchTotal),
      effectiveRatePerGram: Math.round(effectiveRatePerGram),
      tariffStatus,
      activeSellingUnit: Math.round(activeSellingUnit),
      netRevenueBatch: Math.round(netRevenueBatch),
      actualProfitBatch: Math.round(actualProfitBatch),
      actualMargin
    };
  }

  /**
   * Kalkulator HPP Clicker Keyboard Custom (1-7 Tombol)
   */
  function calculateClicker(input, settings = DEFAULT_SETTINGS) {
    const cfg = { ...DEFAULT_SETTINGS, ...settings };
    const buttons = Math.min(7, Math.max(1, Math.floor(Number(input.buttons) || 5)));
    const units = Math.max(1, Math.floor(Number(input.units) || 1));
    const petgPerUnitGrams = Math.max(0, Number(input.petgPerUnitGrams) || (buttons * 3.5 + 6));
    const supportBatchGrams = Math.max(0, Number(input.supportBatchGrams) || 0);
    const printHoursBatch = Math.max(0, Number(input.printHoursBatch) || (units * (0.35 + buttons * 0.12)));
    const activeHoursBatch = Math.max(0, Number(input.activeHoursBatch) || (units * 0.05));
    const switchesPerUnit = input.switchesPerUnit !== undefined ? Math.max(0, Number(input.switchesPerUnit)) : buttons;
    const extraMaterialPerUnit = Math.max(0, Number(input.extraMaterialPerUnit) || 0);
    const discountBatch = Math.max(0, Number(input.discountBatch) || 0);
    const sellingPriceUnit = input.sellingPriceUnit !== '' && input.sellingPriceUnit !== null && input.sellingPriceUnit !== undefined
      ? Math.max(0, Number(input.sellingPriceUnit))
      : null;

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
   * Mendukung perhitungan HPP per unit dari kulakan batch (harga beli + ongkir kargo + kemasan)
   * maupun perhitungan langsung dari item katalog.
   */
  function calculateRobotikaItem(input, settings = DEFAULT_SETTINGS) {
    const cfg = { ...DEFAULT_SETTINGS, ...settings };
    const units = Math.max(1, Math.floor(Number(input.units) || 1));
    const buyPriceUnit = Math.max(0, Number(input.buyPriceUnit) || 0);
    const shippingAllocationUnit = Math.max(0, Number(input.shippingAllocationUnit) || 0);
    const packagingUnit = Math.max(0, Number(input.packagingUnit) || 0);
    const otherCostBatch = Math.max(0, Number(input.otherCostBatch) || 0);
    const discountBatch = Math.max(0, Number(input.discountBatch) || 0);

    const hppUnit = buyPriceUnit + shippingAllocationUnit + packagingUnit + (otherCostBatch / units);
    const hppBatch = hppUnit * units;
    const targetMargin = Math.min(0.90, Math.max(0.05, Number(input.targetMargin) || 0.30));
    const suggestedPriceUnit = ceilTo(hppUnit / (1 - targetMargin), cfg.priceRounding || 500);

    const sellingPriceUnit = input.sellingPriceUnit !== '' && input.sellingPriceUnit !== null && input.sellingPriceUnit !== undefined
      ? Math.max(0, Number(input.sellingPriceUnit))
      : suggestedPriceUnit;

    const netRevenueBatch = sellingPriceUnit * units - discountBatch;
    const profitBatch = netRevenueBatch - hppBatch;
    const actualMargin = netRevenueBatch > 0 ? profitBatch / netRevenueBatch : 0;

    return {
      units,
      buyPriceUnit: Math.round(buyPriceUnit),
      shippingAllocationUnit: Math.round(shippingAllocationUnit),
      packagingUnit: Math.round(packagingUnit),
      hppUnit: Math.round(hppUnit),
      hppBatch: Math.round(hppBatch),
      suggestedPriceUnit: Math.round(suggestedPriceUnit),
      sellingPriceUnit: Math.round(sellingPriceUnit),
      netRevenueBatch: Math.round(netRevenueBatch),
      profitBatch: Math.round(profitBatch),
      actualMargin
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

    for (const w of wages) {
      const amount = Math.round((Number(w.minutes) || 0) / 60 * (Number(w.ratePerHour) || settings.laborRatePerHour));
      wageByOrder[w.orderId] = (wageByOrder[w.orderId] || 0) + amount;
      totalWagesRecorded += amount;
      const workerKey = w.worker === 'Saya' ? 'Saya' : 'Partner';
      wageByWorker[workerKey].recorded += amount;
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
        remaining: Number(adv.amount) || 0
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

      // Talangan bertambah (jika dibayar pakai uang pribadi atau Talangan masuk)
      if (m.advanceCode && advancesMap[m.advanceCode]) {
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
      const initialHpp = Math.max(0, Number(o.initialHpp) || 0);
      const wageInHpp = Math.max(0, Number(o.wageInHpp) || 0);
      const recordedWage = wageByOrder[o.id] !== undefined ? wageByOrder[o.id] : wageInHpp;
      const adjustedHpp = unit === '3d-print' ? Math.max(0, initialHpp - wageInHpp + recordedWage) : initialHpp;
      const netPaid = paidByOrder[o.id] || 0;
      const orderReturn = returnByOrder[o.id] || 0;

      const effectiveBill = o.status === 'Batal' ? 0 : Math.max(0, netBill - orderReturn);
      const remainingBill = o.status === 'Batal' ? 0 : Math.max(0, effectiveBill - netPaid);
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
      mutations
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
    DEFAULT_SETTINGS,
    calculateJasaPrint,
    calculateClicker,
    calculateRobotikaItem,
    computeUnitSummary,
    computeSharedQrisReconciliation
  };
});
