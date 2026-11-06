// v0.2.0 | 2026-11-06 | <html lang> 與說明文字隨實際語言（zh-Hant／en），利於搜尋引擎與瀏覽器翻譯判斷
// v0.1.0 | 2026-11-04 | 獨立公開網站外框（與 ERP 完全分開：不連資料庫、不含任何 ERP 金鑰）
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { getLang } from '@/lib/serverLang'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang()
  return {
    title: 'eiP 全球服務中心 | Global Service Center',
    description: lang === 'en'
      ? 'eiP product manuals, warranty registration and support'
      : 'eiP 產品說明書、保固登錄與售後服務',
  }
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1 }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang()
  return (
    <html lang={lang === 'en' ? 'en' : 'zh-Hant'}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
