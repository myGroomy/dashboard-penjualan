import type { SalesRow, FilterState, DescStats } from './types'

// ===================== FILTERS =====================

/**
 * Terapkan filter global ke data bersih
 */
export function applyFilters(data: SalesRow[], f: FilterState): SalesRow[] {
  return data.filter((r) => {
    if (f.region && r.region !== f.region) return false
    if (f.category && r.productCategory !== f.category) return false
    if (f.customerType && r.customerType !== f.customerType) return false
    if (f.channel && r.salesChannel !== f.channel) return false
    if (f.dateStart) {
      const start = new Date(f.dateStart)
      if (r.saleDate < start) return false
    }
    if (f.dateEnd) {
      const end = new Date(f.dateEnd)
      end.setHours(23, 59, 59)
      if (r.saleDate > end) return false
    }
    return true
  })
}

// ===================== STATS (fungsi murni) =====================

/** Total revenue dari data aktif */
export function calcTotalRevenue(data: SalesRow[]): number {
  return data.reduce((s, r) => s + r.salesAmount, 0)
}

/** Total transaksi = jumlah baris */
export function calcTotalTransactions(data: SalesRow[]): number {
  return data.length
}

/** Total quantity terjual */
export function calcTotalQuantity(data: SalesRow[]): number {
  return data.reduce((s, r) => s + r.quantitySold, 0)
}

/** Rata-rata diskon (0–1, dikali 100 untuk persen) */
export function calcAvgDiscount(data: SalesRow[]): number {
  if (!data.length) return 0
  return data.reduce((s, r) => s + r.discount, 0) / data.length
}

/** Revenue per group (region, kategori, dll) */
export function groupByRevenue(
  data: SalesRow[],
  key: keyof SalesRow
): Record<string, number> {
  return data.reduce<Record<string, number>>((acc, r) => {
    const k = String(r[key])
    acc[k] = (acc[k] ?? 0) + r.salesAmount
    return acc
  }, {})
}

/** Jumlah transaksi per group */
export function groupByCount(
  data: SalesRow[],
  key: keyof SalesRow
): Record<string, number> {
  return data.reduce<Record<string, number>>((acc, r) => {
    const k = String(r[key])
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})
}

/** Revenue per bulan (key: YYYY-MM) */
export function revenueByMonth(data: SalesRow[]): Record<string, number> {
  return data.reduce<Record<string, number>>((acc, r) => {
    const key = `${r.saleDate.getFullYear()}-${String(r.saleDate.getMonth() + 1).padStart(2, '0')}`
    acc[key] = (acc[key] ?? 0) + r.salesAmount
    return acc
  }, {})
}

/** Revenue per hari (key: YYYY-MM-DD) */
export function revenueByDay(data: SalesRow[]): Record<string, number> {
  return data.reduce<Record<string, number>>((acc, r) => {
    const key = r.saleDate.toISOString().slice(0, 10)
    acc[key] = (acc[key] ?? 0) + r.salesAmount
    return acc
  }, {})
}

/** Statistik deskriptif satu array angka */
export function descStats(values: number[], kolom: string): DescStats {
  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  if (!n) return { kolom, count: 0, mean: 0, median: 0, modus: 0, min: 0, max: 0, stdDev: 0, q1: 0, q3: 0 }

  const mean = sorted.reduce((s, v) => s + v, 0) / n
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)]
  const variance = sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / n
  const stdDev = Math.sqrt(variance)
  const q1 = sorted[Math.floor(n * 0.25)]
  const q3 = sorted[Math.floor(n * 0.75)]

  // Modus: nilai paling sering muncul
  const freq: Record<string, number> = {}
  for (const v of sorted) freq[v] = (freq[v] ?? 0) + 1
  const modus = parseFloat(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0])

  return { kolom, count: n, mean, median, modus, min: sorted[0], max: sorted[n - 1], stdDev, q1, q3 }
}

