// v0.7.0 | 2026-11-26 | 修改類操作後清除公開頁面快取（revalidateTag）
// v0.6.0 | 2026-11-19 | 語言管理（languages_list／language_add／language_patch／language_delete）；語言清單改讀資料庫
// v0.5.0 | 2026-11-19 | 類別管理（categories_list／category_add／category_patch／category_delete）；list 附 categoryOptions；category 必須是已存在的類別
// v0.4.0 | 2026-11-19 | 國家管理（countries_list／country_add／country_patch／country_delete）；list 附 languageOptions
// v0.3.0 | 2026-11-19 | 「顯示在保固網站」（listed）：create／patch 可帶
// v0.2.0 | 2026-11-18 | 顯示國家（countries）：create／patch 可帶，list 附 countryOptions
// v0.1.1 | 2026-11-18 | patch 可帶 view_count（搬遷用）
// v0.1.0 | 2026-11-18 | 媒體庫管理 API（只給 ERP 伺服器呼叫）
// 驗證：HMAC 簽章 + 時間戳（見 lib/adminAuth.ts）。驗證失敗一律回 404，不說明原因。
// 只能做媒體庫的操作（列表、新增、改欄位、刪除、發放上傳通行證、登記版本、還原、下載連結）；
// 沒有任何讀取保固登錄資料的路徑。所有欄位在這裡重新驗證，不信任呼叫端。
import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { PORTAL_TAG } from '@/lib/publicCache'
import { verifyAdmin } from '@/lib/adminAuth'
import {
  isMediaKind, isMediaScope, isUuid, normalizeSlug, type MediaKind, type MediaScope,
} from '@/lib/mediaConfig'
import {
  addVersion, createFile, deleteFile, downloadUrl, listAll, patchFile, restoreVersion, setCover, uploadUrl, validateUpload,
  type UploadedFileInfo,
} from '@/lib/mediaDb'
import { rest } from '@/lib/supabaseRest'
import { allowedCodes, countryOptionsFrom, inferCountries, normalizeCountries } from '@/lib/countries'
import { addCountry, addableCountries, deleteCountry, getAllCountries, patchCountry } from '@/lib/countryDb'
import { addLanguage, deleteLanguage, getLanguages, isKnownLang, renameLanguage } from '@/lib/languageDb'
import { addCategory, deleteCategory, getCategories, patchCategory } from '@/lib/categoryDb'

export const dynamic = 'force-dynamic'

const ok = (data: unknown, extra: Record<string, unknown> = {}) => NextResponse.json({ success: true, data, ...extra })
const fail = (error: string, status = 400) => NextResponse.json({ success: false, error }, { status })
const notFound = () => new NextResponse('Not Found', { status: 404 })

type Body = Record<string, unknown>
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

function fileInfo(v: unknown): UploadedFileInfo | undefined {
  if (!v || typeof v !== 'object') return undefined
  const o = v as Record<string, unknown>
  return { file_path: str(o.file_path, 300), file_name: str(o.file_name, 255), mime_type: str(o.mime_type, 120), size_bytes: Number(o.size_bytes) || 0 }
}

export async function POST(req: Request) {
  const raw = await req.text()
  if (raw.length > 65_536 || !verifyAdmin(req.headers, raw)) return notFound()

  let body: Body
  try { body = JSON.parse(raw) as Body } catch { return fail('資料格式錯誤') }
  if (!body || typeof body !== 'object') return fail('資料格式錯誤')
  const actor = str(body.actor, 64) || 'erp'
  const id = body.id

  const res = await run(body, actor, id)
  // 有修改資料的操作：清除公開頁面的快取，專員改完馬上看得到
  if (!READ_ONLY.has(String(body.op))) revalidateTag(PORTAL_TAG)
  return res
}

const READ_ONLY = new Set(['list', 'upload_url', 'download_url', 'countries_list', 'categories_list', 'languages_list'])

