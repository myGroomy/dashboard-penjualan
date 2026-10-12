'use client'
import { useMemo, useState } from 'react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useStore } from '@/store/StoreContext'
import {
  revenueByMonth, linearRegression, expSmoothing, calcMetrics,
  fmtRupiah, fmtNum, groupByRevenue,
} from '@/lib/stats'
import { EmptyState, InsightBox, SectionHeader, SkeletonRows } from '@/components/UI'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const baseTooltip = { backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#94a3b8', cornerRadius: 8, padding: 10 }

export default function PredictivePage() {
  const { filteredData, loading, darkMode } = useStore()
  const tickColor = darkMode ? '#94a3b8' : '#64748b'
  const gridColor = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const [method, setMethod] = useState<'linear' | 'exp'>('linear')
  const [horizon, setHorizon] = useState<3 | 6 | 12>(6)
  const [projDim, setProjDim] = useState<'region' | 'productCategory'>('region')

  // ---- Data aktual bulanan ----
  const monthlyRaw = useMemo(() => {
    const m = revenueByMonth(filteredData)
    return Object.entries(m).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredData])

  // ---- Split 80/20 ----
  const splitIdx = useMemo(() => Math.max(2, Math.floor(monthlyRaw.length * 0.8)), [monthlyRaw])
  const trainData = useMemo(() => monthlyRaw.slice(0, splitIdx), [monthlyRaw, splitIdx])
  const testData  = useMemo(() => monthlyRaw.slice(splitIdx), [monthlyRaw, splitIdx])

  const xTrain = trainData.map((_, i) => i)
  const yTrain = trainData.map(([, v]) => v)

  // ---- Linear Regression ----
  const linModel = useMemo(() => linearRegression(xTrain, yTrain), [xTrain, yTrain])

  // ---- Exponential Smoothing ----
  const expSmoothed = useMemo(() => expSmoothing(yTrain, 0.3), [yTrain])

  // ---- Prediksi: perpanjang ke horizon ----
  const totalLen = monthlyRaw.length
  const predLabels = useMemo(() => {
    if (!monthlyRaw.length) return []
    const last = monthlyRaw[monthlyRaw.length - 1][0]
    const [y, m] = last.split('-').map(Number)
    return Array.from({ length: horizon }, (_, i) => {
      const d = new Date(y, m + i, 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })
  }, [monthlyRaw, horizon])

  const linForecast = useMemo(() =>
    predLabels.map((_, i) => linModel.predict(totalLen + i)),
  [predLabels, linModel, totalLen])

  const expForecast = useMemo(() => {
    if (!expSmoothed.length) return []
    let last = expSmoothed[expSmoothed.length - 1]
    const alpha = 0.3
    return predLabels.map(() => {
      // Perkiraan: teruskan level terakhir (tanpa trend)
      return last
    })
  }, [expSmoothed, predLabels])

  // ---- Trend garis (seluruh data aktual) ----
  const linTrend = useMemo(() =>
    monthlyRaw.map((_, i) => linModel.predict(i)),
  [monthlyRaw, linModel])

  // ---- Confidence interval dari std dev residual ----
  const stdResidual = useMemo(() => {
    const residuals = yTrain.map((v, i) => v - linModel.predict(i))
    const n = residuals.length
    const mean = residuals.reduce((s, v) => s + v, 0) / n
    const variance = residuals.reduce((s, v) => s + (v - mean) ** 2, 0) / n
    return Math.sqrt(variance)
  }, [yTrain, linModel])

  // ---- Metrics evaluasi (test set) ----
  const linMetrics = useMemo(() => {
    if (!testData.length) return null
    const predicted = testData.map((_, i) => linModel.predict(splitIdx + i))
    return calcMetrics(testData.map(([, v]) => v), predicted)
  }, [testData, linModel, splitIdx])

  const expMetrics = useMemo(() => {
    if (!testData.length) return null
    // Perpanjang exp smoothing ke test set
    let level = expSmoothed[expSmoothed.length - 1] ?? 0
    const preds = testData.map(([, v]) => {
      const p = level
      level = 0.3 * v + 0.7 * level
      return p
    })
    return calcMetrics(testData.map(([, v]) => v), preds)
  }, [testData, expSmoothed])

  // ---- Proyeksi per dimensi ----
  const projData = useMemo(() => {
    const groups = Array.from(new Set(filteredData.map(r => String(r[projDim]))))
    return groups.map(g => {
      const rows   = filteredData.filter(r => String(r[projDim]) === g)
      const monthly = Object.entries(revenueByMonth(rows)).sort(([a],[b]) => a.localeCompare(b))
      if (monthly.length < 2) return { group: g, forecast: 0 }
      const xs = monthly.map((_, i) => i)
      const ys = monthly.map(([,v]) => v)
      const model = linearRegression(xs, ys)
      return { group: g, forecast: model.predict(monthly.length + 2) }
    }).sort((a, b) => b.forecast - a.forecast)
  }, [filteredData, projDim])

  // ---- Insights ----
  const insights = useMemo(() => {
    if (monthlyRaw.length < 3) return ['Data terlalu sedikit untuk prediksi yang andal. Butuh minimal 3 periode.']
    const out: string[] = []
    if (linModel.slope > 0) out.push(`Tren linear menunjukkan kenaikan rata-rata ${fmtRupiah(linModel.slope)} per bulan.`)
    else out.push(`Tren linear menunjukkan penurunan rata-rata ${fmtRupiah(Math.abs(linModel.slope))} per bulan.`)
    if (linMetrics) out.push(`Model Linear: MAE = ${fmtRupiah(linMetrics.mae)}, MAPE = ${fmtNum(linMetrics.mape, 1)}%, R² = ${fmtNum(linMetrics.r2)}.`)
    out.push('⚠ Hasil prediksi adalah estimasi statistik, bukan jaminan. Data hanya 200 baris.')
    return out
  }, [monthlyRaw, linModel, linMetrics])

  const allLabels = [...monthlyRaw.map(([k]) => k), ...predLabels]
  const actualPad = [...monthlyRaw.map(([,v]) => v), ...Array(predLabels.length).fill(null)]
  const trendPad  = [...linTrend, ...linForecast.map((v, i) => linModel.predict(totalLen + i))]

  const forecastValues = method === 'linear' ? linForecast : expForecast
  const forecastPad = [...Array(monthlyRaw.length).fill(null), ...forecastValues]
  const ciUpper = [...Array(monthlyRaw.length).fill(null), ...forecastValues.map(v => v + stdResidual)]
  const ciLower = [...Array(monthlyRaw.length).fill(null), ...forecastValues.map(v => Math.max(0, v - stdResidual))]

  if (loading) return <SkeletonRows count={8} />
  if (monthlyRaw.length < 2) return (
    <EmptyState message="Data tidak cukup untuk analisis prediktif. Butuh minimal 2 periode bulanan." />
  )

  const scaleOpts = {
    grid:  { color: gridColor },
    ticks: { color: tickColor, font: { family: 'Inter', size: 11 } },
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Peringatan asumsi */}
      <div className="card bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
        <div className="flex gap-2 text-sm text-amber-700 dark:text-amber-300">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <span><strong>Asumsi & Keterbatasan:</strong> Model diimplementasikan dengan Vanilla JS. Data hanya 200 baris sehingga interval kepercayaan lebar. Hasil adalah <em>estimasi statistik</em>, bukan prediksi bisnis. Pembagian latih/uji = 80/20 berdasarkan urutan waktu.</span>
        </div>
      </div>

      <InsightBox insights={insights} />

      {/* Kontrol */}
      <div className="card">
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Metode Prediksi</label>
            <div className="flex gap-2">
              {(['linear', 'exp'] as const).map(m => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${method === m ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  {m === 'linear' ? 'Linear Regression' : 'Exp. Smoothing (α=0.3)'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Horizon Prediksi</label>
            <div className="flex gap-2">
              {([3, 6, 12] as const).map(h => (
                <button key={h} onClick={() => setHorizon(h)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${horizon === h ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  {h} bulan
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Forecast Chart */}
        <SectionHeader title="Forecast Revenue" sub={`Data latih: ${splitIdx} periode | Data uji: ${testData.length} periode`} />
        <div className="h-72" aria-label="Grafik forecast revenue">
          <Line
            data={{
              labels: allLabels,
              datasets: [
                {
                  label: 'Aktual',
                  data: actualPad,
                  borderColor: '#3b82f6',
                  backgroundColor: 'rgba(59,130,246,0.08)',
                  fill: false,
                  tension: 0.3,
                  pointRadius: 3,
                  spanGaps: false,
                },
                {
                  label: 'Garis Tren',
                  data: trendPad,
                  borderColor: '#10b981',
                  borderDash: [5, 4],
                  fill: false,
                  pointRadius: 0,
                },
                {
                  label: `Prediksi (${method === 'linear' ? 'Linear' : 'Exp. Smoothing'})`,
                  data: forecastPad,
                  borderColor: '#f59e0b',
                  backgroundColor: 'rgba(245,158,11,0.15)',
                  fill: false,
                  borderDash: [4, 3],
                  pointRadius: 4,
                  spanGaps: false,
                },
                {
                  label: 'CI Atas',
                  data: ciUpper,
                  borderColor: 'rgba(245,158,11,0.3)',
                  backgroundColor: 'rgba(245,158,11,0.08)',
                  fill: '+1',
                  borderDash: [2, 3],
                  pointRadius: 0,
                },
                {
                  label: 'CI Bawah',
                  data: ciLower,
                  borderColor: 'rgba(245,158,11,0.3)',
                  fill: false,
                  borderDash: [2, 3],
                  pointRadius: 0,
                },
              ],
            }}
            options={{
              responsive: true, maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom', labels: { color: tickColor, font: { family: 'Inter', size: 11 }, boxWidth: 16 } },
                tooltip: { ...baseTooltip, callbacks: { label: ctx => ctx.parsed.y != null ? `${ctx.dataset.label}: ${fmtRupiah(ctx.parsed.y)}` : '' } },
              },
              scales: {
                x: scaleOpts,
                y: { ...scaleOpts, ticks: { ...scaleOpts.ticks, callback: (v) => fmtRupiah(Number(v)) } },
              },
            }}
          />
        </div>
      </div>

      {/* Metrics Evaluasi */}
      <div className="grid md:grid-cols-2 gap-6">
        {[
          { label: 'Linear Regression', m: linMetrics },
          { label: 'Exp. Smoothing (α=0.3)', m: expMetrics },
        ].map(({ label, m }) => (
          <div key={label} className="card">
            <SectionHeader title={label} sub="Evaluasi pada data uji (20% terakhir)" />
            {m && testData.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { k: 'MAE',  v: fmtRupiah(m.mae) },
                  { k: 'RMSE', v: fmtRupiah(m.rmse) },
                  { k: 'MAPE', v: `${fmtNum(m.mape, 1)}%` },
                  { k: 'R²',   v: fmtNum(m.r2) },
                ].map(({ k, v }) => (
                  <div key={k} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                    <div className="text-xs text-slate-500 dark:text-slate-400">{k}</div>
                    <div className="text-base font-bold text-primary-600 dark:text-primary-400">{v}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Data uji tidak cukup untuk evaluasi.</p>
            )}
          </div>
        ))}
      </div>

      {/* Proyeksi per Dimensi */}
      <div className="card">
        <div className="flex items-center gap-4 mb-4">
          <SectionHeader title="Proyeksi Revenue" />
          <select value={projDim} onChange={e => setProjDim(e.target.value as 'region' | 'productCategory')}
            className="text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-slate-200">
            <option value="region">Per Region</option>
            <option value="productCategory">Per Kategori</option>
          </select>
        </div>
        <div className="space-y-2">
          {projData.map(d => (
            <div key={d.group} className="flex items-center gap-3">
              <span className="text-sm font-medium w-28 truncate text-slate-700 dark:text-slate-300">{d.group}</span>
              <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-primary-500"
                  style={{ width: `${Math.min(100, (d.forecast / (projData[0]?.forecast || 1)) * 100)}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 w-24 text-right">{fmtRupiah(Math.max(0, d.forecast))}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">Proyeksi dihitung dengan Linear Regression independen per {projDim === 'region' ? 'region' : 'kategori'}.</p>
      </div>
    </div>
  )
}
