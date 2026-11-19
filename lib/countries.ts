// v0.2.0 | 2026-11-19 | 國家清單改由資料庫提供（專員在 ERP「國家管理」新增／停用）；這裡只放不依賴資料庫的規則
// v0.1.1 | 2026-11-19 | 國家選項附主要語言（lang）
// v0.1.0 | 2026-11-18 | 說明書「顯示國家」：可選的國家清單與挑選規則
import type { L10n } from './portalConfig'

export const TW = 'tw'       // 台灣（內建）
export const INTL = 'intl'   // 全部海外（內建，預設）

/** 資料庫裡的一個海外國家（warranty_countries 的一列，轉成程式用的格式） */
export interface Country {
  code: string; nameZh: string; nameEn: string; lon: number; lat: number
  langs: string[]; enabled: boolean
  labelSide: 'top' | 'bottom' | 'left' | 'right'; hoverLabel: boolean; mobileHide: boolean; sort: number
}

/** 專員可選的「顯示國家」。lang = 該國主要語言（ERP 上傳表單用來自動帶入語言） */
export interface CountryOption { code: string; name: L10n; lang: string }

export function countryOptionsFrom(list: Country[]): CountryOption[] {
  return [
    { code: TW, name: { zh: '台灣', en: 'Taiwan' }, lang: 'zh-TW' },
    { code: INTL, name: { zh: '全部海外', en: 'All overseas' }, lang: 'en' },
    ...list.filter(c => c.enabled).map(c => ({ code: c.code, name: { zh: c.nameZh, en: c.nameEn }, lang: c.langs[0] ?? 'en' })),
  ]
}

/** 合法的國家代碼集合：台灣、全部海外，加上清單內（可選擇是否含已停用）的國家 */
export const allowedCodes = (list: Country[], includeDisabled = false): Set<string> =>
  new Set([TW, INTL, ...list.filter(c => includeDisabled || c.enabled).map(c => c.code)])

export const isCountryCode = (c: unknown, allowed: Set<string>): c is string => typeof c === 'string' && allowed.has(c)

/** 有自己頁面的國家（/country/<代碼>）：清單內啟用中的海外國家 + 全部海外 */
export const isCountryPage = (code: string, list: Country[]): boolean =>
  code === INTL || list.some(c => c.enabled && c.code === code)

export function countryName(code: string, list: Country[]): L10n | undefined {
  if (code === TW) return { zh: '台灣', en: 'Taiwan' }
  if (code === INTL) return { zh: '全部海外', en: 'All overseas' }
  const c = list.find(x => x.code === code)
  return c ? { zh: c.nameZh, en: c.nameEn } : undefined
}

/** 某國的說明書語言偏好順序（找不到時由 /m/ 再退回英文） */
export function countryLangsOf(code: string, list: Country[]): string[] {
  if (code === TW) return ['zh-TW']
  if (code === INTL) return ['en']
  return list.find(c => c.code === code)?.langs ?? ['en']
}

/** 整理專員送來的國家：去重、驗證；不合法回 null（空陣列也算不合法） */
export function normalizeCountries(v: unknown, allowed: Set<string>): string[] | null {
  if (!Array.isArray(v) || v.length === 0 || v.length > 20) return null
  const out = [...new Set(v.map(x => (typeof x === 'string' ? x.trim().toLowerCase() : '')))]
  return out.every(c => allowed.has(c)) ? out : null
}

/** 沒指定國家時的預設：繁中 = 台灣，其他 = 全部海外 */
export const inferCountries = (lang: string): string[] => (lang === 'zh-TW' ? [TW] : [INTL])

/** 文件實際生效的國家（舊資料沒有設定時，依語言推定） */
export const effectiveCountries = (d: { lang: string; countries?: string[] | null }): string[] =>
  d.countries && d.countries.length ? d.countries : inferCountries(d.lang)

/**
 * 某國要顯示同一產品的哪些文件：
 *   1. 明確指定這個國家的文件（例如日本專屬的日文版）
 *   2. 加上「全部海外」的文件中，語言還沒被第 1 項涵蓋的（例如通用英文版）→ 成為可切換的其他語言
 *   3. 台灣不套用「全部海外」；兩者都沒有 → 空陣列（該國不顯示這個產品）
 * 哪一份當主要版本，由呼叫端依該國的語言順序決定。
 * 註：同一產品同一語言只能有一份文件（資料庫唯一限制），所以「同語言、不同國家內容不同」目前不支援。
 */
export function docsForCountry<T extends { lang: string; countries?: string[] | null }>(docs: T[], country: string): T[] {
  const specific = docs.filter(d => effectiveCountries(d).includes(country))
  if (country === TW || country === INTL) return specific
  const covered = new Set(specific.map(d => d.lang))
  return [...specific, ...docs.filter(d => !covered.has(d.lang) && !specific.includes(d) && effectiveCountries(d).includes(INTL))]
}
