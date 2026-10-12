'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STAGES = [
  {
    href: '/dashboard/descriptive',
    step: '01',
    label: 'Descriptive',
    question: 'Apa yang terjadi?',
    desc: 'Tren penjualan, revenue per region dan kategori, distribusi diskon, serta statistik deskriptif lengkap.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
  },
  {
    href: '/dashboard/diagnostic',
    step: '02',
    label: 'Diagnostic',
    question: 'Mengapa terjadi?',
    desc: 'Heatmap korelasi Pearson, kontribusi perubahan revenue, deteksi outlier IQR, dan dampak diskon.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    ),
  },
  {
    href: '/dashboard/predictive',
    step: '03',
    label: 'Predictive',
    question: 'Apa yang akan terjadi?',
    desc: 'Forecast revenue dengan regresi linear dan exponential smoothing, dievaluasi lewat MAE, RMSE, MAPE, dan R².',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    ),
  },
  {
    href: '/dashboard/prescriptive',
    step: '04',
    label: 'Prescriptive',
    question: 'Apa yang harus dilakukan?',
    desc: 'Rekomendasi, simulasi what-if, matriks prioritas segmen, target sales rep, dan action item berprioritas.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
]

const FEATURES = [
  {
    title: 'Filter global',
    desc: 'Region, kategori, tipe customer, sales channel, dan rentang tanggal. Berlaku di keempat halaman sekaligus.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M3 4a2 2 0 013-2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm0 4h18M7 12h4m-4 4h7" />
    ),
  },
  {
    title: 'Upload CSV',
    desc: 'Ganti dataset bawaan dengan file milik sendiri. Baris tidak valid dibuang dan dilaporkan otomatis.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M7 16a4 4 0 01-.88-7.9A5 5 0 0115.9 6.5A3.5 3.5 0 0118 13v3a2 2 0 01-2 2H7zm5-3l2 2 4-4" />
    ),
  },
  {
    title: 'Statistik manual',
    desc: 'Regresi, korelasi Pearson, exponential smoothing, dan IQR ditulis sendiri. Tanpa library stats eksternal.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M9 7h6M9 11h10M9 15h8M5 7h.01M5 11h.01M5 15h.01" />
    ),
  },
  {
    title: 'Insight otomatis',
    desc: 'Ringkasan temuan dihitung ulang mengikuti filter aktif, jadi selalu sesuai dengan data yang sedang dilihat.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347a3 3 0 01-2.121.879H9.34a3 3 0 01-2.121-.879l-.347-.347z" />
    ),
  },
  {
    title: 'Dark mode',
    desc: 'Toggle terang dan gelap yang konsisten di seluruh halaman, bukan hanya di dalam dashboard.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    ),
  },
  {
    title: 'Responsif & aksesibel',
    desc: 'Sidebar jadi drawer di layar kecil. Dilengkapi label ARIA dan navigasi keyboard.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M12 18h.01M11 12a1 1 0 112 0v5a2 2 0 11-4 0v-5a1 1 0 112 0z" />
    ),
  },
]

const STACK = [
  'Next.js 14',
  'React 18',
  'TypeScript',
  'Tailwind CSS',
  'Chart.js',
  'PapaParse',
]

export default function Home() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [dark])

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* ===================== NAVBAR ===================== */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="mr-auto min-w-0">
            <div className="font-semibold text-sm text-slate-900 dark:text-white leading-tight">Dashboard Penjualan</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">2023 Analytics</div>
          </div>

          <nav className="hidden md:flex items-center gap-1" aria-label="Navigasi halaman utama">
            {[
              { href: '#analitik', label: 'Analitik' },
              { href: '#fitur', label: 'Fitur' },
              { href: '#stack', label: 'Teknologi' },
            ].map((l) => (
              <a key={l.href} href={l.href}
                className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-500 rounded-lg transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          <button
            onClick={() => setDark((d) => !d)}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={dark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
          >
            {dark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <Link href="/dashboard/descriptive" className="btn-primary text-sm">
            Buka Dashboard
          </Link>
        </div>
      </header>

      {/* ===================== HERO ===================== */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-primary-100 dark:bg-primary-900/30 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 px-3 py-1 text-xs font-medium text-primary-700 dark:text-primary-300">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-600" aria-hidden="true" />
            Proyek IBM BOB · 200 transaksi · 2023
          </div>

          <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
            Dari angka mentah menjadi{' '}
            <span className="text-primary-600 dark:text-primary-500">keputusan</span>
          </h1>

          <p className="mt-5 mx-auto max-w-2xl text-base md:text-lg text-slate-600 dark:text-slate-400 text-pretty">
            Dashboard analitik penjualan yang memandu dari satu file CSV mentah melalui empat tahap analisis —
            dari melihat apa yang terjadi sampai menentukan tindakan yang harus diambil.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/dashboard/descriptive" className="btn-primary px-5 py-2.5 text-sm">
              Mulai Analisis
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </Link>
            <a href="#analitik"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              Lihat Tahap Analitik
            </a>
          </div>

          <dl className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { v: '200', l: 'Transaksi dianalisis' },
              { v: '4', l: 'Tahap analisis' },
              { v: '14', l: 'Kolom data' },
              { v: '0', l: 'Backend & database' },
            ].map((s) => (
              <div key={s.l} className="card">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{s.v}</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{s.l}</div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ===================== TAHAP ANALITIK ===================== */}
      <section id="analitik" className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Empat tahap analisis</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Setiap halaman menjawab satu pertanyaan berbeda. Filter global di sidebar berlaku di keempatnya,
              jadi setiap angka yang muncul selalu sesuai dengan subset data yang sedang dipilih.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {STAGES.map((s) => (
              <Link key={s.href} href={s.href}
                className="group card hover:border-primary-300 dark:hover:border-primary-800 hover:shadow-md transition-all duration-200">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      {s.icon}
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{s.step}</span>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{s.label}</h3>
                    </div>
                    <p className="mt-0.5 text-sm font-medium text-primary-600 dark:text-primary-400">{s.question}</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{s.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FITUR ===================== */}
      <section id="fitur" className="scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Fitur</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Semua perhitungan berjalan di sisi klien. Tidak ada backend, tidak ada database,
              tidak ada request setelah halaman dimuat.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card">
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    {f.icon}
                  </svg>
                </div>
                <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== STACK ===================== */}
      <section id="stack" className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Teknologi</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Stack yang ringan dan modern, cukup untuk satu dashboard analitik tanpa infrastruktur tambahan.
            </p>
          </div>

          <ul className="mt-10 flex flex-wrap gap-3" role="list">
            {STACK.map((t) => (
              <li key={t}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                {t}
              </li>
            ))}
          </ul>

          <div className="mt-12 card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Siap melihat datamu?</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Buka dashboard dan langsung eksplorasi 200 transaksi bawaan, atau unggah CSV milikmu.
                </p>
              </div>
              <Link href="/dashboard/descriptive" className="btn-primary flex-shrink-0">
                Buka Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Dashboard Penjualan 2023 · Proyek IBM BOB
          </p>
          <div className="flex items-center gap-4">
            <a href="https://github.com/myGroomy/dashboard-penjualan" target="_blank" rel="noreferrer"
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              GitHub
            </a>
            <Link href="/dashboard/descriptive"
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
