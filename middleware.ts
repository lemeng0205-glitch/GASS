// v0.1.0 | 2026-11-06 | 算出本次請求的語言，放進請求標頭 x-eip-lang，讓頁面內容與 <html lang> 用同一個答案
import { NextResponse, type NextRequest } from 'next/server'
import { LANG_COOKIE, LANG_HEADER, resolveLang } from '@/lib/lang'

export function middleware(req: NextRequest) {
  const lang = resolveLang(
    req.nextUrl.pathname,
    req.nextUrl.searchParams.get('lang'),
    req.cookies.get(LANG_COOKIE)?.value,
    req.headers.get('accept-language'),
  )
  const headers = new Headers(req.headers)
  headers.set(LANG_HEADER, lang)   // 一律覆寫，避免外部自行帶入
  return NextResponse.next({ request: { headers } })
}

// 只處理頁面；API、靜態檔案、Next 內部資源不經過
export const config = { matcher: ['/((?!api|_next|portal|.*\\..*).*)'] }
