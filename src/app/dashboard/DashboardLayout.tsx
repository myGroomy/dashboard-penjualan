'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { StoreProvider } from '@/store/StoreContext'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import UploadFallback from '@/components/UploadFallback'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  // Ambil nama halaman dari URL: /dashboard/descriptive → 'descriptive'
  const page = pathname.split('/').pop() ?? 'descriptive'

  return (
    <StoreProvider>
      <div className="h-full">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="lg:ml-64 flex flex-col min-h-screen">
          <Topbar page={page} onHamburger={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 md:p-6 page-enter" role="main" aria-live="polite">
            {children}
          </main>
        </div>
        <UploadFallback />
      </div>
    </StoreProvider>
  )
}
