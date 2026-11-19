// v0.1.0 | 2026-11-19 | 內建的全球常用國家資料：專員在 ERP 的「國家管理」從這裡挑選新增
// 座標為首都或市場中心的概略位置（只用來在點陣地圖上放釘點，不是精確定位）；
// langs = 該國預設的說明書語言（依優先順序；找不到時再退回英文），專員可在「國家管理」調整。
// 清單裡沒有的國家：在這裡加一筆、推上去即可（程式碼不用改別處）。
export interface WorldCountry { zh: string; en: string; lon: number; lat: number; langs: string[] }

export const WORLD_COUNTRIES: Record<string, WorldCountry> = {
  // 東亞
  hk: { zh: '香港', en: 'Hong Kong', lon: 114.2, lat: 22.3, langs: ['zh-TW', 'en'] },
  mo: { zh: '澳門', en: 'Macao', lon: 113.5, lat: 22.2, langs: ['zh-TW', 'en'] },
  cn: { zh: '中國大陸', en: 'Mainland China', lon: 104, lat: 35, langs: ['zh-CN', 'en'] },
  jp: { zh: '日本', en: 'Japan', lon: 139, lat: 36, langs: ['ja', 'en'] },
  kr: { zh: '韓國', en: 'South Korea', lon: 127.5, lat: 37, langs: ['ko', 'en'] },
  mn: { zh: '蒙古', en: 'Mongolia', lon: 106.9, lat: 47.9, langs: ['en'] },
  // 東南亞
  sg: { zh: '新加坡', en: 'Singapore', lon: 104, lat: 1.3, langs: ['en'] },
  my: { zh: '馬來西亞', en: 'Malaysia', lon: 101.7, lat: 3.1, langs: ['en', 'ms'] },
  th: { zh: '泰國', en: 'Thailand', lon: 100.5, lat: 13.8, langs: ['th', 'en'] },
  vn: { zh: '越南', en: 'Vietnam', lon: 105.8, lat: 21, langs: ['vi', 'en'] },
  id: { zh: '印尼', en: 'Indonesia', lon: 106.8, lat: -6.2, langs: ['id', 'en'] },
  ph: { zh: '菲律賓', en: 'Philippines', lon: 121, lat: 14.6, langs: ['en'] },
  kh: { zh: '柬埔寨', en: 'Cambodia', lon: 104.9, lat: 11.5, langs: ['en'] },
  mm: { zh: '緬甸', en: 'Myanmar', lon: 96.1, lat: 19.8, langs: ['en'] },
  la: { zh: '寮國', en: 'Laos', lon: 102.6, lat: 18, langs: ['en'] },
  // 南亞、中亞
  in: { zh: '印度', en: 'India', lon: 77.2, lat: 28.6, langs: ['en'] },
  pk: { zh: '巴基斯坦', en: 'Pakistan', lon: 73, lat: 33.7, langs: ['en'] },
  bd: { zh: '孟加拉', en: 'Bangladesh', lon: 90.4, lat: 23.8, langs: ['en'] },
  lk: { zh: '斯里蘭卡', en: 'Sri Lanka', lon: 79.9, lat: 6.9, langs: ['en'] },
  np: { zh: '尼泊爾', en: 'Nepal', lon: 85.3, lat: 27.7, langs: ['en'] },
  kz: { zh: '哈薩克', en: 'Kazakhstan', lon: 71.4, lat: 51.2, langs: ['ru', 'en'] },
  // 中東
  ae: { zh: '阿拉伯聯合大公國', en: 'United Arab Emirates', lon: 54.4, lat: 24.5, langs: ['ar', 'en'] },
  sa: { zh: '沙烏地阿拉伯', en: 'Saudi Arabia', lon: 46.7, lat: 24.7, langs: ['ar', 'en'] },
  qa: { zh: '卡達', en: 'Qatar', lon: 51.5, lat: 25.3, langs: ['ar', 'en'] },
  kw: { zh: '科威特', en: 'Kuwait', lon: 48, lat: 29.4, langs: ['ar', 'en'] },
  jo: { zh: '約旦', en: 'Jordan', lon: 35.9, lat: 31.9, langs: ['ar', 'en'] },
  il: { zh: '以色列', en: 'Israel', lon: 35.2, lat: 31.8, langs: ['en'] },
  tr: { zh: '土耳其', en: 'Türkiye', lon: 32.9, lat: 39.9, langs: ['tr', 'en'] },
  // 大洋洲
  au: { zh: '澳洲', en: 'Australia', lon: 134, lat: -25, langs: ['en'] },
  nz: { zh: '紐西蘭', en: 'New Zealand', lon: 174.8, lat: -41.3, langs: ['en'] },
  // 歐洲
  gb: { zh: '英國', en: 'United Kingdom', lon: -2, lat: 54, langs: ['en'] },
  ie: { zh: '愛爾蘭', en: 'Ireland', lon: -6.3, lat: 53.3, langs: ['en'] },
  de: { zh: '德國', en: 'Germany', lon: 10.5, lat: 51, langs: ['de', 'en'] },
  fr: { zh: '法國', en: 'France', lon: 2.5, lat: 46.5, langs: ['fr', 'en'] },
  es: { zh: '西班牙', en: 'Spain', lon: -3.7, lat: 40.4, langs: ['es', 'en'] },
  pt: { zh: '葡萄牙', en: 'Portugal', lon: -9.1, lat: 38.7, langs: ['pt', 'en'] },
  it: { zh: '義大利', en: 'Italy', lon: 12.5, lat: 41.9, langs: ['it', 'en'] },
  nl: { zh: '荷蘭', en: 'Netherlands', lon: 4.9, lat: 52.4, langs: ['nl', 'en'] },
  be: { zh: '比利時', en: 'Belgium', lon: 4.4, lat: 50.8, langs: ['fr', 'nl', 'en'] },
  ch: { zh: '瑞士', en: 'Switzerland', lon: 7.4, lat: 46.9, langs: ['de', 'fr', 'en'] },
  at: { zh: '奧地利', en: 'Austria', lon: 16.4, lat: 48.2, langs: ['de', 'en'] },
  se: { zh: '瑞典', en: 'Sweden', lon: 18.1, lat: 59.3, langs: ['en'] },
  no: { zh: '挪威', en: 'Norway', lon: 10.7, lat: 59.9, langs: ['en'] },
  dk: { zh: '丹麥', en: 'Denmark', lon: 12.6, lat: 55.7, langs: ['en'] },
  fi: { zh: '芬蘭', en: 'Finland', lon: 25, lat: 60.2, langs: ['en'] },
  pl: { zh: '波蘭', en: 'Poland', lon: 21, lat: 52.2, langs: ['pl', 'en'] },
  cz: { zh: '捷克', en: 'Czechia', lon: 14.4, lat: 50.1, langs: ['en'] },
  hu: { zh: '匈牙利', en: 'Hungary', lon: 19, lat: 47.5, langs: ['en'] },
  ro: { zh: '羅馬尼亞', en: 'Romania', lon: 26.1, lat: 44.4, langs: ['en'] },
  gr: { zh: '希臘', en: 'Greece', lon: 23.7, lat: 38, langs: ['en'] },
  ua: { zh: '烏克蘭', en: 'Ukraine', lon: 30.5, lat: 50.5, langs: ['en'] },
  ru: { zh: '俄羅斯', en: 'Russia', lon: 37.6, lat: 55.8, langs: ['ru', 'en'] },
  // 美洲
  us: { zh: '美國', en: 'United States', lon: -98, lat: 39, langs: ['en'] },
  ca: { zh: '加拿大', en: 'Canada', lon: -106, lat: 56, langs: ['en', 'fr'] },
  mx: { zh: '墨西哥', en: 'Mexico', lon: -99.1, lat: 19.4, langs: ['es', 'en'] },
  br: { zh: '巴西', en: 'Brazil', lon: -47.9, lat: -15.8, langs: ['pt', 'en'] },
  ar: { zh: '阿根廷', en: 'Argentina', lon: -58.4, lat: -34.6, langs: ['es', 'en'] },
  cl: { zh: '智利', en: 'Chile', lon: -70.7, lat: -33.4, langs: ['es', 'en'] },
  co: { zh: '哥倫比亞', en: 'Colombia', lon: -74.1, lat: 4.7, langs: ['es', 'en'] },
  pe: { zh: '秘魯', en: 'Peru', lon: -77, lat: -12, langs: ['es', 'en'] },
  // 非洲
  za: { zh: '南非', en: 'South Africa', lon: 28, lat: -26.2, langs: ['en'] },
  eg: { zh: '埃及', en: 'Egypt', lon: 31.2, lat: 30, langs: ['ar', 'en'] },
  ng: { zh: '奈及利亞', en: 'Nigeria', lon: 3.4, lat: 6.5, langs: ['en'] },
  ke: { zh: '肯亞', en: 'Kenya', lon: 36.8, lat: -1.3, langs: ['en'] },
  ma: { zh: '摩洛哥', en: 'Morocco', lon: -6.8, lat: 34, langs: ['fr', 'ar', 'en'] },
}
export const isWorldCountry = (c: string) => Object.prototype.hasOwnProperty.call(WORLD_COUNTRIES, c)
