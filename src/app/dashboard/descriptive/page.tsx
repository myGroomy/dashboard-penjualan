'use client'
import { useMemo, useState, useEffect, useRef } from 'react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Line, Doughnut, Scatter } from 'react-chartjs-2'
import { useStore } from '@/store/StoreContext'
import {
  calcTotalRevenue, calcTotalTransactions, calcTotalQuantity, calcAvgDiscount,
  groupByRevenue, groupByCount, revenueByMonth, revenueByDay,
  descStats, fmtRupiah, fmtNum, fmtPct, sortDesc,
} from '@/lib/stats'
import { KpiCard, SkeletonCard, EmptyState, InsightBox, SectionHeader, SkeletonRows } from '@/components/UI'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler)

// ---- Palet warna aman untuk buta warna ----
const PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
const chartFont = { family: "'Inter', system-ui, sans-serif", size: 11 }
const baseTooltip = {
  backgroundColor: '#1e293b',
  titleColor: '#f1f5f9',
  bodyColor: '#94a3b8',
  cornerRadius: 8,
  padding: 10,
}

function useChartColors(darkMode: boolean) {
  return {
    gridColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    tickColor: darkMode ? '#94a3b8' : '#64748b',
  }
}

export default function DescriptivePage() {
  const { filteredData, loading, darkMode } = useStore()
  const [granularity, setGranularity] = useState<'monthly' | 'daily'>('monthly')
  const [tableSearch, setTableSearch] = useState('')
  const [tablePage, setTablePage] = useState(1)
  const [tableSort, setTableSort] = useState<{ col: string; dir: 'asc' | 'desc' }>({ col: 'saleDate', dir: 'desc' })
  const PAGE_SIZE = 10
  const { gridColor, tickColor } = useChartColors(darkMode)

  // ---- KPI ----
  const totalRevenue      = useMemo(() => calcTotalRevenue(filteredData), [filteredData])
  const totalTransactions = useMemo(() => calcTotalTransactions(filteredData), [filteredData])
  const totalQuantity     = useMemo(() => calcTotalQuantity(filteredData), [filteredData])
  const avgDiscount       = useMemo(() => calcAvgDiscount(filteredData), [filteredData])

  // ---- Insights otomatis ----
  const insights = useMemo(() => {
    if (!filteredData.length) return []
    const byRegion   = sortDesc(groupByRevenue(filteredData, 'region'))
    const byCategory = sortDesc(groupByRevenue(filteredData, 'productCategory'))
    const byRep      = sortDesc(groupByRevenue(filteredData, 'salesRep'))
    const results: string[] = []
    if (byRegion[0])   results.push(`Region ${byRegion[0][0]} menghasilkan revenue tertinggi sebesar ${fmtRupiah(byRegion[0][1])}.`)
    if (byCategory[0]) results.push(`Kategori ${byCategory[0][0]} mendominasi penjualan dengan ${fmtRupiah(byCategory[0][1])}.`)
    if (byRep[0])      results.push(`Sales Rep ${byRep[0][0]} adalah yang paling produktif dengan ${fmtRupiah(byRep[0][1])} total revenue.`)
    return results
  }, [filteredData])

  // ---- Chart: Sales Trend ----
  const trendData = useMemo(() => {
    const raw = granularity === 'monthly' ? revenueByMonth(filteredData) : revenueByDay(filteredData)
    const sorted = Object.entries(raw).sort(([a], [b]) => a.localeCompare(b))
    return { labels: sorted.map(([k]) => k), values: sorted.map(([, v]) => v) }
  }, [filteredData, granularity])

  // ---- Chart: Revenue per Region ----
  const regionData = useMemo(() => sortDesc(groupByRevenue(filteredData, 'region')), [filteredData])

  // ---- Chart: Revenue per Category ----
  const categoryData = useMemo(() => sortDesc(groupByRevenue(filteredData, 'productCategory')), [filteredData])

  // ---- Chart: Sales per Sales Rep ----
  const repData = useMemo(() => sortDesc(groupByRevenue(filteredData, 'salesRep')), [filteredData])

  // ---- Chart: Customer Type ----
  const custTypeData = useMemo(() => groupByCount(filteredData, 'customerType'), [filteredData])

  // ---- Chart: Payment Method ----
  const paymentData = useMemo(() => groupByCount(filteredData, 'paymentMethod'), [filteredData])

  // ---- Chart: Sales Channel ----
  const channelData = useMemo(() => groupByCount(filteredData, 'salesChannel'), [filteredData])

  // ---- Chart: Top 10 Highest Sales ----
  const top10 = useMemo(() =>
    [...filteredData].sort((a, b) => b.salesAmount - a.salesAmount).slice(0, 10),
  [filteredData])

  // ---- Chart: Quantity per Category ----
  const qtyCatData = useMemo(() => {
    const res: Record<string, number> = {}
    for (const r of filteredData) res[r.productCategory] = (res[r.productCategory] ?? 0) + r.quantitySold
    return sortDesc(res)
  }, [filteredData])

  // ---- Statistik Deskriptif ----
  const statsTable = useMemo(() => [
    descStats(filteredData.map(r => r.salesAmount),   'Sales Amount'),
    descStats(filteredData.map(r => r.quantitySold),  'Quantity Sold'),
    descStats(filteredData.map(r => r.discount * 100),'Discount (%)'),
    descStats(filteredData.map(r => r.unitPrice),     'Unit Price'),
    descStats(filteredData.map(r => r.unitCost),      'Unit Cost'),
  ], [filteredData])

  // ---- Tabel Detail Transaksi ----
  const tableFiltered = useMemo(() => {
    const q = tableSearch.toLowerCase()
    return filteredData.filter(r =>
      !q ||
      r.salesRep.toLowerCase().includes(q) ||
      r.region.toLowerCase().includes(q) ||
      r.productCategory.toLowerCase().includes(q) ||
      r.customerType.toLowerCase().includes(q) ||
      r.salesChannel.toLowerCase().includes(q)
    )
  }, [filteredData, tableSearch])

  const tableSorted = useMemo(() => {
    return [...tableFiltered].sort((a, b) => {
      let av: unknown = a[tableSort.col as keyof typeof a]
      let bv: unknown = b[tableSort.col as keyof typeof b]
      if (av instanceof Date) av = av.getTime()
      if (bv instanceof Date) bv = bv.getTime()
      if (typeof av === 'number' && typeof bv === 'number')
        return tableSort.dir === 'asc' ? av - bv : bv - av
      return tableSort.dir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av))
    })
  }, [tableFiltered, tableSort])

  const totalPages = Math.ceil(tableSorted.length / PAGE_SIZE)
  const tablePage_ = Math.min(tablePage, Math.max(1, totalPages))
  const tableSlice = tableSorted.slice((tablePage_ - 1) * PAGE_SIZE, tablePage_ * PAGE_SIZE)

  function sortBy(col: string) {
    setTableSort(prev => ({ col, dir: prev.col === col && prev.dir === 'asc' ? 'desc' : 'asc' }))
    setTablePage(1)
  }

  function exportCsv() {
    const header = 'Tanggal,Sales Rep,Region,Kategori,Sales Amount,Qty,Diskon,Channel,Tipe Customer'
    const rows = tableSorted.map(r =>
      [r.saleDate.toISOString().slice(0,10), r.salesRep, r.region, r.productCategory,
       r.salesAmount, r.quantitySold, fmtPct(r.discount), r.salesChannel, r.customerType].join(',')
    )
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'penjualan_filter.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_,i) => <SkeletonCard key={i} />)}
      </div>
      <SkeletonRows count={6} />
    </div>
  )

  if (!filteredData.length) return <EmptyState />

  const scaleOpts = {
    grid:  { color: gridColor },
    ticks: { color: tickColor, font: chartFont },
  }

  return (
    <div className="space-y-6 page-enter">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Revenue" value={fmtRupiah(totalRevenue)}
          tooltip="Total Sales Amount dari semua transaksi pada filter aktif"
          color="blue" />
        <KpiCard label="Total Transaksi" value={fmtNum(totalTransactions, 0)}
          tooltip="Jumlah baris transaksi (setelah pembersihan duplikat)"
          color="green" />
        <KpiCard label="Total Qty Terjual" value={fmtNum(totalQuantity, 0)}
          tooltip="Jumlah total Quantity_Sold dari semua transaksi"
          color="purple" />
        <KpiCard label="Rata-rata Diskon" value={fmtPct(avgDiscount)}
          tooltip="Rata-rata nilai kolom Discount (0–1) dikali 100"
          color="amber" />
      </div>

      {/* Insight */}
      <InsightBox insights={insights} />

      {/* Sales Trend */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader title="Tren Penjualan" sub="Revenue dari waktu ke waktu" />
          <div className="flex gap-2">
            {(['monthly', 'daily'] as const).map(g => (
              <button key={g}
                onClick={() => setGranularity(g)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${granularity === g ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}>
                {g === 'monthly' ? 'Bulanan' : 'Harian'}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64" aria-label="Grafik tren penjualan">
          <Line data={{
            labels: trendData.labels,
            datasets: [{
              label: 'Revenue',
              data: trendData.values,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59,130,246,0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 3,
            }]
          }} options={{
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { ...baseTooltip, callbacks: { label: ctx => fmtRupiah(ctx.parsed.y) } } },
            scales: { x: scaleOpts, y: { ...scaleOpts, ticks: { ...scaleOpts.ticks, callback: (v) => fmtRupiah(Number(v)) } } },
          }} />
        </div>
      </div>

      {/* Revenue per Region & per Category */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <SectionHeader title="Revenue per Region" />
          <div className="h-52" aria-label="Revenue per region">
            <Bar data={{
              labels: regionData.map(([k]) => k),
              datasets: [{ label: 'Revenue', data: regionData.map(([,v]) => v), backgroundColor: PALETTE }]
            }} options={{
              responsive: true, maintainAspectRatio: false, indexAxis: 'x' as const,
              plugins: { legend: { display: false }, tooltip: { ...baseTooltip, callbacks: { label: ctx => fmtRupiah(ctx.parsed.y) } } },
              scales: { x: scaleOpts, y: { ...scaleOpts, ticks: { ...scaleOpts.ticks, callback: (v) => fmtRupiah(Number(v)) } } },
            }} />
          </div>
        </div>

        <div className="card">
          <SectionHeader title="Revenue per Kategori Produk" />
          <div className="h-52" aria-label="Revenue per kategori">
            <Bar data={{
              labels: categoryData.map(([k]) => k),
              datasets: [{ label: 'Revenue', data: categoryData.map(([,v]) => v), backgroundColor: PALETTE }]
            }} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false }, tooltip: { ...baseTooltip, callbacks: { label: ctx => fmtRupiah(ctx.parsed.y) } } },
              scales: { x: scaleOpts, y: { ...scaleOpts, ticks: { ...scaleOpts.ticks, callback: (v) => fmtRupiah(Number(v)) } } },
            }} />
          </div>
        </div>
      </div>

      {/* Sales per Sales Rep */}
      <div className="card">
        <SectionHeader title="Revenue per Sales Representative" sub="Diurutkan dari tertinggi" />
        <div className="h-56" aria-label="Revenue per sales representative">
          <Bar data={{
            labels: repData.map(([k]) => k),
            datasets: [{ label: 'Revenue', data: repData.map(([,v]) => v), backgroundColor: '#3b82f6' }]
          }} options={{
            responsive: true, maintainAspectRatio: false, indexAxis: 'y' as const,
            plugins: { legend: { display: false }, tooltip: { ...baseTooltip, callbacks: { label: ctx => fmtRupiah(ctx.parsed.x) } } },
            scales: { x: { ...scaleOpts, ticks: { ...scaleOpts.ticks, callback: (v) => fmtRupiah(Number(v)) } }, y: scaleOpts },
          }} />
        </div>
      </div>

      {/* Doughnut Charts */}
      <div className="grid md:grid-cols-3 gap-6">
        {([
          { title: 'Tipe Customer', data: custTypeData },
          { title: 'Metode Pembayaran', data: paymentData },
          { title: 'Sales Channel', data: channelData },
        ] as const).map(({ title, data }) => (
          <div key={title} className="card">
            <SectionHeader title={title} />
            <div className="h-40" aria-label={title}>
              <Doughnut data={{
                labels: Object.keys(data),
                datasets: [{ data: Object.values(data), backgroundColor: PALETTE, borderWidth: 1 }]
              }} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { color: tickColor, font: chartFont, boxWidth: 12 } },
                  tooltip: { ...baseTooltip },
                },
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Scatter: Discount vs Sales */}
      <div className="card">
        <SectionHeader title="Diskon vs Sales Amount" sub="Setiap titik = satu transaksi" />
        <div className="h-56" aria-label="Scatter plot diskon vs sales">
          <Scatter data={{
            datasets: [{
              label: 'Transaksi',
              data: filteredData.map(r => ({ x: r.discount * 100, y: r.salesAmount })),
              backgroundColor: 'rgba(59,130,246,0.5)',
              pointRadius: 4,
            }]
          }} options={{
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { ...baseTooltip, callbacks: { label: ctx => `Diskon ${fmtNum((ctx.parsed as any).x, 1)}% — ${fmtRupiah((ctx.parsed as any).y)}` } } },
            scales: {
              x: { ...scaleOpts, title: { display: true, text: 'Diskon (%)', color: tickColor, font: chartFont } },
              y: { ...scaleOpts, ticks: { ...scaleOpts.ticks, callback: (v) => fmtRupiah(Number(v)) }, title: { display: true, text: 'Sales Amount', color: tickColor, font: chartFont } },
            },
          }} />
        </div>
      </div>

      {/* Top 10 Highest Sales */}
      <div className="card">
        <SectionHeader title="Top 10 Transaksi Tertinggi" sub="Berdasarkan Sales Amount" />
        <div className="h-64" aria-label="Top 10 transaksi tertinggi">
          <Bar data={{
            labels: top10.map(r => `${r.salesRep} – ${r.productCategory}`),
            datasets: [{ label: 'Sales Amount', data: top10.map(r => r.salesAmount), backgroundColor: '#8b5cf6' }]
          }} options={{
            responsive: true, maintainAspectRatio: false, indexAxis: 'y' as const,
            plugins: { legend: { display: false }, tooltip: { ...baseTooltip, callbacks: { label: ctx => fmtRupiah(ctx.parsed.x) } } },
            scales: { x: { ...scaleOpts, ticks: { ...scaleOpts.ticks, callback: (v) => fmtRupiah(Number(v)) } }, y: scaleOpts },
          }} />
        </div>
      </div>

      {/* Quantity per Category */}
      <div className="card">
        <SectionHeader title="Quantity Terjual per Kategori" />
        <div className="h-44" aria-label="Quantity per kategori">
          <Bar data={{
            labels: qtyCatData.map(([k]) => k),
            datasets: [{ label: 'Qty', data: qtyCatData.map(([,v]) => v), backgroundColor: PALETTE }]
          }} options={{
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { ...baseTooltip } },
            scales: { x: scaleOpts, y: scaleOpts },
          }} />
        </div>
      </div>

      {/* Statistik Deskriptif */}
      <div className="card overflow-x-auto">
        <SectionHeader title="Statistik Deskriptif" sub="Kolom numerik pada data terfilter" />
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              {['Kolom','N','Mean','Median','Modus','Min','Max','Std Dev','Q1','Q3'].map(h => (
                <th key={h} className="pb-2 pr-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {statsTable.map(s => (
              <tr key={s.kolom} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{s.kolom}</td>
                <td className="py-2 pr-4 text-slate-500">{s.count}</td>
                <td className="py-2 pr-4">{fmtNum(s.mean)}</td>
                <td className="py-2 pr-4">{fmtNum(s.median)}</td>
                <td className="py-2 pr-4">{fmtNum(s.modus)}</td>
                <td className="py-2 pr-4">{fmtNum(s.min)}</td>
                <td className="py-2 pr-4">{fmtNum(s.max)}</td>
                <td className="py-2 pr-4">{fmtNum(s.stdDev)}</td>
                <td className="py-2 pr-4">{fmtNum(s.q1)}</td>
                <td className="py-2 pr-4">{fmtNum(s.q3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tabel Detail Transaksi */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <SectionHeader title="Detail Transaksi" />
          <div className="flex gap-2 sm:ml-auto">
            <input
              type="search" placeholder="Cari rep, region, kategori..."
              value={tableSearch} onChange={e => { setTableSearch(e.target.value); setTablePage(1) }}
              className="text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-slate-200 w-48"
            />
            <button onClick={exportCsv} className="btn-primary text-xs">
              Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {[
                  { col: 'saleDate', label: 'Tanggal' },
                  { col: 'salesRep', label: 'Sales Rep' },
                  { col: 'region', label: 'Region' },
                  { col: 'productCategory', label: 'Kategori' },
                  { col: 'salesAmount', label: 'Amount' },
                  { col: 'quantitySold', label: 'Qty' },
                  { col: 'discount', label: 'Diskon' },
                  { col: 'salesChannel', label: 'Channel' },
                  { col: 'customerType', label: 'Tipe' },
                ].map(({ col, label }) => (
                  <th key={col} className="pb-2 pr-3 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap cursor-pointer hover:text-primary-600 select-none"
                    onClick={() => sortBy(col)}>
                    {label}{tableSort.col === col ? (tableSort.dir === 'asc' ? ' ▲' : ' ▼') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableSlice.map((r, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  <td className="py-2 pr-3 whitespace-nowrap text-slate-500">{r.saleDate.toISOString().slice(0,10)}</td>
                  <td className="py-2 pr-3 font-medium">{r.salesRep}</td>
                  <td className="py-2 pr-3">{r.region}</td>
                  <td className="py-2 pr-3">{r.productCategory}</td>
                  <td className="py-2 pr-3 text-emerald-600 dark:text-emerald-400 font-medium">{fmtRupiah(r.salesAmount)}</td>
                  <td className="py-2 pr-3">{r.quantitySold}</td>
                  <td className="py-2 pr-3">{fmtPct(r.discount)}</td>
                  <td className="py-2 pr-3">{r.salesChannel}</td>
                  <td className="py-2 pr-3">{r.customerType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
            <span>Halaman {tablePage_} dari {totalPages} ({tableSorted.length} baris)</span>
            <div className="flex gap-1">
              <button disabled={tablePage_ === 1} onClick={() => setTablePage(1)}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700">«</button>
              <button disabled={tablePage_ === 1} onClick={() => setTablePage(p => p - 1)}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700">‹</button>
              <button disabled={tablePage_ === totalPages} onClick={() => setTablePage(p => p + 1)}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700">›</button>
              <button disabled={tablePage_ === totalPages} onClick={() => setTablePage(totalPages)}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700">»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
