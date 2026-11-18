// v0.1.0 | 2026-11-18 | 媒體庫資料存取（warranty_media_files / warranty_media_versions + bucket warranty-media）
// 只能在伺服器端使用。所有放進網址的值（id、slug）都先驗證格式，不拼接使用者原文。
import 'server-only'
import {
  rest, storageExists, storageRemove, storageSignedUpload, storageSignedUrl,
} from './supabaseRest'
import {
  ALLOWED_LABEL, ALLOWED_MIME, MAX_VERSIONS, MEDIA_BUCKET, buildFilePath, isPathFor, isSlug, isUuid, sizeError,
  type MediaKind,
} from './mediaConfig'

export interface MediaVersion {
  id: string; media_id: string; version_no: number; file_path: string; file_name: string
  mime_type: string; size_bytes: number; uploaded_by: string | null; created_at: string
}
export interface MediaFile {
  id: string; slug: string; lang: string; title: string; kind: MediaKind; sku: string | null
  is_published: boolean; current_version_id: string | null; view_count: number
  countries: string[]
  created_by: string | null; created_at: string; updated_at: string
}
export interface MediaItem extends MediaFile { versions: MediaVersion[] }
export interface UploadedFileInfo { file_path: string; file_name: string; mime_type: string; size_bytes: number }

const FILES = 'warranty_media_files'
const VERS = 'warranty_media_versions'

// ---------- 後台 ----------
export async function listAll(): Promise<MediaItem[] | null> {
  const f = await rest<MediaFile[]>(`${FILES}?select=*&order=updated_at.desc`)
  const v = await rest<MediaVersion[]>(`${VERS}?select=*&order=version_no.desc`)
  if (!f.ok || !v.ok) return null
  const by = new Map<string, MediaVersion[]>()
  for (const x of v.data ?? []) by.set(x.media_id, [...(by.get(x.media_id) ?? []), x])
  return (f.data ?? []).map(m => ({ ...m, versions: by.get(m.id) ?? [] }))
}

/** 檢查 client 回報的上傳資訊；合法回 null，否則回中文錯誤訊息 */
export async function validateUpload(slug: string, lang: string, f: Partial<UploadedFileInfo> | undefined): Promise<string | null> {
  if (!f || typeof f.file_path !== 'string' || typeof f.file_name !== 'string' || typeof f.mime_type !== 'string') return '缺少檔案資訊'
  if (!ALLOWED_MIME[f.mime_type]) return `只支援 ${ALLOWED_LABEL}`
  const tooBig = sizeError(f.mime_type, Number(f.size_bytes ?? 0))
  if (tooBig) return tooBig
  if (f.file_name.length > 255) return '檔名過長'
  if (!isPathFor(f.file_path, slug, lang)) return '檔案路徑不正確'
  if (!(await storageExists(MEDIA_BUCKET, f.file_path))) return '找不到已上傳的檔案，請重新上傳'
  return null
}

/** 新增版本並設為目前版本（「覆蓋」就是這個動作），只保留最近 MAX_VERSIONS 版 */
export async function addVersion(mediaId: string, f: UploadedFileInfo, username: string): Promise<{ version?: MediaVersion; error?: string }> {
  const last = await rest<Array<{ version_no: number }>>(
    `${VERS}?select=version_no&media_id=eq.${mediaId}&order=version_no.desc&limit=1`)
  if (!last.ok) return { error: '儲存版本失敗，請再試一次' }
  const nextNo = (last.data?.[0]?.version_no ?? 0) + 1

  const ins = await rest<MediaVersion[]>(VERS, {
    method: 'POST', returning: true,
    body: { media_id: mediaId, version_no: nextNo, file_path: f.file_path, file_name: f.file_name,
            mime_type: f.mime_type, size_bytes: f.size_bytes, uploaded_by: username },
  })
  if (ins.code === '23505') return { error: '這個檔案已經登記過了' }
  const ver = ins.data?.[0]
  if (!ins.ok || !ver) return { error: '儲存版本失敗，請再試一次' }

  const up = await rest(`${FILES}?id=eq.${mediaId}`, {
    method: 'PATCH', body: { current_version_id: ver.id, updated_at: new Date().toISOString() },
  })
  if (!up.ok) return { error: '更新目前版本失敗，請再試一次' }

  const all = await rest<Array<{ id: string; file_path: string }>>(
    `${VERS}?select=id,file_path&media_id=eq.${mediaId}&order=version_no.desc`)
  const stale = (all.data ?? []).slice(MAX_VERSIONS)
  if (stale.length) {
    await storageRemove(MEDIA_BUCKET, stale.map(v => v.file_path))
    await rest(`${VERS}?id=in.(${stale.map(v => v.id).join(',')})`, { method: 'DELETE' })
  }
  return { version: ver }
}

export async function createFile(
  input: { slug: string; lang: string; title: string; kind: MediaKind; sku: string | null; countries: string[]; file: UploadedFileInfo },
  username: string,
): Promise<{ data?: MediaFile; error?: string; status?: number }> {
  const ins = await rest<MediaFile[]>(FILES, {
    method: 'POST', returning: true,
    body: { slug: input.slug, lang: input.lang, title: input.title, kind: input.kind, sku: input.sku, countries: input.countries, created_by: username },
  })
  if (ins.code === '23505') return { error: '這個編號與語言已經有文件了，請改用該文件的「覆蓋」', status: 400 }
  const media = ins.data?.[0]
  if (!ins.ok || !media) return { error: '建立失敗，請稍後再試', status: 500 }
  const r = await addVersion(media.id, input.file, username)
  if (r.error) {
    await rest(`${FILES}?id=eq.${media.id}`, { method: 'DELETE' })
    return { error: r.error, status: 500 }
  }
  return { data: media }
}

