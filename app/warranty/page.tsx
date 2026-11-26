// v0.2.0 | 2026-11-26 | 卡片改用圖示、加大、按鈕樣式；移除重複的站名小字；下方加說明書連結與客服信箱
// v0.1.0 | 2026-11-25 | 全球保固頁入口：兩張卡片（保固登錄、諮詢維修）
import Link from 'next/link'

export const dynamic = 'force-dynamic'   // 客服信箱讀環境變數

const s = (i: number) => ({ '--i': i } as React.CSSProperties)

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l7 3v5.5c0 4.4-3 8.1-7 9.5-4-1.4-7-5.1-7-9.5V6l7-3z" />
      <path d="M8.8 12.2l2.2 2.2 4.4-4.6" />
    </svg>
  )
}
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5.5h16v10.5H10l-4.5 3.5V16H4z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </svg>
  )
}

const CARDS = [
  { href: '/warranty/register', icon: <ShieldIcon />, title: 'Register your warranty', sub: 'Just bought an eiP product? Register it in about a minute.', go: 'Register' },
  { href: '/warranty/support', icon: <ChatIcon />, title: 'Get support', sub: 'Something not working? Tell us and our support team will reply by email.', go: 'Contact support' },
]

export default function Page() {
  const support = process.env.WARRANTY_SUPPORT_EMAIL?.trim()
  return (
    <main className="wty-main wide">
      <Link href="/country/intl" className="back rise">← Global Service Center</Link>
      <h1 className="rise" style={s(1)}>Warranty &amp; Support</h1>
      <p className="lead rise" style={s(2)}>Choose what you need.</p>
      <div className="cards">
        {CARDS.map((c, i) => (
          <Link key={c.href} href={c.href} className="wg card rise" style={s(i + 3)}>
            <span className="icon">{c.icon}</span>
            <h2>{c.title}</h2>
            <p>{c.sub}</p>
            <span className="go">{c.go}<span className="arrow" aria-hidden="true">→</span></span>
          </Link>
        ))}
      </div>
      <p className="helper rise" style={s(5)}>
        Looking for a user manual? <Link href="/country/intl">Product manuals →</Link>
        {support && <><br />Other questions? Email us at <a href={`mailto:${support}`}>{support}</a></>}
      </p>
    </main>
  )
}
