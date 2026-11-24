// v0.1.0 | 2026-11-24 | 維修諮詢 API：驗證 → 限流 → 寄信到客服信箱。不寫入資料庫
import { NextResponse } from 'next/server'
import { parseRepair, sendRepairMail, tooMany } from '@/lib/repairMail'

export async function POST(req: Request) {
  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  // 防機器人：隱藏欄位有值就假裝成功
  if (typeof body === 'object' && body !== null && (body as { website?: unknown }).website) {
    return NextResponse.json({ ok: true })
  }
  const input = parseRepair(body)
  if (!input) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
  if (tooMany(ip)) return NextResponse.json({ error: 'rate' }, { status: 429 })
  try {
    if (!(await sendRepairMail(input))) return NextResponse.json({ error: 'server' }, { status: 502 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}
