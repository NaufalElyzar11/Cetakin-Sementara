# Panduan komponen Cetakin

Fitur panduan berisi 21 artikel HTML statis yang dipetakan ke 25 SKU dari `products-template.xlsx` yang diberikan pada 13 Oktober 2026. Semua 11 sensor, kedua driver L298N, kedua servo, dan motor gearbox memiliki panduan. Dua SKU L298N berbagi satu artikel. Uno, Uno R3 compatible, Nano klasik, dan Mega berbagi panduan persiapan Arduino.

Panduan tambahan mencakup LM2596, XL4005, OLED I²C, DFPlayer Mini, dan persiapan ESP32. LED, jumper, konektor, PCB, roda, spacer, bahan solder, isolasi, serta baterai/holder tidak diberi artikel komponen tersendiri dalam revisi ini.

## Akses dan konten

- `panduan.html`: daftar lengkap, pencarian nama/fungsi/SKU, filter kategori, dan tautan persiapan board. Filter disimpan di URL.
- `panduan/<slug>.html`: artikel berisi fungsi, batas penggunaan, alat, diagram, tabel pin, langkah uji, hasil yang diharapkan, kode bila diperlukan, solusi masalah, langkah berikutnya, dan referensi teknis.
- Menu desktop dan ponsel seluruh halaman utama memiliki tautan Panduan.
- Kartu katalog menandai produk dengan panduan. Detail produk menampilkan tautan panduan jika SKU dipetakan. Produk lain tidak diberi tautan kosong.
- Jika data katalog gagal dimuat atau SKU belum aktif, detail tetap menyediakan tautan ke panduan SKU yang dikenali. Harga dan pemesanan tetap tidak tersedia sampai produk valid berhasil dimuat.
- Isi artikel dan semua kartu sudah berada dalam HTML; membaca tidak memerlukan JavaScript. Interaksi pencarian, checkbox, salin kode, sorotan kabel, daftar isi aktif, dan dialog diagram memakai JavaScript.
- Checkbox alat tersimpan di localStorage perangkat. Halaman tetap berjalan jika storage diblokir.
- Kode bisa disalin dengan Clipboard API atau fallback salin browser. Jika keduanya gagal, kode dipilih untuk salin manual.
- Diagram adalah skema koneksi listrik berdasarkan label, bukan gambar posisi fisik pin. Tabel dan keterangan tetap menjadi acuan. Pada HP, diagram ringkas memperlihatkan pin dan tujuan sambungan sekaligus; diagram besar tetap bisa diperbesar dan digeser dalam dialog. Koneksi bisa disorot dari tabel.

## Struktur sumber

`guide-data.js` menyimpan konten dan pemetaan SKU. `tools/build-guides.cjs` menghasilkan artikel statis, hub, dan `guide-index.js` yang lebih kecil untuk lookup katalog. `guide-core.js` menangani lookup dan pencarian; `guide.js` menangani interaksi; `guide.css` mengikuti warna dan tipografi situs Cetakin.

Setelah mengubah konten:

```powershell
node tools/build-guides.cjs
node --test --test-isolation=none tests/catalog-core.test.cjs tests/clicker-core.test.cjs tests/guide-core.test.cjs
```

File HTML hasil build dan `guide-index.js` ikut disimpan agar hosting tetap tanpa build atau dependency runtime. Jalankan generator setelah mengubah `guide-data.js`; perubahan langsung pada artikel hasil build akan tertimpa.

Pemetaan default berdasarkan `id` produk. Kolom CSV opsional `guide_id` dapat menunjuk slug artikel yang sudah tersedia untuk SKU baru. Nilai yang tidak dikenal menyembunyikan tautan, sehingga katalog tidak membuat tautan ke halaman yang tidak ada. Jangan memakai pencocokan nama otomatis untuk modul dengan varian listrik berbeda.

`data/guide-products.json` hanya berisi snapshot ID, nama, tipe, dan kategori dari Excel untuk mengecek cakupan panduan. File ini bukan pengganti sumber harga, stok, atau status aktif katalog. Excel asli tidak diubah. Katalog tetap mengambil CSV yang sudah dikonfigurasi dalam `site-config.js`.

## Pemeriksaan browser

Jalankan server lokal pada port 4173. Jika Playwright tersedia:

```powershell
node tests/guide-browser.cjs
```

Paket Playwright dapat ditunjuk melalui `CETAKIN_PLAYWRIGHT`; URL preview melalui `CETAKIN_PREVIEW`; direktori screenshot melalui `CETAKIN_QA_OUTPUT`. Tes menggunakan browser headless tersendiri, bukan sesi browser pribadi. Data valid untuk uji tautan SKU hanya diintersep pada sesi tes; tidak ditulis ke katalog atau spreadsheet. Setelah tes fixture, sumber CSV asli diperiksa secara terpisah.

## Batas teknis dan data

Contoh rangkaian dan kode belum diuji pada unit fisik. Artikel mencantumkan acuan produsen/library dan menyatakan perbedaan antara spesifikasi chip, board compatible, serta varian yang belum teridentifikasi. Rating arus L298N tidak mengikuti klaim “5A” pada nama produk; versi OLED, DFPlayer JL, dan pinout BFD-1000 perlu dicocokkan pada unit. Untuk BFD-1000, referensi produsen unit persis belum tersedia, sehingga panduan tidak menebak urutan konektor atau rating catu.

Excel memiliki 100 baris dengan `active` dan `description` kosong. Parser katalog yang ada mewajibkan `active` TRUE/FALSE dan deskripsi untuk produk aktif. Pemilik perlu melengkapi sumber CSV sebelum seluruh SKU dapat tampil dan dibeli. Guide tetap dapat dibaca dari menu Panduan meskipun produk belum aktif. Harga, stok, dan status jual tidak diisi dengan asumsi oleh fitur ini.

Canonical dan sitemap per artikel dapat ditambahkan setelah domain produksi dipastikan. Revisi lokal ini tidak mengubah hosting, sumber Google Sheets, atau workbook asli.