export async function patchFile(id: string, patch: Record<string, unknown>): Promise<{ data?: MediaFile; error?: string; status?: number }> {
  const r = await rest<MediaFile[]>(`${FILES}?id=eq.${id}`, {
    method: 'PATCH', returning: true, body: { ...patch, updated_at: new Date().toISOString() },
  })
  if (r.code === '23505') return { error: '這個編號與語言已經有文件了，請換一個', status: 400 }
  const row = r.data?.[0]
  if (!r.ok || !row) return { error: '更新失敗，請稍後再試', status: 500 }
  return { data: row }
}

export async function deleteFile(id: string): Promise<boolean> {
  const v = await rest<Array<{ file_path: string }>>(`${VERS}?select=file_path&media_id=eq.${id}`)
  if (!v.ok) return false
  await storageRemove(MEDIA_BUCKET, (v.data ?? []).map(x => x.file_path))
  const d = await rest(`${FILES}?id=eq.${id}`, { method: 'DELETE' })   // 版本會連帶刪除
  return d.ok
}

export async function restoreVersion(id: string, versionId: string): Promise<{ data?: MediaFile; error?: string; status?: number }> {
  const v = await rest<Array<{ id: string }>>(`${VERS}?select=id&id=eq.${versionId}&media_id=eq.${id}`)
  if (!v.ok || !v.data?.length) return { error: '找不到這個版本（可能已超過保留的 3 版）', status: 404 }
  const r = await patchFile(id, { current_version_id: versionId })
  return r.error ? { error: '還原失敗，請稍後再試', status: 500 } : r
}

export async function uploadUrl(slug: string, lang: string, mime: string, size: number): Promise<{ path: string; token: string } | { error: string }> {
  if (!ALLOWED_MIME[mime]) return { error: `只支援 ${ALLOWED_LABEL}` }
  const tooBig = sizeError(mime, size)
  if (tooBig) return { error: tooBig }
  const path = buildFilePath(slug, lang, mime)
  const s = await storageSignedUpload(MEDIA_BUCKET, path)
  return s ? { path, token: s.token } : { error: '無法建立上傳連結，請稍後再試' }
}

/** 後台下載：簽名連結 60 秒有效，並以原檔名下載。版本必須屬於該文件 */
export async function downloadUrl(id: string, versionId?: string): Promise<{ url: string } | { error: string; status: number }> {
  let vid = versionId
  if (vid === undefined) {
    const m = await rest<Array<{ current_version_id: string | null }>>(`${FILES}?select=current_version_id&id=eq.${id}`)
    vid = m.data?.[0]?.current_version_id ?? undefined
  }
  if (!vid || !isUuid(vid)) return { error: '這份文件目前沒有可下載的檔案', status: 404 }
  const v = await rest<Array<{ file_path: string; file_name: string }>>(
    `${VERS}?select=file_path,file_name&id=eq.${vid}&media_id=eq.${id}`)
  const row = v.data?.[0]
  if (!v.ok || !row) return { error: '找不到這個版本（可能已超過保留的 3 版）', status: 404 }
  const url = await storageSignedUrl(MEDIA_BUCKET, row.file_path, 60, row.file_name)
  return url ? { url } : { error: '產生下載連結失敗，請稍後再試', status: 500 }
}

// ---------- 公開（消費者） ----------
export interface PublicDoc {
  id: string; slug: string; title: string; kind: string; lang: string; countries: string[]
  current_version_id: string; updated_at: string
}
type RawPublic = Omit<PublicDoc, 'current_version_id'> & { current_version_id: string | null }
const PUBLIC_COLS = 'id,slug,title,kind,lang,countries,current_version_id,updated_at'

/** 某編號底下「已上架且有目前版本」的文件。只讀公開需要的欄位 */
export async function publishedBySlug(slug: string): Promise<PublicDoc[]> {
  if (!isSlug(slug)) return []
  const r = await rest<RawPublic[]>(`${FILES}?select=${PUBLIC_COLS}&slug=eq.${slug}&is_published=eq.true`)
  return (r.data ?? []).filter((d): d is PublicDoc => !!d.current_version_id)
}

/** 所有「已上架、類型為說明書、有目前版本」的文件（國家頁的產品清單由這裡自動產生） */
export async function publishedManuals(): Promise<PublicDoc[]> {
  const r = await rest<RawPublic[]>(`${FILES}?select=${PUBLIC_COLS}&is_published=eq.true&kind=eq.manual&order=slug.asc`)
  return (r.data ?? []).filter((d): d is PublicDoc => !!d.current_version_id)
}

export async function publishedFile(slug: string, id: string): Promise<{ id: string; current_version_id: string } | null> {
  if (!isSlug(slug) || !isUuid(id)) return null
  const r = await rest<Array<{ id: string; current_version_id: string | null }>>(
    `${FILES}?select=id,current_version_id&id=eq.${id}&slug=eq.${slug}&is_published=eq.true`)
  const m = r.data?.[0]
  return m?.current_version_id ? { id: m.id, current_version_id: m.current_version_id } : null
}

export async function versionInfo(versionId: string): Promise<{ file_path: string; mime_type: string } | null> {
  if (!isUuid(versionId)) return null
  const r = await rest<Array<{ file_path: string; mime_type: string }>>(
    `${VERS}?select=file_path,mime_type&id=eq.${versionId}`)
  return r.data?.[0] ?? null
}

export async function incView(id: string): Promise<void> {
  await rest('rpc/warranty_media_inc_view', { method: 'POST', body: { p_id: id } })
}
