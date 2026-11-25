// v0.1.0 | 2026-11-25 | 全球保固頁（海外）的選單清單：國家、通路、產品。前後端共用（伺服器端也用它檢查送來的值）
// 依《全球保固頁_規格》第 5 節（業務 2026-11-23～25 提供）。
// 國家：業務的實際販售範圍 14 國。其中 pl、sg、se 不在 warranty_countries（首頁地圖資料）裡，
//   所以這裡另外維護，不影響地圖。日後若補進地圖，可改由資料庫供應。
// 產品：暫時寫在這裡；日後改由資料表供應，讓業務自己維護。

export const GW_COUNTRIES: { code: string; name: string }[] = [
  { code: 'au', name: 'Australia' }, { code: 'be', name: 'Belgium' }, { code: 'ca', name: 'Canada' },
  { code: 'fr', name: 'France' }, { code: 'de', name: 'Germany' }, { code: 'jp', name: 'Japan' },
  { code: 'mx', name: 'Mexico' }, { code: 'nl', name: 'Netherlands' }, { code: 'pl', name: 'Poland' },
  { code: 'sg', name: 'Singapore' }, { code: 'es', name: 'Spain' }, { code: 'se', name: 'Sweden' },
  { code: 'gb', name: 'United Kingdom' }, { code: 'us', name: 'United States' },
]

export const GW_CHANNELS = ['Amazon', 'eBay', 'Newegg', 'eiP Official Store', 'Others']

export const GW_PRODUCTS: { category: string; name: string }[] = [
  { category: 'Stylus', name: 'eiP Pencil 2' },
  { category: 'Stylus', name: 'eiP Pencil X' },
  { category: 'Stylus', name: 'eiP Pencil X Classic' },
  { category: 'Stylus', name: 'eiP USI 2.0 Ultra' },
  { category: 'Stylus', name: 'Penoval USI 2.0' },
  { category: 'Stylus', name: 'Penoval USI 2.0 Lite' },
  { category: 'Keyboard', name: 'eiP HyperKeys Keyboard' },
  { category: 'Keyboard', name: 'eiP Magnetix Keyboard (iPad)' },
  { category: 'Keyboard', name: 'eiP Magnetix Keyboard (Pixel Tablet)' },
  { category: 'Keyboard', name: 'eiP Magnetix Keyboard Lite' },
]
