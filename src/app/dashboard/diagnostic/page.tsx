'use client'
import { useMemo, useState } from 'react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { useStore } from '@/store/StoreContext'
import {
  pearsonCorr, groupByRevenue, detectOutliers,
  fmtRupiah, fmtNum, fmtPct, fmtDate, sortDesc,
} from '@/lib/stats'
import type { SalesRow } from '@/lib/types'
import { EmptyState, InsightBox, SectionHeader, SkeletonRows } from '@/components/UI'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// ---- Kekuatan korelasi Pearson ----
function corrStrength(r: number): { label: string; color: string } {
  const abs = Math.abs(r)
  if (abs >= 0.7) return { label: 'Kuat', color: r > 0 ? '#3b82f6' : '#ef4444' }
  if (abs >= 0.4) return { label: 'Sedang', color: r > 0 ? '#60a5fa' : '#f87171' }
  return { label: 'Lemah', color: '#94a3b8' }
}

// ---- Warna sel heatmap berdasarkan nilai korelasi (-1 s/d 1) ----
function heatmapColor(r: number): string {
  if (isNaN(r)) return '#f1f5f9'
  const abs = Math.abs(r)
  if (r > 0) return `rgba(59,130,246,${0.15 + abs * 0.7})`
  return `rgba(239,68,68,${0.15 + abs * 0.7})`
}

