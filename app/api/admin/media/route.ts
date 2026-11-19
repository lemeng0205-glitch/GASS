// v0.3.0 | 2026-11-19 | 「顯示在保固網站」（listed）：create／patch 可帶
// v0.2.0 | 2026-11-18 | 顯示國家（countries）：create／patch 可帶，list 附 countryOptions
// v0.1.1 | 2026-11-18 | patch 可帶 view_count（搬遷用）
// v0.1.0 | 2026-11-18 | 媒體庫管理 API（只給 ERP 伺服器呼叫）
// 驗證：HMAC 簽章 + 時間戳（見 lib/adminAuth.ts）。驗證失敗一律回 404，不說明原因。
// 只能做媒體庫的操作（列表、新增、改欄位、刪除、發放上傳通行證、登記版本、還原、下載連結）；
// 沒有任何讀取保固登錄資料的路徑。所有欄位在這裡重新驗證，不信任呼叫端。
import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/adminAuth'
import {
  isMediaKind, isMediaLang, isUuid, normalizeSlug, type MediaKind,
} from '@/lib/mediaConfig'
import {
  addVersion, createFile, deleteFile, downloadUrl, listAll, patchFile, restoreVersion, uploadUrl, validateUpload,
  type UploadedFileInfo,
} from '@/lib/mediaDb'
import { rest } from '@/lib/supabaseRest'
import { COUNTRY_OPTIONS, inferCountries, normalizeCountries } from '@/lib/countries'

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

  switch (body.op) {
    case 'list': {
      const items = await listAll()
      // countryOptions：ERP 後台的「顯示國家」選單用（國家清單只在本站維護一份）
      return items ? ok(items, { countryOptions: COUNTRY_OPTIONS }) : fail('讀取失敗，請稍後再試', 500)
    }

    case 'upload_url': {
      const slug = normalizeSlug(str(body.slug, 80))
      const lang = str(body.lang, 12)
      if (!slug || !lang) return fail('缺少連結編號或語言')
      if (!isMediaLang(lang)) return fail('語言不正確')
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
      if (!isMediaLang(lang)) return fail('語言不正確')
      if (!isMediaKind(kind)) return fail('類型不正確')
      // 顯示國家：沒給就依語言推定（繁中 = 台灣、其他 = 全部海外）；有給就必須全部合法
      let countries = inferCountries(lang)
      if (body.countries !== undefined) {
        const c = normalizeCountries(body.countries)
        if (!c) return fail('顯示國家不正確')
        countries = c
      }
      const file = fileInfo(body.file)
      const bad = await validateUpload(slug, lang, file)
      if (bad) return fail(bad)
      if (body.listed !== undefined && typeof body.listed !== 'boolean') return fail('「顯示在保固網站」格式不正確')
      const listed = body.listed !== false
      const r = await createFile({ slug, lang, title, kind: kind as MediaKind, sku: str(body.sku, 64) || null, countries, listed, file: file as UploadedFileInfo }, actor)
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
        if (!isMediaLang(body.lang)) return fail('語言不正確')
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
      if (typeof body.is_published === 'boolean') patch.is_published = body.is_published
      if (body.listed !== undefined) {
        if (typeof body.listed !== 'boolean') return fail('「顯示在保固網站」格式不正確')
        patch.listed = body.listed
      }
      if (body.countries !== undefined) {
        const c = normalizeCountries(body.countries)
        if (!c) return fail('顯示國家不正確（至少選一個）')
        patch.countries = c
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

    default:
      return fail('不支援的操作')
  }
}
