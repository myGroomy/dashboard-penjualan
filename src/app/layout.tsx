import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dashboard Penjualan 2023',
  description:
    'Dashboard analitik penjualan dengan 4 tahap analisis: descriptive, diagnostic, predictive, dan prescriptive.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
