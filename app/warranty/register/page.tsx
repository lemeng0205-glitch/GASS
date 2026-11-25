// v0.1.0 | 2026-11-25 | 全球保固登錄
import Link from 'next/link'
import GlobalForm from '@/components/warranty/GlobalForms'

export const metadata = { title: 'Warranty Registration' }

export default function Page() {
  return (
    <main className="wty-main">
      <Link href="/warranty" className="back rise">← Warranty &amp; Support</Link>
      <p className="w-eyebrow rise" style={{ '--i': 0 } as React.CSSProperties}>Global Service Center</p>
      <h1 className="rise" style={{ '--i': 1 } as React.CSSProperties}>Warranty Registration</h1>
      <p className="lead rise" style={{ '--i': 2 } as React.CSSProperties}>Register your product to activate warranty support. It takes about one minute.</p>
      <GlobalForm mode="register" />
    </main>
  )
}
