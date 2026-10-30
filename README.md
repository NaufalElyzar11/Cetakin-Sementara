# Website Cetakin

Website profil dan katalog Cetakin dalam satu folder mandiri, memakai HTML, CSS, dan JavaScript tanpa PHP, dependensi aplikasi, atau proses build.

## Jalankan lokal (Full-Stack Node.js + Express.js)

Jalankan server backend + frontend dari folder proyek:

```powershell
node server.js
```

Lalu buka di browser:
- **Website Katalog Publik**: `http://localhost:8080/`
- **Portal Admin & Keuangan (`owner`, `admin_3d`, `admin_robotika`)**: `http://localhost:8080/admin.html`

> **Catatan**: Jangan lagi menggunakan `python -m http.server 4173` karena fitur Login, Keuangan, dan CRUD Katalog membutuhkan backend API Express.js (`server.js`).

## Halaman dan fitur

- `index.html`: profil, empat layanan, bagian **Produk Pertama**, preview singkat yang diteruskan ke Clicker Lab, proses, cerita brand, kontak.
- `clicker.html`: konfigurator pre-order 1–7 tombol, base solid/flexi/compact, enam bentuk base (termasuk Love dan Bunga 5 Kelopak), tiga font, dua belas simbol tertanam dari `clicker_keycaps_simbol_2_warna`, enam warna PETG termasuk pink untuk badan dan simbol/huruf per tombol, harga, subtotal, draf WhatsApp, link desain, dan ekspor PNG. Simbol harus berbeda warna dari badan. Lihat [CLICKER.md](./CLICKER.md).
- `robotika.html`: katalog dengan pencarian, kategori, rentang harga, stok tersedia, dan pengurutan.
- `panduan.html` / `panduan/`: 21 guide komponen dengan wiring, kode yang bisa disalin, daftar isi, checklist alat, dan langkah periksa masalah. Mencakup semua sensor, driver, dan aktuator dari Excel; detail dan pembaruan konten ada di [PANDUAN.md](./PANDUAN.md).
- `gantungan-kunci.html`: katalog dengan filter asal desain/seri.
- `produk.html?id=...`: satu gambar, harga, stok, deskripsi, spesifikasi, jumlah, subtotal, tautan produk, rekomendasi, dan pesanan WhatsApp.
- `site-config.js`: nomor WhatsApp, sumber CSV, interval pembaruan.
- `catalog-core.js`: parser CSV, validasi, filter, dan format pesan.
- `catalog.js` / `catalog.css`: interaksi dan tampilan katalog/detail.
- `contact.js`: pesan WhatsApp konsultasi/kontak; `app.js`: menu dan clicker.
- `data/products-template.csv`: template impor Google Sheets dengan baris petunjuk nonaktif.
- `data/products-demo.csv` dan `assets/catalog/`: data serta ilustrasi demonstrasi.

Sumber CSV Google Sheets sudah diisi di `site-config.js`. Jika `csvUrl` dikosongkan, katalog memakai data contoh dan pesanan produk berlabel simulasi. Sumber perlu mengikuti format yang divalidasi parser; petunjuk pengisian, URL gambar, dan stok ada di [KATALOG.md](./KATALOG.md).

## Alur pemesanan

Pemesanan dan konsultasi menuju **0858 2280 1431**, dengan draf pesan sesuai konteks. Clicker menyertakan urutan tombol, base, warna badan serta simbol/huruf setiap tombol, font, jumlah pcs, subtotal, catatan, dan link versi 2 untuk membuka ulang desain. Link versi 1 tetap terbaca; karakter koleksi lama harus dipilih ulang dari simbol baru sebelum memesan. Katalog menyertakan produk, jumlah, harga, subtotal, dan tautan. Pengunjung tetap harus menekan kirim sendiri di WhatsApp. Gambar clicker bisa diunduh sebagai PNG lalu dilampirkan sendiri di chat.

Email `bjbcetakin@gmail.com` tetap tersedia sebagai kontak umum. Situs tidak menyimpan pesanan, memproses pembayaran, atau mengurangi stok otomatis. Owner memperbarui stok di spreadsheet setelah konfirmasi. Publikasi Google Sheets dapat tertunda beberapa menit, sehingga ini bukan reservasi stok realtime.

## Hosting

**Vercel:** mendukung HTML/CSS/JS statis. Impor repositori website, gunakan framework **Other**, kosongkan Build Command, dan gunakan direktori akar sebagai Output Directory (`.` bila diminta). Jika repository berisi seluruh proyek induk, pilih Root Directory `website`. [Dokumentasi konfigurasi](https://vercel.com/docs/builds/configure-a-build).

Untuk penggunaan komersial Cetakin, pilih paket yang mengizinkannya; **Vercel Hobby ditujukan untuk penggunaan pribadi nonkomersial**. [Ketentuan Hobby](https://vercel.com/docs/plans/hobby).

**GitHub tetap dapat dipakai sebagai repositori sumber kode.** GitHub Pages tidak disarankan untuk versi katalog penjualan ini: kebijakannya membatasi penggunaan untuk menjalankan bisnis daring atau situs yang berfokus memfasilitasi transaksi komersial. [Batasan GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

Semua tautan halaman/aset lokal bersifat relatif sehingga kode tetap portabel ke hosting statis yang sesuai. Revisi ini belum di-commit, di-push, atau dideploy oleh agen.

## Pemeriksaan pengembangan

```powershell
node --test tests/catalog-core.test.cjs
node --test tests/clicker-core.test.cjs
```

Pada lingkungan yang membatasi pembuatan child process, gunakan `node --test --test-isolation=none tests/catalog-core.test.cjs tests/clicker-core.test.cjs`.

Tes mencakup CSV multibaris/kutipan, data rusak, produk nonaktif, filter, URL gambar, validasi jumlah, dan pesan pesanan. Tidak membutuhkan npm install.

Tinjau kedua katalog, stok habis, detail produk, filter kosong, menu ponsel, serta konfigurator clicker melalui server lokal. Integrasi sumber Google Sheets asli baru dapat diverifikasi setelah URL publik diberikan.

## Konten sebelum publikasi

- Masukkan produk, harga, stok, spesifikasi, serta gambar nyata dan isi URL CSV.
- Clicker masih memakai visualisasi konsep; jangan menyebutnya foto produk.
- Owner: **Naufal Elyzar** dan **M. Fadlianur**, nama saja.
- Instagram dan TikTok memakai handle usaha `@cetakin.bjb`.
- Setelah domain final tersedia, tambahkan canonical, sitemap dan gambar Open Graph dengan URL absolut. Metadata detail diubah oleh JavaScript; preview sosial per produk belum digenerasi di server.
- File bisnis, QRIS, model 3D, dan spreadsheet keuangan di folder induk tidak diperlukan untuk deployment website.
