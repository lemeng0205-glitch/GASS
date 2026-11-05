'use client'
// v0.1.0 | 2026-11-05 | 保固登錄表單：送到 /api/warranty/register（伺服器端寫入，瀏覽器不接觸資料庫）
import { useState } from 'react'
import { PRODUCTS, type PortalLang, type L10n } from '@/lib/portalConfig'

const CHANNELS = ['官方網站', '蝦皮', 'momo', 'PChome', 'Amazon', '實體店面', '其他']

const T = {
  name:     { zh: '姓名', en: 'Name' },
  email:    { zh: 'Email', en: 'Email' },
  product:  { zh: '購買產品', en: 'Product' },
  pick:     { zh: '請選擇產品', en: 'Select a product' },
  channel:  { zh: '購買通路', en: 'Where you bought it' },
  pickCh:   { zh: '請選擇通路', en: 'Select a channel' },
  orderNo:  { zh: '訂單編號', en: 'Order number' },
  date:     { zh: '購買日期', en: 'Purchase date' },
  submit:   { zh: '送出保固登錄', en: 'Submit registration' },
  sending:  { zh: '送出中…', en: 'Sending…' },
  doneT:    { zh: '登錄完成', en: 'Registration complete' },
  doneSub:  { zh: '請保留您的登錄編號，查詢保固時會用到。', en: 'Please keep your registration number for warranty lookups.' },
  regNo:    { zh: '登錄編號', en: 'Registration number' },
  invalid:  { zh: '資料格式有誤，請檢查後再送出。', en: 'Please check your details and try again.' },
  server:   { zh: '系統暫時無法處理，請稍後再試。', en: 'Something went wrong. Please try again later.' },
} satisfies Record<string, L10n>

const field = 'mt-2 w-full rounded-xl border border-[var(--rule)] bg-[var(--bg)] px-3.5 py-2.5 text-[15px] text-[var(--ink)] outline-none transition-colors focus:border-[var(--accent)]'
const label = 'text-[12px] font-medium tracking-wider text-[var(--soft)]'

export default function WarrantyForm({ lang }: { lang: PortalLang }) {
  const [state, setState] = useState<'idle' | 'sending' | 'invalid' | 'server'>('idle')
  const [regNo, setRegNo] = useState<string | null>(null)
  const t = (k: keyof typeof T) => T[k][lang]
  const today = new Date().toISOString().slice(0, 10)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('sending')
    const f = new FormData(e.currentTarget)
    const body = Object.fromEntries(f.entries())
    try {
      const res = await fetch('/api/warranty/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.status === 400) return setState('invalid')
      if (!res.ok) return setState('server')
      const data = (await res.json()) as { regNo: string }
      setRegNo(data.regNo)
    } catch {
      setState('server')
    }
  }

  if (regNo) {
    return (
      <section className="glass rounded-3xl p-6 sm:p-10" aria-live="polite">
        <h2 className="gold-text text-[clamp(22px,3vw,30px)] font-light tracking-wide">{t('doneT')}</h2>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--soft)]">{t('doneSub')}</p>
        <p className={`${label} mt-7`}>{t('regNo')}</p>
        <p className="mt-2 select-all text-[28px] font-semibold tracking-[0.12em]">{regNo}</p>
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
        <label className={`${label} sm:col-span-2`}>{t('product')}
          <select name="product" required defaultValue="" className={field}>
            <option value="" disabled>{t('pick')}</option>
            {PRODUCTS.map(p => <option key={p.slug} value={p.name}>{p.name}</option>)}
          </select>
        </label>
        <label className={label}>{t('channel')}
          <select name="channel" required defaultValue="" className={field}>
            <option value="" disabled>{t('pickCh')}</option>
            {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className={label}>{t('orderNo')}
          <input name="orderNo" required maxLength={64} autoComplete="off" className={field} />
        </label>
        <label className={label}>{t('date')}
          <input name="purchaseDate" type="date" required max={today} className={field} />
        </label>
      </div>
      {/* 防機器人：真人看不到，機器人常會填 */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <button type="submit" disabled={state === 'sending'}
              className="btn-gold mt-8 rounded-full px-8 py-3 text-[13px] font-semibold tracking-[0.12em] disabled:opacity-60">
        {state === 'sending' ? t('sending') : t('submit')}
      </button>
      {(state === 'invalid' || state === 'server') && (
        <p role="alert" className="mt-4 text-[13px] text-[var(--soft)]">{t(state)}</p>
      )}
    </form>
  )
}
