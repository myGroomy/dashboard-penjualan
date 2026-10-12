'use client'
import { useRef } from 'react'
import { useStore } from '@/store/StoreContext'

export default function UploadFallback() {
  const { error, loadFromUpload } = useStore()
  const inputRef = useRef<HTMLInputElement>(null)

  if (!error) return null

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadFromUpload(file)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Upload File CSV</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
            Gagal memuat data otomatis. Pastikan file{' '}
            <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">200_sales_data.csv</code>{' '}
            ada di folder <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">public/ibm-data/</code>.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Atau upload file CSV di bawah ini secara manual.
          </p>
          <button
            onClick={() => inputRef.current?.click()}
            className="btn-primary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Pilih File CSV
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFile}
            aria-label="Upload file CSV 200_sales_data.csv"
          />
          <p className="text-xs text-slate-400 mt-4">File: <code>200_sales_data.csv</code></p>
        </div>
      </div>
    </div>
  )
}
