# Mengelola katalog Cetakin

Website membaca satu tabel produk dari Google Sheets melalui URL CSV publik. Kedua katalog dan halaman detail menggunakan tabel yang sama. Foto produk disimpan di layanan gambar pilihan Anda; tabel cukup berisi URL gambar tersebut.

## Kondisi saat ini

- `site-config.js` masih memiliki `csvUrl: ''`, sehingga website menampilkan **mode contoh** dari `data/products-demo.csv`.
- Seluruh produk, harga, stok, ukuran, material, dan ilustrasi contoh adalah data demonstrasi, bukan penawaran usaha yang sudah dikonfirmasi.
- Tombol WhatsApp pada produk contoh membuat pesan berlabel **simulasi pesanan**.
- Google Sheet asli belum dibuat atau dihubungkan. Setelah URL CSV diisi, website hanya membaca sumber tersebut dan tidak beralih diam-diam ke data contoh jika ada masalah.

## 1. Buat spreadsheet

1. Buat Google Sheet baru khusus katalog publik, misalnya **Katalog Cetakin**.
2. Pilih **File → Import → Upload**, lalu pilih `data/products-template.csv` dari folder website. Gunakan pemisah **Comma/koma** bila diperlukan.
3. Beri nama tab **Produk**. Jangan mengubah judul kolom di baris pertama.
4. Isi produk asli. Dua baris dalam template hanya petunjuk pengisian dan memiliki `active=FALSE`, sehingga tidak muncul di website.
5. Isi `price`, `stock`, dan `weight_grams` sebagai angka biasa. Jangan memakai simbol Rp, pemisah ribuan, atau rumus `IMAGE()` pada kolom URL gambar. Untuk kolom harga/stok, format **Plain text** dapat dipakai agar angka CSV tetap `25000`, bukan `25.000` atau `25,000`.
6. Ubah `active` menjadi `TRUE` hanya setelah data siap ditampilkan. Untuk menambah produk, cukup tambahkan baris baru.

| Kolom | Isi dan aturan |
| --- | --- |
| `id` | Kode unik dan tetap. Huruf kecil, angka, tanda hubung; maks. 80 karakter. Contoh `dudukan-servo-mini`. Jangan ganti ID produk yang sudah dibagikan. |
| `type` | Tepat `robotika` atau `gantungan-kunci`. |
| `name` | Nama produk, misalnya `Toothless Mini`. |
| `category` | Wajib untuk robotika, misalnya `Dudukan & Bracket`. Untuk ganci boleh kosong. |
| `origin` | Wajib untuk ganci, misalnya `How to Train Your Dragon` atau `Desain Cetakin`. Untuk robotika boleh kosong. |
| `price` | Harga satuan dalam rupiah, bilangan bulat positif; contoh `25000`. |
| `stock` | Jumlah stok siap dipesan, bilangan bulat minimal `0`. Nol membuat tombol beli nonaktif. |
| `image_url` | Satu URL HTTPS langsung ke gambar. Boleh kosong; website memakai gambar pengganti. |
| `description` | Deskripsi, isi paket, batas kompatibilitas, atau catatan produk. Mendukung paragraf/baris baru dalam sel. |
| `material` | Opsional, misalnya `PETG`. Hanya tulis bahan yang memang digunakan. |
| `dimensions` | Opsional, ukuran lengkap beserta satuan, misalnya `45 × 30 × 20 mm`. |
| `weight_grams` | Opsional, berat dalam gram. |
| `active` | `TRUE` untuk ditampilkan; `FALSE` untuk disembunyikan. |
| `featured` | Opsional, `TRUE` untuk diprioritaskan pada urutan **Pilihan Cetakin**. |
| `updated_at` | Opsional, tanggal pembaruan internal seperti `2026-09-28`. Bukan bukti bahwa stok sedang dicadangkan. |

Semua judul kolom pada template harus dipertahankan, termasuk `category` dan `origin`. Isi kolom yang tidak relevan boleh kosong. ID berulang, harga/stok tidak valid, atau kolom wajib kosong pada produk aktif akan menggagalkan pemuatan seluruh katalog supaya data salah tidak dipakai untuk pemesanan.

## 2. Publikasikan tab sebagai CSV

1. Di Google Sheets pilih **File → Share → Publish to web** / **Publikasikan ke web**.
2. Pilih tab **Produk**, lalu format **Comma-separated values (.csv)**. Publikasikan hanya tab katalog yang boleh dibaca publik.
3. Pastikan **Automatically republish when changes are made** aktif.
4. Salin URL publik berbentuk `https://docs.google.com/spreadsheets/d/e/.../pub?gid=...&single=true&output=csv`.
5. Buka `site-config.js`, masukkan URL tadi pada `catalog.csvUrl`:

```js
catalog: {
  csvUrl: 'TEMPEL_URL_CSV_HTTPS_DI_SINI',
  demoUrl: './data/products-demo.csv',
  refreshMs: 60000,
  timeoutMs: 12000
}
```

