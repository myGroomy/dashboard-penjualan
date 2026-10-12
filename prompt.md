PERAN
Anda adalah Senior Data Analyst sekaligus Frontend Engineer yang berpengalaman membangun
dashboard analitik dengan HTML, Tailwind CSS, dan Vanilla JavaScript. Hasilkan dashboard yang
informatif, interaktif, mengikuti prinsip data visualization, dan siap dijalankan.

TAHAP 0: PERSIAPAN (WAJIB SEBELUM MENULIS KODE)
1. Baca folder .agents/ dan .claude/, lalu gunakan skills yang relevan (terutama skill untuk
   frontend/UI design dan data visualization). Sebutkan skill mana yang dipakai dan alasannya. Front end wajib pakai @taste-skills. 
2. Buka ibm-data/200_sales_data.csv dan periksa: nama kolom, tipe data, delimiter, encoding,
   format tanggal, nilai kosong, duplikat, serta nilai unik tiap kolom kategorikal. Jangan
   menebak skema. Jangan mengubah file CSV asli.
3. Tulis ringkasan temuan (maksimal 15 baris) berisi: daftar kolom, definisi metrik yang Anda
   pilih (Revenue, Total Transactions, Average Discount), serta analisis yang tidak dapat
   dibuat karena kolom tidak tersedia (misalnya tidak ada kolom tanggal) beserta alternatifnya.
4. Lanjutkan ke implementasi tanpa menunggu persetujuan, kecuali ada ambiguitas yang
   mengubah hasil secara signifikan.

TUJUAN
Buat Dashboard Penjualan multi-halaman (SPA tanpa framework) dengan data langsung dari
./ibm-data/200_sales_data.csv. Dilarang memakai data dummy atau data hardcode.

TEKNOLOGI DAN STRUKTUR FILE
- HTML semantik, Tailwind CSS (CDN), Vanilla JavaScript, Chart.js 4.x (CDN), PapaParse (CDN).
  Tentukan versi CDN secara eksplisit (pinned), bukan "latest".
- File: index.html, style.css (hanya styling tambahan yang tidak praktis dengan Tailwind),
  dan script.js. Folder ibm-data/ tidak diubah.
- script.js dibagi menjadi bagian-bagian berurutan dan diberi penanda komentar jelas:
  CONFIG, STATE, DATA (load/clean), FILTERS, STATS (fungsi perhitungan murni), CHARTS (helper),
  PAGES (renderDescriptive, renderDiagnostic, renderPredictive, renderPrescriptive), ROUTER,
  UI (dark mode, loading/error/empty state), INIT.
- Fungsi perhitungan (STATS) harus murni dan terpisah dari fungsi rendering (DOM/Chart).
- Karena fetch() gagal pada protokol file://, sediakan: (a) petunjuk menjalankan lewat server
  lokal (python -m http.server atau Live Server), dan (b) fallback tombol "Upload CSV" yang
  muncul otomatis bila fetch gagal.

DATA PIPELINE
loadData -> cleanData -> applyFilters -> hitung (STATS) -> render.
- cleanData: trim teks, konversi tipe angka dan tanggal, tangani nilai kosong, hapus duplikat,
  dan catat jumlah baris yang dibuang (tampilkan di UI).
- Definisikan Revenue, Total Transactions, dan Average Discount berdasarkan kolom asli CSV.
  Tampilkan definisinya lewat tooltip (ikon info) pada kartu KPI.
- Format angka memakai Intl.NumberFormat dengan locale id-ID. Tentukan mata uang berdasarkan
  data, dan gunakan singkatan untuk angka besar.

INTERFACE
- Mobile-first dan responsif. Sidebar tetap di desktop, berubah menjadi hamburger menu di mobile.
- Empat menu dengan ikon dan penanda aktif: Descriptive, Diagnostic, Predictive, Prescriptive.
  Halaman default adalah Descriptive.
