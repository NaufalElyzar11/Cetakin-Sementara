'use strict';

const ROBOTIKA_PRESETS = require('../../data/robotika-audited-presets.json');

const CLICKER_PRESETS = {
  1: { petgPerUnitGrams: 8.842, supportBatchGrams: 2.0, printHoursBatch: 0.5, activeHoursBatch: 0.05, sellingPriceUnit: 14000 },
  2: { petgPerUnitGrams: 19.134, supportBatchGrams: 2.0, printHoursBatch: 0.7, activeHoursBatch: 0.05, sellingPriceUnit: 17000 },
  3: { petgPerUnitGrams: 28.526, supportBatchGrams: 3.0, printHoursBatch: 1.05, activeHoursBatch: 0.05, sellingPriceUnit: 21000 },
  4: { petgPerUnitGrams: 37.368, supportBatchGrams: 4.0, printHoursBatch: 1.4, activeHoursBatch: 0.05, sellingPriceUnit: 26000 },
  5: { petgPerUnitGrams: 46.21, supportBatchGrams: 5.0, printHoursBatch: 1.7, activeHoursBatch: 0.05, sellingPriceUnit: 32000 },
  6: { petgPerUnitGrams: 55.052, supportBatchGrams: 5.5, printHoursBatch: 2.1, activeHoursBatch: 0.05, sellingPriceUnit: 35000 },
  7: { petgPerUnitGrams: 62.894, supportBatchGrams: 6.0, printHoursBatch: 2.4, activeHoursBatch: 0.05, sellingPriceUnit: 38000 }
};

const DEFAULT_SETTINGS = {
  // Parameter HPP 3D Print & Clicker (dari Pengaturan Excel Keuangan_dan_HPP_3D_Print.xlsm)
  petgPerKg: 150000,
  electricityPerKwh: 1600,
  printerPowerWatts: 150,
  printerCost: 6300000,
  printerLifespanHours: 5000,
  maintenancePerHour: 1000,
  laborRatePerHour: 10000,
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

  // Parameter Khusus Jasa Print (dari tab Jasa Print)
  jasaTargetMargin: 0.20,
  jasaMinOrder: 10000,
  layerRates: {
    '0.30': { compareRate: 400, serviceRate: 350 },
    '0.28': { compareRate: 500, serviceRate: 450 },
    '0.20': { compareRate: 700, serviceRate: 600 },
    '0.16': { compareRate: 900, serviceRate: 800 },
    '0.12': { compareRate: 1000, serviceRate: 900 },
    '0.10': { compareRate: 1200, serviceRate: 1100 }
  },

  // Pengaturan Pembukuan 3D Print (sesuai Pengaturan & Ringkasan spreadsheet)
  bookStartDate: '2026-09-28',
  driveFolderUrl: '',
  minCashReserve3D: 1000000,
  openingBalances3D: {
    Merchant: 2500,
    'Bank usaha': 0,
    'Kas tunai': 0
  },
  openingAdvances3D: [
    { code: 'TL-MESIN', owner: 'Teman', amount: 6383500, note: 'Konfirmasi pengguna: 28 Sep 2026' },
    { code: 'TL-MODAL', owner: 'Saya', amount: 1000000, note: 'Konfirmasi pengguna: 28 Sep 2026' }
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
  totalBusinessCostRobo: 646853, // Rak Rako + Multimeter ZOYI + Branding SG90 + Nota/Stempel
  openingAdvancesRobo: [
    { code: 'TL-ROBO-PENGADAAN', owner: 'Partner Robotika', amount: 4913449, note: 'Pengadaan barang O01–O25 (audited 19 Okt 2026)' },
    { code: 'TL-ROBO-OPERASIONAL', owner: 'Partner Robotika', amount: 100000, note: 'Estimasi nota dan stempel toko' }
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

module.exports = { CLICKER_PRESETS, ROBOTIKA_PRESETS, DEFAULT_SETTINGS };
