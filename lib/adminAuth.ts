// v0.2.0 | 2026-11-26 | 新增 verifyWarrantyAdmin：保固資料管理 API 用另一組憑證（PORTAL_WARRANTY_SECRET），媒體庫憑證外洩也讀不到客人資料
// v0.1.0 | 2026-11-18 | 管理 API 的請求驗證：HMAC-SHA256 簽章 + 時間戳
// 呼叫端（ERP 伺服器）用共用憑證對「時間戳 + 請求內容」簽章；本站驗證通過才處理。
//   - 憑證放在環境變數 PORTAL_ADMIN_SECRET；換憑證時可把舊的放進 PORTAL_ADMIN_SECRET_PREV 並存一段時間
//   - 時間戳誤差超過 120 秒一律作廢（擋重送）
//   - 比對用固定時間比較；任何失敗都不說明原因（呼叫端只會看到 404）
//   - 沒設定憑證 = 管理 API 完全關閉
import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

const WINDOW_SEC = 120

export function verifyAdmin(headers: Headers, rawBody: string): boolean {
  return verifyWith([process.env.PORTAL_ADMIN_SECRET, process.env.PORTAL_ADMIN_SECRET_PREV], headers, rawBody)
}

/** 保固登錄／申請資料與海外產品清單的管理 API：憑證 PORTAL_WARRANTY_SECRET（換憑證時舊的放 PORTAL_WARRANTY_SECRET_PREV） */
export function verifyWarrantyAdmin(headers: Headers, rawBody: string): boolean {
  return verifyWith([process.env.PORTAL_WARRANTY_SECRET, process.env.PORTAL_WARRANTY_SECRET_PREV], headers, rawBody)
}

function verifyWith(candidates: Array<string | undefined>, headers: Headers, rawBody: string): boolean {
  const secrets = candidates.filter((s): s is string => !!s && s.length >= 32)
  if (!secrets.length) return false

  const ts = headers.get('x-admin-ts') ?? ''
  const sig = headers.get('x-admin-sig') ?? ''
  if (!/^\d{10}$/.test(ts) || !/^[0-9a-f]{64}$/.test(sig)) return false
  if (Math.abs(Date.now() / 1000 - Number(ts)) > WINDOW_SEC) return false

  const got = Buffer.from(sig, 'hex')
  return secrets.some(secret => {
    const want = createHmac('sha256', secret).update(`${ts}.${rawBody}`).digest()
    return want.length === got.length && timingSafeEqual(want, got)
  })
}
