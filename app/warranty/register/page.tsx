// v0.3.0 | 2026-11-26 | 產品選單讀資料庫（業務在 ERP 維護）
// v0.2.0 | 2026-11-26 | 移除標題上方重複的「Global Service Center」小字
// v0.1.0 | 2026-11-25 | 全球保固登錄
import Link from 'next/link'
import GlobalForm from '@/components/warranty/GlobalForms'
import { getOnSaleProducts } from '@/lib/globalWarrantyProducts'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Warranty Registration' }

export default async function Page() {
  const products = await getOnSaleProducts()
  return (
    <main className="wty-main">
      <Link href="/warranty" className="back rise">← Warranty &amp; Support</Link>
      <h1 className="rise" style={{ '--i': 1 } as React.CSSProperties}>Warranty Registration</h1>
      <p className="lead rise" style={{ '--i': 2 } as React.CSSProperties}>Register your product to activate warranty support. It takes about one minute.</p>
      <GlobalForm mode="register" products={products} />
    </main>
  )
}
