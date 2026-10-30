# Clicker Lab Cetakin

Halaman `clicker.html` berjalan sebagai HTML/CSS/JavaScript statis, sama seperti website yang ada. Tidak membutuhkan npm, backend, upload, atau proses build. Menu Clicker pada beranda dan katalog mengarah ke halaman ini. Preview singkat beranda diteruskan sebagai desain ke konfigurator.

## Pilihan customer

- 1–7 tombol; satu huruf, angka, atau simbol = satu tombol.
- Huruf A–Z dan angka 1–9; angka 0 belum tersedia pada model lokal.
- Font Nunito ExtraBold, Bungee, dan DynaPuff Bold; satu font untuk seluruh huruf.
- Dua belas simbol dari koleksi `clicker_keycaps_simbol_2_warna`: Love, Bintang, Bunga, Awan, Bulan, Petir, Telapak, Kucing, Beruang, Labu, Hantu, dan Robot.
- Base Solid (1–7), Flexi (2–7), dan Flexi compact (2–7).
- Bentuk Silinder Beralur, Heksagon, Gear, Kaki Lucu, Love, dan Bunga 5 Kelopak.
- Warna base dan setiap keycap: putih, hitam, sky blue, orange, merah, pink. Warna huruf maupun simbol dapat dipilih sendiri per tombol dari enam warna tersebut; tidak memakai emoji bawaan perangkat.
- Huruf sewarna keycap tetap bisa dipesan sebagai huruf timbul satu warna, dengan catatan kontras pada editor.
- Simbol tertanam rata pada muka keycap, sehingga warna simbol dan badan wajib berbeda. Pemesanan dan ekspor diblokir sampai kedua warna berbeda. Lubang mata Hantu dan Robot memperlihatkan warna badan; kelima bantalan Telapak memakai warna simbol yang sama.
- Jumlah produk 1–99 pcs dengan desain yang sama, dan catatan maksimal 300 karakter.

Harga per pcs tidak berubah menurut base/font/warna pada pilihan ini:

| Jumlah tombol | Harga |
|---|---:|
| 1 | Rp14.000 |
| 2 | Rp17.000 |
| 3 | Rp21.000 |
| 4 | Rp26.000 |
| 5 | Rp30.000 |
| 6 | Rp34.000 |
| 7 | Rp37.000 |

Subtotal = harga per pcs × jumlah produk. Ongkir belum termasuk. Halaman tidak menetapkan waktu produksi atau menerima pembayaran.

## Alur WhatsApp

`Pesan sekarang` membuka nomor dari `site-config.js` (saat ini `6285822801431`) dengan draf terisi: susunan dari gantungan ke bawah, tipe dan bentuk base, warna base, material, font, isi serta warna setiap tombol, jumlah pcs, harga satuan, subtotal, catatan, dan link desain. Contoh detail simbol: `4. Love | keycap Putih | simbol Orange`. Customer menekan kirim sendiri; membuka WhatsApp tidak berarti pesanan sudah diterima.

