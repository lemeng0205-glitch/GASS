// v0.1.0 | 2026-11-05 | 保固登錄 API：驗證後以伺服器端金鑰寫入
import { NextResponse } from 'next/server'
import { insertWarranty, parseWarranty } from '@/lib/warranty'

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
  // 防機器人：隱藏欄位有值就假裝成功
  if (typeof body === 'object' && body !== null && (body as { website?: unknown }).website) {
    return NextResponse.json({ regNo: 'EW00000000' })
  }
  const input = parseWarranty(body)
  if (!input) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  try {
    const regNo = await insertWarranty(input)
    return NextResponse.json({ regNo })
  } catch {
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}
