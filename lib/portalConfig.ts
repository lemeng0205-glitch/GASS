// ================================================
// v0.2.0 | 2026-11-05 | 新增 Market（台灣／海外）與英文說明書產品；Pencil 2 與 Pencil 2 Halo 分開
// v0.1.0 | 2026-11-04 | 獨立網站設定（從 ERP 草稿 feature/portal v0.2.0 搬出）
// ------------------------------------------------
// Changelog:
//   v0.1.0 (2026-11-04) - 脫離 ERP：移除資料庫讀取；說明書一律連到 ERP 媒體庫的公開連結 /m/<編號>
//                         新增美國／海外頁、一鍵複製訂單資訊
//
// 本網站不含資料庫、不含任何 ERP 金鑰。所有連結都是公開網址。
// ⚠ 保固登錄頁目前仍在 WordPress（eipstore.online），WordPress 預計 2027/1 底關閉，
//   關站前需改連新頁面（改下方 WARRANTY_TW / WARRANTY_GLOBAL 即可）。
// ================================================

export type PortalLang = 'zh' | 'en'
export type L10n = Record<PortalLang, string>

/** 網址 ?lang=zh|en 優先；沒帶時用該頁預設（台灣頁中文、海外頁英文） */
export const pickLang = (v: string | string[] | undefined, fallback: PortalLang = 'zh'): PortalLang =>
  v === 'en' ? 'en' : v === 'zh' ? 'zh' : fallback

/** 說明書所在位置（ERP 媒體庫的公開連結；若日後換網域，只改這一行） */
export const MEDIA_BASE = 'https://lemeng-erp.vercel.app'
export const manualUrl = (slug: string) => `${MEDIA_BASE}/m/${slug}`

/** 兩條軌道：台灣（自建、中文說明書）／海外（英文說明書，所有海外地區同一套） */
export type Track = 'tw' | 'intl'

export interface PortalRegion {
  code: string
  name: L10n
  lon: number
  lat: number
  href: string | null    // null = 地圖上只顯示、不可點
  track: Track
}

// 地圖上的釘點：台灣進台灣頁；其他地點全部進同一個海外頁。
// 只標示有銷售或客服管道的地區（標得越多，消費者越會當成「這裡有保固」）。
export const REGIONS: PortalRegion[] = [
  { code: 'tw', name: { zh: '台灣', en: 'Taiwan' },        lon: 121,  lat: 23.7, href: '/tw', track: 'tw' },
  { code: 'jp', name: { zh: '日本', en: 'Japan' },         lon: 138,  lat: 36,   href: '/us', track: 'intl' },
  { code: 'na', name: { zh: '北美', en: 'North America' }, lon: -100, lat: 40,   href: '/us', track: 'intl' },
  { code: 'eu', name: { zh: '歐洲', en: 'Europe' },        lon: 10,   lat: 50,   href: '/us', track: 'intl' },
  { code: 'au', name: { zh: '澳洲', en: 'Australia' },     lon: 134,  lat: -25,  href: '/us', track: 'intl' },
]

/** 首頁下方兩個大按鈕 */
export const TRACKS: Array<{ key: Track; name: L10n; href: string }> = [
  { key: 'tw',   name: { zh: '台灣', en: 'Taiwan' },          href: '/tw' },
  { key: 'intl', name: { zh: '海外', en: 'International' },  href: '/us' },
]

export const COPY = {
  brand:      { zh: 'eiP 全球售後服務', en: 'eiP Global Service' },
  heroTitle:  { zh: '在世界任何地方，都安心使用', en: 'Peace of mind, wherever you are' },
  heroSub:    { zh: '選擇您的所在地區，取得產品說明書、保固登錄與售後服務。', en: 'Choose your region for manuals, warranty registration and support.' },
  pickRegion: { zh: '選擇地區', en: 'Choose your region' },
  comingSoon: { zh: '即將推出', en: 'Coming soon' },
  manuals:    { zh: '產品說明書', en: 'Product manuals' },
  openManual: { zh: '使用說明書', en: 'Manual' },
  backGlobal: { zh: '← 返回首頁', en: '← Back to home' },
  twTitle:    { zh: '台灣售後服務中心', en: 'Taiwan Service Center' },
  twSub:      { zh: '說明書、保固登錄與常用資源都在這裡。', en: 'Manuals, warranty registration and resources.' },
  usTitle:    { zh: '海外售後服務中心', en: 'International Service Center' },
  usSub:      { zh: '說明書、保固登錄與常見問題。', en: 'Manuals, warranty registration and FAQ.' },
} satisfies Record<string, L10n>

export const COPY_ORDER = {
  title:     { zh: '聯絡客服前：一鍵複製訂單資訊', en: 'Before contacting support: copy your order info' },
  sub:       { zh: '填好後按複製，再貼給客服，可以加快處理。這些資料只留在您的瀏覽器，不會上傳。',
               en: 'Fill in, copy, and paste it to our support team to speed things up. Nothing is uploaded; it stays in your browser.' },
  orderNo:   { zh: '訂單編號', en: 'Order number' },
  orderDate: { zh: '訂單日期', en: 'Order date' },
  item:      { zh: '品項', en: 'Product' },
  pick:      { zh: '請選擇品項', en: 'Select a product' },
  copy:      { zh: '複製訂單資訊', en: 'Copy order info' },
  copied:    { zh: '已複製 ✓', en: 'Copied ✓' },
  manual:    { zh: '無法自動複製，請手動選取上方文字複製。', en: 'Could not copy automatically. Please select the text above and copy it.' },
} satisfies Record<string, L10n>

export interface QuickLink { key: string; label: L10n; desc: L10n; href: string }

