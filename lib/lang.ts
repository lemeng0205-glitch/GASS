// v0.1.0 | 2026-11-06 | 語言判斷（單一來源）：網址 ?lang= ＞ 使用者上次選的（cookie）＞ 該頁預設
// 預設：台灣頁／保固登錄 = 中文；海外頁 = 英文；首頁 = 看瀏覽器語言（排第一的是中文就中文，其他英文）
// 給 middleware（edge）與 server 共用，不可引入 server-only 或 Node 專用模組。
export type Lang = 'zh' | 'en'
export const LANG_COOKIE = 'eip_lang'
export const LANG_HEADER = 'x-eip-lang'

const asLang = (v: string | null | undefined): Lang | null => (v === 'zh' || v === 'en' ? v : null)

export function resolveLang(pathname: string, param: string | null, cookie: string | null | undefined, accept: string | null): Lang {
  const explicit = asLang(param) ?? asLang(cookie)
  if (explicit) return explicit
  if (pathname === '/tw' || pathname.startsWith('/tw/') || pathname.startsWith('/register')) return 'zh'
  if (pathname === '/us' || pathname.startsWith('/us/')) return 'en'
  return /^zh/i.test((accept ?? '').trim()) ? 'zh' : 'en'
}
