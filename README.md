# Dashboard Penjualan 2023

Dashboard analitik penjualan berbasis Next.js yang memandu user lewat **empat tahap analisis data**, dari melihat apa yang terjadi sampai menentukan tindakan yang harus diambil.

Dibangun sebagai proyek IBM BOB dengan data penjualan 200 transaksi (2023).

---

## Tabel Isi

- [Tentang Proyek](#tentang-proyek)
- [Empat Tahap Analitik](#empat-tahap-analitik)
- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Menjalankan Proyek](#menjalankan-proyek)
- [Struktur Proyek](#struktur-proyek)
- [Format Data CSV](#format-data-csv)
- [Skrip](#skrip)

---

## Tentang Proyek

Aplikasi dashboard yang mengubah satu file CSV penjualan mentah menjadi insight yang bisa ditindaklanjuti.

Alur penggunaannya: data CSV dimuat otomatis saat aplikasi dibuka, atau pengguna mengunggah file sendiri. Selanjutnya, seluruh halaman analisis dijejalkan filter global yang sama di sidebar. Terakhir, tiap halaman menjawab pertanyaan yang berbeda dalam rangkaian analisis empat tahap.

Semua perhitungan statistik dijalankan di sisi klien (browser) tanpa backend atau database.

---

## Empat Tahap Analitik

| Tahap | Pertanyaan | Isi Halaman |
| --- | --- | --- |
| **Descriptive** | Apa yang terjadi? | Tren penjualan, revenue per region/kategori/sales rep, scatter diskon vs penjualan, top 10 transaksi, statistik deskriptif (mean, median, modus, std dev, kuartil) |
| **Diagnostic** | Mengapa terjadi? | Heatmap korelasi Pearson, analisis kontribusi perubahan revenue antar-periode, deteksi outlier metode IQR, dampak diskon per kategori |
| **Predictive** | Apa yang akan terjadi? | Forecast revenue dengan regresi linear + exponential smoothing, evaluasi model (MAE, RMSE, MAPE, R²), proyeksi periode berikutnya |
| **Prescriptive** | Apa yang harus dilakukan? | Rekomendasi berbasis data, simulasi what-if, matriks prioritas segmen, target per sales rep, action items berprioritas |

Rute halaman:

```
/                          → landing page (informasi proyek)
/dashboard/descriptive     → Apa yang terjadi?
/dashboard/diagnostic      → Mengapa terjadi?
/dashboard/predictive      → Apa yang akan terjadi?
/dashboard/prescriptive    → Apa yang harus dilakukan?
```

---

## Fitur

- **Filter global** — region, kategori produk, tipe customer, sales channel, dan rentang tanggal. Filter berlaku di keempat halaman sekaligus.
- **Visualisasi Chart.js** — line, bar, doughnut, scatter, dan bubble chart dibungkus `react-chartjs-2`.
- **Statistik diimplementasikan sendiri** — mean, median, modus, deviasi standar, kuartil, korelasi Pearson, regresi linear, exponential smoothing, dan IQR outlier detection ditulis manual di `src/lib/stats.ts` tanpa library statistik eksternal.
- **Upload CSV** — ganti dataset bawaan dengan file CSV milik sendiri, dengan validasi dan pembersihan baris.
- **Indikator kualitas data** — sidebar menampilkan jumlah baris valid dari total baris terbaca dan berapa baris yang dibuang.
- **Insight otomatis** — ringkasan temuan yang dihitung ulang mengikuti filter aktif.
- **Dark mode** — toggle terang/gelap, konsisten di seluruh halaman.
- **Responsif** — sidebar menjadi drawer pada layar kecil.
- **Aksesibilitas** — label ARIA, navigasi keyboard, dan ikon dekoratif disembunyikan dari screen reader.

---

## Teknologi

| Layer | Teknologi |
| --- | --- |
| Framework | Next.js 14.2.5 (App Router) |
| UI | React 18.3.1, TypeScript 5.5.3 |
| Styling | Tailwind CSS 3.4.4 |
| Grafik | Chart.js 4.4.2 + react-chartjs-2 5.2.0 |
| Parsing CSV | PapaParse 5.4.1 |
| Utilitas | clsx 2.1.1 |
| Linting | ESLint 8.57.0 + eslint-config-next |

---

## Menjalankan Proyek

Prasyarat: **Node.js 18.17+** dan **npm**.

```bash
# Install dependensi
npm install

# Jalankan server pengembangan
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### Build produksi

```bash
npm run build     # bundle produksi ke .next/
npm start         # jalankan server hasil build
```

### Linting

```bash
npm run lint
```

---

## Struktur Proyek

```
.
├── public/
│   └── ibm-data/
│       └── 200_sales_data.csv   # dataset bawaan (200 transaksi)
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # root layout + metadata
│   │   ├── page.tsx                    # landing page
│   │   ├── globals.css                 # Tailwind + komponen global
│   │   └── dashboard/
│   │       ├── layout.tsx              # shell dashboard
│   │       ├── DashboardLayout.tsx     # sidebar + topbar + provider
│   │       ├── descriptive/page.tsx
│   │       ├── diagnostic/page.tsx
│   │       ├── predictive/page.tsx
│   │       └── prescriptive/page.tsx
│   ├── components/
│   │   ├── Sidebar.tsx        # navigasi + filter global
│   │   ├── Topbar.tsx         # judul halaman, reset filter, dark mode
│   │   ├── UI.tsx             # KpiCard, InsightBox, EmptyState, dll
│   │   └── UploadFallback.tsx # fallback upload CSV
│   ├── lib/
│   │   ├── types.ts           # tipe data mentah & bersih
│   │   ├── dataLoader.ts      # baca CSV + pembersihan baris
│   │   └── stats.ts           # fungsi statistik murni
│   └── store/
│       └── StoreContext.tsx   # state global: data, filter, dark mode
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Format Data CSV

Dataset bawaan berisi 200 transaksi dengan kolom berikut:

| Kolom | Tipe | Contoh |
| --- | --- | --- |
| `Product_ID` | number | `1088` |
| `Sale_Date` | date | `2023-11-16` |
| `Sales_Rep` | string | `Eve` |
| `Region` | string | `North` |
| `Sales_Amount` | number | `8518.45` |
| `Quantity_Sold` | number | `13` |
| `Product_Category` | string | `Furniture` |
| `Unit_Cost` | number | `2440.11` |
| `Unit_Price` | number | `2517.60` |
| `Customer_Type` | string | `New` |
| `Discount` | number (0–1) | `0.23` |
| `Payment_Method` | string | `Bank Transfer` |
| `Sales_Channel` | string | `Retail` |
| `Region_and_Sales_Rep` | string | `North-Eve` |

### Membuat CSV sendiri

Unggah lewat tombol upload di dashboard, atau ganti isi `public/ibm-data/200_sales_data.csv`.

Aturan minimal agar file terbaca:

- Baris pertama berisi nama kolom.
- Kolom wajib: `Sale_Date`, `Sales_Amount`, `Quantity_Sold`, `Unit_Cost`, `Unit_Price`, `Discount`, `Region`, `Sales_Rep`, `Product_Category`, `Customer_Type`, `Sales_Channel`, `Payment_Method`.
- Baris dengan nilai tidak valid (tanggal rusak, angka non-numerik) otomatis dibuang dan dihitung pada indikator kualitas data.

---

## Skrip

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan dengan hot reload |
| `npm run build` | Build produksi |
| `npm start` | Menjalankan hasil build produksi |
| `npm run lint` | Menjalankan ESLint |

---

## Lisensi

MIT