Tautan `wa.me` mengisi teks, tanpa melampirkan file. `Unduh gambar` membuat PNG 1800 × 1400 di perangkat customer; customer melampirkannya secara manual. PNG berisi preview, spesifikasi per tombol, jumlah pcs, dan subtotal. Catatan bebas tetap ada di chat. Lihat [dokumentasi click to chat WhatsApp](https://faq.whatsapp.com/5913398998672934).

`Salin link desain` menyimpan konfigurasi dalam fragmen URL versi 2 (`#desain=...`), tanpa server atau penyimpanan pesanan. Admin yang membuka link pada website yang sama akan melihat susunan, warna badan dan simbol/huruf, font, jumlah pcs, dan catatan tersebut. Link dari `localhost`/`127.0.0.1` hanya untuk pengujian lokal; link customer yang dapat dibuka admin memerlukan website dipasang pada hosting publik.

Link versi 1 tetap bisa dibaca. Huruf dan warna lama dipertahankan; karakter dari koleksi lama menjadi slot `Pilih simbol`, sambil mempertahankan warna, jumlah pcs, catatan, dan pilihan lainnya. Customer harus memilih salah satu simbol baru sebelum memesan atau mengekspor. Tidak ada penggantian karakter otomatis, termasuk untuk nama yang mirip seperti Kucing atau Robot. ID katalog baru memakai awalan `symbol-` agar tidak tertukar dengan ID lama.

## Preview dan batas model

Preview memakai kontur 2D base dari generator lokal, proyeksi badan keycap referensi `Glorious Fulffy-Bojo.stl`, simbol dari `models/keycaps/clicker_keycaps_simbol_2_warna/glyphs.py`, serta huruf yang dipaskan ke bidang atas dengan helper CAD yang sama. Kontur simbol sudah dalam ukuran akhir milimeter dan tidak diperbesar ulang menurut font. Tampak dari atas; mekanisme, alur samping, dan sendi digambarkan secara ilustratif. PNG tidak mengandung STL atau 3MF. Warna layar bukan sampel warna filament.

Ukuran badan keycap adalah 18,5 × 18,51 × 7 mm. Huruf timbul di atas badan, sedangkan simbol tertanam sedalam 0,8 mm pada Z=6,2–7 mm dan rata dengan permukaan. Simbol maksimal 11,4 mm (Kucing 11 mm), dengan jarak minimal 1 mm dari tepi muka datar. Love satu tombol memakai kontur 38 × 34 mm, sedangkan Love solid/flexi beberapa tombol tetap 46 × 46 mm (ukuran kontur, belum termasuk gantungan). Pitch mengikuti bentuk model: Silinder/Heksagon/Gear/Kaki memakai Solid 24 mm, Flexi 33 mm, Compact 26,5 mm; Love/Bunga memakai Solid dan Flexi 44 mm, Compact 32,5 mm. Gantungan pada modul pertama memakai kontur housing yang sudah menyatu dengan eyelet CAD, termasuk lubangnya. Memilih tombol tetap bisa melalui preview atau deretan tombol editor, tanpa kotak seleksi garis putus-putus pada preview.

Pemeriksaan konservatif memakai envelope atas/bawah karakter, termasuk badan keycap, dan jarak minimal 1 mm di antara dua tombol. Kombinasi yang terlalu rapat diblokir untuk pemesanan dan ekspor sampai jenis base atau karakter diganti. Pemeriksaan ini tidak mensimulasikan gerakan sendi atau membuktikan fit fisik. Panduan CAD mencatat revisi belum diuji cetak fisik; admin tetap perlu mengecek hasil uji cetak/rakitan sebelum produksi.

Model clicker utuh bertema sushi/jeruk/awan/roket dan topper 3D bervolume belum dimasukkan, karena konfigurator ini untuk susunan keyboard modular dengan harga 1–7 tombol.

Koleksi `clicker_keycaps_rounded_low`, `clicker_designs_seri_2`, dan `clicker_designs` tidak dipakai lagi sebagai sumber simbol. Pilihan simbol hanya berasal dari `clicker_keycaps_simbol_2_warna`; aset koleksi lama tidak ditawarkan di editor.

## Mengubah pilihan

- Harga: `PRICES` pada `clicker-core.js`; tabel halaman dan tombol jumlah mengikuti sumber yang sama.
- Nomor admin: `whatsappNumber` pada `site-config.js`.
- Warna/font/jenis base: `COLORS`, `FONTS`, `MODES` pada `clicker-core.js`.
- Kontur simbol/base, path glyph, font TTF dan lisensinya: `clicker-assets.js` dan `assets/clicker/`. Ikon simbol memakai nama `symbol-love.svg` sampai `symbol-robot.svg`.
- UI: `clicker.html`, `clicker.css`, `clicker.js`.

Jika model lokal berubah, ekspor ulang aset dari folder `website` dengan Python 3.12 dan dependensi CAD lokal yang sudah tersedia:

```powershell
py -3.12 tools/build-clicker-assets.py
```

Helper hanya membaca generator/kontur/font. Tidak menjalankan pembangun STL/3MF, tidak menimpa model, dan menonaktifkan penulisan bytecode. Setelah diekspor, folder website tetap mandiri; helper tidak dibutuhkan di hosting.

Lisensi font SIL OFL ikut disalin. Atribusi mekanisme CHB 3D PRINTING / CC BY 4.0 dan modifikasi ditampilkan di bagian bawah halaman.

## Verifikasi

```powershell
node --test --test-isolation=none tests/catalog-core.test.cjs tests/clicker-core.test.cjs
```

Pengujian inti mencakup tujuh harga, subtotal, dua belas simbol × tiga puluh pasangan warna berbeda × tiga font, validasi simbol sewarna badan, kontur lubang mata dan bantalan terpisah, isi WhatsApp per tombol, migrasi link versi 1, link rusak, batas jumlah, envelope, pitch enam bentuk base, dan batas preview/gantungan untuk setiap jumlah serta jenis base. Verifikasi browser mencakup desktop dan ponsel, reload link, pilihan simbol dan warna, validasi, serta unduh PNG.
