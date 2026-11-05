// v0.1.0 | 2026-11-05 | 保固登錄：欄位驗證與伺服器端寫入（只能在伺服器端使用，含 Secret key）
import 'server-only'


export interface WarrantyInput {
  name: string
  email: string
  product: string
  channel: string
  orderNo: string
  purchaseDate: string
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

/** 回傳整理後的資料；欄位不合格回傳 null */
export function parseWarranty(raw: unknown): WarrantyInput | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const v: WarrantyInput = {
    name: str(r.name, 80),
    email: str(r.email, 254).toLowerCase(),
    product: str(r.product, 120),
    channel: str(r.channel, 60),
    orderNo: str(r.orderNo, 64),
    purchaseDate: str(r.purchaseDate, 10),
  }
  if (Object.values(v).some(x => !x)) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.purchaseDate)) return null
  const d = new Date(`${v.purchaseDate}T00:00:00Z`)
  if (Number.isNaN(d.getTime()) || d.getTime() > Date.now() + 86_400_000) return null
  return v
}

/** 寫入保固登錄，回傳登錄編號 */
export async function insertWarranty(v: WarrantyInput): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) throw new Error('missing Supabase env')

  const res = await fetch(`${url}/rest/v1/warranty_registrations`, {
    method: 'POST',
    headers: {
      apikey: key,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      name: v.name,
      email: v.email,
      product: v.product,
      channel: v.channel,
      order_no: v.orderNo,
      purchase_date: v.purchaseDate,
    }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`insert failed: ${res.status}`)
  const rows = (await res.json()) as Array<{ reg_no: string }>
  return rows[0].reg_no
}