6. Jalankan website melalui server lokal atau hosting, lalu buka kedua katalog. Penanda **Pratinjau katalog** seharusnya hilang dan produk asli tampil.
7. Publikasikan perubahan konfigurasi website sekali. Perubahan isi produk berikutnya cukup dilakukan di Google Sheets, tanpa mengubah kode atau deploy ulang.

URL halaman editor `/edit`, halaman berbagi, dan halaman HTML hasil publikasi tidak dapat digunakan sebagai URL CSV. Sumber juga harus bisa diakses tanpa login dan mengizinkan pembacaan dari browser (CORS). Uji memakai tab privat setelah URL asli tersedia.

Spreadsheet katalog bersifat publik. Simpan data pelanggan, HPP, margin, dan catatan keuangan di dokumen terpisah. Website tidak memerlukan API key, service account, atau akses edit spreadsheet.

Petunjuk resmi publikasi dan jeda pembaruan: [Google Sheets Help](https://support.google.com/docs/answer/183965?hl=en).

## 3. Gambar dari layanan pihak ketiga

- Gunakan URL HTTPS yang langsung menampilkan gambar tanpa login, misalnya URL berkas JPG, PNG, WebP, atau endpoint gambar CDN. Tautan album, halaman unggahan, dan halaman berbagi Google Drive bukan URL gambar langsung.
- Hosting gambar harus mengizinkan gambar dimuat dari website lain. Tautan yang kedaluwarsa atau memblokir hotlink akan menampilkan gambar pengganti.
- Saran ukuran: rasio 4:3, sekitar 1200 × 900 px, berkas terkompresi sekitar 100–300 KB bila memungkinkan. Gambar ditampilkan dengan `object-fit: contain` agar bentuk produk tidak terpotong.
- Isi hanya satu URL pada `image_url`. Gambar yang sama dipakai pada kartu katalog dan halaman detail.

## 4. Stok dan pesanan WhatsApp

Alur saat ini: **Google Sheets → katalog → pesan WhatsApp → konfirmasi oleh owner → owner memperbarui stok di Google Sheets**.

- Website memuat data saat halaman dibuka dan mencoba memperbaruinya setiap 60 detik selama tab terlihat. Sumber CSV Google dapat membutuhkan beberapa menit untuk memperbarui publikasi; ini **bukan stok transaksi realtime**.
- Klik WhatsApp tidak mengurangi atau mencadangkan stok, dan website tidak dapat mengetahui apakah pesan jadi dikirim. Dua pengunjung bisa memilih stok terakhir yang sama.
- Pesan beli sudah berisi nama/kode produk, jumlah, harga satuan, subtotal, dan tautan produk. Tidak ada pertanyaan berulang tentang ketersediaan stok. Total beserta ongkir serta konfirmasi tetap diselesaikan lewat chat.
- Setelah pesanan dikonfirmasi, kurangi `stock` secara manual. Jika tidak dijual lagi, ubah `active` menjadi `FALSE`.
- Jika pembaruan data gagal, data sebelumnya dapat tetap terlihat tetapi tombol beli pada halaman detail dinonaktifkan sampai pemuatan berhasil. Website tidak menganggap data gagal sebagai stok terbaru.
- Batas jumlah per pesan adalah 999 pcs atau stok yang tersedia, mana yang lebih kecil. Diskusikan pesanan lebih besar melalui kontak usaha.

Untuk reservasi stok otomatis, keranjang lintas produk, pembayaran daring, atau banyak pesanan bersamaan, tahap berikutnya memerlukan backend dan basis data transaksi. Mengubah HTML ke framework saja tidak menyelesaikan kebutuhan tersebut.

## 5. Mengubah nomor dan pesan

- Nomor utama ada di `site-config.js`: `6285822801431` (format internasional tanpa `+`).
- Pesan konsultasi ada di `contact.js`.
- Pesan clicker ada di `app.js` dan mengikuti teks/warna yang dipilih.
- Pesan produk katalog ada di `catalog-core.js` fungsi `orderMessage`.
- Jika nomor berubah, perbarui juga tautan fallback WhatsApp pada HTML dan nomor yang terlihat di bagian kontak.

## Pemeriksaan sebelum menggunakan data asli

1. Buka katalog robotika dan ganci, pastikan kategori/asal desain serta harga cocok dengan spreadsheet.
2. Ubah satu stok ke `0` dan tunggu publikasi Google diperbarui. Tombol beli produk itu harus nonaktif.
3. Periksa foto, detail ukuran/bahan, jumlah, subtotal, dan draf pesan WhatsApp.
4. Buka URL detail produk langsung di tab baru untuk memeriksa tautan yang akan dibagikan.
5. Pastikan seluruh baris contoh sudah dihapus atau `active=FALSE` dan penanda demo sudah hilang.
