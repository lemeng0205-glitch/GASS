// v0.1.0 | 2026-11-18 | 伺服器端用 Secret key 呼叫 Supabase REST（資料表）與 Storage REST（檔案）。不引入 supabase-js
// 只能在伺服器端使用。Secret key 只放在 apikey 標頭（新式 sb_secret 金鑰不是 JWT，不能放 Authorization）。
import 'server-only'

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) throw new Error('missing Supabase env')
  return { url: url.replace(/\/+$/, ''), key }
}

export interface RestResult<T> { ok: boolean; status: number; data: T | null; code?: string }

/** PostgREST：path 例如 `warranty_media_files?select=*&slug=eq.abc`。呼叫端必須先驗證要放進網址的值 */
export async function rest<T = unknown>(
  path: string,
  opts: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown; returning?: boolean } = {},
): Promise<RestResult<T>> {
  const { url, key } = env()
  const headers: Record<string, string> = { apikey: key }
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (opts.returning) headers.Prefer = 'return=representation'
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    cache: 'no-store',
  })
  const text = await res.text()
  let data: unknown = null
  try { data = text ? JSON.parse(text) : null } catch { data = null }
  if (!res.ok) {
    const code = data && typeof data === 'object' && 'code' in data ? String((data as { code: unknown }).code) : undefined
    return { ok: false, status: res.status, data: null, code }
  }
  return { ok: true, status: res.status, data: data as T }
}

// ---------- Storage ----------
const enc = (p: string) => p.split('/').map(encodeURIComponent).join('/')

/** 發放一次性簽名上傳 token（瀏覽器用它直傳檔案，不需要任何密鑰） */
export async function storageSignedUpload(bucket: string, path: string): Promise<{ token: string } | null> {
  const { url, key } = env()
  const res = await fetch(`${url}/storage/v1/object/upload/sign/${bucket}/${enc(path)}`, {
    method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' }, body: '{}', cache: 'no-store',
  })
  if (!res.ok) return null
  const j = (await res.json().catch(() => null)) as { url?: string } | null
  const token = j?.url ? new URL(j.url, 'http://x').searchParams.get('token') : null
  return token ? { token } : null
}

/** 簽名下載連結（預設 5 分鐘）。download 有值時，瀏覽器會以該檔名下載 */
export async function storageSignedUrl(bucket: string, path: string, expiresIn = 300, download?: string): Promise<string | null> {
  const { url, key } = env()
  const res = await fetch(`${url}/storage/v1/object/sign/${bucket}/${enc(path)}`, {
    method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn }), cache: 'no-store',
  })
  if (!res.ok) return null
  const j = (await res.json().catch(() => null)) as { signedURL?: string } | null
  if (!j?.signedURL) return null
  const full = encodeURI(`${url}/storage/v1${j.signedURL}`)
  return download ? `${full}&download=${encodeURIComponent(download)}` : full
}

export async function storageRemove(bucket: string, paths: string[]): Promise<void> {
  if (!paths.length) return
  const { url, key } = env()
  await fetch(`${url}/storage/v1/object/${bucket}`, {
    method: 'DELETE', headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes: paths }), cache: 'no-store',
  })
}

/** 確認檔案真的存在 */
export async function storageExists(bucket: string, path: string): Promise<boolean> {
  const { url, key } = env()
  const i = path.lastIndexOf('/')
  const res = await fetch(`${url}/storage/v1/object/list/${bucket}`, {
    method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: path.slice(0, i), search: path.slice(i + 1), limit: 20 }), cache: 'no-store',
  })
  if (!res.ok) return false
  const list = (await res.json().catch(() => [])) as Array<{ name: string }>
  return Array.isArray(list) && list.some(o => o.name === path.slice(i + 1))
}

/** 讀取檔案內容（HTML 說明書需要由伺服器取出再加隔離標頭） */
export async function storageText(bucket: string, path: string): Promise<string | null> {
  const { url, key } = env()
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${enc(path)}`, { headers: { apikey: key }, cache: 'no-store' })
  return res.ok ? res.text() : null
}