/** Deteksi outlier dengan metode IQR */
export function detectOutliers(data: SalesRow[]): SalesRow[] {
  const vals = data.map((r) => r.salesAmount).sort((a, b) => a - b)
  const n = vals.length
  if (!n) return []
  const q1 = vals[Math.floor(n * 0.25)]
  const q3 = vals[Math.floor(n * 0.75)]
  const iqr = q3 - q1
  const lo = q1 - 1.5 * iqr
  const hi = q3 + 1.5 * iqr
  return data.filter((r) => r.salesAmount < lo || r.salesAmount > hi)
}

/** Korelasi Pearson antara dua array angka */
export function pearsonCorr(x: number[], y: number[]): number {
  const n = x.length
  if (!n) return 0
  const mx = x.reduce((s, v) => s + v, 0) / n
  const my = y.reduce((s, v) => s + v, 0) / n
  let num = 0, dx = 0, dy = 0
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my)
    dx  += (x[i] - mx) ** 2
    dy  += (y[i] - my) ** 2
  }
  return dx === 0 || dy === 0 ? 0 : num / Math.sqrt(dx * dy)
}

/** Regresi linear sederhana: kembalikan slope, intercept, dan prediksi */
export function linearRegression(
  x: number[],
  y: number[]
): { slope: number; intercept: number; predict: (xi: number) => number } {
  const n = x.length
  const mx = x.reduce((s, v) => s + v, 0) / n
  const my = y.reduce((s, v) => s + v, 0) / n
  let num = 0, den = 0
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my)
    den += (x[i] - mx) ** 2
  }
  const slope = den === 0 ? 0 : num / den
  const intercept = my - slope * mx
  return { slope, intercept, predict: (xi) => slope * xi + intercept }
}

/** Exponential Smoothing sederhana (alpha = 0.3) */
export function expSmoothing(values: number[], alpha = 0.3): number[] {
  if (!values.length) return []
  const result: number[] = [values[0]]
  for (let i = 1; i < values.length; i++) {
    result.push(alpha * values[i] + (1 - alpha) * result[i - 1])
  }
  return result
}

/** Hitung MAE, RMSE, MAPE, R² antara aktual dan prediksi */
export function calcMetrics(
  actual: number[],
  predicted: number[]
): { mae: number; rmse: number; mape: number; r2: number } {
  const n = actual.length
  if (!n) return { mae: 0, rmse: 0, mape: 0, r2: 0 }
  let mae = 0, sse = 0, mape = 0
  const mean = actual.reduce((s, v) => s + v, 0) / n
  let sst = 0
  for (let i = 0; i < n; i++) {
    const diff = actual[i] - predicted[i]
    mae  += Math.abs(diff)
    sse  += diff ** 2
    mape += actual[i] !== 0 ? Math.abs(diff / actual[i]) : 0
    sst  += (actual[i] - mean) ** 2
  }
  return {
    mae:  mae  / n,
    rmse: Math.sqrt(sse / n),
    mape: (mape / n) * 100,
    r2:   sst === 0 ? 1 : 1 - sse / sst,
  }
}

// ===================== FORMAT =====================

/** Format angka ke rupiah id-ID (singkatan untuk besar) */
export function fmtRupiah(val: number): string {
  if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(1)}M`
  if (val >= 1_000_000)     return `Rp ${(val / 1_000_000).toFixed(1)}Jt`
  if (val >= 1_000)         return `Rp ${(val / 1_000).toFixed(1)}Rb`
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

/** Format angka biasa */
export function fmtNum(val: number, dec = 2): string {
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(val)
}

/** Format persen */
export function fmtPct(val: number): string {
  return `${(val * 100).toFixed(1)}%`
}

/** Format tanggal ke id-ID */
export function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}

/** Sort object record menurun berdasarkan nilai */
export function sortDesc(obj: Record<string, number>): [string, number][] {
  return Object.entries(obj).sort((a, b) => b[1] - a[1])
}
