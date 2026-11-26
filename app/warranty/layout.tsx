// v0.2.0 | 2026-11-26 | 頁首改實色底、隱藏語言切換
// v0.1.0 | 2026-11-25 | 全球保固頁（海外）外框：英文、背景柔光、專用樣式（只在 /warranty 底下載入）
import type { Metadata } from 'next'
import PortalHeader from '@/components/PortalHeader'
import './warranty.css'

export const metadata: Metadata = {
  title: { default: 'Warranty & Support | eiP', template: '%s | eiP' },
  description: 'Register your eiP product warranty or contact eiP support.',
}

export default function WarrantyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wty" lang="en">
      <div className="wty-aura" aria-hidden="true"><i /><i /><i /></div>
      <PortalHeader lang="en" path="/warranty" solid hideLang />
      {children}
    </div>
  )
}
