// v0.1.0 | 2026-11-26 | 全球保固資料管理 API（只給 ERP 伺服器呼叫）：海外保固登錄／諮詢維修清單（唯讀）、海外產品清單維護
// 驗證：HMAC 簽章 + 時間戳，憑證是 PORTAL_WARRANTY_SECRET（與媒體庫的 PORTAL_ADMIN_SECRET 分開）。
// 驗證失敗或沒設憑證一律回 404，不說明原因。登錄與申請只能讀，不能改或刪。
import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { verifyWarrantyAdmin } from '@/lib/adminAuth'
import { rest } from '@/lib/supabaseRest'
import { GW_PRODUCTS_TAG } from '@/lib/globalWarrantyProducts'

export const dynamic = 'force-dynamic'

const ok = (data: unknown) => NextResponse.json({ success: true, data })
const fail = (error: string, status = 400) => NextResponse.json({ success: false, error }, { status })
const notFound = () => new NextResponse('Not Found', { status: 404 })

type Body = Record<string, unknown>
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T00:00:00Z`).getTime())
const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
const nextDay = (s: string) => new Date(Date.parse(`${s}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10)

/** 共用篩選：日期（台灣時間）、關鍵字（只留安全字元，放進 PostgREST 的 or=）、國家 */
function filters(b: Body, searchCols: string[]): string | null {
  const parts: string[] = []
  const from = str(b.from, 10), to = str(b.to, 10)
  if (from) { if (!isDate(from)) return null; parts.push(`created_at=gte.${encodeURIComponent(`${from}T00:00:00+08:00`)}`) }
  if (to) { if (!isDate(to)) return null; parts.push(`created_at=lt.${encodeURIComponent(`${nextDay(to)}T00:00:00+08:00`)}`) }
  const country = str(b.country, 2)
  if (country) { if (!/^[a-z]{2}$/.test(country)) return null; parts.push(`country=eq.${country}`) }
  const q = str(b.q, 60).replace(/[^\p{L}\p{N}@._+\- ]/gu, '').trim()
  if (q) parts.push(`or=${encodeURIComponent(`(${searchCols.map(c => `${c}.ilike."*${q}*"`).join(',')})`)}`)
  const limit = Math.min(Math.max(Number(b.limit) || 500, 1), 5000)
  parts.push(`order=created_at.desc`, `limit=${limit}`)
  return parts.join('&')
}

export async function POST(req: Request) {
  const raw = await req.text()
  if (raw.length > 16_384 || !verifyWarrantyAdmin(req.headers, raw)) return notFound()
  let body: Body
  try { body = JSON.parse(raw) as Body } catch { return fail('資料格式錯誤') }
  if (!body || typeof body !== 'object') return fail('資料格式錯誤')

  switch (body.op) {
    // ---- 海外保固登錄（只列海外 region=intl；台灣版登錄不在這裡） ----
    case 'registrations_list': {
      const f = filters(body, ['name', 'email', 'order_no', 'reg_no', 'serial_no'])
      if (f === null) return fail('篩選條件格式錯誤')
      const cols = 'reg_no,created_at,name,email,country,product,channel,order_no,purchase_date,serial_no,status'
      const r = await rest<unknown[]>(`warranty_registrations?select=${cols}&region=eq.intl&${f}`)
      return r.ok ? ok(r.data ?? []) : fail('讀取失敗', 502)
    }
    // ---- 諮詢維修（保固申請） ----
    case 'claims_list': {
      const f = filters(body, ['contact_name', 'contact_email', 'claim_no', 'serial_no'])
      if (f === null) return fail('篩選條件格式錯誤')
      const cols = 'claim_no,created_at,contact_name,contact_email,phone,country,product,serial_no,description,status,registration:warranty_registrations(reg_no)'
      const r = await rest<unknown[]>(`warranty_claims?select=${cols}&${f}`)
      return r.ok ? ok(r.data ?? []) : fail('讀取失敗', 502)
    }

    // ---- 海外產品清單 ----
    case 'products_list': {
      const r = await rest<unknown[]>('warranty_products?select=id,name,category,on_sale,sort&order=sort.asc,name.asc')
      if (r.ok) return ok(r.data ?? [])
      return fail(r.code === '42P01' || r.status === 404 ? '產品表還沒建立（請先執行 014_warranty_products.sql）' : '讀取失敗', 502)
    }
    case 'product_add': {
      const name = str(body.name, 120), category = str(body.category, 40)
      if (!name || !category) return fail('請填產品名稱與分類')
      const sort = Number.isInteger(body.sort) ? Number(body.sort) : 0
      const r = await rest('warranty_products', { method: 'POST', returning: true, body: { name, category, sort } })
      if (!r.ok) return fail(r.code === '23505' ? '已經有同名的產品' : '新增失敗', r.code === '23505' ? 409 : 502)
      revalidateTag(GW_PRODUCTS_TAG)
      return ok((r.data as unknown[])?.[0] ?? null)
    }
    case 'product_patch': {
      const id = str(body.id, 36)
      if (!isUuid(id)) return fail('找不到這個產品', 404)
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (body.name !== undefined) { const v = str(body.name, 120); if (!v) return fail('產品名稱不可空白'); patch.name = v }
      if (body.category !== undefined) { const v = str(body.category, 40); if (!v) return fail('分類不可空白'); patch.category = v }
      if (body.on_sale !== undefined) { if (typeof body.on_sale !== 'boolean') return fail('資料格式錯誤'); patch.on_sale = body.on_sale }
      if (body.sort !== undefined) { if (!Number.isInteger(body.sort)) return fail('排序要是整數'); patch.sort = body.sort }
      const r = await rest<unknown[]>(`warranty_products?id=eq.${id}`, { method: 'PATCH', returning: true, body: patch })
      if (!r.ok) return fail(r.code === '23505' ? '已經有同名的產品' : '儲存失敗', r.code === '23505' ? 409 : 502)
      if (!r.data?.length) return fail('找不到這個產品', 404)
      revalidateTag(GW_PRODUCTS_TAG)
      return ok(r.data[0])
    }
    case 'product_delete': {
      const id = str(body.id, 36)
      if (!isUuid(id)) return fail('找不到這個產品', 404)
      const r = await rest<unknown[]>(`warranty_products?id=eq.${id}`, { method: 'DELETE', returning: true })
      if (!r.ok) return fail('刪除失敗', 502)
      revalidateTag(GW_PRODUCTS_TAG)
      return ok(null)
    }
    default:
      return fail('不支援的操作')
  }
}
