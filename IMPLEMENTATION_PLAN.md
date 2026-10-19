# Rencana implementasi website Cetakin

Status: versi pertama tersedia. Revisi katalog dan WhatsApp diimplementasikan pada 28 September 2026; sumber Google Sheets asli dan publikasi revisi masih menunggu.

Bagian 1–9 berikut menyimpan keputusan/verifikasi versi awal. Keputusan terbaru pada bagian 10 menggantikan alur email dan rekomendasi hosting lama.

## 1. Tujuan dan posisi

Website berfungsi sebagai profil usaha Cetakin dan pintu masuk pemesanan. Pesan utama: **"Ide kecil jadi bentuk nyata."** Cetakin menawarkan jasa cetak 3D dan produk buatan sendiri, dimulai dari gantungan kunci clicker keyboard kustom 1–5 huruf. Usaha dijalankan oleh dua owner.

Narasi harus terasa rapi dan percaya diri tanpa mengklaim pengalaman, kapasitas produksi, testimoni, waktu pengerjaan, atau harga yang belum terverifikasi. Informasi teknis seperti printer Anycubic Kobra X tanpa AMS, material PETG, dan pilihan warna saat ini dapat muncul di bagian proses/FAQ, bukan mendominasi beranda.

## 2. Arah visual

- Gunakan logo horizontal untuk navigasi dan footer; ikon terpisah untuk favicon dan elemen kecil.
- Ikuti panduan warna pada `Logo/Filosofi.png`: oranye `#FF7A00`, charcoal `#1F2937`, sky blue `#38BDF8`, dan light blue `#E8F6FF`.
- Gaya editorial yang bersih: tipografi kuat, ruang kosong cukup, bidang terang sebagai dasar, bagian gelap untuk kontras, detail garis/lapisan yang mengingatkan proses cetak 3D.
- Hero dan configurator sementara memakai ilustrasi CSS berbentuk clicker yang diberi label sebagai visualisasi konsep. Saat foto produk nyata tersedia, ganti ilustrasi utama dengan foto tersebut.
- Animasi singkat dan berfungsi: transisi pergantian warna, respons clicker, kemunculan konten saat masuk layar. Hormati `prefers-reduced-motion`.

## 3. Struktur halaman versi pertama

1. **Beranda** — pernyataan nilai, visual produk, dua jalur CTA: "Konsultasikan cetakan" dan "Lihat produk".
2. **Layanan** — cetak 3D kustom, alur dari ide/file sampai hasil, jenis permintaan yang bisa dikonsultasikan. Hindari janji material/finishing yang belum tersedia.
3. **Produk** — clicker keyboard 1–5 huruf, opsi warna PETG yang tersedia, detail switch dan gantungan, galeri foto/render, CTA pemesanan. Harga ditampilkan hanya jika sudah disetujui dan HPP final.
4. **Tentang Cetakin** — makna nama, logo berlapis, nilai ramah/kreatif/modern/presisi berdasarkan panduan brand.
5. **Dua owner** — tampilkan nama Naufal Elyzar dan M. Fadlianur saja, tanpa jabatan, foto, atau tautan pribadi. Kanal kontak usaha ditampilkan terpisah.
6. **Kontak** — email usaha `bjbcetakin@gmail.com`, Instagram dan TikTok usaha `@cetakin.bjb`, jam respons bila ada, dan FAQ ringkas. Tautan email dapat membuka subjek dan draf pesan sesuai jenis permintaan. Tidak ada tombol WhatsApp.

Untuk rilis awal, gunakan satu halaman profil dengan bagian katalog clicker dan navigasi jangkar. Formulir pengiriman data belum diperlukan; tombol pemesanan membuka draf email. Struktur produk tetap mudah dikembangkan menjadi halaman tersendiri.

## 4. Interaksi yang memberi manfaat

