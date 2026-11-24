// v0.1.0 | 2026-11-24 | 維修諮詢：驗證表單、擋濫用、用 Resend 寄信到客服信箱（Reply-To = 客人）。不存任何資料
// 環境變數（在 Vercel 設定，不要寫進程式）：
//   RESEND_API_KEY   寄信服務金鑰
//   REPAIR_MAIL_TO   客服收信信箱（可用逗號放多個）
//   REPAIR_MAIL_FROM 寄件人，例如  eiP Support <service-us@lemeng.com.tw>（網域要在 Resend 驗證過）
import 'server-only'

export interface RepairInput {
  name: string; email: string; country: string; product: string
  orderNo: string; message: string
}

const clean = (v: unknown, max: number) =>
  typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max) : ''
// 單行欄位（會進信件標題）：不允許換行
const line = (v: unknown, max: number) => clean(v, max).replace(/[\r\n]+/g, ' ')

export function parseRepair(body: unknown): RepairInput | null {
  if (typeof body !== 'object' || body === null) return null
  const b = body as Record<string, unknown>
  const r: RepairInput = {
    name: line(b.name, 80), email: line(b.email, 254).toLowerCase(), country: line(b.country, 60),
    product: line(b.product, 80), orderNo: line(b.orderNo, 64), message: clean(b.message, 3000),
  }
  if (!r.name || !r.product || !r.message || r.message.length < 10) return null
  if (!/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/.test(r.email)) return null
  return r
}

// 簡易限流：每個來源 IP 每小時 5 封。伺服器重啟或多個實例時會重置，只是第一道防線
const hits = new Map<string, number[]>()
export function tooMany(ip: string): boolean {
  const now = Date.now(), win = 3600_000
  const list = (hits.get(ip) ?? []).filter((t) => now - t < win)
  if (list.length >= 5) { hits.set(ip, list); return true }
  list.push(now); hits.set(ip, list)
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < win)) hits.delete(k)
  return false
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

export async function sendRepairMail(r: RepairInput): Promise<boolean> {
  const key = process.env.RESEND_API_KEY, to = process.env.REPAIR_MAIL_TO, from = process.env.REPAIR_MAIL_FROM
  if (!key || !to || !from) throw new Error('missing mail env')
  const rows: [string, string][] = [['Name', r.name], ['Email', r.email], ['Country', r.country || '-'],
    ['Product', r.product], ['Order number', r.orderNo || '-']]
  const html = `<table cellpadding="6" style="font:14px sans-serif">${rows.map(([k, v]) => `<tr><td><b>${k}</b></td><td>${esc(v)}</td></tr>`).join('')}</table>`
    + `<p style="font:14px sans-serif;white-space:pre-wrap">${esc(r.message)}</p>`
    + `<p style="font:12px sans-serif;color:#888">Reply to this email to answer the customer.</p>`
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\n${r.message}\n`
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from, to: to.split(',').map((s) => s.trim()).filter(Boolean), reply_to: r.email,
      subject: `[Repair inquiry] ${r.product} – ${r.name}`, html, text,
    }),
    cache: 'no-store',
  })
  return res.ok
}
