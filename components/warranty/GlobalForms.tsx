// v0.2.0 | 2026-11-26 | 產品選單改由頁面傳入（資料庫 warranty_products）
'use client'
// v0.1.0 | 2026-11-25 | 全球保固頁（海外）表單：保固登錄、諮詢維修。特效移植自業務畫面參考（依序浮現、游標柔光、進度線、按鈕光澤、打勾＋編號翻出＋彩紙）
// 送出到本站 API（/api/warranty/global/*），瀏覽器不接觸資料庫。失敗時保留已填內容。
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { GW_CHANNELS, GW_COUNTRIES } from '@/lib/globalWarrantyLists'

type Kind = 'text' | 'email' | 'date' | 'tel' | 'select' | 'textarea'
interface Field {
  name: string; label: string; kind: Kind; required: boolean; max: number; min?: number
  hint?: string; err?: string; options?: { value: string; label: string; group?: string }[]
  autoComplete?: string; check?: (v: string) => boolean
}

const PREFILL_KEY = 'eip-gw-prefill'
const localToday = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10) }
const EMAIL_RE = /^[^\s@,;<>"'()]+@[^\s@,;<>"'()]+\.[^\s@,;<>"'()]{2,}$/
const COUNTRY_OPTS = GW_COUNTRIES.map(c => ({ value: c.code, label: c.name }))
const CHANNEL_OPTS = GW_CHANNELS.map(c => ({ value: c, label: c }))

const NAME: Field = { name: 'name', label: 'Full name', kind: 'text', required: true, max: 80, autoComplete: 'name', err: 'Please enter your name.' }
const EMAIL: Field = { name: 'email', label: 'Email', kind: 'email', required: true, max: 254, autoComplete: 'email',
  hint: 'We use this to find your registration if you need support.', err: 'Please enter a valid email address.', check: v => EMAIL_RE.test(v.trim()) }
const COUNTRY: Field = { name: 'country', label: 'Country / Region', kind: 'select', required: true, max: 2, options: COUNTRY_OPTS, err: 'Please select your country or region.' }
// 產品選單由頁面（伺服器端讀 warranty_products）傳入，見 GlobalForm 的 products
const PRODUCT: Field = { name: 'product', label: 'Product', kind: 'select', required: true, max: 120, options: [], err: 'Please select your product.' }
const SERIAL: Field = { name: 'serialNo', label: 'Serial number', kind: 'text', required: false, max: 60 }

const REG_FIELDS: Field[] = [
  NAME, EMAIL, COUNTRY, PRODUCT,
  { name: 'channel', label: 'Where did you buy it?', kind: 'select', required: true, max: 60, options: CHANNEL_OPTS, err: 'Please select where you bought it.' },
  { name: 'orderNo', label: 'Order number', kind: 'text', required: true, max: 64, hint: 'You can find it in your order confirmation email or receipt.', err: 'Please enter your order number.' },
  { name: 'purchaseDate', label: 'Purchase date', kind: 'date', required: true, max: 10, err: 'Please enter a purchase date that is not in the future.',
    check: v => /^\d{4}-\d{2}-\d{2}$/.test(v) && v >= '2000-01-01' && v <= localToday() },
  SERIAL,
]
const CLAIM_FIELDS: Field[] = [
  NAME, { ...EMAIL, hint: 'Our support team will reply to this address.' }, COUNTRY, PRODUCT,
  { name: 'description', label: 'What is the problem?', kind: 'textarea', required: true, max: 4000,
    hint: 'Please describe what happened and what you have already tried.', err: 'Please describe the problem.' },
  SERIAL,
  { name: 'phone', label: 'Phone', kind: 'tel', required: false, max: 40, min: 3, autoComplete: 'tel', err: 'Please enter a valid phone number.' },
  { name: 'regNo', label: 'Warranty registration number', kind: 'text', required: false, max: 10, hint: 'If you registered your product, e.g. EW1234ABCD.' },
]

function valid(f: Field, v: string): boolean {
  const s = v.trim()
  if (!s) return !f.required
  if (s.length > f.max || (f.min && s.length < f.min)) return false
  return f.check ? f.check(s) : true
}

/** 卡片上跟著游標的柔光 */
function glow(e: React.PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
}
const rise = (i: number) => ({ '--i': i } as React.CSSProperties)

type Mode = 'register' | 'claim'
const CONF = {
  register: { fields: REG_FIELDS, api: '/api/warranty/global/register', submit: 'Register warranty', doneTitle: 'Registration received', codeLabel: 'Registration number' },
  claim: { fields: CLAIM_FIELDS, api: '/api/warranty/global/claim', submit: 'Send request', doneTitle: 'We have received your request', codeLabel: 'Request number' },
}