export const WARRANTY_TW = 'https://eipstore.online/2025%e4%bf%9d%e5%9b%ba%e9%a0%81/'
export const WARRANTY_GLOBAL = 'https://eipstore.online/warranty_registration_global'

export const TW_LINKS: QuickLink[] = [
  { key: 'warranty',  label: { zh: '保固登錄', en: 'Warranty registration' },
    desc: { zh: '登錄您的產品以享保固服務', en: 'Register your product' }, href: WARRANTY_TW },
  { key: 'manuals',   label: { zh: '產品說明書', en: 'Product manuals' },
    desc: { zh: '鍵盤保護殼、觸控筆說明書', en: 'Keyboard cases & styluses' }, href: '#manuals' },
  { key: 'templates', label: { zh: '電子模板', en: 'Digital templates' },
    desc: { zh: '下載筆記與繪圖模板', en: 'Download templates' },
    href: 'https://drive.google.com/drive/folders/1JN4Xs6zi2_UPslaKUG1EZeAZMq-cewsi' },
  { key: 'community', label: { zh: 'Facebook 私密社團', en: 'Facebook community' },
    desc: { zh: '使用技巧與玩家交流', en: 'Tips & community' }, href: 'https://eipstore.net/penlemengvip' },
]

export const US_LINKS: QuickLink[] = [
  { key: 'warranty', label: { zh: '保固登錄', en: 'Warranty registration' },
    desc: { zh: '登錄您的產品以享保固服務', en: 'Register your product' }, href: WARRANTY_GLOBAL },
  { key: 'manuals',  label: { zh: '產品說明書', en: 'Product manuals' },
    desc: { zh: '鍵盤保護殼、觸控筆說明書', en: 'Keyboard cases & styluses' }, href: '#manuals' },
  { key: 'faq',      label: { zh: '常見問題', en: 'FAQ' },
    desc: { zh: '常見問題與解答', en: 'Frequently asked questions' }, href: 'https://www.penoval.com/en/blogs/faq' },
]

export type ProductLine = 'keyboard' | 'stylus'
export const PRODUCT_LINES: Array<{ key: ProductLine; label: L10n }> = [
  { key: 'stylus',   label: { zh: '觸控筆', en: 'Styluses' } },
  { key: 'keyboard', label: { zh: '鍵盤保護殼', en: 'Keyboard cases' } },
]

/** tw = 台灣頁（中文說明書）；us = 海外頁（英文說明書） */
export type Market = 'tw' | 'us'

export interface PortalProduct {
  slug: string; name: string; nameEn?: string; line: ProductLine
  markets: Market[]
  noImage?: true   // public/portal/products/<slug>.png 尚未提供時填 true
}

// slug = 媒體庫連結編號（同一編號下以語言區分：zh-TW／en）；圖片 = public/portal/products/<slug>.png
// 海外頁的說明書是英文版 PDF，原檔直接上傳，不改文字與圖片。
export const PRODUCTS: PortalProduct[] = [
  { slug: 'eip-pencil-2-halo', name: 'eiP Pencil 2 Halo',                line: 'stylus',   markets: ['tw'] },
  { slug: 'pencil-x-classic',  name: 'eiP Pencil X Classic（鉛筆款）',    line: 'stylus', markets: ['tw'] },
  { slug: 'pencil-x',          name: 'eiP Pencil X',                     line: 'stylus',   markets: ['tw', 'us'] },
  { slug: 'pencil-pro',        name: 'eiP Pencil Pro',                   line: 'stylus',   markets: ['tw'] },
  { slug: 'pencil',            name: 'eiP Pencil',                       line: 'stylus',   markets: ['tw'] },
  { slug: 'mpp-stylus-pro',    name: 'eiP MPP Stylus Pro',               line: 'stylus',   markets: ['tw'] },
  { slug: 's2',                name: 'eiP S2',                           line: 'stylus',   markets: ['tw'] },
  { slug: 'hyperkeys',         name: 'HyperKeys 智定義鍵盤',              nameEn: 'eiP HyperKeys Keyboard Case', line: 'keyboard', markets: ['tw', 'us'] },
  { slug: 'magnetix-2',        name: 'Magnetix 2 鍵盤保護殼',             nameEn: 'eiP Magnetix Keyboard Case (iPad)', line: 'keyboard', markets: ['tw', 'us'] },
  { slug: 'magnetix-quick',    name: 'Magnetix 鍵盤保護殼（快捷版）',      line: 'keyboard', markets: ['tw'] },
  { slug: 'maglite-2',         name: 'Maglite 2 鍵盤保護殼',              line: 'keyboard', markets: ['tw'] },
  { slug: 'maglite-2-hp',      name: 'Maglite 2 劫盜地圖 哈利波特聯名款',  line: 'keyboard', markets: ['tw'] },
  // 海外獨有（只有英文版說明書）
  { slug: 'eip-pencil-2',      name: 'eiP Pencil 2',                     line: 'stylus',   markets: ['us'], noImage: true },
  { slug: 'usi2-pro',          name: 'eiP USI 2.0 Pro',                  line: 'stylus',   markets: ['us'], noImage: true },
  { slug: 'usi2-ultra',        name: 'eiP USI 2.0 Ultra',                line: 'stylus',   markets: ['us'], noImage: true },
  { slug: 'penoval-usi2',      name: 'Penoval USI 2.0',                  line: 'stylus',   markets: ['us'], noImage: true },
  { slug: 'penoval-usi2-lite', name: 'Penoval USI 2.0 Lite',             line: 'stylus',   markets: ['us'], noImage: true },
  { slug: 'magnetix-pixel',    name: 'eiP Magnetix Keyboard Case (Pixel Tablet)', line: 'keyboard', markets: ['us'], noImage: true },
]