- **Pratinjau clicker**: pengunjung mengetik 1–5 huruf dan memilih warna untuk melihat contoh tampilan. Label jelas bahwa ini simulasi, bukan pratinjau final produksi.
- **Interaksi tombol clicker**: tekan dengan mouse, sentuh, atau keyboard; umpan balik visual ringan. Suara tidak diputar otomatis.
- **Galeri produk**: ditunda sampai foto atau render model produk yang sudah dikonfirmasi tersedia. Versi pertama memakai satu ilustrasi interaktif yang jujur tentang statusnya.
- **CTA kontekstual**: pilihan "Pesan clicker" atau "Konsultasi jasa cetak" membuka email dengan subjek/draf berbeda. Instagram dan TikTok menjadi kanal pendukung; website tidak menyimpan data pengunjung.

## 5. Teknologi dan publikasi

- **HTML + CSS + JavaScript statis** tanpa dependensi dan proses build. Rencana Astro diganti karena paket tidak tersedia di lingkungan kerja offline dan halaman ini tidak memerlukan framework. Situs tetap dapat dipasang di GitHub Pages maupun Vercel.
- Optimasi gambar, metadata SEO, Open Graph, sitemap, semantik HTML, navigasi keyboard, dan tata letak responsif.
- Sumber kode ditempatkan di folder `website/` agar file bisnis, STL, QRIS, dan spreadsheet di folder induk tidak ikut dipublikasikan.
- **Pilihan utama:** repositori GitHub khusus folder website, lalu deploy statis ke Vercel. **Alternatif:** GitHub Pages dari branch utama dan direktori akar repositori. Seluruh path aset/tautan internal memakai path relatif agar bekerja pada subpath repo.
- Jangan memasukkan `Qris/Qris.jpeg`, kalkulator keuangan, atau aset operasional lain ke direktori publik website.

Petunjuk publikasi khusus proyek ini ada di `README.md`.

## 6. Urutan pengerjaan

1. **Konten dan aset:** pastikan cakupan layanan, foto produk, dan apakah harga boleh ditampilkan. Nama kedua owner sudah tersedia; versi awal memakai ilustrasi berlabel.
2. **Fondasi:** buat halaman statis, token warna/tipografi, layout, navigasi, dan metadata dasar.
3. **Halaman:** bangun hero, layanan, produk, proses, cerita brand, owner, FAQ, dan kontak dengan copy bahasa Indonesia.
4. **Interaksi:** pratinjau clicker, kontrol warna, microinteraction, dan CTA email dengan draf pesan yang relevan.
5. **Pemeriksaan:** uji desktop/mobile, akses keyboard, kontras, reduced motion, tautan kontak, tampilan gambar, dan kesiapan path relatif untuk GitHub Pages/Vercel.
6. **Publikasi:** setelah konten publik terverifikasi, buat repo website dan deploy ke platform yang dipilih; cek URL live dan metadata sosial.

## 7. Kriteria selesai

- Website nyaman dipakai pada ponsel dan desktop, dengan CTA kontak terlihat jelas.
- Dua owner tampil dengan informasi yang memang disetujui untuk publik.
- Layanan dan produk dipahami tanpa klaim yang belum dibuktikan.
- Pratinjau clicker dapat dioperasikan dengan keyboard serta tidak menghalangi pengunjung yang mengurangi animasi.
- File statis dapat disajikan langsung tanpa build; path relatif mendukung Vercel dan GitHub Pages.
- Folder publik tidak berisi QRIS, file keuangan, atau aset usaha internal.

## 8. Data yang masih diperlukan

- Nama owner sudah final untuk tampilan awal: **Naufal Elyzar** dan **M. Fadlianur**, tanpa jabatan, foto, atau tautan pribadi.
- Konfirmasi URL akun Instagram/TikTok `@cetakin.bjb`, lokasi/jangkauan layanan, dan jam respons jika ingin ditampilkan. Email usaha yang diberikan: **bjbcetakin@gmail.com**.
- Cakupan rilis pertama yang diasumsikan: **profil + katalog clicker + kontak email**, tanpa formulir. Ini dapat diubah bila kebutuhan pemesanan sudah jelas.
- Foto clicker nyata (jika tersedia), contoh cetakan jasa, dan status harga final.
- Nama akun/repo GitHub, pilihan Vercel atau GitHub Pages, dan domain jika sudah ada. Ini diperlukan saat tahap publikasi, bukan untuk membuat website lokal.

## 9. Verifikasi implementasi lokal

