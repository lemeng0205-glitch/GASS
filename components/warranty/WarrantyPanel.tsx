'use client'
// v0.1.0 | 2026-11-26 | 全球保固（保固登錄／諮詢維修）嵌入各國服務頁：點「Warranty registration」卡片直接在頁面下方顯示表單，不換頁
// 表單與送出流程跟獨立頁 /warranty 共用（GlobalForms）。表單只有英文。
import '@/app/warranty/warranty.css'
import { useState } from 'react'
import GlobalForm from './GlobalForms'

type Mode = 'register' | 'claim'
const TABS: { key: Mode; label: string; lead: string }[] = [
  { key: 'register', label: 'Register warranty', lead: 'Register your product to activate warranty support. It takes about one minute.' },
  { key: 'claim', label: 'Get support', lead: 'Something not working? Tell us and our support team will reply by email.' },
]

export default function WarrantyPanel({ products, supportEmail }: { products: { category: string; name: string }[]; supportEmail?: string }) {
  const [mode, setMode] = useState<Mode>('register')
  const [round, setRound] = useState(0)   // 從完成畫面切換時換新表單

  function go(to: Mode, fromDone = false) {
    setMode(to)
    if (fromDone) {
      setRound(r => r + 1)
      requestAnimationFrame(() => document.getElementById('warranty')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
  }

  const tab = TABS.find(t => t.key === mode)!
  return (
    <div className="wty wty-embed" lang="en">
      <div className="seg" role="tablist" aria-label="Warranty and support">
        {TABS.map(t => (
          <button key={t.key} type="button" role="tab" aria-selected={mode === t.key} onClick={() => go(t.key)}>{t.label}</button>
        ))}
      </div>
      <p className="lead">{tab.lead}</p>
      <GlobalForm key={`${mode}-${round}`} mode={mode} products={products} onSwitch={to => go(to, true)} />
      {supportEmail && <p className="helper">Other questions? Email us at <a href={`mailto:${supportEmail}`}>{supportEmail}</a></p>}
    </div>
  )
}
