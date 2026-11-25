// v0.1.0 | 2026-11-25 | 諮詢維修（保固申請）API：驗證 → 防濫用 → 寫入 warranty_claims → 通知客服＋寄「已收到」信（失敗不影響申請）
// 回應不透露登錄編號是否存在（填錯編號與正常情況的回應相同）。
import { NextResponse } from 'next/server'
import { clientIp, createClaim, parseClaim, tooManyFromIp, tooManyGlobal } from '@/lib/globalWarranty'

export async function POST(req: Request) {
  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  if (typeof body === 'object' && body !== null && (body as { website?: unknown }).website) {
    return NextResponse.json({ claimNo: 'EC00000000' })
  }
  const input = parseClaim(body)
  if (!input) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  try {
    if (tooManyFromIp('claim', clientIp(req.headers), 5) || await tooManyGlobal('warranty_claims', 60)) {
      return NextResponse.json({ error: 'rate' }, { status: 429 })
    }
    return NextResponse.json(await createClaim(input))
  } catch (e) {
    console.error('global claim failed:', String((e as Error)?.message ?? e).replace(/[^\s@]+@[^\s@]+/g, '<email>'))
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}
