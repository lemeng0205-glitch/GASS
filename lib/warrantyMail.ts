// v0.3.1 | 2026-11-26 | 帳號、密碼、寄件地址去掉前後空白（避免 Vercel 貼上多帶空白造成登入失敗）
// v0.3.0 | 2026-11-25 | 放進專案：Mailcloud 連線放在這裡（本站沒有既有的 mailTransport）；寄信紀錄用 lib/supabaseRest 的 rest() 寫入
// v0.2.0 | 2026-11-25 | （業務草稿）新增 kind claim_staff_notify 與 replyTo 參數
// v0.1.0 | 2026-11-24 | （業務草稿）寄信唯一入口：寄信 + 寫入 warranty_mail_log
//
// 規則：
// - 寄信失敗不可以讓存檔失敗：這個函式不丟例外，只回傳 { ok, error }。
// - 每次呼叫都寫一筆 warranty_mail_log（成功失敗都寫）；不存收件地址，錯誤訊息遮掉 Email。
// - 只在伺服器端使用。
// 環境變數（只在 Vercel 設定）：MAILCLOUD_USER、MAILCLOUD_PASSWORD、WARRANTY_SUPPORT_EMAIL、
//   WARRANTY_MAIL_FROM（建議）、WARRANTY_MAIL_FROM_NAME（選填）、WARRANTY_MAIL_ARCHIVE_BCC（選填）
import 'server-only'
import nodemailer from 'nodemailer'
import { rest } from './supabaseRest'
import type { BuiltEmail } from './warrantyEmailTemplates'

export type WarrantyMailKind = 'registration_confirm' | 'claim_received' | 'claim_update' | 'claim_staff_notify'

/** 信件樣板需要的共用設定；缺客服信箱回傳 null（呼叫端就不寄，但仍記錄） */
export function warrantyMailIdentity(): { supportEmail: string; senderName: string } | null {
  const supportEmail = process.env.WARRANTY_SUPPORT_EMAIL?.trim()
  if (!supportEmail) return null
  return { supportEmail, senderName: process.env.WARRANTY_MAIL_FROM_NAME?.trim() || 'eiP Support' }
}

let cached: nodemailer.Transporter | null = null
function transport() {
  // 去掉前後空白與換行（在 Vercel 貼上時常多帶，會造成 504 Authentication failed）
  const user = process.env.MAILCLOUD_USER?.trim()
  const pass = process.env.MAILCLOUD_PASSWORD?.trim()
  if (!user || !pass) throw new Error('missing Mailcloud env')
  cached ??= nodemailer.createTransport({
    host: 'ms.mailcloud.com.tw', port: 465, secure: true, auth: { user, pass },
    connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000,
  })
  return cached
}

function fromHeader(): string {
  const address = (process.env.WARRANTY_MAIL_FROM || process.env.MAILCLOUD_FROM || process.env.MAILCLOUD_USER || '').trim()
  const name = (process.env.WARRANTY_MAIL_FROM_NAME || 'eiP Support').replace(/["\r\n]/g, '')
  return `"${name}" <${address}>`
}

const maskEmail = (s: string) => s.replace(/[^\s<>"']+@[^\s<>"']+/g, '<email>').slice(0, 500)

export async function sendWarrantyMail(opts: {
  kind: WarrantyMailKind
  to: string | null | undefined
  /** 只有 claim_staff_notify 傳（顧客 Email，必須先通過格式檢查）；沒給就用客服信箱 */
  replyTo?: string | null
  registrationId?: string | null
  claimId?: string | null
  /** null = 缺設定，不寄但記錄 */
  mail: BuiltEmail | null
}): Promise<{ ok: boolean; error?: string }> {
  let ok = false
  let error: string | undefined
  let messageId: string | null = null

  const to = (opts.to ?? '').trim()
  if (!to) error = 'no recipient'
  else if (!opts.mail) error = 'mail not configured'
  else {
    try {
      const info = await transport().sendMail({
        from: fromHeader(),
        to,
        replyTo: (opts.replyTo ?? '').trim() || process.env.WARRANTY_SUPPORT_EMAIL || undefined,
        bcc: process.env.WARRANTY_MAIL_ARCHIVE_BCC || undefined,
        subject: opts.mail.subject,
        html: opts.mail.html,
        text: opts.mail.text,
      })
      ok = true
      messageId = info?.messageId ?? null
    } catch (err) {
      error = maskEmail(String((err as { message?: unknown } | null)?.message ?? err))
    }
  }

  try {
    const r = await rest('warranty_mail_log', {
      method: 'POST',
      body: {
        registration_id: opts.registrationId ?? null, claim_id: opts.claimId ?? null,
        kind: opts.kind, ok, error: error ?? null, message_id: messageId,
      },
    })
    if (!r.ok) console.error('warranty_mail_log insert failed:', r.status, r.code ?? '')
  } catch (e) {
    console.error('warranty_mail_log insert failed:', maskEmail(String((e as Error)?.message ?? e)))
  }
  return ok ? { ok } : { ok, error }
}
