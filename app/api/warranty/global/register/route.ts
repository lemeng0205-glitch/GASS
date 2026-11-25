// v0.1.0 | 2026-11-25 | 全球保固登錄 API：驗證 → 防濫用 → 寫入 warranty_registrations → 寄確認信（失敗不影響登錄）
import { NextResponse } from 'next/server'
import { clientIp, createRegistration, parseRegistration, tooManyFromIp, tooManyGlobal } from '@/lib/globalWarranty'

export async function POST(req: Request) {
  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  // 防機器人：隱藏欄位有值就假裝成功（不寫入、不寄信）
  if (typeof body === 'object' && body !== null && (body as { website?: unknown }).website) {
    return NextResponse.json({ regNo: 'EW00000000', emailSent: false })
  }
  const input = parseRegistration(body)
  if (!input) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  try {
    if (tooManyFromIp('reg', clientIp(req.headers), 10) || await tooManyGlobal('warranty_registrations', 60)) {
      return NextResponse.json({ error: 'rate' }, { status: 429 })
    }
    return NextResponse.json(await createRegistration(input))
  } catch (e) {
    console.error('global register failed:', String((e as Error)?.message ?? e).replace(/[^\s@]+@[^\s@]+/g, '<email>'))
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}