- Seluruh file situs dan aset mengembalikan HTTP 200 dari server statis lokal.
- Semua jangkar dan referensi aset relatif yang ada di HTML ditemukan.
- JavaScript lolos pemeriksaan sintaks `node --check`.
- Simulasi clicker diuji untuk perubahan huruf, pembatasan input ke A–Z, pilihan warna, tautan email yang menyesuaikan pilihan, dan kondisi input kosong.
- Tata letak diperiksa pada desktop serta viewport ponsel 390 px dan 320 px; tidak ditemukan gulir horizontal pada viewport 320 px.
- Logo footer dan kontras beberapa teks kecil dikoreksi setelah pemeriksaan visual.
- Tautan Instagram dan TikTok dibuat dari handle yang diberikan, tetapi halaman akun belum dapat diverifikasi dari lingkungan ini.


## 10. Revisi katalog dan WhatsApp — 28 September 2026

- Pertahankan **Produk Pertama** clicker, simulator, dan kedua nama owner.
- Tambahkan layanan **Komponen Robotika** dan **Gantungan Kunci** beserta halaman katalog terpisah.
- Gunakan kategori pada robotika dan asal desain/seri pada ganci. Keduanya memiliki pencarian, filter harga/stok, pengurutan, hasil kosong, serta pemuatan bertahap.
- Tambahkan detail produk dengan satu gambar, deskripsi, spesifikasi, stok, kontrol jumlah, subtotal, salin tautan, produk terkait, dan tombol WhatsApp.
- Seluruh alur pemesanan/konsultasi pindah ke **0858 2280 1431**, dengan pesan semi formal sesuai konteks. Email tetap kontak umum.
- Tetap memakai HTML/CSS/JavaScript. Katalog membaca CSV Google Sheets tanpa server aplikasi atau kunci rahasia. Satu tabel membedakan dua katalog melalui kolom `type`.
- Karena spreadsheet belum ada, sediakan template impor, panduan pengelolaan, dan mode contoh yang ditandai jelas. Produk/harga/stok contoh bukan penawaran riil.
- Data dimuat saat membuka halaman dan diperbarui berkala selama tab terlihat. Stok belum dicadangkan lewat WhatsApp; owner memperbaruinya setelah konfirmasi. Sumber publikasi Sheets dapat memiliki jeda.
- Tombol beli dinonaktifkan untuk stok nol, jumlah tidak valid, atau data gagal diperbarui. Sumber asli yang gagal tidak diganti data contoh.
- Vercel mendukung teknologinya; pilih paket yang mengizinkan bisnis, karena Hobby nonkomersial. GitHub tetap penyimpanan kode; GitHub Pages tidak direkomendasikan untuk katalog transaksi ini. Rujukan resmi ada di README.
- Integrasi Google Sheets asli baru dapat diverifikasi setelah URL CSV tersedia. Tidak ada publikasi revisi otomatis.

Panduan operasional terbaru: **KATALOG.md**. Tes logika: `node --test tests/catalog-core.test.cjs`.


### Hasil verifikasi revisi

- 6 tes logika lulus melalui `node tests/catalog-core.test.cjs`. Runner `node --test` tidak dapat membuat subprocess di sandbox ini; menjalankan berkas tes langsung tetap menjalankan semua tes Node.
- 4 halaman HTML lolos pemeriksaan referensi berkas dan jangkar; 7 rute halaman/aset/data mengembalikan HTTP 200.
- Browser: pencarian, kategori, asal desain, rentang harga tidak valid, reset filter, stok tersedia, navigasi kartu ke detail, jumlah/subtotal, pesan WhatsApp, stok nol, dan ID tidak ditemukan diperiksa.
- Sumber live sengaja digagalkan melalui server uji sementara: tidak muncul data contoh, detail tidak ditampilkan, dan tidak ada tautan pemesanan aktif. Server uji sudah dihentikan.
- Tampilan katalog/detail diperiksa pada desktop dan ponsel 390/320 px. Navigasi dan kontak beranda diperiksa; tidak ditemukan overflow horizontal halaman.
- Simulator clicker tetap bekerja, dan pilihan teks/warna diteruskan ke WhatsApp.
- Koneksi Google Sheets asli, perubahan stok dari Sheets, dan URL foto pihak ketiga masih menunggu data asli.
