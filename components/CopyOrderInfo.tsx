'use client'
// v0.2.0 | 2026-11-04 | 一鍵複製訂單資訊（高級質感樣式）：只在瀏覽器內組字串，不送出任何資料
import { useMemo, useState } from 'react'
import { COPY_ORDER, PRODUCTS, type Market, type PortalLang } from '@/lib/portalConfig'

const field = 'mt-2 w-full rounded-xl border border-[var(--rule)] bg-[var(--bg)] px-3.5 py-2.5 text-[15px] text-[var(--ink)] outline-none transition-colors focus:border-[var(--accent)]'

export default function CopyOrderInfo({ lang, market }: { lang: PortalLang; market: Market }) {
  const [orderNo, setOrderNo] = useState('')
  const [orderDate, setOrderDate] = useState('')
  const [item, setItem] = useState('')
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const L = (k: keyof typeof COPY_ORDER) => COPY_ORDER[k][lang]

  const text = useMemo(() => [
    `${COPY_ORDER.orderNo[lang]}：${orderNo.trim()}`,
    `${COPY_ORDER.orderDate[lang]}：${orderDate}`,
    `${COPY_ORDER.item[lang]}：${item}`,
  ].join('\n'), [orderNo, orderDate, item, lang])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setState('copied')
      setTimeout(() => setState('idle'), 2500)
    } catch {
      setState('failed')
    }
  }

  return (
    <section className="glass mt-14 rounded-3xl p-6 sm:p-10">
      <p className="eyebrow">Order Info</p>
      <h2 className="mt-3 text-[clamp(20px,3vw,28px)] font-light tracking-wide">{L('title')}</h2>
      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--soft)]">{L('sub')}</p>
      <div className="mt-7 grid gap-5 sm:grid-cols-3">
        <label className="text-[12px] font-medium tracking-wider text-[var(--soft)]">{L('orderNo')}
          <input className={field} value={orderNo} maxLength={64} autoComplete="off"
                 onChange={e => { setOrderNo(e.target.value); setState('idle') }} />
        </label>
        <label className="text-[12px] font-medium tracking-wider text-[var(--soft)]">{L('orderDate')}
          <input className={field} type="date" value={orderDate}
                 onChange={e => { setOrderDate(e.target.value); setState('idle') }} />
        </label>
        <label className="text-[12px] font-medium tracking-wider text-[var(--soft)]">{L('item')}
          <select className={field} value={item} onChange={e => { setItem(e.target.value); setState('idle') }}>
            <option value="">{L('pick')}</option>
            {PRODUCTS.filter(p => p.markets.includes(market)).map(p => {
              const n = lang === 'en' && p.nameEn ? p.nameEn : p.name
              return <option key={p.slug} value={n}>{n}</option>
            })}
          </select>
        </label>
      </div>
      <pre className="mt-6 whitespace-pre-wrap rounded-xl border border-[var(--rule)] bg-[var(--bg)] p-5 text-[14px] leading-relaxed text-[var(--ink)]" aria-live="polite">{text}</pre>
      <button type="button" onClick={copy}
              className="btn-gold mt-5 rounded-full px-8 py-3 text-[13px] font-semibold tracking-[0.12em]">
        {state === 'copied' ? L('copied') : L('copy')}
      </button>
      {state === 'failed' && <p className="mt-3 text-[13px] text-[var(--soft)]">{L('manual')}</p>}
    </section>
  )
}
