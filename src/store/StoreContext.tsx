'use client'
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { SalesRow, FilterState, DataQuality } from '@/lib/types'
import { loadData, loadFromFile } from '@/lib/dataLoader'
import { applyFilters } from '@/lib/stats'

// ===================== STATE GLOBAL =====================

interface StoreState {
  // Data
  allData: SalesRow[]
  filteredData: SalesRow[]
  quality: DataQuality | null
  loading: boolean
  error: string | null
  // Filter
  filters: FilterState
  hasActiveFilter: boolean
  // Dark mode
  darkMode: boolean
  // Unique values untuk dropdown filter
  regions: string[]
  categories: string[]
  customerTypes: string[]
  channels: string[]
}

interface StoreActions {
  setFilter: (key: keyof FilterState, val: string) => void
  resetFilters: () => void
  toggleDarkMode: () => void
  loadFromUpload: (file: File) => Promise<void>
}

const DEFAULT_FILTERS: FilterState = {
  region: '',
  category: '',
  customerType: '',
  channel: '',
  dateStart: '',
  dateEnd: '',
}

const StoreContext = createContext<(StoreState & StoreActions) | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [allData, setAllData]       = useState<SalesRow[]>([])
  const [quality, setQuality]       = useState<DataQuality | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [filters, setFilters]       = useState<FilterState>(DEFAULT_FILTERS)
  const [darkMode, setDarkMode]     = useState(false)

  // Muat data dari CSV publik saat pertama kali
  useEffect(() => {
    loadData('/ibm-data/200_sales_data.csv')
      .then(({ data, quality }) => {
        setAllData(data)
        setQuality(quality)
        setLoading(false)
      })
      .catch((e) => {
        console.error('Gagal memuat CSV:', e)
        setError('Gagal memuat data CSV. Silakan upload file CSV secara manual.')
        setLoading(false)
      })
  }, [])

  // Terapkan dark mode ke elemen html
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark')
    else          document.documentElement.classList.remove('dark')
  }, [darkMode])

  // Data terfilter — dihitung ulang setiap kali allData atau filter berubah
  const filteredData = applyFilters(allData, filters)

  const hasActiveFilter = Object.values(filters).some((v) => v !== '')

  // Unique values untuk dropdown
  const unique = <K extends keyof SalesRow>(key: K) =>
    Array.from(new Set(allData.map((r) => String(r[key])))).sort()

  const setFilter = useCallback(
    (key: keyof FilterState, val: string) =>
      setFilters((prev) => ({ ...prev, [key]: val })),
    []
  )
  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), [])
  const toggleDarkMode = useCallback(() => setDarkMode((d) => !d), [])

  const loadFromUpload = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)
    try {
      const { data, quality } = await loadFromFile(file)
      setAllData(data)
      setQuality(quality)
    } catch (e) {
      setError('Gagal membaca file CSV.')
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <StoreContext.Provider
      value={{
        allData,
        filteredData,
        quality,
        loading,
        error,
        filters,
        hasActiveFilter,
        darkMode,
        regions:       unique('region'),
        categories:    unique('productCategory'),
        customerTypes: unique('customerType'),
        channels:      unique('salesChannel'),
        setFilter,
        resetFilters,
        toggleDarkMode,
        loadFromUpload,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore harus dipakai di dalam StoreProvider')
  return ctx
}
