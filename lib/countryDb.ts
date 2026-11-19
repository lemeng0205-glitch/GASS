// v0.1.0 | 2026-11-19 | 國家清單的資料存取（warranty_countries）與「國家管理」的新增／停用／刪除
// 讀取失敗（例如資料表還沒建立）時，自動改用內建的 9 個國家，網站不會因此壞掉。
// 只能在伺服器端使用。放進網址的值都先驗證格式。
import 'server-only'
import { COUNTRY_LANGS, REGIONS, type PortalRegion } from './portalConfig'
import { rest } from './supabaseRest'
import { WORLD_COUNTRIES, isWorldCountry } from './worldCountries'
import { isKnownLang } from './languageDb'
import type { Country } from './countries'

const TABLE = 'warranty_countries'
const CODE_RE = /^[a-z]{2}$/

interface Row {
  code: string; name_zh: string; name_en: string; lon: number | string; lat: number | string
  langs: string[]; enabled: boolean; label_side: Country['labelSide']; hover_label: boolean
  mobile_hide: boolean; sort: number
}
const fromRow = (r: Row): Country => ({
  code: r.code, nameZh: r.name_zh, nameEn: r.name_en, lon: Number(r.lon), lat: Number(r.lat),
  langs: r.langs?.length ? r.langs : ['en'], enabled: r.enabled,
  labelSide: r.label_side ?? 'top', hoverLabel: r.hover_label, mobileHide: r.mobile_hide, sort: r.sort,
})

/** 備用清單：目前地圖上原有的 9 個海外國家（資料庫讀不到時使用） */
export const SEED_COUNTRIES: Country[] = REGIONS.filter(r => r.track === 'intl').map((r, i) => ({
  code: r.code, nameZh: r.name.zh, nameEn: r.name.en, lon: r.lon, lat: r.lat,
  langs: COUNTRY_LANGS[r.code] ?? ['en'], enabled: true,
  labelSide: r.labelSide ?? 'top', hoverLabel: !!r.hoverLabel, mobileHide: !!r.mobileHide, sort: (i + 1) * 10,
}))

/** 全部國家（含已停用），依 sort；讀取失敗回備用清單 */
export async function getAllCountries(): Promise<Country[]> {
  try {
    const r = await rest<Row[]>(`${TABLE}?select=*&order=sort.asc,code.asc`)
    if (r.ok && Array.isArray(r.data)) return r.data.map(fromRow)
  } catch { /* 沒設定 Supabase 等：用備用清單 */ }
  return SEED_COUNTRIES
}

/** 啟用中的國家（首頁地圖、按鈕、國家頁、上傳選單用） */
export async function getCountries(): Promise<Country[]> {
  return (await getAllCountries()).filter(c => c.enabled)
}

/** 地圖用的地區清單：台灣 + 啟用中的海外國家 */
export function regionsFor(list: Country[]): PortalRegion[] {
  const tw = REGIONS.find(r => r.track === 'tw')!
  return [tw, ...list.map<PortalRegion>(c => ({
    code: c.code, name: { zh: c.nameZh, en: c.nameEn }, lon: c.lon, lat: c.lat,
    href: `/country/${c.code}`, track: 'intl', labelSide: c.labelSide,
    ...(c.hoverLabel ? { hoverLabel: true as const } : {}), ...(c.mobileHide ? { mobileHide: true as const } : {}),
  }))]
}

// ---------- 國家管理（專員在 ERP 操作，經管理 API） ----------
type Result<T> = { data?: T; error?: string; status?: number }

/** 還沒加入、可以新增的國家（來自內建的全球清單） */
export function addableCountries(list: Country[]) {
  const have = new Set(list.map(c => c.code))
  return Object.entries(WORLD_COUNTRIES).filter(([code]) => !have.has(code))
    .map(([code, w]) => ({ code, zh: w.zh, en: w.en, langs: w.langs }))
    .sort((a, b) => a.zh.localeCompare(b.zh, 'zh-Hant'))
}

export async function addCountry(code: string): Promise<Result<Country>> {
  if (!CODE_RE.test(code) || !isWorldCountry(code)) return { error: '這個國家不在內建清單裡', status: 400 }
  const all = await getAllCountries()
  if (all.some(c => c.code === code)) return { error: '已經有這個國家了（若看不到，可能被停用，請在清單裡重新啟用）', status: 400 }
  const w = WORLD_COUNTRIES[code]
  const sort = (all.reduce((m, c) => Math.max(m, c.sort), 0) || 0) + 10
  const r = await rest<Row[]>(TABLE, {
    method: 'POST', returning: true,
    body: { code, name_zh: w.zh, name_en: w.en, lon: w.lon, lat: w.lat, langs: w.langs, sort },
  })
  if (r.code === '23505') return { error: '已經有這個國家了', status: 400 }
  const row = r.data?.[0]
  if (!r.ok || !row) return { error: '新增失敗（若是第一次使用，請先執行 005_countries.sql）', status: 500 }
  return { data: fromRow(row) }
}

export async function patchCountry(code: string, patch: { enabled?: boolean; langs?: string[] }): Promise<Result<Country>> {
  if (!CODE_RE.test(code)) return { error: '國家代碼不正確', status: 400 }
  const body: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof patch.enabled === 'boolean') body.enabled = patch.enabled
  if (patch.langs !== undefined) {
    const langs = [...new Set(patch.langs)]
    if (!langs.length || langs.length > 6 || !(await Promise.all(langs.map(isKnownLang))).every(Boolean)) return { error: '語言不正確（1～6 種）', status: 400 }
    body.langs = langs
  }
  const r = await rest<Row[]>(`${TABLE}?code=eq.${code}`, { method: 'PATCH', returning: true, body })
  const row = r.data?.[0]
  if (!r.ok || !row) return { error: '更新失敗，請稍後再試', status: r.ok ? 404 : 500 }
  return { data: fromRow(row) }
}

/** 刪除國家：還有說明書指定這個國家時不能刪（請先改掉，或改用「停用」） */
export async function deleteCountry(code: string): Promise<Result<null>> {
  if (!CODE_RE.test(code)) return { error: '國家代碼不正確', status: 400 }
  const used = await rest<Array<{ id: string }>>(`warranty_media_files?select=id&countries=cs.%7B${code}%7D`)
  if (!used.ok) return { error: '檢查失敗，請稍後再試', status: 500 }
  if (used.data?.length) return { error: `還有 ${used.data.length} 份說明書指定了這個國家，請先改掉，或改用「停用」`, status: 400 }
  const d = await rest(`${TABLE}?code=eq.${code}`, { method: 'DELETE' })
  return d.ok ? { data: null } : { error: '刪除失敗，請稍後再試', status: 500 }
}
