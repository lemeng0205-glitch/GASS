// v0.2.0 | 2026-11-26 | 產品清單改由呼叫端傳入（讀 warranty_products，業務在 ERP 維護）
// v0.1.0 | 2026-11-25 | 全球保固頁（海外）：欄位驗證、防濫用、寫入 warranty_registrations／warranty_claims、寄信
// 只能在伺服器端使用。依《全球保固頁_規格》第 3、4、7 節與《寄信規格》。
import 'server-only'
import { rest } from './supabaseRest'
import { GW_CHANNELS, GW_COUNTRIES } from './globalWarrantyLists'
import { sendWarrantyMail, warrantyMailIdentity } from './warrantyMail'
import { buildClaimReceivedEmail, buildClaimStaffNotifyEmail, buildRegistrationConfirmEmail } from './warrantyEmailTemplates'

// ---------- 欄位整理 ----------
// 去掉控制字元（保留換行給多行欄位），頭尾空白
const clean = (v: unknown) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim() : '')
const oneLine = (v: unknown) => clean(v).replace(/[\r\n\t]+/g, ' ')
const within = (s: string, min: number, max: number) => s.length >= min && s.length <= max
// Email：一般格式檢查，並且不可含換行、逗號、分號、角括號、引號（會放進信件的 Reply-To）
const EMAIL_RE = /^[^\s@,;<>"'()]+@[^\s@,;<>"'()]+\.[^\s@,;<>"'()]{2,}$/
const okEmail = (s: string) => within(s, 3, 254) && EMAIL_RE.test(s)
const COUNTRY_CODES = new Set(GW_COUNTRIES.map(c => c.code))
const optional = (s: string, min: number, max: number): string | null | false => (s ? (within(s, min, max) ? s : false) : null)

export interface RegistrationInput {
  name: string; email: string; country: string; product: string; channel: string
  orderNo: string; purchaseDate: string; serialNo: string | null
}

/** products = 目前販售中的產品名稱（來自 warranty_products） */
export function parseRegistration(raw: unknown, products: Set<string>): RegistrationInput | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  if (r.consent !== true) return null
  const v = {
    name: oneLine(r.name), email: oneLine(r.email).toLowerCase(), country: oneLine(r.country),
    product: oneLine(r.product), channel: oneLine(r.channel), orderNo: oneLine(r.orderNo),
    purchaseDate: oneLine(r.purchaseDate),
  }
  const serialNo = optional(oneLine(r.serialNo), 1, 60)
  if (serialNo === false) return null
  if (!within(v.name, 1, 80) || !okEmail(v.email) || !COUNTRY_CODES.has(v.country)) return null
  if (!products.has(v.product) || !GW_CHANNELS.includes(v.channel) || !within(v.orderNo, 1, 64)) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.purchaseDate)) return null
  const d = new Date(`${v.purchaseDate}T00:00:00Z`)
  // 不早於 2000-01-01；不晚於今天（容許時區差一天）
  if (Number.isNaN(d.getTime()) || v.purchaseDate < '2000-01-01' || d.getTime() > Date.now() + 86_400_000) return null
  if (d.toISOString().slice(0, 10) !== v.purchaseDate) return null   // 擋 2026-02-31 之類
  return { ...v, serialNo }
}

export interface ClaimInput {
  name: string; email: string; country: string; product: string; description: string
  serialNo: string | null; phone: string | null; regNo: string | null
}

export function parseClaim(raw: unknown, products: Set<string>): ClaimInput | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  if (r.consent !== true) return null
  const v = {
    name: oneLine(r.name), email: oneLine(r.email).toLowerCase(), country: oneLine(r.country),
    product: oneLine(r.product), description: clean(r.description).replace(/\r\n?/g, '\n'),
  }
  const serialNo = optional(oneLine(r.serialNo), 1, 60)
  const phone = optional(oneLine(r.phone), 3, 40)
  const regRaw = oneLine(r.regNo).toUpperCase()
  if (serialNo === false || phone === false) return null
  if (!within(v.name, 1, 80) || !okEmail(v.email) || !COUNTRY_CODES.has(v.country)) return null
  if (!products.has(v.product) || !within(v.description, 1, 4000)) return null
  // 登錄編號格式不對就當沒填（不回錯誤，避免被拿來試探）
  const regNo = /^EW[0-9A-Z]{8}$/.test(regRaw) ? regRaw : null
  return { ...v, serialNo, phone, regNo }
}

