// v0.4.0 | 2026-11-24 | /warranty/（海外保固登錄靜態頁）專用 CSP：connect-src 只在這裡多放行 Google Apps Script 兩個網址；/warranty 轉址到 /warranty/index.html
// v0.3.0 | 2026-11-19 | img-src 放行本站 Supabase 來源（電子模板預覽圖）
// v0.2.0 | 2026-11-18 | /m/<編號>/f/<id>（說明書檔案）不疊本站 CSP，由該路由自己加隔離標頭
// v0.1.0 | 2026-11-04 | 安全標頭（僅正式環境；開發模式 Next 需要 eval）
const isProd = process.env.NODE_ENV === 'production'

// 電子模板預覽圖用本站資料庫的簽名連結顯示 → 只放行這一個來源（不用萬用字元）
let supabaseOrigin = ''
try { supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : '' } catch {}

const buildCsp = (connectSrc) => [
  "default-src 'self'",
  `img-src 'self' data:${supabaseOrigin ? ' ' + supabaseOrigin : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  `connect-src ${connectSrc}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')
const csp = buildCsp("'self'")
// 海外保固登錄頁把資料送到 Google Apps Script（送出後 Google 會轉址到 googleusercontent 取回結果）→ 只有 /warranty/ 底下放行
const warrantyCsp = buildCsp("'self' https://script.google.com https://script.googleusercontent.com")

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async redirects() {
    // 要用轉址而不是 rewrite：頁面的 warranty.css / warranty.js 是相對路徑
    return [{ source: '/warranty', destination: '/warranty/index.html', permanent: false }]
  },
  async headers() {
    if (!isProd) return []
    return [
      {
        // 一般頁面：完整的安全標頭。說明書檔案路徑 /m/<編號>/f/<id> 除外（見下一條）
        source: '/((?!m/[^/]+/f/|warranty/).*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
      {
        // 海外保固登錄靜態頁：和一般頁面相同的標頭，只有 CSP 的 connect-src 多放行 Google 兩個網址
        source: '/warranty/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: warrantyCsp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
      {
        // 說明書檔案：HTML 線上說明書由該路由自己加 CSP sandbox（隔離、無身分）、nosniff、Referrer-Policy，
        // 這裡不能再疊一層本站的 CSP，否則會擋掉說明書裡的外部圖片與腳本。其餘標頭照常。
        source: '/m/:slug/f/:id',
        headers: [
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ]
  },
}
export default nextConfig
