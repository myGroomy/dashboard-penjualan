'use client'

// ---- KPI Card ----
interface KpiCardProps {
  label: string
  value: string
  sub?: string
  tooltip?: string
  color?: 'blue' | 'green' | 'purple' | 'amber'
}

const COLOR_MAP = {
  blue:   'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  green:  'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  amber:  'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
}

export function KpiCard({ label, value, sub, tooltip, color = 'blue' }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
        {tooltip && (
          <span className="tooltip-container ml-1">
            <svg className="w-3.5 h-3.5 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="tooltip-box">{tooltip}</span>
          </span>
        )}
      </div>
      <div className={`text-2xl font-bold ${COLOR_MAP[color]}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  )
}

// ---- Skeleton ----
export function SkeletonCard() {
  return (
    <div className="card space-y-3">
      <div className="skeleton h-3 w-24 rounded" />
      <div className="skeleton h-7 w-32 rounded" />
      <div className="skeleton h-3 w-16 rounded" />
    </div>
  )
}

// ---- Empty State ----
export function EmptyState({ message = 'Tidak ada data untuk filter yang dipilih.' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-slate-400 dark:text-slate-500 text-sm">{message}</p>
    </div>
  )
}

// ---- Error State ----
export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg className="w-12 h-12 text-red-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p className="text-red-500 text-sm font-medium">{message}</p>
    </div>
  )
}

// ---- Loading Skeleton Rows ----
export function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton h-8 rounded" />
      ))}
    </div>
  )
}

// ---- Insight Box ----
export function InsightBox({ insights }: { insights: string[] }) {
  if (!insights.length) return null
  return (
    <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347a3.003 3.003 0 01-2.121.879H9.34a3.003 3.003 0 01-2.121-.879l-.347-.347z" />
        </svg>
        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Insight Otomatis</span>
      </div>
      <ul className="space-y-1">
        {insights.map((ins, i) => (
          <li key={i} className="text-sm text-blue-800 dark:text-blue-200 flex gap-2">
            <span className="text-blue-400 flex-shrink-0">•</span>
            <span>{ins}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---- Section Header ----
export function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
      {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}
