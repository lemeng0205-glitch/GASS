// v0.3.0 | 2026-11-26 | 產品選單讀資料庫（業務在 ERP 維護）
// v0.2.0 | 2026-11-26 | 移除標題上方重複的「Global Service Center」小字
// v0.1.0 | 2026-11-25 | 諮詢維修（保固申請）：沒登錄過保固也可以填
import Link from 'next/link'
import GlobalForm from '@/components/warranty/GlobalForms'
import { getOnSaleProducts } from '@/lib/globalWarrantyProducts'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Get Support' }

export default async function Page() {
  const products = await getOnSaleProducts()
  return (
    <main className="wty-main">
      <Link href="/warranty" className="back rise">← Warranty &amp; Support</Link>
      <h1 className="rise" style={{ '--i': 1 } as React.CSSProperties}>Get Support</h1>
      <p className="lead rise" style={{ '--i': 2 } as React.CSSProperties}>Tell us what is wrong and our support team will reply by email. You do not need to register your product first.</p>
      <GlobalForm mode="claim" products={products} />
    </main>
  )
}
