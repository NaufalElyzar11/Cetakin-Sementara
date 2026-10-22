(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CetakinFinance = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CLICKER_PRESETS = {
    1: { petgPerUnitGrams: 8.842, supportBatchGrams: 2.0, printHoursBatch: 0.5, activeHoursBatch: 0.05, sellingPriceUnit: 14000 },
    2: { petgPerUnitGrams: 19.134, supportBatchGrams: 2.0, printHoursBatch: 0.7, activeHoursBatch: 0.05, sellingPriceUnit: 17000 },
    3: { petgPerUnitGrams: 28.526, supportBatchGrams: 3.0, printHoursBatch: 1.05, activeHoursBatch: 0.05, sellingPriceUnit: 21000 },
    4: { petgPerUnitGrams: 37.368, supportBatchGrams: 4.0, printHoursBatch: 1.4, activeHoursBatch: 0.05, sellingPriceUnit: 26000 },
    5: { petgPerUnitGrams: 46.21, supportBatchGrams: 5.0, printHoursBatch: 1.7, activeHoursBatch: 0.05, sellingPriceUnit: 32000 },
    6: { petgPerUnitGrams: 55.052, supportBatchGrams: 5.5, printHoursBatch: 2.1, activeHoursBatch: 0.05, sellingPriceUnit: 35000 },
    7: { petgPerUnitGrams: 62.894, supportBatchGrams: 6.0, printHoursBatch: 2.4, activeHoursBatch: 0.05, sellingPriceUnit: 38000 }
  };

  const ROBOTIKA_PRESETS = [
    {
      "sku": "MPU",
      "name": "MPU6050 Sensor Gyroscope Accelerometer 3 AXIS Gyro GY-521",
      "sellUnitQty": 1,
      "hppStok": 18375,
      "alokasiBiayaUsaha": 3549.76,
      "kemasan": 200,
      "biayaPenuh": 22124.76,
      "acuanBanjar": 34850,
      "acuanAdawwino": 45000,
      "hargaJualUsulan": 30000,
      "labaKotor": 11625,
      "sisaLabaBersih": 7875.24,
      "marginBersih": 0.2625,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "https://shopee.co.id/product/142313672/25259881758 | Indeks web; dirayapi 4 bulan lalu",
      "hargaMinimum": 22150,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "BB",
      "name": "Breadboard 400 Lubang Arduino Raspberry Pi SOLDERLESS 400 Titik 400P",
      "sellUnitQty": 1,
      "hppStok": 7845,
      "alokasiBiayaUsaha": 1228.82,
      "kemasan": 200,
      "biayaPenuh": 9273.82,
      "acuanBanjar": 15000,
      "acuanAdawwino": null,
      "hargaJualUsulan": 12000,
      "labaKotor": 4155,
      "sisaLabaBersih": 2726.18,
      "marginBersih": 0.2272,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "https://shopee.co.id/product/142313672/22850754620 | Angka terlihat di etalase terindeks",
      "hargaMinimum": 9300,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "BAT",
      "name": "Baterai Lithium-ion 18650 3,7 V 1500 mAh Visero",
      "sellUnitQty": 1,
      "hppStok": 11160,
      "alokasiBiayaUsaha": 2063.05,
      "kemasan": 200,
      "biayaPenuh": 13423.05,
      "acuanBanjar": null,
      "acuanAdawwino": null,
      "hargaJualUsulan": 18000,
      "labaKotor": 6840,
      "sisaLabaBersih": 4576.95,
      "marginBersih": 0.2543,
      "penanda": "Menutup biaya; tanpa pembanding",
      "catatan": "",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 13450,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "CLEAN",
      "name": "Pembersih Timah TIP Solder Desoldering Iron Mesh - G3137",
      "sellUnitQty": 1,
      "hppStok": 14057.5,
      "alokasiBiayaUsaha": 2250.25,
      "kemasan": 200,
      "biayaPenuh": 16507.75,
      "acuanBanjar": null,
      "acuanAdawwino": null,
      "hargaJualUsulan": 21500,
      "labaKotor": 7442.5,
      "sisaLabaBersih": 4992.25,
      "marginBersih": 0.2322,
      "penanda": "Menutup biaya; tanpa pembanding",
      "catatan": "",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 16550,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "HEAT1",
      "name": "Selongsong Pelapis Kabel Heat Shrink Tube DHS3 1 mm x 40 mm — Satuan 1 potong",
      "sellUnitQty": 1,
      "hppStok": 79.51,
      "alokasiBiayaUsaha": 68.51,
      "kemasan": 0,
      "biayaPenuh": 148.02,
      "acuanBanjar": null,
      "acuanAdawwino": null,
      "hargaJualUsulan": 300,
      "labaKotor": 220.49,
      "sisaLabaBersih": 151.98,
      "marginBersih": 0.5066,
      "penanda": "Menutup biaya; tanpa pembanding",
      "catatan": "Alokasi rata-rata per potong. Komposisi 328 pcs dari pembahasan/model DHS3, bukan rincian ukuran pada PDF ini. HPP rata-rata campuran; bukan biaya terpisah tiap ukuran. Kemasan satuan digabung pesanan.",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 150,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "HEAT2",
      "name": "Selongsong Pelapis Kabel Heat Shrink Tube DHS3 2 mm x 40 mm — Satuan 1 potong",
      "sellUnitQty": 1,
      "hppStok": 79.51,
      "alokasiBiayaUsaha": 68.51,
      "kemasan": 0,
      "biayaPenuh": 148.02,
      "acuanBanjar": null,
      "acuanAdawwino": null,
      "hargaJualUsulan": 300,
      "labaKotor": 220.49,
      "sisaLabaBersih": 151.98,
      "marginBersih": 0.5066,
      "penanda": "Menutup biaya; tanpa pembanding",
      "catatan": "Alokasi rata-rata per potong. Komposisi 328 pcs dari pembahasan/model DHS3, bukan rincian ukuran pada PDF ini. HPP rata-rata campuran; bukan biaya terpisah tiap ukuran. Kemasan satuan digabung pesanan.",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 150,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "HEAT3",
      "name": "Selongsong Pelapis Kabel Heat Shrink Tube DHS3 3 mm x 40 mm — Satuan 1 potong",
      "sellUnitQty": 1,
      "hppStok": 79.51,
      "alokasiBiayaUsaha": 84.04,
      "kemasan": 0,
      "biayaPenuh": 163.55,
      "acuanBanjar": null,
      "acuanAdawwino": null,
      "hargaJualUsulan": 350,
      "labaKotor": 270.49,
      "sisaLabaBersih": 186.45,
      "marginBersih": 0.5327,
      "penanda": "Menutup biaya; tanpa pembanding",
      "catatan": "Alokasi rata-rata per potong. Komposisi 328 pcs dari pembahasan/model DHS3, bukan rincian ukuran pada PDF ini. HPP rata-rata campuran; bukan biaya terpisah tiap ukuran. Kemasan satuan digabung pesanan.",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 200,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "HEAT4",
      "name": "Selongsong Pelapis Kabel Heat Shrink Tube DHS3 4 mm x 40 mm — Satuan 1 potong",
      "sellUnitQty": 1,
      "hppStok": 79.51,
      "alokasiBiayaUsaha": 84.04,
      "kemasan": 0,
      "biayaPenuh": 163.55,
      "acuanBanjar": null,
      "acuanAdawwino": null,
      "hargaJualUsulan": 350,
      "labaKotor": 270.49,
      "sisaLabaBersih": 186.45,
      "marginBersih": 0.5327,
      "penanda": "Menutup biaya; tanpa pembanding",
      "catatan": "Alokasi rata-rata per potong. Komposisi 328 pcs dari pembahasan/model DHS3, bukan rincian ukuran pada PDF ini. HPP rata-rata campuran; bukan biaya terpisah tiap ukuran. Kemasan satuan digabung pesanan.",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 200,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "HEAT6",
      "name": "Selongsong Pelapis Kabel Heat Shrink Tube DHS3 6 mm x 40 mm — Satuan 1 potong",
      "sellUnitQty": 1,
      "hppStok": 79.51,
      "alokasiBiayaUsaha": 99.58,
      "kemasan": 0,
      "biayaPenuh": 179.09,
      "acuanBanjar": null,
      "acuanAdawwino": null,
      "hargaJualUsulan": 400,
      "labaKotor": 320.49,
      "sisaLabaBersih": 220.91,
      "marginBersih": 0.5523,
      "penanda": "Menutup biaya; tanpa pembanding",
      "catatan": "Alokasi rata-rata per potong. Komposisi 328 pcs dari pembahasan/model DHS3, bukan rincian ukuran pada PDF ini. HPP rata-rata campuran; bukan biaya terpisah tiap ukuran. Kemasan satuan digabung pesanan.",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 200,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "HEAT8",
      "name": "Selongsong Pelapis Kabel Heat Shrink Tube DHS3 8 mm x 80 mm — Satuan 1 potong",
      "sellUnitQty": 1,
      "hppStok": 79.51,
      "alokasiBiayaUsaha": 99.58,
      "kemasan": 0,
      "biayaPenuh": 179.09,
      "acuanBanjar": null,
      "acuanAdawwino": null,
      "hargaJualUsulan": 400,
      "labaKotor": 320.49,
      "sisaLabaBersih": 220.91,
      "marginBersih": 0.5523,
      "penanda": "Menutup biaya; tanpa pembanding",
      "catatan": "Alokasi rata-rata per potong. Komposisi 328 pcs dari pembahasan/model DHS3, bukan rincian ukuran pada PDF ini. HPP rata-rata campuran; bukan biaya terpisah tiap ukuran. Kemasan satuan digabung pesanan.",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 200,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "HEAT10",
      "name": "Selongsong Pelapis Kabel Heat Shrink Tube DHS3 10 mm x 80 mm — Satuan 1 potong",
      "sellUnitQty": 1,
      "hppStok": 79.51,
      "alokasiBiayaUsaha": 130.65,
      "kemasan": 0,
      "biayaPenuh": 210.16,
      "acuanBanjar": null,
      "acuanAdawwino": null,
      "hargaJualUsulan": 500,
      "labaKotor": 420.49,
      "sisaLabaBersih": 289.84,
      "marginBersih": 0.5797,
      "penanda": "Menutup biaya; tanpa pembanding",
      "catatan": "Alokasi rata-rata per potong. Komposisi 328 pcs dari pembahasan/model DHS3, bukan rincian ukuran pada PDF ini. HPP rata-rata campuran; bukan biaya terpisah tiap ukuran. Kemasan satuan digabung pesanan.",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 250,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "HEAT14",
      "name": "Selongsong Pelapis Kabel Heat Shrink Tube DHS3 14 mm x 80 mm — Satuan 1 potong",
      "sellUnitQty": 1,
      "hppStok": 79.51,
      "alokasiBiayaUsaha": 130.65,
      "kemasan": 0,
      "biayaPenuh": 210.16,
      "acuanBanjar": null,
      "acuanAdawwino": null,
      "hargaJualUsulan": 500,
      "labaKotor": 420.49,
      "sisaLabaBersih": 289.84,
      "marginBersih": 0.5797,
      "penanda": "Menutup biaya; tanpa pembanding",
      "catatan": "Alokasi rata-rata per potong. Komposisi 328 pcs dari pembahasan/model DHS3, bukan rincian ukuran pada PDF ini. HPP rata-rata campuran; bukan biaya terpisah tiap ukuran. Kemasan satuan digabung pesanan.",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 250,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "TAPE",
      "name": "Isolasi Solasi Selotip Listrik Lakban Kabel tape Hitam PVC 20 Yard",
      "sellUnitQty": 1,
      "hppStok": 6737.37,
      "alokasiBiayaUsaha": 330.16,
      "kemasan": 200,
      "biayaPenuh": 7267.53,
      "acuanBanjar": null,
      "acuanAdawwino": null,
      "hargaJualUsulan": 8000,
      "labaKotor": 1262.63,
      "sisaLabaBersih": 732.47,
      "marginBersih": 0.0916,
      "penanda": "Menutup biaya; tanpa pembanding",
      "catatan": "",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 7300,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "SP20",
      "name": "Spacer Nylon Plastik Penyangga Dudukan PCB Main Board Stand off Standoff M3 20mm",
      "sellUnitQty": 1,
      "hppStok": 2937.37,
      "alokasiBiayaUsaha": 0,
      "kemasan": 200,
      "biayaPenuh": 3137.37,
      "acuanBanjar": null,
      "acuanAdawwino": null,
      "hargaJualUsulan": 2050,
      "labaKotor": -887.37,
      "sisaLabaBersih": -1087.37,
      "marginBersih": -0.5304,
      "penanda": "MERAH: harga belum menutup biaya",
      "catatan": "",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 3150,
      "statusBiaya": "BELUM MENUTUP"
    },
    {
      "sku": "SP8",
      "name": "Spacer Nylon Plastik Penyangga Dudukan PCB Main Board Stand off Standoff M3 8mm",
      "sellUnitQty": 1,
      "hppStok": 718,
      "alokasiBiayaUsaha": 118.69,
      "kemasan": 200,
      "biayaPenuh": 1036.69,
      "acuanBanjar": null,
      "acuanAdawwino": null,
      "hargaJualUsulan": 1300,
      "labaKotor": 582,
      "sisaLabaBersih": 263.31,
      "marginBersih": 0.2025,
      "penanda": "Menutup biaya; tanpa pembanding",
      "catatan": "",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 1050,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "SP15",
      "name": "Spacer Nylon Plastik Penyangga Dudukan PCB Main Board Stand off Standoff M3 15mm",
      "sellUnitQty": 1,
      "hppStok": 1018,
      "alokasiBiayaUsaha": 165.29,
      "kemasan": 200,
      "biayaPenuh": 1383.29,
      "acuanBanjar": null,
      "acuanAdawwino": null,
      "hargaJualUsulan": 1750,
      "labaKotor": 732,
      "sisaLabaBersih": 366.71,
      "marginBersih": 0.2095,
      "penanda": "Menutup biaya; tanpa pembanding",
      "catatan": "",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 1400,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "SPONGE",
      "name": "Spon Spons Busa Sponge Cleaner PEMBERSIH MATA SOLDER 5 x 3,5 cm",
      "sellUnitQty": 1,
      "hppStok": 818,
      "alokasiBiayaUsaha": 149.76,
      "kemasan": 200,
      "biayaPenuh": 1167.76,
      "acuanBanjar": null,
      "acuanAdawwino": null,
      "hargaJualUsulan": 1500,
      "labaKotor": 682,
      "sisaLabaBersih": 332.24,
      "marginBersih": 0.2215,
      "penanda": "Menutup biaya; tanpa pembanding",
      "catatan": "",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 1200,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "FLUX1",
      "name": "Flux Pasta Solder Anti-Oksidasi Cream Paste untuk PCB SMD",
      "sellUnitQty": 1,
      "hppStok": 3018,
      "alokasiBiayaUsaha": 1175.07,
      "kemasan": 200,
      "biayaPenuh": 4393.07,
      "acuanBanjar": null,
      "acuanAdawwino": null,
      "hargaJualUsulan": 7000,
      "labaKotor": 3982,
      "sisaLabaBersih": 2606.93,
      "marginBersih": 0.3724,
      "penanda": "Menutup biaya; tanpa pembanding",
      "catatan": "",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 4400,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "FLUX2",
      "name": "Flux Pasta Minyak Solder Amtech 10cc RMA-223 RMA223 Suntik Timah Rosin",
      "sellUnitQty": 1,
      "hppStok": 3618,
      "alokasiBiayaUsaha": 522.6,
      "kemasan": 200,
      "biayaPenuh": 4340.6,
      "acuanBanjar": 6950,
      "acuanAdawwino": 8500,
      "hargaJualUsulan": 5500,
      "labaKotor": 1882,
      "sisaLabaBersih": 1159.4,
      "marginBersih": 0.2108,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 4350,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "PCB5",
      "name": "PCB Hole Single Side FR4 Fiber 5x7cm",
      "sellUnitQty": 1,
      "hppStok": 2566.75,
      "alokasiBiayaUsaha": 321.03,
      "kemasan": 200,
      "biayaPenuh": 3087.78,
      "acuanBanjar": null,
      "acuanAdawwino": 4000,
      "hargaJualUsulan": 3800,
      "labaKotor": 1233.25,
      "sisaLabaBersih": 712.22,
      "marginBersih": 0.1874,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 3100,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "PCB4",
      "name": "PCB Hole Double Side FR4 Fiber 4x6cm",
      "sellUnitQty": 1,
      "hppStok": 5566.75,
      "alokasiBiayaUsaha": 771.55,
      "kemasan": 200,
      "biayaPenuh": 6538.3,
      "acuanBanjar": null,
      "acuanAdawwino": null,
      "hargaJualUsulan": 8250,
      "labaKotor": 2683.25,
      "sisaLabaBersih": 1711.7,
      "marginBersih": 0.2075,
      "penanda": "Menutup biaya; tanpa pembanding",
      "catatan": "",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 6550,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "MF30",
      "name": "Kabel Jumper Dupont Male to Female 30 cm — Satuan 1 kabel",
      "sellUnitQty": 1,
      "hppStok": 300.33,
      "alokasiBiayaUsaha": 93.11,
      "kemasan": 0,
      "biayaPenuh": 393.44,
      "acuanBanjar": 800,
      "acuanAdawwino": null,
      "hargaJualUsulan": 700,
      "labaKotor": 399.67,
      "sisaLabaBersih": 306.56,
      "marginBersih": 0.4379,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Kemasan satuan digabung pesanan.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/18987104570 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 400,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "MF30",
      "name": "Kabel Jumper Dupont Male to Female 30 cm — Paket 10 kabel",
      "sellUnitQty": 10,
      "hppStok": 3003.3,
      "alokasiBiayaUsaha": 931.08,
      "kemasan": 500,
      "biayaPenuh": 4434.38,
      "acuanBanjar": 8000,
      "acuanAdawwino": 8000,
      "hargaJualUsulan": 6500,
      "labaKotor": 3496.7,
      "sisaLabaBersih": 2065.62,
      "marginBersih": 0.3178,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Pembanding paket merupakan ekuivalen harga satuan x jumlah, bukan penawaran paket terkonfirmasi.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/18987104570 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 4450,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "MF30",
      "name": "Kabel Jumper Dupont Male to Female 30 cm — Paket 40 kabel",
      "sellUnitQty": 40,
      "hppStok": 12013.2,
      "alokasiBiayaUsaha": 3724.31,
      "kemasan": 500,
      "biayaPenuh": 16237.51,
      "acuanBanjar": 32000,
      "acuanAdawwino": 32000,
      "hargaJualUsulan": 25500,
      "labaKotor": 13486.8,
      "sisaLabaBersih": 9262.49,
      "marginBersih": 0.3632,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Pembanding paket merupakan ekuivalen harga satuan x jumlah, bukan penawaran paket terkonfirmasi.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/18987104570 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 16250,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "MQ",
      "name": "MQ-2 MQ2 LPG Butane Methane Gas Smoke Sensor Module for Arduino",
      "sellUnitQty": 1,
      "hppStok": 18350,
      "alokasiBiayaUsaha": 2501.14,
      "kemasan": 200,
      "biayaPenuh": 21051.14,
      "acuanBanjar": 29850,
      "acuanAdawwino": null,
      "hargaJualUsulan": 26600,
      "labaKotor": 8250,
      "sisaLabaBersih": 5548.86,
      "marginBersih": 0.2086,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "https://shopee.co.id/product/142313672/18282890297 | Listing tunggal MQ2; listing multi-varian tidak dipakai",
      "hargaMinimum": 21100,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "PIR",
      "name": "HC-SR501 PIR Motion Sensor Module",
      "sellUnitQty": 1,
      "hppStok": 12004,
      "alokasiBiayaUsaha": 1645.47,
      "kemasan": 200,
      "biayaPenuh": 13849.47,
      "acuanBanjar": 19888,
      "acuanAdawwino": 22000,
      "hargaJualUsulan": 17500,
      "labaKotor": 5496,
      "sisaLabaBersih": 3650.53,
      "marginBersih": 0.2086,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "HPP_Harga_Di_Bawah_Banjar_Robotika.xlsx / reprice-results, 13-10-2026 | Acuan historis; belum diperiksa ulang",
      "hargaMinimum": 13850,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "SG",
      "name": "TowerPro Motor Servo SG90 SG-90 9G 180 derajat",
      "sellUnitQty": 1,
      "hppStok": 16669,
      "alokasiBiayaUsaha": 2526.31,
      "kemasan": 200,
      "biayaPenuh": 19395.31,
      "acuanBanjar": 29850,
      "acuanAdawwino": 27500,
      "hargaJualUsulan": 25000,
      "labaKotor": 8331,
      "sisaLabaBersih": 5604.69,
      "marginBersih": 0.2242,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "https://shopee.co.id/product/142313672/21982872384 | Indeks web; dirayapi 2 bulan lalu",
      "hargaMinimum": 19400,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "J20MM",
      "name": "Kabel Jumper Dupont Male to Male 20 cm — Satuan 1 kabel",
      "sellUnitQty": 1,
      "hppStok": 279.2,
      "alokasiBiayaUsaha": 68.6,
      "kemasan": 0,
      "biayaPenuh": 347.8,
      "acuanBanjar": 700,
      "acuanAdawwino": null,
      "hargaJualUsulan": 600,
      "labaKotor": 320.8,
      "sisaLabaBersih": 252.2,
      "marginBersih": 0.4203,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Biaya satu paket 120 kabel dibagi rata: MM40 + MF40 + FF40. Kemasan satuan digabung pesanan.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/21691677272 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 350,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "J20MM",
      "name": "Kabel Jumper Dupont Male to Male 20 cm — Paket 10 kabel",
      "sellUnitQty": 10,
      "hppStok": 2792,
      "alokasiBiayaUsaha": 686.03,
      "kemasan": 500,
      "biayaPenuh": 3978.03,
      "acuanBanjar": 7000,
      "acuanAdawwino": 6000,
      "hargaJualUsulan": 5500,
      "labaKotor": 2708,
      "sisaLabaBersih": 1521.97,
      "marginBersih": 0.2767,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Biaya satu paket 120 kabel dibagi rata: MM40 + MF40 + FF40. Pembanding paket merupakan ekuivalen harga satuan x jumlah, bukan penawaran paket terkonfirmasi.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/21691677272 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 4000,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "J20MM",
      "name": "Kabel Jumper Dupont Male to Male 20 cm — Paket 40 kabel",
      "sellUnitQty": 40,
      "hppStok": 11168,
      "alokasiBiayaUsaha": 2744.11,
      "kemasan": 500,
      "biayaPenuh": 14412.11,
      "acuanBanjar": 28000,
      "acuanAdawwino": 24000,
      "hargaJualUsulan": 21500,
      "labaKotor": 10332,
      "sisaLabaBersih": 7087.89,
      "marginBersih": 0.3297,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Biaya satu paket 120 kabel dibagi rata: MM40 + MF40 + FF40. Pembanding paket merupakan ekuivalen harga satuan x jumlah, bukan penawaran paket terkonfirmasi.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/21691677272 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 14450,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "J20MF",
      "name": "Kabel Jumper Dupont Male to Female 20 cm — Satuan 1 kabel",
      "sellUnitQty": 1,
      "hppStok": 279.2,
      "alokasiBiayaUsaha": 68.6,
      "kemasan": 0,
      "biayaPenuh": 347.8,
      "acuanBanjar": 700,
      "acuanAdawwino": null,
      "hargaJualUsulan": 600,
      "labaKotor": 320.8,
      "sisaLabaBersih": 252.2,
      "marginBersih": 0.4203,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Biaya satu paket 120 kabel dibagi rata: MM40 + MF40 + FF40. Kemasan satuan digabung pesanan.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/21691677272 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 350,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "J20MF",
      "name": "Kabel Jumper Dupont Male to Female 20 cm — Paket 10 kabel",
      "sellUnitQty": 10,
      "hppStok": 2792,
      "alokasiBiayaUsaha": 686.03,
      "kemasan": 500,
      "biayaPenuh": 3978.03,
      "acuanBanjar": 7000,
      "acuanAdawwino": null,
      "hargaJualUsulan": 5500,
      "labaKotor": 2708,
      "sisaLabaBersih": 1521.97,
      "marginBersih": 0.2767,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Biaya satu paket 120 kabel dibagi rata: MM40 + MF40 + FF40. Pembanding paket merupakan ekuivalen harga satuan x jumlah, bukan penawaran paket terkonfirmasi.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/21691677272 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 4000,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "J20MF",
      "name": "Kabel Jumper Dupont Male to Female 20 cm — Paket 40 kabel",
      "sellUnitQty": 40,
      "hppStok": 11168,
      "alokasiBiayaUsaha": 2744.11,
      "kemasan": 500,
      "biayaPenuh": 14412.11,
      "acuanBanjar": 28000,
      "acuanAdawwino": null,
      "hargaJualUsulan": 21500,
      "labaKotor": 10332,
      "sisaLabaBersih": 7087.89,
      "marginBersih": 0.3297,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Biaya satu paket 120 kabel dibagi rata: MM40 + MF40 + FF40. Pembanding paket merupakan ekuivalen harga satuan x jumlah, bukan penawaran paket terkonfirmasi.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/21691677272 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 14450,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "J20FF",
      "name": "Kabel Jumper Dupont Female to Female 20 cm — Satuan 1 kabel",
      "sellUnitQty": 1,
      "hppStok": 279.2,
      "alokasiBiayaUsaha": 68.6,
      "kemasan": 0,
      "biayaPenuh": 347.8,
      "acuanBanjar": 700,
      "acuanAdawwino": null,
      "hargaJualUsulan": 600,
      "labaKotor": 320.8,
      "sisaLabaBersih": 252.2,
      "marginBersih": 0.4203,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Biaya satu paket 120 kabel dibagi rata: MM40 + MF40 + FF40. Kemasan satuan digabung pesanan.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/21691677272 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 350,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "J20FF",
      "name": "Kabel Jumper Dupont Female to Female 20 cm — Paket 10 kabel",
      "sellUnitQty": 10,
      "hppStok": 2792,
      "alokasiBiayaUsaha": 686.03,
      "kemasan": 500,
      "biayaPenuh": 3978.03,
      "acuanBanjar": 7000,
      "acuanAdawwino": 6000,
      "hargaJualUsulan": 5500,
      "labaKotor": 2708,
      "sisaLabaBersih": 1521.97,
      "marginBersih": 0.2767,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Biaya satu paket 120 kabel dibagi rata: MM40 + MF40 + FF40. Pembanding paket merupakan ekuivalen harga satuan x jumlah, bukan penawaran paket terkonfirmasi.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/21691677272 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 4000,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "J20FF",
      "name": "Kabel Jumper Dupont Female to Female 20 cm — Paket 40 kabel",
      "sellUnitQty": 40,
      "hppStok": 11168,
      "alokasiBiayaUsaha": 2744.11,
      "kemasan": 500,
      "biayaPenuh": 14412.11,
      "acuanBanjar": 28000,
      "acuanAdawwino": 24000,
      "hargaJualUsulan": 21500,
      "labaKotor": 10332,
      "sisaLabaBersih": 7087.89,
      "marginBersih": 0.3297,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Biaya satu paket 120 kabel dibagi rata: MM40 + MF40 + FF40. Pembanding paket merupakan ekuivalen harga satuan x jumlah, bukan penawaran paket terkonfirmasi.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/21691677272 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 14450,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "PCB9",
      "name": "PCB DOT MATRIX THRU HOLE DOUBLE LAYER 9X15CM",
      "sellUnitQty": 1,
      "hppStok": 15154,
      "alokasiBiayaUsaha": 2002.78,
      "kemasan": 200,
      "biayaPenuh": 17356.78,
      "acuanBanjar": 22950,
      "acuanAdawwino": 26000,
      "hargaJualUsulan": 21800,
      "labaKotor": 6646,
      "sisaLabaBersih": 4443.22,
      "marginBersih": 0.2038,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "HPP_Harga_Di_Bawah_Banjar_Robotika.xlsx / reprice-results, 13-10-2026 | Acuan historis; belum diperiksa ulang",
      "hargaMinimum": 17400,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "L298B",
      "name": "Motor Driver L298N 2 Channel Board H-Bridge 5A",
      "sellUnitQty": 1,
      "hppStok": 42504,
      "alokasiBiayaUsaha": 5777.8,
      "kemasan": 200,
      "biayaPenuh": 48481.8,
      "acuanBanjar": null,
      "acuanAdawwino": null,
      "hargaJualUsulan": 61300,
      "labaKotor": 18796,
      "sisaLabaBersih": 12818.2,
      "marginBersih": 0.2091,
      "penanda": "Menutup biaya; tanpa pembanding",
      "catatan": "Judul 5A; varian berbeda dari L298N biasa. Jangan menyamakan pembanding tanpa pemeriksaan.",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 48500,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "MM30",
      "name": "Kabel Jumper Dupont Male to Male 30 cm — Satuan 1 kabel",
      "sellUnitQty": 1,
      "hppStok": 328.35,
      "alokasiBiayaUsaha": 84.4,
      "kemasan": 0,
      "biayaPenuh": 412.75,
      "acuanBanjar": 800,
      "acuanAdawwino": null,
      "hargaJualUsulan": 700,
      "labaKotor": 371.65,
      "sisaLabaBersih": 287.25,
      "marginBersih": 0.4104,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Kemasan satuan digabung pesanan.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/18987104570 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 450,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "MM30",
      "name": "Kabel Jumper Dupont Male to Male 30 cm — Paket 10 kabel",
      "sellUnitQty": 10,
      "hppStok": 3283.5,
      "alokasiBiayaUsaha": 844.02,
      "kemasan": 500,
      "biayaPenuh": 4627.52,
      "acuanBanjar": 8000,
      "acuanAdawwino": null,
      "hargaJualUsulan": 6500,
      "labaKotor": 3216.5,
      "sisaLabaBersih": 1872.48,
      "marginBersih": 0.2881,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Pembanding paket merupakan ekuivalen harga satuan x jumlah, bukan penawaran paket terkonfirmasi.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/18987104570 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 4650,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "MM30",
      "name": "Kabel Jumper Dupont Male to Male 30 cm — Paket 40 kabel",
      "sellUnitQty": 40,
      "hppStok": 13134,
      "alokasiBiayaUsaha": 3376.08,
      "kemasan": 500,
      "biayaPenuh": 17010.08,
      "acuanBanjar": 32000,
      "acuanAdawwino": null,
      "hargaJualUsulan": 25500,
      "labaKotor": 12366,
      "sisaLabaBersih": 8489.92,
      "marginBersih": 0.3329,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Pembanding paket merupakan ekuivalen harga satuan x jumlah, bukan penawaran paket terkonfirmasi.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/18987104570 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 17050,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "L298",
      "name": "L298N L298 DUAL H BRIDGE STEPPER MOTOR DRIVER MODULE",
      "sellUnitQty": 1,
      "hppStok": 22807.5,
      "alokasiBiayaUsaha": 1659.92,
      "kemasan": 200,
      "biayaPenuh": 24667.42,
      "acuanBanjar": 29850,
      "acuanAdawwino": 35000,
      "hargaJualUsulan": 28350,
      "labaKotor": 5542.5,
      "sisaLabaBersih": 3682.58,
      "marginBersih": 0.1299,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "HPP_Harga_Di_Bawah_Banjar_Robotika.xlsx / reprice-results, 13-10-2026 | Acuan historis; belum diperiksa ulang",
      "hargaMinimum": 24700,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "WHEEL",
      "name": "WHEEL RODA RUBBER FOR SMART ROBOT CAR 4WD 2WD",
      "sellUnitQty": 1,
      "hppStok": 7074,
      "alokasiBiayaUsaha": 504.31,
      "kemasan": 200,
      "biayaPenuh": 7778.31,
      "acuanBanjar": null,
      "acuanAdawwino": 12000,
      "hargaJualUsulan": 10450,
      "labaKotor": 3376,
      "sisaLabaBersih": 2671.69,
      "marginBersih": 0.2557,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 7800,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "MOTOR",
      "name": "MOTOR DC GEARBOX 1/48 DUAL SHAFT FOR SMART CHASSIS 4WD 2WD",
      "sellUnitQty": 1,
      "hppStok": 7404,
      "alokasiBiayaUsaha": 527.84,
      "kemasan": 200,
      "biayaPenuh": 8131.84,
      "acuanBanjar": null,
      "acuanAdawwino": 18000,
      "hargaJualUsulan": 15000,
      "labaKotor": 7596,
      "sisaLabaBersih": 6868.16,
      "marginBersih": 0.4579,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 8150,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "Motor",
      "name": "Motor DC Gearbox Kuning dan Roda Smart Car Robot Wheel",
      "sellUnitQty": 1,
      "hppStok": 14478,
      "alokasiBiayaUsaha": 1032.15,
      "kemasan": 200,
      "biayaPenuh": 15710.15,
      "acuanBanjar": 19950,
      "acuanAdawwino": null,
      "hargaJualUsulan": 18000,
      "labaKotor": 3522,
      "sisaLabaBersih": 2289.85,
      "marginBersih": 0.1272,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "1 set = 1 motor + 1 roda dari stok yang sama, maksimal 10 set. HPP dan alokasi menjumlahkan kedua komponen; bukan stok baru.",
      "sumberPembanding": "",
      "hargaMinimum": 15750,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "PCB8",
      "name": "PCB Dot Matrix Thru Hole Single Layer 8x12cm",
      "sellUnitQty": 1,
      "hppStok": 15426.67,
      "alokasiBiayaUsaha": 2104.48,
      "kemasan": 200,
      "biayaPenuh": 17731.15,
      "acuanBanjar": 24985,
      "acuanAdawwino": null,
      "hargaJualUsulan": 22400,
      "labaKotor": 6973.33,
      "sisaLabaBersih": 4668.85,
      "marginBersih": 0.2084,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "HPP_Harga_Di_Bawah_Banjar_Robotika.xlsx / reprice-results, 13-10-2026 | Acuan historis; belum diperiksa ulang",
      "hargaMinimum": 17750,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "DHT22",
      "name": "Module DHT22 Temperature Humidity Sensor DHT-22 2302 Suhu Modul",
      "sellUnitQty": 1,
      "hppStok": 21911.84,
      "alokasiBiayaUsaha": 3072.26,
      "kemasan": 200,
      "biayaPenuh": 25184.1,
      "acuanBanjar": 36000,
      "acuanAdawwino": 55000,
      "hargaJualUsulan": 32000,
      "labaKotor": 10088.16,
      "sisaLabaBersih": 6815.9,
      "marginBersih": 0.213,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "https://shopee.co.id/product/142313672/22151131487 | Indeks web; dirayapi 3 bulan lalu",
      "hargaMinimum": 25200,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "FLAME",
      "name": "Flame Infrared Modul Module Sensor Detector Api Kebakaran Arduino",
      "sellUnitQty": 1,
      "hppStok": 3871.84,
      "alokasiBiayaUsaha": 909.78,
      "kemasan": 200,
      "biayaPenuh": 4981.62,
      "acuanBanjar": 9950,
      "acuanAdawwino": 13000,
      "hargaJualUsulan": 7000,
      "labaKotor": 3128.16,
      "sisaLabaBersih": 2018.38,
      "marginBersih": 0.2883,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "HPP_Harga_Di_Bawah_Banjar_Robotika.xlsx / reprice-results, 13-10-2026 | Acuan historis; belum diperiksa ulang",
      "hargaMinimum": 5000,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "HC",
      "name": "Ultrasonic Sensor HC-SR04 HCSR04 Jarak Arduino",
      "sellUnitQty": 1,
      "hppStok": 11319.84,
      "alokasiBiayaUsaha": 2634.8,
      "kemasan": 200,
      "biayaPenuh": 14154.63,
      "acuanBanjar": 23880,
      "acuanAdawwino": 22000,
      "hargaJualUsulan": 20000,
      "labaKotor": 8680.16,
      "sisaLabaBersih": 5845.37,
      "marginBersih": 0.2923,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "https://shopee.co.id/product/142313672/17298464092 | Indeks web 19-10-2026; dirayapi 3 bulan lalu",
      "hargaMinimum": 14200,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "PUSHS",
      "name": "Push Button 4p Ukuran Standar 6x6x4.3mm",
      "sellUnitQty": 1,
      "hppStok": 292.84,
      "alokasiBiayaUsaha": 64.37,
      "kemasan": 200,
      "biayaPenuh": 557.2,
      "acuanBanjar": 999,
      "acuanAdawwino": 500,
      "hargaJualUsulan": 700,
      "labaKotor": 407.16,
      "sisaLabaBersih": 142.8,
      "marginBersih": 0.204,
      "penanda": "Menutup; di atas acuan",
      "catatan": "",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 600,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "WATER",
      "name": "Sensor Water Level Modul Ketinggian Permukaan Air",
      "sellUnitQty": 1,
      "hppStok": 3859,
      "alokasiBiayaUsaha": 758.42,
      "kemasan": 200,
      "biayaPenuh": 4817.42,
      "acuanBanjar": 8000,
      "acuanAdawwino": 10000,
      "hargaJualUsulan": 6500,
      "labaKotor": 2641,
      "sisaLabaBersih": 1682.58,
      "marginBersih": 0.2589,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "https://shopee.co.id/product/142313672/23151122553 | Indeks web; dirayapi 1 bulan lalu",
      "hargaMinimum": 4850,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "RAIN",
      "name": "[SEN-0007] RAINDROPS RAIN HUMIDITY DETECTION SENSOR AIR HUJAN MODULE",
      "sellUnitQty": 1,
      "hppStok": 10100,
      "alokasiBiayaUsaha": 916.57,
      "kemasan": 200,
      "biayaPenuh": 11216.57,
      "acuanBanjar": 13988,
      "acuanAdawwino": 15000,
      "hargaJualUsulan": 13250,
      "labaKotor": 3150,
      "sisaLabaBersih": 2033.43,
      "marginBersih": 0.1535,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "HPP_Harga_Di_Bawah_Banjar_Robotika.xlsx / reprice-results, 13-10-2026 | Acuan historis; belum diperiksa ulang",
      "hargaMinimum": 11250,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "OBSTACLE",
      "name": "[SEN-0018] INFRARED BARRIER OBSTACLE SENSOR HALANGAN RINTANGAN MODULE",
      "sellUnitQty": 1,
      "hppStok": 6100,
      "alokasiBiayaUsaha": 1149.59,
      "kemasan": 200,
      "biayaPenuh": 7449.59,
      "acuanBanjar": 12840,
      "acuanAdawwino": 15000,
      "hargaJualUsulan": 10000,
      "labaKotor": 3900,
      "sisaLabaBersih": 2550.41,
      "marginBersih": 0.255,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "https://shopee.co.id/product/142313672/22551135574 | Indeks web; dirayapi 1 bulan lalu",
      "hargaMinimum": 7450,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "TIN",
      "name": "Timah Paragon Kecil 10m | Timah Paragon, Timah Solder",
      "sellUnitQty": 1,
      "hppStok": 30727.67,
      "alokasiBiayaUsaha": 4170.33,
      "kemasan": 200,
      "biayaPenuh": 35098,
      "acuanBanjar": null,
      "acuanAdawwino": null,
      "hargaJualUsulan": 44350,
      "labaKotor": 13622.33,
      "sisaLabaBersih": 9252,
      "marginBersih": 0.2086,
      "penanda": "Menutup biaya; tanpa pembanding",
      "catatan": "",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 35100,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "XL",
      "name": "XL4005 Adjustable 5A StepDown Buck Converter Volt DC-DC",
      "sellUnitQty": 1,
      "hppStok": 14050,
      "alokasiBiayaUsaha": 1926.35,
      "kemasan": 200,
      "biayaPenuh": 16176.35,
      "acuanBanjar": 22850,
      "acuanAdawwino": 24000,
      "hargaJualUsulan": 20450,
      "labaKotor": 6400,
      "sisaLabaBersih": 4273.65,
      "marginBersih": 0.209,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "HPP_Harga_Di_Bawah_Banjar_Robotika.xlsx / reprice-results, 13-10-2026 | Acuan historis; belum diperiksa ulang",
      "hargaMinimum": 16200,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "MEGA",
      "name": "ARDUINO MEGA 2560 R3 CH340 COMPATIBLE BOARD + USB CABLE",
      "sellUnitQty": 1,
      "hppStok": 193153.85,
      "alokasiBiayaUsaha": 5171.98,
      "kemasan": 200,
      "biayaPenuh": 198525.82,
      "acuanBanjar": null,
      "acuanAdawwino": null,
      "hargaJualUsulan": 210000,
      "labaKotor": 16846.15,
      "sisaLabaBersih": 11474.18,
      "marginBersih": 0.0546,
      "penanda": "Menutup biaya; tanpa pembanding",
      "catatan": "",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 198550,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "NANO",
      "name": "NANO V3 MINI USB ATMEGA328P CH340G 5V BOARD ARDUINO COMPATIBLE",
      "sellUnitQty": 1,
      "hppStok": 40153.85,
      "alokasiBiayaUsaha": 9211.09,
      "kemasan": 200,
      "biayaPenuh": 49564.94,
      "acuanBanjar": 82000,
      "acuanAdawwino": 85000,
      "hargaJualUsulan": 70000,
      "labaKotor": 29846.15,
      "sisaLabaBersih": 20435.06,
      "marginBersih": 0.2919,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "HPP_Harga_Di_Bawah_Banjar_Robotika.xlsx / reprice-results, 13-10-2026 | Acuan historis; belum diperiksa ulang",
      "hargaMinimum": 49600,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "MG",
      "name": "MG90S Micro Servo Full Metal Gear 180 derajat Tower Pro",
      "sellUnitQty": 1,
      "hppStok": 27153.85,
      "alokasiBiayaUsaha": 1785.34,
      "kemasan": 200,
      "biayaPenuh": 29139.18,
      "acuanBanjar": 34850,
      "acuanAdawwino": 35000,
      "hargaJualUsulan": 33100,
      "labaKotor": 5946.15,
      "sisaLabaBersih": 3960.82,
      "marginBersih": 0.1197,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "HPP_Harga_Di_Bawah_Banjar_Robotika.xlsx / reprice-results, 13-10-2026 | Acuan historis; belum diperiksa ulang",
      "hargaMinimum": 29150,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "LM",
      "name": "LM2596 DC-DC ADJUSTABLE STEP DOWN PSU 4.5-35V to 1.25-30V",
      "sellUnitQty": 1,
      "hppStok": 9353.85,
      "alokasiBiayaUsaha": 1692.13,
      "kemasan": 200,
      "biayaPenuh": 11245.97,
      "acuanBanjar": null,
      "acuanAdawwino": null,
      "hargaJualUsulan": 15000,
      "labaKotor": 5646.15,
      "sisaLabaBersih": 3754.03,
      "marginBersih": 0.2503,
      "penanda": "Menutup biaya; tanpa pembanding",
      "catatan": "Board standar adjustable; bukan diasumsikan CC/CV.",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 11250,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "BF",
      "name": "BFD-1000 5 CHANNEL INFRARED TRACING ROBOT LINE FOLLOWER AVOIDER SENSOR",
      "sellUnitQty": 1,
      "hppStok": 28146.67,
      "alokasiBiayaUsaha": 3822.66,
      "kemasan": 200,
      "biayaPenuh": 32169.33,
      "acuanBanjar": null,
      "acuanAdawwino": null,
      "hargaJualUsulan": 40650,
      "labaKotor": 12503.33,
      "sisaLabaBersih": 8480.67,
      "marginBersih": 0.2086,
      "penanda": "Menutup biaya; tanpa pembanding",
      "catatan": "",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 32200,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "SOIL",
      "name": "Capacitive Soil Sensor Tanah Hygrometer Humidity Moisture Module V2.0",
      "sellUnitQty": 1,
      "hppStok": 16646.67,
      "alokasiBiayaUsaha": 793.32,
      "kemasan": 200,
      "biayaPenuh": 17639.99,
      "acuanBanjar": 17488,
      "acuanAdawwino": null,
      "hargaJualUsulan": 19400,
      "labaKotor": 2753.33,
      "sisaLabaBersih": 1760.01,
      "marginBersih": 0.0907,
      "penanda": "Menutup; di atas acuan",
      "catatan": "",
      "sumberPembanding": "HPP_Harga_Di_Bawah_Banjar_Robotika.xlsx / reprice-results, 13-10-2026 | Acuan historis; belum diperiksa ulang",
      "hargaMinimum": 17650,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "PCB7",
      "name": "PCB DOT MATRIX THRU HOLE SINGLE LAYER 7X9CM",
      "sellUnitQty": 1,
      "hppStok": 8146.67,
      "alokasiBiayaUsaha": 1445.8,
      "kemasan": 200,
      "biayaPenuh": 9792.46,
      "acuanBanjar": 15500,
      "acuanAdawwino": null,
      "hargaJualUsulan": 13000,
      "labaKotor": 4853.33,
      "sisaLabaBersih": 3207.54,
      "marginBersih": 0.2467,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "HPP_Harga_Di_Bawah_Banjar_Robotika.xlsx / reprice-results, 13-10-2026 | Acuan historis; belum diperiksa ulang",
      "hargaMinimum": 9800,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "LEDB",
      "name": "LED 3mm F3 Super Bright Clear Blue Biru — Satuan 1 LED",
      "sellUnitQty": 1,
      "hppStok": 164.67,
      "alokasiBiayaUsaha": 26.51,
      "kemasan": 0,
      "biayaPenuh": 191.18,
      "acuanBanjar": 350,
      "acuanAdawwino": 400,
      "hargaJualUsulan": 300,
      "labaKotor": 135.33,
      "sisaLabaBersih": 108.82,
      "marginBersih": 0.3627,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Kemasan satuan digabung pesanan.",
      "sumberPembanding": "HPP_Harga_Di_Bawah_Banjar_Robotika.xlsx / reprice-results, 13-10-2026 | Acuan historis; belum diperiksa ulang",
      "hargaMinimum": 200,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "LEDB",
      "name": "LED 3mm F3 Super Bright Clear Blue Biru — Paket 10 LED",
      "sellUnitQty": 10,
      "hppStok": 1646.67,
      "alokasiBiayaUsaha": 265.13,
      "kemasan": 500,
      "biayaPenuh": 2411.8,
      "acuanBanjar": 3500,
      "acuanAdawwino": null,
      "hargaJualUsulan": 3000,
      "labaKotor": 1353.33,
      "sisaLabaBersih": 588.2,
      "marginBersih": 0.1961,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "HPP_Harga_Di_Bawah_Banjar_Robotika.xlsx / reprice-results, 13-10-2026 | Acuan historis; belum diperiksa ulang",
      "hargaMinimum": 2450,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "LEDW",
      "name": "LED 3mm F3 Super Bright Clear White Putih — Satuan 1 LED",
      "sellUnitQty": 1,
      "hppStok": 164.67,
      "alokasiBiayaUsaha": 26.51,
      "kemasan": 0,
      "biayaPenuh": 191.18,
      "acuanBanjar": 350,
      "acuanAdawwino": 400,
      "hargaJualUsulan": 300,
      "labaKotor": 135.33,
      "sisaLabaBersih": 108.82,
      "marginBersih": 0.3627,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Kemasan satuan digabung pesanan.",
      "sumberPembanding": "HPP_Harga_Di_Bawah_Banjar_Robotika.xlsx / reprice-results, 13-10-2026 | Acuan historis; belum diperiksa ulang",
      "hargaMinimum": 200,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "LEDW",
      "name": "LED 3mm F3 Super Bright Clear White Putih — Paket 10 LED",
      "sellUnitQty": 10,
      "hppStok": 1646.67,
      "alokasiBiayaUsaha": 265.13,
      "kemasan": 500,
      "biayaPenuh": 2411.8,
      "acuanBanjar": 3500,
      "acuanAdawwino": null,
      "hargaJualUsulan": 3000,
      "labaKotor": 1353.33,
      "sisaLabaBersih": 588.2,
      "marginBersih": 0.1961,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "HPP_Harga_Di_Bawah_Banjar_Robotika.xlsx / reprice-results, 13-10-2026 | Acuan historis; belum diperiksa ulang",
      "hargaMinimum": 2450,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "UNO",
      "name": "Modul Uno R3 CH430G ATMEGA328P CH340 SMD USB Kabel Header Pin",
      "sellUnitQty": 1,
      "hppStok": 51819.3,
      "alokasiBiayaUsaha": 8693.63,
      "kemasan": 200,
      "biayaPenuh": 60712.93,
      "acuanBanjar": 95000,
      "acuanAdawwino": 112700,
      "hargaJualUsulan": 80000,
      "labaKotor": 28180.7,
      "sisaLabaBersih": 19287.07,
      "marginBersih": 0.2411,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "https://shopee.co.id/banjarrobotika | UNO SMD terlihat Rp64.000 di etalase; kabel/USB belum dipastikan",
      "hargaMinimum": 60750,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "DHT11",
      "name": "Modul DHT11 Sensor Kelembaban Suhu Humidity Temperature Digital",
      "sellUnitQty": 1,
      "hppStok": 9909.3,
      "alokasiBiayaUsaha": 1519.55,
      "kemasan": 200,
      "biayaPenuh": 11628.84,
      "acuanBanjar": 19950,
      "acuanAdawwino": 22000,
      "hargaJualUsulan": 15000,
      "labaKotor": 5090.7,
      "sisaLabaBersih": 3371.16,
      "marginBersih": 0.2247,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "HPP_Harga_Di_Bawah_Banjar_Robotika.xlsx / reprice-results, 13-10-2026 | Acuan historis; belum diperiksa ulang",
      "hargaMinimum": 11650,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "MF10",
      "name": "Kabel Jumper Dupont Male to Female 10 cm — Satuan 1 kabel",
      "sellUnitQty": 1,
      "hppStok": 220.48,
      "alokasiBiayaUsaha": 55.78,
      "kemasan": 0,
      "biayaPenuh": 276.26,
      "acuanBanjar": 550,
      "acuanAdawwino": 500,
      "hargaJualUsulan": 500,
      "labaKotor": 279.52,
      "sisaLabaBersih": 223.74,
      "marginBersih": 0.4475,
      "penanda": "Menutup; sama dengan acuan",
      "catatan": "Kemasan satuan digabung pesanan.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/25835328036 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 300,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "MF10",
      "name": "Kabel Jumper Dupont Male to Female 10 cm — Paket 10 kabel",
      "sellUnitQty": 10,
      "hppStok": 2204.82,
      "alokasiBiayaUsaha": 557.76,
      "kemasan": 500,
      "biayaPenuh": 3262.59,
      "acuanBanjar": 5500,
      "acuanAdawwino": 5000,
      "hargaJualUsulan": 4500,
      "labaKotor": 2295.18,
      "sisaLabaBersih": 1237.41,
      "marginBersih": 0.275,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Pembanding paket merupakan ekuivalen harga satuan x jumlah, bukan penawaran paket terkonfirmasi.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/25835328036 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 3300,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "MF10",
      "name": "Kabel Jumper Dupont Male to Female 10 cm — Paket 40 kabel",
      "sellUnitQty": 40,
      "hppStok": 8819.3,
      "alokasiBiayaUsaha": 2231.05,
      "kemasan": 500,
      "biayaPenuh": 11550.35,
      "acuanBanjar": 22000,
      "acuanAdawwino": 20000,
      "hargaJualUsulan": 17500,
      "labaKotor": 8680.7,
      "sisaLabaBersih": 5949.65,
      "marginBersih": 0.34,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Pembanding paket merupakan ekuivalen harga satuan x jumlah, bukan penawaran paket terkonfirmasi.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/25835328036 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 11600,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "FF10",
      "name": "Kabel Jumper Dupont Female to Female 10 cm — Satuan 1 kabel",
      "sellUnitQty": 1,
      "hppStok": 195.48,
      "alokasiBiayaUsaha": 63.54,
      "kemasan": 0,
      "biayaPenuh": 259.03,
      "acuanBanjar": 550,
      "acuanAdawwino": null,
      "hargaJualUsulan": 500,
      "labaKotor": 304.52,
      "sisaLabaBersih": 240.97,
      "marginBersih": 0.4819,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Kemasan satuan digabung pesanan.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/25835328036 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 300,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "FF10",
      "name": "Kabel Jumper Dupont Female to Female 10 cm — Paket 10 kabel",
      "sellUnitQty": 10,
      "hppStok": 1954.82,
      "alokasiBiayaUsaha": 635.44,
      "kemasan": 500,
      "biayaPenuh": 3090.26,
      "acuanBanjar": 5500,
      "acuanAdawwino": null,
      "hargaJualUsulan": 4500,
      "labaKotor": 2545.18,
      "sisaLabaBersih": 1409.74,
      "marginBersih": 0.3133,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Pembanding paket merupakan ekuivalen harga satuan x jumlah, bukan penawaran paket terkonfirmasi.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/25835328036 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 3100,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "FF10",
      "name": "Kabel Jumper Dupont Female to Female 10 cm — Paket 40 kabel",
      "sellUnitQty": 40,
      "hppStok": 7819.3,
      "alokasiBiayaUsaha": 2541.75,
      "kemasan": 500,
      "biayaPenuh": 10861.05,
      "acuanBanjar": 22000,
      "acuanAdawwino": null,
      "hargaJualUsulan": 17500,
      "labaKotor": 9680.7,
      "sisaLabaBersih": 6638.95,
      "marginBersih": 0.3794,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Pembanding paket merupakan ekuivalen harga satuan x jumlah, bukan penawaran paket terkonfirmasi.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/25835328036 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 10900,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "H3",
      "name": "3x 18650 Battery Holder Tempat Baterai Case Box Kotak Dengan Kabel Seri",
      "sellUnitQty": 1,
      "hppStok": 5509.3,
      "alokasiBiayaUsaha": 773.86,
      "kemasan": 200,
      "biayaPenuh": 6483.16,
      "acuanBanjar": null,
      "acuanAdawwino": null,
      "hargaJualUsulan": 8200,
      "labaKotor": 2690.7,
      "sisaLabaBersih": 1716.84,
      "marginBersih": 0.2094,
      "penanda": "Menutup biaya; tanpa pembanding",
      "catatan": "",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 6500,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "H2",
      "name": "2x 18650 Battery Holder Baterai Case tempat Kotak Batere Box Dudukan",
      "sellUnitQty": 1,
      "hppStok": 3918.3,
      "alokasiBiayaUsaha": 553.58,
      "kemasan": 200,
      "biayaPenuh": 4671.87,
      "acuanBanjar": null,
      "acuanAdawwino": 13000,
      "hargaJualUsulan": 5900,
      "labaKotor": 1981.7,
      "sisaLabaBersih": 1228.13,
      "marginBersih": 0.2082,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 4700,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "LDR",
      "name": "Modul Sensor Cahaya LDR Photoresistor photosensitive Arduinouno",
      "sellUnitQty": 1,
      "hppStok": 4618.3,
      "alokasiBiayaUsaha": 1299.26,
      "kemasan": 200,
      "biayaPenuh": 6117.56,
      "acuanBanjar": 11500,
      "acuanAdawwino": null,
      "hargaJualUsulan": 9000,
      "labaKotor": 4381.7,
      "sisaLabaBersih": 2882.44,
      "marginBersih": 0.3203,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "HPP_Harga_Di_Bawah_Banjar_Robotika.xlsx / reprice-results, 13-10-2026 | Acuan historis; belum diperiksa ulang",
      "hargaMinimum": 6150,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "SW",
      "name": "Saklar Rocker Switch KCD11 POWER 10X15MM ON OFF Merah 2 Pin",
      "sellUnitQty": 1,
      "hppStok": 518.3,
      "alokasiBiayaUsaha": 87.53,
      "kemasan": 200,
      "biayaPenuh": 805.82,
      "acuanBanjar": 1500,
      "acuanAdawwino": 40002015,
      "hargaJualUsulan": 1000,
      "labaKotor": 481.7,
      "sisaLabaBersih": 194.18,
      "marginBersih": 0.1942,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Acuan I: 4000 (20x15mm); tidak dipakai untuk perbandingan karena varian berbeda atau teks belum terurai.",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 850,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "SET_HIJAU",
      "name": "Omron Push Button B3F 4055 saklar + tutup hijau",
      "sellUnitQty": 1,
      "hppStok": 859.3,
      "alokasiBiayaUsaha": 136.93,
      "kemasan": 200,
      "biayaPenuh": 1196.22,
      "acuanBanjar": 119505,
      "acuanAdawwino": null,
      "hargaJualUsulan": 1500,
      "labaKotor": 640.7,
      "sisaLabaBersih": 303.78,
      "marginBersih": 0.2025,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "1 set = 1 saklar + 1 tutup. Saklar O15 sebanyak 15 dibagi ke 5 warna, masing-masing 3 set.",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 1200,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "SET_BIRU",
      "name": "Omron Push Button B3F 4055 saklar + tutup biru",
      "sellUnitQty": 1,
      "hppStok": 859.3,
      "alokasiBiayaUsaha": 136.93,
      "kemasan": 200,
      "biayaPenuh": 1196.22,
      "acuanBanjar": 119505,
      "acuanAdawwino": null,
      "hargaJualUsulan": 1500,
      "labaKotor": 640.7,
      "sisaLabaBersih": 303.78,
      "marginBersih": 0.2025,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "1 set = 1 saklar + 1 tutup. Saklar O15 sebanyak 15 dibagi ke 5 warna, masing-masing 3 set.",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 1200,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "SET_PUTIH",
      "name": "Omron Push Button B3F 4055 saklar + tutup putih",
      "sellUnitQty": 1,
      "hppStok": 859.3,
      "alokasiBiayaUsaha": 136.93,
      "kemasan": 200,
      "biayaPenuh": 1196.22,
      "acuanBanjar": 119505,
      "acuanAdawwino": null,
      "hargaJualUsulan": 1500,
      "labaKotor": 640.7,
      "sisaLabaBersih": 303.78,
      "marginBersih": 0.2025,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "1 set = 1 saklar + 1 tutup. Saklar O15 sebanyak 15 dibagi ke 5 warna, masing-masing 3 set.",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 1200,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "SET_HITAM",
      "name": "Omron Push Button B3F 4055 saklar + tutup hitam",
      "sellUnitQty": 1,
      "hppStok": 859.3,
      "alokasiBiayaUsaha": 136.93,
      "kemasan": 200,
      "biayaPenuh": 1196.22,
      "acuanBanjar": 119505,
      "acuanAdawwino": null,
      "hargaJualUsulan": 1500,
      "labaKotor": 640.7,
      "sisaLabaBersih": 303.78,
      "marginBersih": 0.2025,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "1 set = 1 saklar + 1 tutup. Saklar O15 sebanyak 15 dibagi ke 5 warna, masing-masing 3 set.",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 1200,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "SET_MERAH",
      "name": "Omron Push Button B3F 4055 saklar + tutup merah",
      "sellUnitQty": 1,
      "hppStok": 859.3,
      "alokasiBiayaUsaha": 136.93,
      "kemasan": 200,
      "biayaPenuh": 1196.22,
      "acuanBanjar": 119505,
      "acuanAdawwino": null,
      "hargaJualUsulan": 1500,
      "labaKotor": 640.7,
      "sisaLabaBersih": 303.78,
      "marginBersih": 0.2025,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "1 set = 1 saklar + 1 tutup. Saklar O15 sebanyak 15 dibagi ke 5 warna, masing-masing 3 set.",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 1200,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "ESP",
      "name": "ESP32 CH340 Type C WROOM WIFI Bluetooth BLE IOT Development Board 30 pin",
      "sellUnitQty": 1,
      "hppStok": 65000,
      "alokasiBiayaUsaha": 8808.37,
      "kemasan": 200,
      "biayaPenuh": 74008.37,
      "acuanBanjar": 99950,
      "acuanAdawwino": 107800,
      "hargaJualUsulan": 93550,
      "labaKotor": 28550,
      "sisaLabaBersih": 19541.63,
      "marginBersih": 0.2089,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 74050,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "OLED",
      "name": "OLED 0.96 inch Blue I2C 128x64 LCD Display Module",
      "sellUnitQty": 1,
      "hppStok": 27600,
      "alokasiBiayaUsaha": 3759.48,
      "kemasan": 200,
      "biayaPenuh": 31559.48,
      "acuanBanjar": 46500,
      "acuanAdawwino": 55000,
      "hargaJualUsulan": 39900,
      "labaKotor": 12300,
      "sisaLabaBersih": 8340.52,
      "marginBersih": 0.209,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "HPP_Harga_Di_Bawah_Banjar_Robotika.xlsx / reprice-results, 13-10-2026 | Acuan historis; belum diperiksa ulang",
      "hargaMinimum": 31600,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "DFPLAYER",
      "name": "DFPlayer Mini MP3 JL 24 DF Player - varian JL 24PIN",
      "sellUnitQty": 1,
      "hppStok": 16050,
      "alokasiBiayaUsaha": 2190.44,
      "kemasan": 200,
      "biayaPenuh": 18440.44,
      "acuanBanjar": 28850,
      "acuanAdawwino": 35000,
      "hargaJualUsulan": 23300,
      "labaKotor": 7250,
      "sisaLabaBersih": 4859.56,
      "marginBersih": 0.2086,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 18450,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "FF30",
      "name": "Kabel Jumper Dupont Female to Female 30 cm — Satuan 1 kabel",
      "sellUnitQty": 1,
      "hppStok": 277.5,
      "alokasiBiayaUsaha": 100.2,
      "kemasan": 0,
      "biayaPenuh": 377.7,
      "acuanBanjar": 800,
      "acuanAdawwino": null,
      "hargaJualUsulan": 700,
      "labaKotor": 422.5,
      "sisaLabaBersih": 322.3,
      "marginBersih": 0.4604,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Kemasan satuan digabung pesanan.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/18987104570 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 400,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "FF30",
      "name": "Kabel Jumper Dupont Female to Female 30 cm — Paket 10 kabel",
      "sellUnitQty": 10,
      "hppStok": 2775,
      "alokasiBiayaUsaha": 1002.01,
      "kemasan": 500,
      "biayaPenuh": 4277.01,
      "acuanBanjar": 8000,
      "acuanAdawwino": null,
      "hargaJualUsulan": 6500,
      "labaKotor": 3725,
      "sisaLabaBersih": 2222.99,
      "marginBersih": 0.342,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Pembanding paket merupakan ekuivalen harga satuan x jumlah, bukan penawaran paket terkonfirmasi.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/18987104570 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 4300,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "FF30",
      "name": "Kabel Jumper Dupont Female to Female 30 cm — Paket 40 kabel",
      "sellUnitQty": 40,
      "hppStok": 11100,
      "alokasiBiayaUsaha": 4008.04,
      "kemasan": 500,
      "biayaPenuh": 15608.04,
      "acuanBanjar": 32000,
      "acuanAdawwino": null,
      "hargaJualUsulan": 25500,
      "labaKotor": 14400,
      "sisaLabaBersih": 9891.96,
      "marginBersih": 0.3879,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Pembanding paket merupakan ekuivalen harga satuan x jumlah, bukan penawaran paket terkonfirmasi.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/18987104570 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 15650,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "MM10",
      "name": "Kabel Jumper Dupont Male to Male 10 cm — Satuan 1 kabel",
      "sellUnitQty": 1,
      "hppStok": 265,
      "alokasiBiayaUsaha": 41.94,
      "kemasan": 0,
      "biayaPenuh": 306.94,
      "acuanBanjar": 550,
      "acuanAdawwino": null,
      "hargaJualUsulan": 500,
      "labaKotor": 235,
      "sisaLabaBersih": 193.06,
      "marginBersih": 0.3861,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Kemasan satuan digabung pesanan.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/25835328036 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 350,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "MM10",
      "name": "Kabel Jumper Dupont Male to Male 10 cm — Paket 10 kabel",
      "sellUnitQty": 10,
      "hppStok": 2650,
      "alokasiBiayaUsaha": 419.45,
      "kemasan": 500,
      "biayaPenuh": 3569.45,
      "acuanBanjar": 5500,
      "acuanAdawwino": 5000,
      "hargaJualUsulan": 4500,
      "labaKotor": 1850,
      "sisaLabaBersih": 930.55,
      "marginBersih": 0.2068,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Pembanding paket merupakan ekuivalen harga satuan x jumlah, bukan penawaran paket terkonfirmasi.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/25835328036 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 3600,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "MM10",
      "name": "Kabel Jumper Dupont Male to Male 10 cm — Paket 40 kabel",
      "sellUnitQty": 40,
      "hppStok": 10600,
      "alokasiBiayaUsaha": 1677.79,
      "kemasan": 500,
      "biayaPenuh": 12777.79,
      "acuanBanjar": 22000,
      "acuanAdawwino": 20000,
      "hargaJualUsulan": 17500,
      "labaKotor": 6900,
      "sisaLabaBersih": 4722.21,
      "marginBersih": 0.2698,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "Pembanding paket merupakan ekuivalen harga satuan x jumlah, bukan penawaran paket terkonfirmasi.",
      "sumberPembanding": "https://shopee.co.id/product/142313672/25835328036 | Indeks etalase 19-10-2026; asumsi harga per kabel, perlu konfirmasi isi listing",
      "hargaMinimum": 12800,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "HEADERF",
      "name": "Header Female 40 Pin Straight Lurus Singel Row 1x40 Pitch 2.54mm Hitam",
      "sellUnitQty": 1,
      "hppStok": 1300,
      "alokasiBiayaUsaha": 201.96,
      "kemasan": 200,
      "biayaPenuh": 1701.96,
      "acuanBanjar": 2999,
      "acuanAdawwino": 3000,
      "hargaJualUsulan": 2150,
      "labaKotor": 850,
      "sisaLabaBersih": 448.04,
      "marginBersih": 0.2084,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 1750,
      "statusBiaya": "MENUTUP + SURPLUS"
    },
    {
      "sku": "HEADERM",
      "name": "Header Male 40 Pin Straight Lurus Single Row 1x40 Pitch 2.54mm Putih",
      "sellUnitQty": 1,
      "hppStok": 650,
      "alokasiBiayaUsaha": 341.77,
      "kemasan": 200,
      "biayaPenuh": 1191.77,
      "acuanBanjar": 2499,
      "acuanAdawwino": 2000,
      "hargaJualUsulan": 1950,
      "labaKotor": 1300,
      "sisaLabaBersih": 758.23,
      "marginBersih": 0.3888,
      "penanda": "Menutup; di bawah acuan",
      "catatan": "",
      "sumberPembanding": "Harga pesaing belum ditemukan / belum terverifikasi",
      "hargaMinimum": 1200,
      "statusBiaya": "MENUTUP + SURPLUS"
    }
  ];

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
