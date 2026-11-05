// v0.1.0 | 2026-11-04 | 獨立公開網站外框（與 ERP 完全分開：不連資料庫、不含任何 ERP 金鑰）
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'eiP 全球售後服務',
  description: 'eiP 產品說明書、保固登錄與售後服務',
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