- Hash routing (#/descriptive, #/diagnostic, #/predictive, #/prescriptive) tanpa reload; tombol
  back browser berfungsi dan halaman bisa di-bookmark. Transisi antar halaman halus (fade).
- Topbar: judul halaman, jumlah record aktif (misalnya "132 dari 200 transaksi"), tombol Reset
  Filter, dan toggle dark mode (chart ikut berganti warna).
- Filter global: Region, Product Category, Customer Type, Sales Channel, dan rentang tanggal
  (jika ada kolom tanggal). Default "All". Satu kali diubah, semua halaman dan chart ikut
  diperbarui tanpa refresh. Gunakan chart.update() atau chart.destroy() sebelum membuat ulang
  chart agar tidak terjadi memory leak.
- Desain konsisten: satu warna primer, satu warna aksen, warna semantik (positif/negatif/
  peringatan), palet yang aman untuk buta warna, card rounded-2xl dengan soft shadow, hover
  effect, dan transisi halus.
- Setiap halaman memiliki: loading state (skeleton), empty state saat filter tidak
  menghasilkan data, error state saat CSV gagal dimuat, dan 2-3 insight otomatis dalam kalimat
  bahasa Indonesia yang dihasilkan dari data.
- Aksesibilitas: aria-label pada chart dan kontrol, kontras warna memadai, navigasi keyboard.
- Bahasa UI dan komentar kode: Indonesia. Nama variabel dan fungsi: Inggris.

HALAMAN 1: DESCRIPTIVE ("Apa yang terjadi?")
- KPI: Total Revenue, Total Transactions, Total Quantity Sold, Average Discount.
- Visualisasi dan tipe chart:
  Sales Trend (line, granularitas mengikuti rentang data, dengan toggle harian/bulanan jika
  data mencukupi); Revenue per Region (bar); Revenue per Product Category (bar);
  Sales per Sales Representative (horizontal bar, diurutkan menurun);
  Customer Type Distribution (doughnut); Payment Method Usage (doughnut atau bar);
  Sales Channel Distribution (doughnut); Discount vs Sales (scatter); Top 10 Highest Sales
  (horizontal bar, diurutkan menurun); Quantity Sold per Category (bar).
- Tabel statistik deskriptif untuk kolom numerik: count, mean, median, modus, min, max,
  standar deviasi, Q1, Q3. Tambahkan histogram distribusi nilai penjualan.
- Tabel detail transaksi dengan search, sort, pagination, dan tombol export CSV hasil filter.

HALAMAN 2: DIAGNOSTIC ("Mengapa hal itu terjadi?")
- Heatmap korelasi Pearson antar kolom numerik, dibuat dengan tabel HTML + skala warna (tanpa
  plugin tambahan), disertai interpretasi kekuatan korelasi (lemah/sedang/kuat).
- Analisis kontribusi: pilih dua periode (dropdown), tampilkan dimensi (Region, Kategori,
  Sales Rep, Channel) mana yang paling berkontribusi pada perubahan revenue.
- Waterfall chart perubahan revenue antar periode (gunakan floating bar pada Chart.js).
- Deteksi outlier dengan metode IQR, tampilkan daftar transaksi yang terdeteksi.
- Drill-down: klik bar/segmen untuk melihat rincian pada dimensi lain.
- Dampak diskon terhadap quantity dan revenue per kategori.
- Kesimpulan penyebab ditulis otomatis dalam kalimat.

HALAMAN 3: PREDICTIVE ("Apa yang kemungkinan akan terjadi?")
- Seluruh model diimplementasikan sendiri dengan Vanilla JavaScript (tanpa library ML).
- Forecast revenue N periode ke depan (pilihan 3/6/12) dengan dua metode yang dapat
  dibandingkan lewat toggle: Linear Regression dan Exponential Smoothing.
- Line chart membedakan data aktual, garis tren, dan prediksi dengan confidence interval
  (dari standar deviasi residual).
- Pembagian data latih dan data uji (misalnya 80/20, urut waktu). Tampilkan MAE, RMSE, MAPE,
  dan R² untuk tiap metode.
- Proyeksi revenue per Region atau per Kategori (dropdown).
- Jika jumlah periode terlalu sedikit untuk model, turunkan granularitas (misalnya mingguan)
  atau tampilkan peringatan jelas.
- Tampilkan asumsi, keterbatasan model (data hanya 200 baris), dan peringatan bahwa hasil
  adalah estimasi.

HALAMAN 4: PRESCRIPTIVE ("Apa yang sebaiknya dilakukan?")
- Rekomendasi berbasis aturan (rule-based) yang dihitung dari data aktif, misalnya: kategori
  atau region dengan pertumbuhan tertinggi, segmen dengan diskon tinggi tetapi revenue rendah,
  Sales Rep di bawah rata-rata. Tampilkan angka pendukung pada tiap rekomendasi.
- Simulasi what-if dengan slider (diskon, harga, quantity) yang menampilkan estimasi dampak
  revenue secara langsung. Cantumkan asumsi elastisitas yang dipakai dan buat nilainya bisa
  diubah pengguna.
- Matriks prioritas segmen (dampak vs usaha) dalam bentuk bubble chart.
- Rekomendasi pembagian target penjualan per Sales Rep atau per Region.
- Daftar action items berprioritas (High/Medium/Low) dengan alasan dan estimasi dampak,
  dapat diexport ke CSV.

ATURAN SEMUA HALAMAN
- Semua perhitungan memakai data hasil filter global yang sedang aktif.
- Beri komentar bahasa Indonesia pada setiap rumus dan algoritma penting.
- Kode lengkap tanpa placeholder atau "// ...kode lainnya".
- Jika suatu analisis tidak mungkin dibuat karena keterbatasan kolom CSV, jangan dipalsukan:
  tampilkan pesan yang menjelaskan alasannya di halaman terkait.

VERIFIKASI SEBELUM SELESAI
Jalankan server lokal dan pastikan: (1) tidak ada error di console pada keempat halaman;
(2) mengubah setiap filter memperbarui KPI, chart, tabel, dan insight; (3) angka KPI cocok
dengan hitungan independen dari CSV (cek minimal Total Revenue dan Total Transactions);
(4) empty state, error state, dan dark mode berfungsi; (5) tampilan baik pada lebar 375px dan
1280px. Laporkan hasil verifikasi secara singkat.

OUTPUT AKHIR
Tampilkan struktur folder, daftar skill yang dipakai, definisi metrik yang dipilih, cara
menjalankan, serta asumsi dan keterbatasan.