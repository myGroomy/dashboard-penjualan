'use client'
import { useMemo, useState } from 'react'
import {
  Chart as ChartJS, LinearScale, PointElement, BubbleController,
  Title, Tooltip, Legend,
} from 'chart.js'
import { Bubble } from 'react-chartjs-2'
import { useStore } from '@/store/StoreContext'
import {
  groupByRevenue, calcTotalRevenue, fmtRupiah, fmtNum, fmtPct, sortDesc,
  revenueByMonth, linearRegression,
} from '@/lib/stats'
import { EmptyState, InsightBox, SectionHeader, SkeletonRows } from '@/components/UI'

ChartJS.register(LinearScale, PointElement, BubbleController, Title, Tooltip, Legend)

const PRIORITY_COLOR = {
  High:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Low:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

interface ActionItem {
  priority: 'High' | 'Medium' | 'Low'
  action: string
  alasan: string
  estimasi: string
}

export default function PrescriptivePage() {
  const { filteredData, loading, darkMode } = useStore()
  const tickColor = darkMode ? '#94a3b8' : '#64748b'
  const gridColor = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const baseTooltip = { backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#94a3b8', cornerRadius: 8, padding: 10 }

  // ---- Slider what-if ----
  const [discountAdj, setDiscountAdj]   = useState(0)    // % perubahan diskon
  const [priceAdj, setPriceAdj]         = useState(0)    // % perubahan harga
  const [quantityAdj, setQuantityAdj]   = useState(0)    // % perubahan qty
  const [elasticity, setElasticity]     = useState(-1.5) // elastisitas harga default

  // ---- Rekomendasi berbasis aturan ----
  const rekomendasi = useMemo(() => {
    if (!filteredData.length) return []
    const out: string[] = []
    const totalRev = calcTotalRevenue(filteredData)
    const avgRev   = totalRev / filteredData.length

    // Region dengan pertumbuhan tertinggi
    const byRegion = sortDesc(groupByRevenue(filteredData, 'region'))
    if (byRegion[0]) out.push(`Region ${byRegion[0][0]} paling produktif (${fmtRupiah(byRegion[0][1])}). Prioritaskan alokasi sumber daya ke sini.`)

    // Kategori dengan diskon tinggi tapi revenue rendah
    const cats = Array.from(new Set(filteredData.map(r => r.productCategory)))
    const catStats = cats.map(cat => {
      const rows = filteredData.filter(r => r.productCategory === cat)
      return {
        cat,
        avgDisc: rows.reduce((s, r) => s + r.discount, 0) / rows.length,
        avgRev:  rows.reduce((s, r) => s + r.salesAmount, 0) / rows.length,
      }
    })
    const highDiscLowRev = catStats.filter(c => c.avgDisc > 0.15 && c.avgRev < avgRev)
    if (highDiscLowRev.length) {
      out.push(`Kategori ${highDiscLowRev.map(c => c.cat).join(', ')} memiliki diskon tinggi (>15%) namun revenue di bawah rata-rata. Evaluasi efektivitas diskon.`)
    }

    // Sales Rep di bawah rata-rata
    const byRep    = groupByRevenue(filteredData, 'salesRep')
    const repVals  = Object.values(byRep)
    const avgRepRev = repVals.reduce((s, v) => s + v, 0) / (repVals.length || 1)
    const lowReps  = Object.entries(byRep).filter(([, v]) => v < avgRepRev)
    if (lowReps.length) {
      out.push(`Sales Rep ${lowReps.map(([k]) => k).join(', ')} berada di bawah rata-rata revenue (${fmtRupiah(avgRepRev)}). Pertimbangkan coaching atau redistribusi target.`)
    }

    // Kategori tumbuh paling cepat
    const byCategory = sortDesc(groupByRevenue(filteredData, 'productCategory'))
    if (byCategory[0]) out.push(`Kategori ${byCategory[0][0]} menghasilkan revenue tertinggi (${fmtRupiah(byCategory[0][1])}). Tingkatkan stok dan promosi.`)

    return out
  }, [filteredData])

  // ---- Simulasi What-If ----
  const baseRevenue = useMemo(() => calcTotalRevenue(filteredData), [filteredData])
  const simRevenue  = useMemo(() => {
    // Revenue estimasi: dampak perubahan harga (elastisitas), diskon, dan qty
    // ΔRev ≈ Rev × (1 + Δprice/100) × (1 + elasticity × Δprice/100) × (1 + Δqty/100)
    const priceEffect    = 1 + priceAdj / 100
    const elasticityEff  = 1 + (elasticity * priceAdj) / 100
    const qtyEffect      = 1 + quantityAdj / 100
    // Dampak diskon: setiap +1% diskon diasumsikan meningkatkan qty 0.5% tapi menurunkan margin
    const discEffect     = 1 - discountAdj / 100 * 0.3 // dampak net -0.3x setiap +1% diskon
    return baseRevenue * priceEffect * elasticityEff * qtyEffect * discEffect
  }, [baseRevenue, discountAdj, priceAdj, quantityAdj, elasticity])

  const simDelta = simRevenue - baseRevenue

  // ---- Matriks prioritas (bubble chart) ----
  const bubbleData = useMemo(() => {
    const cats = Array.from(new Set(filteredData.map(r => r.productCategory)))
    return cats.map((cat, i) => {
      const rows     = filteredData.filter(r => r.productCategory === cat)
      const rev      = rows.reduce((s, r) => s + r.salesAmount, 0)
      const avgDisc  = rows.reduce((s, r) => s + r.discount, 0) / (rows.length || 1)
      // Dampak = revenue share (0-100), Usaha = rata-rata diskon yang diperlukan (0-100)
      const impact   = (rev / (calcTotalRevenue(filteredData) || 1)) * 100
      const effort   = avgDisc * 100
      return { x: effort, y: impact, r: Math.max(6, impact / 3), label: cat }
    })
  }, [filteredData])

  // ---- Target per Sales Rep ----
  const repTargets = useMemo(() => {
    const totalRev = calcTotalRevenue(filteredData)
    const reps     = Array.from(new Set(filteredData.map(r => r.salesRep)))
    return reps.map(rep => {
      const rows  = filteredData.filter(r => r.salesRep === rep)
      const rev   = rows.reduce((s, r) => s + r.salesAmount, 0)
      const share = rev / (totalRev || 1)
      // Target: rata-rata + 10%
      const target = (totalRev / reps.length) * 1.1
      return { rep, rev, share, target, gap: target - rev }
    }).sort((a, b) => b.rev - a.rev)
  }, [filteredData])

  // ---- Action Items berprioritas ----
  const actionItems = useMemo((): ActionItem[] => {
    if (!filteredData.length) return []
    const byRegion   = sortDesc(groupByRevenue(filteredData, 'region'))
    const byCategory = sortDesc(groupByRevenue(filteredData, 'productCategory'))
    const byRep      = sortDesc(groupByRevenue(filteredData, 'salesRep'))
    const totalRev   = calcTotalRevenue(filteredData)

    const items: ActionItem[] = [
      {
        priority: 'High',
        action: `Fokus ekspansi di Region ${byRegion[0]?.[0] ?? '-'}`,
        alasan: `Revenue tertinggi: ${fmtRupiah(byRegion[0]?.[1] ?? 0)} (${fmtPct((byRegion[0]?.[1] ?? 0) / totalRev)})`,
        estimasi: `+${fmtRupiah((byRegion[0]?.[1] ?? 0) * 0.15)} jika tumbuh 15%`,
      },
      {
        priority: 'High',
        action: `Tingkatkan kampanye untuk kategori ${byCategory[0]?.[0] ?? '-'}`,
        alasan: `Kategori dengan revenue tertinggi saat ini`,
        estimasi: `+${fmtRupiah((byCategory[0]?.[1] ?? 0) * 0.1)} jika tumbuh 10%`,
      },
      {
        priority: 'Medium',
        action: `Evaluasi dan kurangi diskon berlebih pada kategori dengan margin rendah`,
        alasan: 'Diskon >15% tidak selalu meningkatkan revenue signifikan',
        estimasi: 'Potensi peningkatan margin ~5–10%',
      },
      {
        priority: 'Medium',
        action: `Program coaching untuk Sales Rep ${byRep[byRep.length - 1]?.[0] ?? '-'}`,
        alasan: `Revenue terendah: ${fmtRupiah(byRep[byRep.length - 1]?.[1] ?? 0)}`,
        estimasi: `+${fmtRupiah((repTargets[repTargets.length - 1]?.gap ?? 0))} untuk mencapai rata-rata`,
      },
      {
        priority: 'Low',
        action: 'Optimalkan mix Sales Channel (Online vs Retail)',
        alasan: 'Diversifikasi channel dapat memperluas jangkauan pelanggan',
        estimasi: 'Estimasi sulit tanpa data biaya operasional channel',
      },
      {
        priority: 'Low',
        action: 'Segmentasi customer New vs Returning untuk program loyalitas',
        alasan: 'Pelanggan returning cenderung memiliki nilai lifetime lebih tinggi',
        estimasi: 'Peningkatan retensi 5% ≈ pertumbuhan revenue 10–15% (rule of thumb)',
      },
    ]
    return items
  }, [filteredData, repTargets])

  // ---- Insights ----
  const insights = useMemo(() => {
    if (!filteredData.length) return []
    return [
      rekomendasi[0] ?? '',
      `Simulasi what-if: perubahan harga ${priceAdj > 0 ? '+' : ''}${priceAdj}%, qty ${quantityAdj > 0 ? '+' : ''}${quantityAdj}% → estimasi revenue ${fmtRupiah(simRevenue)}`,
    ].filter(Boolean)
  }, [filteredData, rekomendasi, priceAdj, quantityAdj, simRevenue])

  function exportActionItems() {
    const header = 'Prioritas,Aksi,Alasan,Estimasi Dampak'
    const rows   = actionItems.map(a => `${a.priority},"${a.action}","${a.alasan}","${a.estimasi}"`)
    const blob   = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' })
    const url    = URL.createObjectURL(blob)
    const link   = document.createElement('a')
    link.href = url; link.download = 'action_items.csv'; link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <SkeletonRows count={8} />
  if (!filteredData.length) return <EmptyState />

  return (
    <div className="space-y-6 page-enter">
      <InsightBox insights={insights} />

      {/* Rekomendasi Berbasis Aturan */}
      <div className="card">
        <SectionHeader title="Rekomendasi Berbasis Data" sub="Dihitung dari data aktif saat ini" />
        <ul className="space-y-3">
          {rekomendasi.map((r, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0 font-bold text-xs">{i + 1}</span>
              <span className="text-slate-700 dark:text-slate-300">{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Simulasi What-If */}
      <div className="card">
        <SectionHeader title="Simulasi What-If" sub="Ubah parameter untuk melihat estimasi dampak revenue" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-5">
            {/* Slider Diskon */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <label>Perubahan Diskon</label>
                <span className={discountAdj > 0 ? 'text-red-500' : discountAdj < 0 ? 'text-emerald-500' : ''}>
                  {discountAdj > 0 ? '+' : ''}{discountAdj}%
                </span>
              </div>
              <input type="range" min={-20} max={20} value={discountAdj}
                onChange={e => setDiscountAdj(Number(e.target.value))}
                className="w-full accent-primary-600" aria-label="Perubahan diskon" />
            </div>
            {/* Slider Harga */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <label>Perubahan Harga</label>
                <span className={priceAdj > 0 ? 'text-emerald-500' : priceAdj < 0 ? 'text-red-500' : ''}>
                  {priceAdj > 0 ? '+' : ''}{priceAdj}%
                </span>
              </div>
              <input type="range" min={-30} max={30} value={priceAdj}
                onChange={e => setPriceAdj(Number(e.target.value))}
                className="w-full accent-primary-600" aria-label="Perubahan harga" />
            </div>
            {/* Slider Quantity */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <label>Perubahan Quantity</label>
                <span className={quantityAdj > 0 ? 'text-emerald-500' : quantityAdj < 0 ? 'text-red-500' : ''}>
                  {quantityAdj > 0 ? '+' : ''}{quantityAdj}%
                </span>
              </div>
              <input type="range" min={-50} max={50} value={quantityAdj}
                onChange={e => setQuantityAdj(Number(e.target.value))}
                className="w-full accent-primary-600" aria-label="Perubahan quantity" />
            </div>
            {/* Elastisitas */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <label>Elastisitas Harga</label>
                <span className="font-medium text-slate-700 dark:text-slate-300">{fmtNum(elasticity)}</span>
              </div>
              <input type="range" min={-3} max={0} step={0.1} value={elasticity}
                onChange={e => setElasticity(Number(e.target.value))}
                className="w-full accent-purple-500" aria-label="Elastisitas harga" />
              <p className="text-xs text-slate-400 mt-1">Elastisitas = persen perubahan permintaan per persen perubahan harga. Default: −1.5</p>
            </div>
          </div>

          {/* Hasil Simulasi */}
          <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-700/40 rounded-2xl p-6 gap-4">
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-1">Revenue Saat Ini</div>
              <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">{fmtRupiah(baseRevenue)}</div>
            </div>
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-1">Estimasi Revenue (What-If)</div>
              <div className={`text-3xl font-bold ${simRevenue >= baseRevenue ? 'text-emerald-500' : 'text-red-500'}`}>{fmtRupiah(simRevenue)}</div>
              <div className={`text-sm font-semibold mt-1 ${simDelta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {simDelta >= 0 ? '▲' : '▼'} {fmtRupiah(Math.abs(simDelta))} ({fmtPct(Math.abs(simDelta / (baseRevenue || 1)))})
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center">
              * Estimasi menggunakan model elastisitas sederhana. Bukan prediksi akurat tanpa data historis lebih banyak.
            </p>
          </div>
        </div>
      </div>

      {/* Matriks Prioritas Bubble Chart */}
      <div className="card">
        <SectionHeader title="Matriks Prioritas Segmen" sub="Sumbu X = usaha (avg diskon %), Sumbu Y = dampak (revenue share %), ukuran = proporsi revenue" />
        <div className="h-64" aria-label="Bubble chart matriks prioritas">
          <Bubble
            data={{
              datasets: bubbleData.map((d, i) => ({
                label: d.label,
                data: [{ x: d.x, y: d.y, r: d.r }],
                backgroundColor: `rgba(${[59,130,246,16,185,129,245,158,11,239,68,68][i % 12]},0.6)`,
              })),
            }}
            options={{
              responsive: true, maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom', labels: { color: tickColor, font: { family: 'Inter', size: 11 }, boxWidth: 12 } },
                tooltip: { ...baseTooltip, callbacks: {
                  label: ctx => {
                    const d = ctx.raw as { x: number; y: number; r: number }
                    return `${ctx.dataset.label}: Usaha ${fmtNum(d.x, 1)}%, Dampak ${fmtNum(d.y, 1)}%`
                  }
                }},
              },
              scales: {
                x: {
                  grid: { color: gridColor }, ticks: { color: tickColor, font: { family: 'Inter', size: 11 } },
                  title: { display: true, text: 'Usaha (Avg Diskon %)', color: tickColor },
                },
                y: {
                  grid: { color: gridColor }, ticks: { color: tickColor, font: { family: 'Inter', size: 11 } },
                  title: { display: true, text: 'Dampak (Revenue Share %)', color: tickColor },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Target per Sales Rep */}
      <div className="card">
        <SectionHeader title="Rekomendasi Target per Sales Rep" sub="Target = rata-rata + 10%. Gap = selisih dari target." />
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {['Sales Rep','Revenue Aktual','Target','Gap','Status'].map(h => (
                  <th key={h} className="pb-2 pr-6 font-semibold text-slate-600 dark:text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {repTargets.map(r => (
                <tr key={r.rep} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  <td className="py-2 pr-6 font-medium">{r.rep}</td>
                  <td className="py-2 pr-6 text-emerald-600 dark:text-emerald-400">{fmtRupiah(r.rev)}</td>
                  <td className="py-2 pr-6">{fmtRupiah(r.target)}</td>
                  <td className={`py-2 pr-6 font-semibold ${r.gap <= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {r.gap <= 0 ? '✓ Tercapai' : `−${fmtRupiah(r.gap)}`}
                  </td>
                  <td className="py-2 pr-6">
                    <div className="w-24 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                      <div className={`h-2 rounded-full ${r.gap <= 0 ? 'bg-emerald-500' : 'bg-amber-400'}`}
                        style={{ width: `${Math.min(100, (r.rev / r.target) * 100)}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Items */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader title="Action Items Berprioritas" />
          <button onClick={exportActionItems} className="btn-primary text-xs">Export CSV</button>
        </div>
        <div className="space-y-3">
          {actionItems.map((a, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 h-fit ${PRIORITY_COLOR[a.priority]}`}>
                {a.priority}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{a.action}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{a.alasan}</div>
              </div>
              <div className="text-xs text-primary-600 dark:text-primary-400 font-medium whitespace-nowrap text-right flex-shrink-0">
                {a.estimasi}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
