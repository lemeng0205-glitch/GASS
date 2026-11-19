// v0.1.0 | 2026-11-19 | 語言清單的資料存取（warranty_languages）與「語言管理」的新增／改名／刪除
// 讀取失敗（例如資料表還沒建立）時，自動改用內建的 19 種語言，網站不會因此壞掉。
// 只能在伺服器端使用。
import 'server-only'
import { MEDIA_LANGS } from './mediaConfig'
import { rest } from './supabaseRest'

const TABLE = 'warranty_languages'
const CODE_RE = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/

export type Language = { value: string; label: string }
interface Row { code: string; label: string; sort: number }

/** 全部語言（依排序）；讀取失敗回內建清單 */
export async function getLanguages(): Promise<Language[]> {
  try {
    const r = await rest<Row[]>(`${TABLE}?select=code,label,sort&order=sort.asc,code.asc`)
    if (r.ok && Array.isArray(r.data) && r.data.length) return r.data.map(x => ({ value: x.code, label: x.label }))
  } catch { /* 沒設定 Supabase 等：用內建清單 */ }
  return MEDIA_LANGS
}

export const isKnownLang = async (l: unknown): Promise<boolean> =>
  typeof l === 'string' && (await getLanguages()).some(x => x.value === l)

export const labelMap = (list: Language[]) => new Map(list.map(l => [l.value, l.label]))

/** 語言代碼寫法統一：語言小寫、2 碼地區大寫（zh-tw → zh-TW、pt-br → pt-BR） */
export function normalizeLangCode(input: string): string | null {
  const [a, b, ...more] = input.trim().replace(/_/g, '-').split('-')
  if (more.length || !a) return null
  const code = b ? `${a.toLowerCase()}-${b.length === 2 ? b.toUpperCase() : b.length === 4 ? b[0].toUpperCase() + b.slice(1).toLowerCase() : b}` : a.toLowerCase()
  return CODE_RE.test(code) ? code : null
}

type Result<T> = { data?: T; error?: string; status?: number }
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export async function addLanguage(codeIn: string, labelIn: string): Promise<Result<Language>> {
  const code = normalizeLangCode(codeIn)
  const label = clean(labelIn, 40)
  if (!code) return { error: '語言代碼格式不正確（例：vi、pt-BR、zh-HK）', status: 400 }
  if (!label) return { error: '請填寫顯示名稱（例：Português）', status: 400 }
  const all = await getLanguages()
  if (all.some(l => l.value === code)) return { error: '已經有這個語言了', status: 400 }
  const sort = (await rest<Array<{ sort: number }>>(`${TABLE}?select=sort&order=sort.desc&limit=1`)).data?.[0]?.sort ?? all.length * 10
  const r = await rest<Row[]>(TABLE, { method: 'POST', returning: true, body: { code, label, sort: sort + 10 } })
  if (r.code === '23505') return { error: '已經有這個語言了', status: 400 }
  if (!r.ok || !r.data?.[0]) return { error: '新增失敗（若是第一次使用，請先執行 011_languages.sql）', status: 500 }
  return { data: { value: code, label } }
}

export async function renameLanguage(code: string, labelIn: string): Promise<Result<Language>> {
  if (!CODE_RE.test(code)) return { error: '語言代碼不正確', status: 400 }
  const label = clean(labelIn, 40)
  if (!label) return { error: '顯示名稱不能是空的', status: 400 }
  const r = await rest<Row[]>(`${TABLE}?code=eq.${code}`, { method: 'PATCH', returning: true, body: { label } })
  if (!r.ok || !r.data?.[0]) return { error: '更新失敗，請稍後再試', status: r.ok ? 404 : 500 }
  return { data: { value: code, label } }
}

/** 刪除語言：還有說明書用這個語言，或有國家把它設為優先語言時不能刪 */
export async function deleteLanguage(code: string): Promise<Result<null>> {
  if (!CODE_RE.test(code)) return { error: '語言代碼不正確', status: 400 }
  const docs = await rest<Array<{ id: string }>>(`warranty_media_files?select=id&lang=eq.${code}`)
  if (!docs.ok) return { error: '檢查失敗，請稍後再試', status: 500 }
  if (docs.data?.length) return { error: `還有 ${docs.data.length} 份文件使用這個語言，請先改掉或刪除`, status: 400 }
  const cs = await rest<Array<{ code: string; name_zh: string }>>(`warranty_countries?select=code,name_zh&langs=cs.%7B${code}%7D`)
  if (cs.ok && cs.data?.length) return { error: `國家「${cs.data.map(c => c.name_zh).join('、')}」還把它設為優先語言，請先到國家管理改掉`, status: 400 }
  const d = await rest(`${TABLE}?code=eq.${code}`, { method: 'DELETE' })
  return d.ok ? { data: null } : { error: '刪除失敗，請稍後再試', status: 500 }
}
