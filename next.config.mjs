// v0.2.0 | 2026-11-18 | /m/<編號>/f/<id>（說明書檔案）不疊本站 CSP，由該路由自己加隔離標頭
// v0.1.0 | 2026-11-04 | 安全標頭（僅正式環境；開發模式 Next 需要 eval）
const isProd = process.env.NODE_ENV === 'production'

const csp = [
  "default-src 'self'",
  "img-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    if (!isProd) return []
    return [
      {
        // 一般頁面：完整的安全標頭。說明書檔案路徑 /m/<編號>/f/<id> 除外（見下一條）
        source: '/((?!m/[^/]+/f/).*)',
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