// ---------- 防濫用 ----------
// 第一道：同一來源每小時上限（存在伺服器記憶體，重啟或多個實例時會重置）
const hits = new Map<string, number[]>()
export function tooManyFromIp(bucket: string, ip: string, limit: number): boolean {
  const now = Date.now(), win = 3_600_000, key = `${bucket}:${ip}`
  const list = (hits.get(key) ?? []).filter(t => now - t < win)
  const over = list.length >= limit
  if (!over) list.push(now)
  hits.set(key, list)
  if (hits.size > 5000) for (const [k, l] of hits) if (!l.some(t => now - t < win)) hits.delete(k)
  return over
}
// 第二道：全站每小時上限（查資料庫最近一小時的筆數，跨實例有效）
export async function tooManyGlobal(table: 'warranty_registrations' | 'warranty_claims', limit: number): Promise<boolean> {
  const since = new Date(Date.now() - 3_600_000).toISOString()
  const r = await rest<unknown[]>(`${table}?select=id&created_at=gte.${encodeURIComponent(since)}&limit=${limit}`)
  return !r.ok || (r.data?.length ?? 0) >= limit   // 查不到時保守視為超過
}

export const clientIp = (h: Headers) => (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'

// ---------- 寫入與寄信 ----------
export async function createRegistration(v: RegistrationInput): Promise<{ regNo: string; emailSent: boolean }> {
  const r = await rest<Array<{ id: string; reg_no: string }>>('warranty_registrations?select=id,reg_no', {
    method: 'POST', returning: true,
    body: {
      name: v.name, email: v.email, country: v.country, product: v.product, channel: v.channel,
      order_no: v.orderNo, purchase_date: v.purchaseDate, serial_no: v.serialNo,
      consent_at: new Date().toISOString(), source: 'overseas-web', region: 'intl',
    },
  })
  const row = r.data?.[0]
  if (!r.ok || !row) throw new Error(`insert registration failed: ${r.status}`)

  const id = warrantyMailIdentity()
  const sent = await sendWarrantyMail({
    kind: 'registration_confirm', to: v.email, registrationId: row.id,
    mail: id ? buildRegistrationConfirmEmail({ ...id, regNo: row.reg_no }) : null,
  })
  return { regNo: row.reg_no, emailSent: sent.ok }
}

export async function createClaim(v: ClaimInput): Promise<{ claimNo: string }> {
  // 登錄編號＋Email 都相符才連結；找不到就留空，照樣收件
  let reg: { id: string; reg_no: string } | null = null
  if (v.regNo) {
    const q = await rest<Array<{ id: string; reg_no: string }>>(
      `warranty_registrations?select=id,reg_no&reg_no=eq.${encodeURIComponent(v.regNo)}&email=eq.${encodeURIComponent(v.email)}&limit=1`)
    reg = q.ok ? q.data?.[0] ?? null : null
  }
  const r = await rest<Array<{ id: string; claim_no: string }>>('warranty_claims?select=id,claim_no', {
    method: 'POST', returning: true,
    body: {
      registration_id: reg?.id ?? null, contact_name: v.name, contact_email: v.email, country: v.country,
      product: v.product, description: v.description, serial_no: v.serialNo, phone: v.phone,
    },
  })
  const row = r.data?.[0]
  if (!r.ok || !row) throw new Error(`insert claim failed: ${r.status}`)

  const id = warrantyMailIdentity()
  // 1. 通知客服（收件人固定是客服信箱，Reply-To = 顧客）
  await sendWarrantyMail({
    kind: 'claim_staff_notify', to: id?.supportEmail, replyTo: v.email, claimId: row.id, registrationId: reg?.id,
    mail: buildClaimStaffNotifyEmail({
      claimNo: row.claim_no, regNo: reg?.reg_no, contactName: v.name, contactEmail: v.email,
      country: v.country, product: v.product, serialNo: v.serialNo, phone: v.phone, description: v.description,
    }),
  })
  // 2. 給顧客的「已收到」信（不含顧客輸入的文字）
  await sendWarrantyMail({
    kind: 'claim_received', to: v.email, claimId: row.id, registrationId: reg?.id,
    mail: id ? buildClaimReceivedEmail({ ...id, claimNo: row.claim_no, regNo: reg?.reg_no }) : null,
  })
  return { claimNo: row.claim_no }
}
