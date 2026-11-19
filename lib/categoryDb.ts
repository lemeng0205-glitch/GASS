// v0.1.0 | 2026-11-19 | 說明書類別清單的資料存取（warranty_categories）與「類別管理」的新增／改名／排序／刪除
// 讀取失敗（例如資料表還沒建立）時，自動改用內建的兩個類別，網站不會因此壞掉。
// 只能在伺服器端使用。
import 'server-only'
import { PRODUCT_LINES } from './portalConfig'
import { rest } from './supabaseRest'

const TABLE = 'warranty_categories'
const KEY_RE = /^[a-z0-9-]{2,32}$/

export interface Category { key: string; nameZh: string; nameEn: string; sort: number }
interface Row { key: string; name_zh: string; name_en: string; sort: number }
const fromRow = (r: Row): Category => ({ key: r.key, nameZh: r.name_zh, nameEn: r.name_en, sort: r.sort })

/** 備用清單：內建的兩個類別（資料庫讀不到時使用） */
export const SEED_CATEGORIES: Category[] = PRODUCT_LINES.map((l, i) => ({ key: l.key, nameZh: l.label.zh, nameEn: l.label.en, sort: (i + 1) * 10 }))

export async function getCategories(): Promise<Category[]> {
  try {
    const r = await rest<Row[]>(`${TABLE}?select=*&order=sort.asc,key.asc`)
    if (r.ok && Array.isArray(r.data)) return r.data.map(fromRow)
  } catch { /* 沒設定 Supabase 等：用備用清單 */ }
  return SEED_CATEGORIES
}

type Result<T> = { data?: T; error?: string; status?: number }
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export async function addCategory(nameZh: string, nameEn: string): Promise<Result<Category>> {
  const zh = clean(nameZh, 30), en = clean(nameEn, 60)
  if (!zh || !en) return { error: '請填寫中文與英文名稱（英文給海外網站顯示）', status: 400 }
  const all = await getCategories()
  if (all.some(c => c.nameZh === zh)) return { error: '已經有同名的類別了', status: 400 }
  const key = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
  const sort = (all.reduce((m, c) => Math.max(m, c.sort), 0) || 0) + 10
  const r = await rest<Row[]>(TABLE, { method: 'POST', returning: true, body: { key, name_zh: zh, name_en: en, sort } })
  const row = r.data?.[0]
  if (!r.ok || !row) return { error: '新增失敗（若是第一次使用，請先執行 010_categories.sql）', status: 500 }
  return { data: fromRow(row) }
}

export async function patchCategory(key: string, patch: { nameZh?: string; nameEn?: string; sort?: number }): Promise<Result<Category>> {
  if (!KEY_RE.test(key)) return { error: '類別代碼不正確', status: 400 }
  const body: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.nameZh !== undefined) { const v = clean(patch.nameZh, 30); if (!v) return { error: '中文名稱不能是空的', status: 400 }; body.name_zh = v }
  if (patch.nameEn !== undefined) { const v = clean(patch.nameEn, 60); if (!v) return { error: '英文名稱不能是空的', status: 400 }; body.name_en = v }
  if (patch.sort !== undefined) { if (!Number.isInteger(patch.sort) || patch.sort < 0 || patch.sort > 100000) return { error: '排序不正確', status: 400 }; body.sort = patch.sort }
  const r = await rest<Row[]>(`${TABLE}?key=eq.${key}`, { method: 'PATCH', returning: true, body })
  const row = r.data?.[0]
  if (!r.ok || !row) return { error: '更新失敗，請稍後再試', status: r.ok ? 404 : 500 }
  return { data: fromRow(row) }
}

/** 刪除類別：還有說明書使用時不能刪（請先把那些說明書改到別的類別） */
export async function deleteCategory(key: string): Promise<Result<null>> {
  if (!KEY_RE.test(key)) return { error: '類別代碼不正確', status: 400 }
  const used = await rest<Array<{ id: string }>>(`warranty_media_files?select=id&category=eq.${key}`)
  if (!used.ok) return { error: '檢查失敗，請稍後再試', status: 500 }
  if (used.data?.length) return { error: `還有 ${used.data.length} 份說明書在這個類別，請先改到別的類別`, status: 400 }
  const d = await rest(`${TABLE}?key=eq.${key}`, { method: 'DELETE' })
  return d.ok ? { data: null } : { error: '刪除失敗，請稍後再試', status: 500 }
}