async function run(body: Body, actor: string, id: unknown): Promise<Response> {
  switch (body.op) {
    case 'list': {
      const items = await listAll()
      // countryOptions／languageOptions：ERP 後台的「顯示國家」與語言選單用（只在本站維護一份）
      return items
        ? ok(items, { countryOptions: countryOptionsFrom(await getAllCountries()), languageOptions: await getLanguages(), categoryOptions: await getCategories() })
        : fail('讀取失敗，請稍後再試', 500)
    }

    case 'upload_url': {
      const slug = normalizeSlug(str(body.slug, 80))
      const lang = str(body.lang, 12)
      if (!slug || !lang) return fail('缺少連結編號或語言')
      if (!(await isKnownLang(lang))) return fail('語言不正確')
      const r = await uploadUrl(slug, lang, str(body.mime, 120), Number(body.size) || 0)
      return 'error' in r ? fail(r.error) : ok({ path: r.path, token: r.token })
    }

    case 'create': {
      const slug = normalizeSlug(str(body.slug, 80))
      const lang = str(body.lang, 12) || 'zh-TW'
      const title = str(body.title, 200)
      const kind = (body.kind ?? 'manual') as unknown
      if (!slug) return fail('連結編號只能用英文、數字、- 與 _（最多 64 字）')
      if (!title) return fail('請填寫名稱')
      if (!(await isKnownLang(lang))) return fail('語言不正確')
      if (!isMediaKind(kind)) return fail('類型不正確')
      // 顯示國家：沒給就依語言推定（繁中 = 台灣、其他 = 全部海外）；有給就必須全部合法
      let countries = inferCountries(lang)
      if (body.countries !== undefined) {
        const c = normalizeCountries(body.countries, allowedCodes(await getAllCountries()))
        if (!c) return fail('顯示國家不正確')
        countries = c
      }
      const file = fileInfo(body.file)
      const bad = await validateUpload(slug, lang, file)
      if (bad) return fail(bad)
      if (body.listed !== undefined && typeof body.listed !== 'boolean') return fail('「顯示在保固網站」格式不正確')
      const listed = body.listed !== false
      if (body.scope !== undefined && !isMediaScope(body.scope)) return fail('用途不正確')
      const scope: MediaScope = body.scope === 'general' ? 'general' : 'global'
      const category = str(body.category, 32) || null
      if (category && !(await getCategories()).some(c => c.key === category)) return fail('類別不存在')
      const r = await createFile({ slug, lang, title, kind: kind as MediaKind, sku: str(body.sku, 64) || null, countries, listed, scope, category, file: file as UploadedFileInfo }, actor)
      return r.error ? fail(r.error, r.status) : ok(r.data)
    }

    case 'add_version': {
      if (!isUuid(id)) return fail('缺少文件')
      const m = await rest<Array<{ slug: string; lang: string }>>(`warranty_media_files?select=slug,lang&id=eq.${id}`)
      const media = m.data?.[0]
      if (!media) return fail('找不到這份文件', 404)
      const file = fileInfo(body.file)
      const bad = await validateUpload(media.slug, media.lang, file)
      if (bad) return fail(bad)
      const r = await addVersion(id, file as UploadedFileInfo, actor)
      return r.error ? fail(r.error, 500) : ok(r.version)
    }

    case 'patch': {
      if (!isUuid(id)) return fail('缺少文件')
      const patch: Record<string, unknown> = {}
      if (body.slug !== undefined) {
        const s = normalizeSlug(str(body.slug, 80))
        if (!s) return fail('連結編號只能用英文、數字、- 與 _（最多 64 字）')
        patch.slug = s
      }
      if (body.lang !== undefined) {
        if (!(await isKnownLang(body.lang))) return fail('語言不正確')
        patch.lang = body.lang
      }
      if (body.title !== undefined) {
        const t = str(body.title, 200)
        if (!t) return fail('名稱不能是空的')
        patch.title = t
      }
      if (body.kind !== undefined) {
        if (!isMediaKind(body.kind)) return fail('類型不正確')
        patch.kind = body.kind
      }
      if (body.sku !== undefined) patch.sku = str(body.sku, 64) || null
      if (body.category !== undefined) {   // 空字串／null = 清除
        const c = str(body.category, 32) || null
        if (c && !(await getCategories()).some(x => x.key === c)) return fail('類別不存在')
        patch.category = c
      }
      if (body.scope !== undefined) {
        if (!isMediaScope(body.scope)) return fail('用途不正確')
        patch.scope = body.scope
      }
      if (typeof body.is_published === 'boolean') patch.is_published = body.is_published
      if (body.listed !== undefined) {
        if (typeof body.listed !== 'boolean') return fail('「顯示在保固網站」格式不正確')
        patch.listed = body.listed
      }
      if (body.countries !== undefined) {
        const c = normalizeCountries(body.countries, allowedCodes(await getAllCountries()))
        if (!c) return fail('顯示國家不正確（至少選一個）')
        patch.countries = c
      }
      // 預覽圖：字串＝設定（路徑必須屬於這份文件且檔案已上傳）、null＝清除
      if (body.cover_path !== undefined) {
        if (body.cover_path !== null && typeof body.cover_path !== 'string') return fail('預覽圖不正確')
        const c = await setCover(id, body.cover_path as string | null)
        if (c.error) return fail(c.error, c.status)
      }
      // 搬遷用：帶入原本累計的開啟次數（整數 0～10 億）
      if (body.view_count !== undefined) {
        const n = Number(body.view_count)
        if (!Number.isInteger(n) || n < 0 || n > 1_000_000_000) return fail('開啟次數不正確')
        patch.view_count = n
      }
      const r = await patchFile(id, patch)
      return r.error ? fail(r.error, r.status) : ok(r.data)
    }

    case 'delete': {
      if (!isUuid(id)) return fail('缺少文件')
      return (await deleteFile(id)) ? ok(null) : fail('刪除失敗，請稍後再試', 500)
    }

    case 'restore': {
      if (!isUuid(id) || !isUuid(body.version_id)) return fail('缺少版本')
      const r = await restoreVersion(id, body.version_id)
      return r.error ? fail(r.error, r.status) : ok(r.data)
    }

    case 'download_url': {
      if (!isUuid(id)) return fail('缺少文件')
      if (body.version_id !== undefined && !isUuid(body.version_id)) return fail('版本不正確')
      const r = await downloadUrl(id, body.version_id as string | undefined)
      return 'error' in r ? fail(r.error, r.status) : ok({ url: r.url })
    }

    // ---- 國家管理（專員在 ERP 新增／停用／調整語言／刪除國家） ----
    case 'countries_list': {
      const all = await getAllCountries()
      return ok({ countries: all, addable: addableCountries(all), languages: await getLanguages() })
    }
    case 'country_add': {
      const r = await addCountry(str(body.code, 4).toLowerCase())
      return r.error ? fail(r.error, r.status) : ok(r.data)
    }
    case 'country_patch': {
      const patch: { enabled?: boolean; langs?: string[] } = {}
      if (body.enabled !== undefined) {
        if (typeof body.enabled !== 'boolean') return fail('啟用狀態不正確')
        patch.enabled = body.enabled
      }
      if (body.langs !== undefined) {
        if (!Array.isArray(body.langs)) return fail('語言不正確')
        patch.langs = body.langs.map(l => (typeof l === 'string' ? l : ''))
      }
      const r = await patchCountry(str(body.code, 4).toLowerCase(), patch)
      return r.error ? fail(r.error, r.status) : ok(r.data)
    }
    case 'country_delete': {
      const r = await deleteCountry(str(body.code, 4).toLowerCase())
      return r.error ? fail(r.error, r.status) : ok(null)
    }

    // ---- 類別管理（專員在 ERP 新增／改名／排序／刪除說明書類別） ----
    case 'categories_list':
      return ok({ categories: await getCategories() })
    case 'category_add': {
      const r = await addCategory(str(body.name_zh, 30), str(body.name_en, 60))
      return r.error ? fail(r.error, r.status) : ok(r.data)
    }
    case 'category_patch': {
      const patch: { nameZh?: string; nameEn?: string; sort?: number } = {}
      if (body.name_zh !== undefined) patch.nameZh = str(body.name_zh, 30)
      if (body.name_en !== undefined) patch.nameEn = str(body.name_en, 60)
      if (body.sort !== undefined) patch.sort = Number(body.sort)
      const r = await patchCategory(str(body.key, 32), patch)
      return r.error ? fail(r.error, r.status) : ok(r.data)
    }
    case 'category_delete': {
      const r = await deleteCategory(str(body.key, 32))
      return r.error ? fail(r.error, r.status) : ok(null)
    }

    // ---- 語言管理（專員在 ERP 新增海外語言／改顯示名稱／刪除） ----
    case 'languages_list':
      return ok({ languages: await getLanguages() })
    case 'language_add': {
      const r = await addLanguage(str(body.code, 16), str(body.label, 40))
      return r.error ? fail(r.error, r.status) : ok(r.data)
    }
    case 'language_patch': {
      const r = await renameLanguage(str(body.code, 16), str(body.label, 40))
      return r.error ? fail(r.error, r.status) : ok(r.data)
    }
    case 'language_delete': {
      const r = await deleteLanguage(str(body.code, 16))
      return r.error ? fail(r.error, r.status) : ok(null)
    }

    default:
      return fail('不支援的操作')
  }
}