export default function GlobalForm({ mode, products }: { mode: Mode; products: { category: string; name: string }[] }) {
  const base = CONF[mode]
  const conf = useMemo(() => ({
    ...base,
    fields: base.fields.map(f => (f.name === 'product' ? { ...f, options: products.map(p => ({ value: p.name, label: p.name, group: p.category })) } : f)),
  }), [base, products])
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(conf.fields.map(f => [f.name, ''])))
  const [consent, setConsent] = useState(false)
  const [bad, setBad] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ code: string; emailSent?: boolean } | null>(null)
  const hp = useRef<HTMLInputElement>(null)
  const errRef = useRef<HTMLDivElement>(null)
  const doneRef = useRef<HTMLElement>(null)

  // 從「登錄完成」帶過來的資料（用 sessionStorage，不放在網址上）
  useEffect(() => {
    if (mode !== 'claim') return
    try {
      const raw = sessionStorage.getItem(PREFILL_KEY)
      if (!raw) return
      sessionStorage.removeItem(PREFILL_KEY)
      const p = JSON.parse(raw) as Record<string, string>
      setValues(v => ({ ...v, ...Object.fromEntries(Object.entries(p).filter(([k, x]) => k in v && typeof x === 'string')) }))
    } catch { /* 讀不到就不帶入 */ }
  }, [mode])

  const required = useMemo(() => conf.fields.filter(f => f.required), [conf])
  const progress = (required.filter(f => valid(f, values[f.name])).length + (consent ? 1 : 0)) / (required.length + 1)

  const set = (name: string, v: string) => {
    setValues(x => ({ ...x, [name]: v }))
    if (bad.has(name)) { const f = conf.fields.find(f => f.name === name)!; if (valid(f, v)) setBad(b => { const n = new Set(b); n.delete(name); return n }) }
  }
  const blur = (f: Field) => setBad(b => { const n = new Set(b); if (values[f.name].trim() && !valid(f, values[f.name])) n.add(f.name); else n.delete(f.name); return n })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const wrong = new Set(conf.fields.filter(f => !valid(f, values[f.name])).map(f => f.name))
    if (!consent) wrong.add('consent')
    setBad(wrong)
    if (wrong.size) { document.getElementById(`gw-${[...wrong][0]}`)?.focus(); return }
    setSending(true)
    try {
      const res = await fetch(conf.api, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, consent: true, website: hp.current?.value ?? '' }),
      })
      if (res.status === 429) throw new Error('Too many requests right now. Please try again in a little while.')
      if (res.status === 400) throw new Error('Some details could not be accepted. Please check the form and try again.')
      if (!res.ok) throw new Error('')
      const out = await res.json() as { regNo?: string; claimNo?: string; emailSent?: boolean }
      const code = out.regNo ?? out.claimNo
      if (!code) throw new Error('')
      setDone({ code, emailSent: out.emailSent })
    } catch (err) {
      setError((err as Error).message || 'Sorry, we could not save your request. Please check your connection and try again.')
      setTimeout(() => errRef.current?.scrollIntoView({ block: 'center' }), 0)
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    if (!done) return
    doneRef.current?.focus({ preventScroll: true })
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
    if (!reduce) { const t = setTimeout(confetti, 650); return () => clearTimeout(t) }
  }, [done])

  if (done) {
    const label = (f: Field, v: string) => f.options?.find(o => o.value === v)?.label ?? v
    const rows = conf.fields.filter(f => f.name !== 'description' && values[f.name].trim()).map(f => [f.label, label(f, values[f.name].trim())])
    const helpPrefill = () => {
      try {
        sessionStorage.setItem(PREFILL_KEY, JSON.stringify({ name: values.name, email: values.email, country: values.country, product: values.product, serialNo: values.serialNo, regNo: done.code }))
      } catch { /* 存不了就不帶入 */ }
    }
    return (
      <section ref={doneRef} tabIndex={-1} className="wg done rise" onPointerMove={glow} aria-live="polite">
        <svg className="check" viewBox="0 0 68 68" aria-hidden="true"><circle cx="34" cy="34" r="30" /><path d="M21 35.5l9 9 17-19" /></svg>
        <h2>{conf.doneTitle}</h2>
        <p>{mode === 'register'
          ? 'Please keep your registration number. You will need it when you contact support.' + (done.emailSent ? ` We have also sent a confirmation email to ${values.email.trim().toLowerCase()}.` : '')
          : 'Our support team will reply to you by email. Please check your inbox (and spam folder).'}</p>
        <p className="w-eyebrow">{conf.codeLabel}</p>
        <div className="regno" aria-label={`${conf.codeLabel} ${done.code}`}>
          {[...done.code].map((ch, i) => <span key={i} style={{ '--i': i } as React.CSSProperties} aria-hidden="true">{ch}</span>)}
        </div>
        <dl>{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        <div className="actions">
          {mode === 'register'
            ? <Link href="/warranty/support" className="wbtn" onClick={helpPrefill}>Need help with this product?</Link>
            : <Link href="/warranty/register" className="wbtn">Register a product</Link>}
          <Link href="/warranty" className="wbtn ghost">Back to Warranty &amp; Support</Link>
        </div>
      </section>
    )
  }

  const today = localToday()
  return (
    <form className="wg rise" style={rise(3)} onSubmit={onSubmit} onPointerMove={glow} noValidate>
      <div className="progress" aria-hidden="true"><b style={{ width: `${progress * 100}%` }} /></div>
      {error && <div ref={errRef} className="banner error" role="alert">{error}</div>}

      {conf.fields.map((f, i) => {
        const id = `gw-${f.name}`, invalid = bad.has(f.name)
        const common = {
          id, name: f.name, value: values[f.name], required: f.required, 'aria-invalid': invalid,
          onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => set(f.name, e.target.value),
          onBlur: () => blur(f),
        }
        let input: React.ReactNode
        if (f.kind === 'select') {
          const groups = [...new Set(f.options!.map(o => o.group).filter(Boolean))] as string[]
          input = (
            <select {...common}>
              <option value="">Select…</option>
              {groups.length
                ? groups.map(g => <optgroup key={g} label={g}>{f.options!.filter(o => o.group === g).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</optgroup>)
                : f.options!.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )
        } else if (f.kind === 'textarea') {
          input = <textarea {...common} maxLength={f.max} rows={6} />
        } else {
          input = <input {...common} type={f.kind} maxLength={f.kind === 'date' ? undefined : f.max} autoComplete={f.autoComplete ?? 'off'}
            {...(f.kind === 'date' ? { max: today, min: '2000-01-01' } : {})} {...(f.kind === 'email' ? { inputMode: 'email' as const } : {})} />
        }
        return (
          <div key={f.name} className={`field rise${invalid ? ' invalid' : ''}`} style={rise(i + 4)}>
            <label htmlFor={id}>{f.label}{!f.required && <span className="opt"> (optional)</span>}</label>
            {input}
            {f.hint && <div className="hint">{f.hint}</div>}
            {f.err && <div className="err">{f.err}</div>}
          </div>
        )
      })}

      {/* 防機器人：真人看不到、不會填 */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="gw-website">Leave this field empty</label>
        <input ref={hp} id="gw-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={`field rise${bad.has('consent') ? ' invalid' : ''}`} style={rise(conf.fields.length + 4)}>
        <div className="consent">
          <input id="gw-consent" type="checkbox" checked={consent} required
            onChange={e => { setConsent(e.target.checked); if (e.target.checked) setBad(b => { const n = new Set(b); n.delete('consent'); return n }) }} />
          <label htmlFor="gw-consent">I agree that my information may be used to provide warranty and after-sales support, as described in the{' '}
            <a href="/warranty/privacy" target="_blank" rel="noopener">Privacy Policy</a>.</label>
        </div>
        <div className="err">Please tick the box to continue.</div>
      </div>

      <button type="submit" className="wbtn rise" style={rise(conf.fields.length + 5)} disabled={sending}>
        {sending ? 'Submitting…' : conf.submit}
      </button>
    </form>
  )
}

/** 彩紙：網站色系，約 2.6 秒後自動結束 */
function confetti() {
  const cv = document.createElement('canvas')
  cv.className = 'wty-confetti'; cv.setAttribute('aria-hidden', 'true')
  document.body.appendChild(cv)
  const ctx = cv.getContext('2d'); if (!ctx) { cv.remove(); return }
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.scale(dpr, dpr)
  const colors = ['#8c7f68', '#45423e', '#dccfb6', '#ead6d0', '#d3dccf', '#b9b4ac', '#4f6b55']
  const ox = innerWidth / 2, oy = Math.min(innerHeight * 0.3, 220)
  const bits = Array.from({ length: 110 }, () => {
    const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 9
    return { x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5, w: 5 + Math.random() * 6, h: 3 + Math.random() * 5,
      r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: colors[Math.floor(Math.random() * colors.length)] }
  })
  const start = performance.now()
  const frame = (now: number) => {
    const t = (now - start) / 2600
    ctx.clearRect(0, 0, innerWidth, innerHeight)
    if (t >= 1) { cv.remove(); return }
    for (const b of bits) {
      b.vy += 0.22; b.vx *= 0.985; b.x += b.vx; b.y += b.vy; b.r += b.vr
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - t * t); ctx.translate(b.x, b.y); ctx.rotate(b.r)
      ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); ctx.restore()
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}
