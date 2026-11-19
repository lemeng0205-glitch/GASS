// ================================================
// v0.5.0 | 2026-11-19 | 國家清單改存資料庫；manualUrl 由呼叫端傳入語言順序；REGIONS 變成備用／初始資料
// v0.4.0 | 2026-11-18 | 各國頁面 /country/<代碼>；說明書連結帶 country 與語言偏好（COUNTRY_LANGS）
// v0.3.0 | 2026-11-18 | 說明書連結改指本站自己的 /m/（媒體庫已搬到本站資料庫），不再經過 ERP 網址
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

// 語言判斷已集中到 lib/lang.ts（middleware 計算）；頁面用 lib/serverLang.ts 的 getLang()

/**
 * 說明書所在位置：本站自己的 /m/<編號>（媒體庫已從 ERP 搬到本站的資料庫，2026-11-18 切換）。
 * 用相對路徑，所以日後換網域不用改這裡。
 */
export const MEDIA_BASE = ''
/**
 * 目前地圖上已有的 9 個海外國家的說明書語言（依優先順序；找不到時再退回英文）。
 * 這只是「資料庫讀不到時的備用清單」與初始資料；正式的國家清單與語言存在資料庫，專員在 ERP「國家管理」維護。
 */
export const COUNTRY_LANGS: Record<string, string[]> = {
  jp: ['ja', 'en'], kr: ['ko', 'en'], de: ['de', 'en'], fr: ['fr', 'en'],
  ca: ['en', 'fr'], us: ['en'], gb: ['en'], au: ['en'], sg: ['en'],
}

/**
 * 某國頁面上的說明書連結：交給 /m/ 依國家與語言挑文件（有專屬該國的優先，否則用「全部海外」版）。
 * langs = 該國的語言偏好順序（由資料庫的國家清單提供）。
 */
export const manualUrl = (slug: string, country: string, langs: string[], lang?: string) =>
  `${MEDIA_BASE}/m/${slug}?country=${encodeURIComponent(country)}&lang=${encodeURIComponent(lang ?? (langs.length ? langs : ['en']).join(','))}`

/** 兩條軌道：台灣（自建、中文說明書）／海外（英文說明書，所有海外地區同一套） */
export type Track = 'tw' | 'intl'

export interface PortalRegion {
  code: string
  name: L10n
  lon: number
  lat: number
  href: string | null    // null = 地圖上只顯示、不可點
  track: Track
  hoverLabel?: true      // 地點太密集時，標籤只在滑過時顯示（避免文字互相蓋住）
  labelSide?: 'top' | 'bottom' | 'left' | 'right'   // 標籤放在圓點的哪一側，預設上方
  mobileHide?: true      // 手機上地圖太小、點會擠在一起：這個點只在桌面版顯示（下方國家按鈕不受影響）
}

// 地圖上的釘點：台灣進台灣頁；其他地點各進自己的國家頁 /country/<代碼>（顯示專員指定給該國的說明書）。
// 只標示有銷售或客服管道的地區（標得越多，消費者越會當成「這裡有保固」）。
export const REGIONS: PortalRegion[] = [
  { code: 'tw', name: { zh: '台灣', en: 'Taiwan' },        lon: 121,  lat: 23.7, href: '/tw', track: 'tw',   labelSide: 'left' },
  { code: 'jp', name: { zh: '日本', en: 'Japan' },         lon: 139,  lat: 36,   href: '/country/jp', track: 'intl', labelSide: 'right' },
  { code: 'kr', name: { zh: '韓國', en: 'South Korea' },   lon: 127.5, lat: 37,  href: '/country/kr', track: 'intl', labelSide: 'top', hoverLabel: true, mobileHide: true },
  { code: 'sg', name: { zh: '新加坡', en: 'Singapore' },   lon: 104,  lat: 1.3,  href: '/country/sg', track: 'intl', labelSide: 'bottom' },
  { code: 'au', name: { zh: '澳洲', en: 'Australia' },     lon: 134,  lat: -25,  href: '/country/au', track: 'intl', labelSide: 'bottom' },
  { code: 'us', name: { zh: '美國', en: 'United States' }, lon: -98,  lat: 39,   href: '/country/us', track: 'intl', labelSide: 'bottom' },
  { code: 'ca', name: { zh: '加拿大', en: 'Canada' },      lon: -106, lat: 56,   href: '/country/ca', track: 'intl', labelSide: 'top', mobileHide: true },
  { code: 'gb', name: { zh: '英國', en: 'United Kingdom' }, lon: -2,   lat: 54,   href: '/country/gb', track: 'intl', labelSide: 'top' },
  { code: 'de', name: { zh: '德國', en: 'Germany' },       lon: 10.5, lat: 51,   href: '/country/de', track: 'intl', labelSide: 'right', hoverLabel: true, mobileHide: true },
  { code: 'fr', name: { zh: '法國', en: 'France' },        lon: 2.5,  lat: 46.5, href: '/country/fr', track: 'intl', labelSide: 'bottom', hoverLabel: true, mobileHide: true },
]

/** 首頁下方國家按鈕的最後一顆：沒列出的國家，顯示「全部海外」通用的說明書 */
export const OTHER_REGION: { name: L10n; href: string } = {
  name: { zh: '其他', en: 'Other' },
  href: '/country/intl',
}

export const COPY = {
  brand:      { zh: 'eiP 全球服務中心', en: 'eiP Global Service Center' },
  heroTitle:  { zh: '在世界任何地方，都安心使用', en: 'Peace of mind, wherever you are' },
  heroSub:    { zh: '選擇您的所在地區，取得產品說明書、保固登錄與售後服務。', en: 'Choose your region for manuals, warranty registration and support.' },
  pickRegion: { zh: '選擇地區', en: 'Choose your region' },
  overseas:   { zh: '海外', en: 'International' },
  comingSoon: { zh: '即將推出', en: 'Coming soon' },
  manuals:    { zh: '產品說明書', en: 'Product manuals' },
  openManual: { zh: '使用說明書', en: 'Manual' },
  backGlobal: { zh: '← 返回首頁', en: '← Back to home' },
  twTitle:    { zh: '台灣售後服務中心', en: 'Taiwan Service Center' },
  twSub:      { zh: '說明書、保固登錄與常用資源都在這裡。', en: 'Manuals, warranty registration and resources.' },
  usTitle:    { zh: '海外售後服務中心', en: 'International Service Center' },
  usSub:      { zh: '說明書、保固登錄與常見問題。', en: 'Manuals, warranty registration and FAQ.' },
  countrySuffix: { zh: '服務中心', en: 'Service Center' },
  otherGroup: { zh: '其他', en: 'Other' },
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
    desc: { zh: '常見問題與解答', en: 'Frequently asked questions' }, href: 'https://eipstore.com/blogs/guide-2026' },
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
  { slug: 'eip-pencil-2',      name: 'eiP Pencil 2',                     line: 'stylus',   markets: ['us'] },
  { slug: 'usi2-pro',          name: 'eiP USI 2.0 Pro',                  line: 'stylus',   markets: ['us'] },
  { slug: 'usi2-ultra',        name: 'eiP USI 2.0 Ultra',                line: 'stylus',   markets: ['us'] },
  { slug: 'penoval-usi2',      name: 'Penoval USI 2.0',                  line: 'stylus',   markets: ['us'] },
  { slug: 'penoval-usi2-lite', name: 'Penoval USI 2.0 Lite',             line: 'stylus',   markets: ['us'] },
  { slug: 'magnetix-pixel',    name: 'eiP Magnetix Keyboard Case (Pixel Tablet)', line: 'keyboard', markets: ['us'] },
]
