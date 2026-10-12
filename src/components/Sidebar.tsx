'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useStore } from '@/store/StoreContext'
import clsx from 'clsx'

const navItems = [
  {
    href: '/dashboard/descriptive',
    label: 'Descriptive',
    sub: 'Apa yang terjadi?',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
  },
  {
    href: '/dashboard/diagnostic',
    label: 'Diagnostic',
    sub: 'Mengapa terjadi?',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    ),
  },
  {
    href: '/dashboard/predictive',
    label: 'Predictive',
    sub: 'Apa yang akan terjadi?',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    ),
  },
  {
    href: '/dashboard/prescriptive',
    label: 'Prescriptive',
    sub: 'Apa yang harus dilakukan?',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { filters, setFilter, quality, regions, categories, customerTypes, channels } = useStore()

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          'fixed top-0 left-0 h-full w-64 bg-sidebar z-30 flex flex-col shadow-2xl transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        aria-label="Navigasi utama"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <div className="text-white font-semibold text-sm leading-tight">Dashboard Penjualan</div>
            <div className="text-slate-400 text-xs">2023 Analytics</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto" role="navigation">
          {/* Menu Analitik */}
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2">Analitik</div>
          <ul className="space-y-1 mb-4" role="list">
            {navItems.map((item) => {
              const active = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? 'page' : undefined}
                    className={clsx(
                      'group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150',
                      active
                        ? 'bg-sidebar-active text-white'
                        : 'text-slate-300 hover:bg-sidebar-hover hover:text-white'
                    )}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {item.icon}
                    </svg>
                    <div>
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className={clsx('text-xs', active ? 'text-blue-200' : 'text-slate-500 group-hover:text-slate-400')}>
                        {item.sub}
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Divider */}
          <div className="border-t border-slate-700 my-3" />
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2">Filter Global</div>

          {/* Filter Region */}
          <div className="px-3 mb-3">
            <label htmlFor="filter-region" className="block text-slate-400 text-xs mb-1">Region</label>
            <select id="filter-region" value={filters.region} onChange={(e) => setFilter('region', e.target.value)}
              className="select-input" aria-label="Filter berdasarkan region">
              <option value="">Semua Region</option>
              {regions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Filter Kategori */}
          <div className="px-3 mb-3">
            <label htmlFor="filter-category" className="block text-slate-400 text-xs mb-1">Kategori Produk</label>
            <select id="filter-category" value={filters.category} onChange={(e) => setFilter('category', e.target.value)}
              className="select-input" aria-label="Filter berdasarkan kategori produk">
              <option value="">Semua Kategori</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Filter Tipe Customer */}
          <div className="px-3 mb-3">
            <label htmlFor="filter-customer" className="block text-slate-400 text-xs mb-1">Tipe Customer</label>
            <select id="filter-customer" value={filters.customerType} onChange={(e) => setFilter('customerType', e.target.value)}
              className="select-input" aria-label="Filter berdasarkan tipe customer">
              <option value="">Semua Tipe</option>
              {customerTypes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Filter Channel */}
          <div className="px-3 mb-3">
            <label htmlFor="filter-channel" className="block text-slate-400 text-xs mb-1">Sales Channel</label>
            <select id="filter-channel" value={filters.channel} onChange={(e) => setFilter('channel', e.target.value)}
              className="select-input" aria-label="Filter berdasarkan sales channel">
              <option value="">Semua Channel</option>
              {channels.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Filter Tanggal */}
          <div className="px-3 mb-3">
            <label htmlFor="filter-date-start" className="block text-slate-400 text-xs mb-1">Tanggal Mulai</label>
            <input type="date" id="filter-date-start" value={filters.dateStart}
              onChange={(e) => setFilter('dateStart', e.target.value)}
              className="select-input" aria-label="Filter tanggal mulai" />
          </div>
          <div className="px-3 mb-4">
            <label htmlFor="filter-date-end" className="block text-slate-400 text-xs mb-1">Tanggal Akhir</label>
            <input type="date" id="filter-date-end" value={filters.dateEnd}
              onChange={(e) => setFilter('dateEnd', e.target.value)}
              className="select-input" aria-label="Filter tanggal akhir" />
          </div>
        </nav>

        {/* Footer kualitas data */}
        <div className="px-6 py-3 border-t border-slate-700 flex-shrink-0">
          {quality ? (
            <div className="text-xs text-slate-500">
              <div>{quality.totalClean} baris valid dari {quality.totalRaw}</div>
              {quality.discarded > 0 && (
                <div className="text-amber-400">{quality.discarded} baris dibuang</div>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-500">Memuat data...</div>
          )}
        </div>
      </aside>
    </>
  )
}
