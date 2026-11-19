// v0.1.0 | 2026-11-18 | 媒體庫共用常數與工具（由 ERP lib/media.ts 搬來，內容保持一致）
// 不含任何密鑰；server 端使用。
export const MEDIA_BUCKET = 'warranty-media'
export const MAX_VERSIONS = 3                       // 每份文件保留最近幾版
export const MAX_FILE_BYTES = 50 * 1024 * 1024      // 與 bucket file_size_limit 一致（002_media.sql）
export const MAX_HTML_BYTES = 4 * 1024 * 1024       // HTML 要經伺服器加隔離標頭後回傳，受 Vercel 回應上限限制

export function sizeError(mime: string, size: number): string | null {
  if (!size) return '檔案是空的'
  if (mime === 'text/html' && size > MAX_HTML_BYTES) return 'HTML 檔案過大（上限 4MB），請壓縮圖片或改用 PDF'
  if (size > MAX_FILE_BYTES) return '檔案過大（上限 50MB）'
  return null
}

/** mime → 副檔名。必須與 bucket 的 allowed_mime_types 一致（002_media.sql） */
export const ALLOWED_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/plain': 'txt',
  'text/html': 'html',
  // 電子模板（GoodNotes／Notability 等專用格式瀏覽器不認得，一律用 octet-stream；副檔名另外由 TEMPLATE_EXTS 把關）
  'application/zip': 'zip',
  'application/octet-stream': 'bin',
}
export const ALLOWED_LABEL = 'PDF、圖片（PNG／JPG／WebP／GIF）、Word、Excel、PowerPoint、TXT、HTML，電子模板另支援 GoodNotes／Notability／ZIP'

/** 電子模板允許的副檔名（mime 為 octet-stream 時，檔名必須是這些之一，避免有人傳可執行檔） */
export const TEMPLATE_EXTS = ['goodnotes', 'nbn', 'note', 'zip'] as const
export const fileExt = (name: string) => (name.split('.').pop() ?? '').toLowerCase()
/** mime 與檔名是否相符：一般類型照舊；octet-stream／zip 必須是模板副檔名 */
export function mimeNameOk(mime: string, fileName: string): boolean {
  if (mime === 'application/octet-stream') return (TEMPLATE_EXTS as readonly string[]).includes(fileExt(fileName))
  if (mime === 'application/zip') return fileExt(fileName) === 'zip'
  return true
}
/** 這種檔案不能在瀏覽器內開啟，公開連結要直接下載 */
export const isDownloadMime = (mime: string) => mime === 'application/octet-stream' || mime === 'application/zip'

export const MEDIA_KINDS = ['manual', 'image', 'document', 'other', 'template'] as const
export type MediaKind = (typeof MEDIA_KINDS)[number]
export const isMediaKind = (k: unknown): k is MediaKind => typeof k === 'string' && (MEDIA_KINDS as readonly string[]).includes(k)

/** 可用的語言（ERP 後台的語言選單向本站取得，只維護這一份）。新增語言只要加在這裡（資料庫不限制語言值）；label 是消費者選擇頁上顯示的名稱 */
export const MEDIA_LANGS: Array<{ value: string; label: string }> = [
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'en',    label: 'English' },
  { value: 'ja',    label: '日本語' },
  { value: 'ko',    label: '한국어' },
  { value: 'de',    label: 'Deutsch' },
  { value: 'fr',    label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'pl', label: 'Polski' },
  { value: 'th', label: 'ไทย' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'ms', label: 'Bahasa Melayu' },
  { value: 'tr', label: 'Türkçe' },
  { value: 'ar', label: 'العربية' },
  { value: 'ru', label: 'Русский' },
  { value: 'zh-CN', label: '简体中文' },
]
export const isMediaLang = (l: unknown): l is string => typeof l === 'string' && MEDIA_LANGS.some(x => x.value === l)
export const langLabel = (l: string) => MEDIA_LANGS.find(x => x.value === l)?.label ?? l

const SLUG_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/
export function normalizeSlug(input: string): string | null {
  const s = input.trim().toLowerCase().replace(/[\s.]+/g, '-')
  return SLUG_RE.test(s) ? s : null
}
export const isSlug = (s: string) => SLUG_RE.test(s)

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isUuid = (s: unknown): s is string => typeof s === 'string' && UUID_RE.test(s)

/** 每次上傳都用全新檔名：避免快取舊檔，覆蓋後消費者一定立刻看到新版 */
export function buildFilePath(slug: string, lang: string, mime: string): string {
  const ext = ALLOWED_MIME[mime] ?? 'bin'
  const rand = Math.random().toString(36).slice(2, 8)
  return `${slug}/${lang}/${Date.now()}-${rand}.${ext}`
}

/** 檢查 client 回報的 file_path 是否屬於該 slug／lang（防止指向別人的檔案） */
export function isPathFor(path: string, slug: string, lang: string): boolean {
  return path.startsWith(`${slug}/${lang}/`) && !path.includes('..') && !path.includes('//')
}

/** 把 ?lang= 轉成偏好順序：支援逗號分隔（lang=ja,en）；zh 當作 zh-TW；最後一定補上 en 當退路。比對不分大小寫 */
export function langPreference(param: string | undefined): string[] {
  if (!param) return []
  const list = param.split(',').slice(0, 4).map(s => s.trim().toLowerCase()).filter(Boolean)
    .map(s => (s === 'zh' ? 'zh-tw' : s))
  if (!list.length) return []
  return list.includes('en') ? list : [...list, 'en']
}