// ---- Format periode: dari array baris ke YYYY-MM ----
function periodKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function DiagnosticPage() {
  const { filteredData, loading, darkMode } = useStore()
  const tickColor = darkMode ? '#94a3b8' : '#64748b'
  const gridColor = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const baseTooltip = { backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#94a3b8', cornerRadius: 8, padding: 10 }

  // ---- Korelasi Pearson ----
  const numericCols: { key: keyof SalesRow; label: string }[] = useMemo(() => [
    { key: 'salesAmount',  label: 'Sales Amt' },
    { key: 'quantitySold', label: 'Qty Sold' },
    { key: 'discount',     label: 'Discount' },
    { key: 'unitPrice',    label: 'Unit Price' },
    { key: 'unitCost',     label: 'Unit Cost' },
  ], [])
  const corrMatrix = useMemo(() => {
    return numericCols.map(a =>
      numericCols.map(b => {
        if (a.key === b.key) return 1
        const ax = filteredData.map(r => r[a.key] as number)
        const bx = filteredData.map(r => r[b.key] as number)
        return pearsonCorr(ax, bx)
      })
    )
  }, [filteredData, numericCols])

  // ---- Analisis kontribusi antar periode ----
  const [periodeA, setPeriodeA] = useState('')
  const [periodeB, setPeriodeB] = useState('')
  const [dimKey, setDimKey] = useState<keyof SalesRow>('region')

  const allPeriods = useMemo(() => {
    const s = new Set(filteredData.map(r => periodKey(r.saleDate)))
    return Array.from(s).sort()
  }, [filteredData])

  const kontribusiData = useMemo(() => {
    if (!periodeA || !periodeB) return []
    const rowsA = filteredData.filter(r => periodKey(r.saleDate) === periodeA)
    const rowsB = filteredData.filter(r => periodKey(r.saleDate) === periodeB)
    const revA  = groupByRevenue(rowsA, dimKey)
    const revB  = groupByRevenue(rowsB, dimKey)
    const keys  = Array.from(new Set([...Object.keys(revA), ...Object.keys(revB)]))
    return keys.map(k => ({
      key: k,
      revA: revA[k] ?? 0,
      revB: revB[k] ?? 0,
      delta: (revB[k] ?? 0) - (revA[k] ?? 0),
    })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  }, [filteredData, periodeA, periodeB, dimKey])

  // ---- Outlier ----
  const outliers = useMemo(() => detectOutliers(filteredData), [filteredData])

  // ---- Dampak diskon per kategori ----
  const discountImpact = useMemo(() => {
    const cats = Array.from(new Set(filteredData.map(r => r.productCategory)))
    return cats.map(cat => {
      const rows  = filteredData.filter(r => r.productCategory === cat)
      const avgDisc = rows.reduce((s, r) => s + r.discount, 0) / (rows.length || 1)
      const avgRev  = rows.reduce((s, r) => s + r.salesAmount, 0) / (rows.length || 1)
      const avgQty  = rows.reduce((s, r) => s + r.quantitySold, 0) / (rows.length || 1)
      return { cat, avgDisc, avgRev, avgQty }
    })
  }, [filteredData])

  // ---- Insights ----
  const insights = useMemo(() => {
    if (!filteredData.length) return []
    const out: string[] = []
    // Korelasi terkuat
    let maxCorr = 0; let maxI = 0; let maxJ = 1
    for (let i = 0; i < numericCols.length; i++)
      for (let j = i + 1; j < numericCols.length; j++) {
        if (Math.abs(corrMatrix[i][j]) > Math.abs(maxCorr)) {
          maxCorr = corrMatrix[i][j]; maxI = i; maxJ = j
        }
      }
    out.push(`Korelasi terkuat: ${numericCols[maxI].label} ↔ ${numericCols[maxJ].label} (r = ${fmtNum(maxCorr)}).`)
    out.push(`Ditemukan ${outliers.length} transaksi outlier menggunakan metode IQR.`)
    const sorted = [...discountImpact].sort((a, b) => b.avgDisc - a.avgDisc)
    if (sorted[0]) out.push(`Kategori ${sorted[0].cat} memiliki rata-rata diskon tertinggi (${fmtPct(sorted[0].avgDisc)}).`)
    return out
  }, [filteredData, corrMatrix, outliers, discountImpact, numericCols])

  if (loading) return <SkeletonRows count={8} />
  if (!filteredData.length) return <EmptyState />

  const scaleOpts = { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: 'Inter', size: 11 } } }

  return (
    <div className="space-y-6 page-enter">
      <InsightBox insights={insights} />

      {/* Heatmap Korelasi Pearson */}
      <div className="card overflow-x-auto">
        <SectionHeader title="Heatmap Korelasi Pearson" sub="Antara kolom numerik — merah = negatif, biru = positif" />
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th className="p-2" />
              {numericCols.map(c => (
                <th key={c.key} className="p-2 font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {numericCols.map((row, i) => (
              <tr key={row.key}>
                <td className="p-2 font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap pr-4">{row.label}</td>
                {numericCols.map((col, j) => {
                  const val = corrMatrix[i][j]
                  const { label, color } = corrStrength(val)
                  return (
                    <td key={col.key}
                      title={`${row.label} ↔ ${col.label}: r = ${fmtNum(val)}\nKekuatan: ${label}`}
                      className="p-2 text-center font-semibold rounded cursor-default"
                      style={{ background: heatmapColor(val), color: Math.abs(val) > 0.5 ? '#fff' : undefined, minWidth: 64 }}>
                      {fmtNum(val)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex gap-4 mt-3 text-xs text-slate-500">
          <span><span className="inline-block w-3 h-3 rounded mr-1" style={{ background: 'rgba(59,130,246,0.85)' }} />Korelasi positif kuat (≥0.7)</span>
          <span><span className="inline-block w-3 h-3 rounded mr-1" style={{ background: 'rgba(239,68,68,0.85)' }} />Korelasi negatif kuat</span>
          <span><span className="inline-block w-3 h-3 rounded mr-1" style={{ background: '#94a3b8' }} />Lemah (&lt;0.4)</span>
        </div>
      </div>

      {/* Analisis Kontribusi Antar Periode */}
      <div className="card">
        <SectionHeader title="Analisis Kontribusi Perubahan Revenue" sub="Bandingkan dua periode dan lihat dimensi penyumbang perubahan" />
        <div className="flex flex-wrap gap-3 mb-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Periode A (Baseline)</label>
            <select value={periodeA} onChange={e => setPeriodeA(e.target.value)}
              className="text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-slate-200">
              <option value="">Pilih periode</option>
              {allPeriods.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Periode B (Pembanding)</label>
            <select value={periodeB} onChange={e => setPeriodeB(e.target.value)}
              className="text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-slate-200">
              <option value="">Pilih periode</option>
              {allPeriods.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Dimensi</label>
            <select value={String(dimKey)} onChange={e => setDimKey(e.target.value as keyof SalesRow)}
              className="text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-slate-200">
              <option value="region">Region</option>
              <option value="productCategory">Kategori</option>
              <option value="salesRep">Sales Rep</option>
              <option value="salesChannel">Channel</option>
            </select>
          </div>
        </div>

        {kontribusiData.length > 0 ? (
          <>
            {/* Waterfall / floating bar menggunakan Chart.js floating bar */}
            <div className="h-64 mb-4" aria-label="Waterfall perubahan revenue">
              <Bar
                data={{
                  labels: kontribusiData.map(d => d.key),
                  datasets: [
                    {
                      label: 'Perubahan Revenue',
                      // Floating bar: [min, max] untuk positif/negatif
                      data: kontribusiData.map(d => d.delta > 0 ? [0, d.delta] : [d.delta, 0]),
                      backgroundColor: kontribusiData.map(d => d.delta >= 0 ? 'rgba(16,185,129,0.75)' : 'rgba(239,68,68,0.75)'),
                    },
                  ],
                }}
                options={{
                  responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { display: false }, tooltip: { ...baseTooltip, callbacks: { label: ctx => `Δ ${fmtRupiah((ctx.raw as number[])[1] - (ctx.raw as number[])[0])}` } } },
                  scales: { x: scaleOpts, y: { ...scaleOpts, ticks: { ...scaleOpts.ticks, callback: (v) => fmtRupiah(Number(v)) } } },
                }}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    {['Dimensi', `Rev ${periodeA}`, `Rev ${periodeB}`, 'Δ Revenue'].map(h => (
                      <th key={h} className="pb-2 pr-4 font-semibold text-slate-600 dark:text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {kontribusiData.map(d => (
                    <tr key={d.key} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                      <td className="py-2 pr-4 font-medium">{d.key}</td>
                      <td className="py-2 pr-4">{fmtRupiah(d.revA)}</td>
                      <td className="py-2 pr-4">{fmtRupiah(d.revB)}</td>
                      <td className={`py-2 pr-4 font-semibold ${d.delta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {d.delta >= 0 ? '+' : ''}{fmtRupiah(d.delta)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400">Pilih dua periode untuk melihat analisis kontribusi.</p>
        )}
      </div>

      {/* Deteksi Outlier */}
      <div className="card overflow-x-auto">
        <SectionHeader
          title={`Deteksi Outlier — ${outliers.length} transaksi`}
          sub="Metode IQR: Sales Amount < Q1 − 1.5×IQR atau > Q3 + 1.5×IQR"
        />
        {outliers.length === 0 ? (
          <p className="text-sm text-slate-400">Tidak ada outlier terdeteksi pada data terfilter.</p>
        ) : (
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {['Tanggal','Sales Rep','Region','Kategori','Amount','Qty','Diskon'].map(h => (
                  <th key={h} className="pb-2 pr-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {outliers.map((r, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800 bg-red-50/40 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <td className="py-2 pr-4 whitespace-nowrap">{fmtDate(r.saleDate)}</td>
                  <td className="py-2 pr-4">{r.salesRep}</td>
                  <td className="py-2 pr-4">{r.region}</td>
                  <td className="py-2 pr-4">{r.productCategory}</td>
                  <td className="py-2 pr-4 font-semibold text-red-500">{fmtRupiah(r.salesAmount)}</td>
                  <td className="py-2 pr-4">{r.quantitySold}</td>
                  <td className="py-2 pr-4">{fmtPct(r.discount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Dampak Diskon */}
      <div className="card overflow-x-auto">
        <SectionHeader title="Dampak Diskon per Kategori" sub="Rata-rata diskon, revenue, dan quantity per kategori produk" />
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              {['Kategori','Avg Diskon','Avg Revenue','Avg Qty'].map(h => (
                <th key={h} className="pb-2 pr-6 font-semibold text-slate-600 dark:text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {discountImpact.sort((a, b) => b.avgDisc - a.avgDisc).map(d => (
              <tr key={d.cat} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                <td className="py-2 pr-6 font-medium">{d.cat}</td>
                <td className="py-2 pr-6">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${d.avgDisc > 0.15 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                    {fmtPct(d.avgDisc)}
                  </span>
                </td>
                <td className="py-2 pr-6 text-emerald-600 dark:text-emerald-400">{fmtRupiah(d.avgRev)}</td>
                <td className="py-2 pr-6">{fmtNum(d.avgQty, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-slate-400 mt-2">
          * Analisis drill-down lanjutan memerlukan lebih banyak dimensi tanggal yang granular untuk korelasi kausalitas.
        </p>
      </div>
    </div>
  )
}
