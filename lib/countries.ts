// v0.1.0 | 2026-11-18 | 說明書「顯示國家」：可選的國家清單與挑選規則（單一來源，ERP 的選單也向這裡取）
import { REGIONS, type L10n } from './portalConfig'

export const TW = 'tw'
export const INTL = 'intl'   // 全部海外（預設）

export interface CountryOption { code: string; name: L10n }

/** 專員可選的國家：台灣、全部海外，再加上地圖上的各國（新增國家：在 portalConfig 的 REGIONS 加一筆） */
export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: TW, name: { zh: '台灣', en: 'Taiwan' } },
  { code: INTL, name: { zh: '全部海外', en: 'All overseas' } },
  ...REGIONS.filter(r => r.track === 'intl').map(r => ({ code: r.code, name: r.name })),
]
const CODES = new Set(COUNTRY_OPTIONS.map(c => c.code))
export const isCountryCode = (c: unknown): c is string => typeof c === 'string' && CODES.has(c)
/** 有自己頁面的國家（/country/<代碼>）：地圖上的海外各國 + 全部海外 */
export const isCountryPage = (c: string) => c !== TW && CODES.has(c)
export const countryName = (c: string) => COUNTRY_OPTIONS.find(x => x.code === c)?.name

/** 整理專員送來的國家：去重、驗證；不合法回 null（空陣列也算不合法） */
export function normalizeCountries(v: unknown): string[] | null {
  if (!Array.isArray(v) || v.length === 0 || v.length > 20) return null
  const out = [...new Set(v.map(x => (typeof x === 'string' ? x.trim().toLowerCase() : '')))]
  return out.every(isCountryCode) ? out : null
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
 * 哪一份當主要版本，由呼叫端依該國的語言順序（COUNTRY_LANGS）決定。
 * 註：同一產品同一語言只能有一份文件（資料庫唯一限制），所以「同語言、不同國家內容不同」目前不支援。
 */
export function docsForCountry<T extends { lang: string; countries?: string[] | null }>(docs: T[], country: string): T[] {
  const specific = docs.filter(d => effectiveCountries(d).includes(country))
  if (country === TW || country === INTL) return specific
  const covered = new Set(specific.map(d => d.lang))
  return [...specific, ...docs.filter(d => !covered.has(d.lang) && !specific.includes(d) && effectiveCountries(d).includes(INTL))]
}
