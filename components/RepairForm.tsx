'use client'
// v0.1.0 | 2026-11-24 | 維修諮詢表單：送到 /api/repair（寄信給客服）。失敗時保留已填內容
import { useState } from 'react'
import { PRODUCTS, type PortalLang, type L10n } from '@/lib/portalConfig'

const T = {
  name:    { zh: '姓名', en: 'Name' },
  email:   { zh: 'Email', en: 'Email' },
  country: { zh: '國家／地區', en: 'Country / Region' },
  product: { zh: '產品', en: 'Product' },
  pick:    { zh: '請選擇產品', en: 'Select a product' },
  orderNo: { zh: '訂單編號（選填）', en: 'Order number (optional)' },
  message: { zh: '請描述問題', en: 'Describe the issue' },
  submit:  { zh: '送出諮詢', en: 'Send inquiry' },
  sending: { zh: '送出中…', en: 'Sending…' },
  doneT:   { zh: '已送出', en: 'Inquiry sent' },
  doneSub: { zh: '客服會以 Email 回覆您，請留意收件匣（也請看一下垃圾信件匣）。', en: 'Our support team will reply by email. Please check your inbox (and spam folder).' },
  invalid: { zh: '資料有誤，請檢查後再送出（問題描述至少 10 個字）。', en: 'Please check your details (the description needs at least 10 characters).' },
  rate:    { zh: '送出次數過多，請稍後再試。', en: 'Too many requests. Please try again later.' },
  server:  { zh: '暫時無法送出，您填的內容還在，請稍後再試一次。', en: 'We could not send your inquiry. Your text is still here – please try again shortly.' },
} satisfies Record<string, L10n>

const field = 'mt-2 w-full rounded-xl border border-[var(--rule)] bg-[var(--bg)] px-3.5 py-2.5 text-[15px] text-[var(--ink)] outline-none transition-colors focus:border-[var(--accent)]'
const label = 'text-[12px] font-medium tracking-wider text-[var(--soft)]'

export default function RepairForm({ lang }: { lang: PortalLang }) {
  const [state, setState] = useState<'idle' | 'sending' | 'invalid' | 'rate' | 'server' | 'done'>('idle')
  const t = (k: keyof typeof T) => T[k][lang]

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('sending')
    const body = Object.fromEntries(new FormData(e.currentTarget).entries())
    try {
      const res = await fetch('/api/repair', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      if (res.status === 400) return setState('invalid')
      if (res.status === 429) return setState('rate')
      if (!res.ok) return setState('server')
      setState('done')
    } catch { setState('server') }
  }

  if (state === 'done') {
    return (
      <section className="glass rounded-3xl p-6 sm:p-10" aria-live="polite">
        <h2 className="gold-text text-[clamp(22px,3vw,30px)] font-light tracking-wide">{t('doneT')}</h2>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--soft)]">{t('doneSub')}</p>
      </section>
    )
  }

  return (
    <form onSubmit={onSubmit} className="glass rounded-3xl p-6 sm:p-10">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={label}>{t('name')}
          <input name="name" required maxLength={80} autoComplete="name" className={field} />
        </label>
        <label className={label}>{t('email')}
          <input name="email" type="email" required maxLength={254} autoComplete="email" className={field} />
        </label>
        <label className={label}>{t('country')}
          <input name="country" maxLength={60} autoComplete="country-name" className={field} />
        </label>
        <label className={label}>{t('orderNo')}
          <input name="orderNo" maxLength={64} autoComplete="off" className={field} />
        </label>
        <label className={`${label} sm:col-span-2`}>{t('product')}
          <select name="product" required defaultValue="" className={field}>
            <option value="" disabled>{t('pick')}</option>
            {PRODUCTS.map(p => <option key={p.slug} value={p.nameEn ?? p.name}>{p.nameEn ?? p.name}</option>)}
          </select>
        </label>
        <label className={`${label} sm:col-span-2`}>{t('message')}
          <textarea name="message" required minLength={10} maxLength={3000} rows={6} className={field} />
        </label>
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <button type="submit" disabled={state === 'sending'}
              className="btn-gold mt-8 rounded-full px-8 py-3 text-[13px] font-semibold tracking-[0.12em] disabled:opacity-60">
        {state === 'sending' ? t('sending') : t('submit')}
      </button>
      {(state === 'invalid' || state === 'rate' || state === 'server') && (
        <p role="alert" className="mt-4 text-[13px] text-[var(--soft)]">{t(state)}</p>
      )}
    </form>
  )
}
