// v0.1.0 | 2026-11-25 | 全球保固頁入口：兩張卡片（保固登錄、諮詢維修）
import Link from 'next/link'

const CARDS = [
  { n: '01', href: '/warranty/register', title: 'Register your warranty', sub: 'Just bought an eiP product? Register it in about a minute.', go: 'Register' },
  { n: '02', href: '/warranty/support', title: 'Get support', sub: 'Something not working? Tell us and our support team will reply by email.', go: 'Contact support' },
]

export default function Page() {
  return (
    <main className="wty-main wide">
      <Link href="/country/intl" className="back rise">← Global Service Center</Link>
      <p className="w-eyebrow rise" style={{ '--i': 0 } as React.CSSProperties}>Global Service Center</p>
      <h1 className="rise" style={{ '--i': 1 } as React.CSSProperties}>Warranty &amp; Support</h1>
      <p className="lead rise" style={{ '--i': 2 } as React.CSSProperties}>Choose what you need.</p>
      <div className="cards">
        {CARDS.map((c, i) => (
          <Link key={c.href} href={c.href} className="wg card rise" style={{ '--i': i + 3 } as React.CSSProperties}>
            <span className="num">{c.n}</span>
            <h2>{c.title}</h2>
            <p>{c.sub}</p>
            <span className="go">{c.go} →</span>
          </Link>
        ))}
      </div>
    </main>
  )
}
