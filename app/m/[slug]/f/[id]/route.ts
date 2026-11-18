// v0.1.0 | 2026-11-18 | 開啟檔案（公開）：由 ERP 搬來
// HTML → 從 Storage 取出、補骨架、加 CSP sandbox 後直接回傳；其他類型 → 導向 5 分鐘有效的簽名連結。並累計開啟次數。
// bucket 是私有的，檔案路徑不會外流；下架或沒有目前版本的文件一律 404。
import { NextRequest, NextResponse } from 'next/server'
import { MEDIA_BUCKET } from '@/lib/mediaConfig'
import { incView, publishedFile, versionInfo } from '@/lib/mediaDb'
import { prepareHtml, HTML_SANDBOX_HEADERS } from '@/lib/mediaHtml'
import { storageSignedUrl, storageText } from '@/lib/supabaseRest'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ slug: string; id: string }> }
const notFound = () => new NextResponse('Not Found', { status: 404 })

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { slug: raw, id } = await params
  let slug: string
  try { slug = decodeURIComponent(raw).toLowerCase() } catch { return notFound() }

  const media = await publishedFile(slug, id)
  if (!media) return notFound()
  const ver = await versionInfo(media.current_version_id)
  if (!ver) return notFound()

  if (ver.mime_type === 'text/html') {
    const html = await storageText(MEDIA_BUCKET, ver.file_path)
    if (html === null) return notFound()
    await incView(media.id)
    return new NextResponse(prepareHtml(html), { status: 200, headers: HTML_SANDBOX_HEADERS })
  }

  const signed = await storageSignedUrl(MEDIA_BUCKET, ver.file_path, 300)
  if (!signed) return notFound()
  await incView(media.id)

  const res = NextResponse.redirect(signed, 302)
  res.headers.set('Cache-Control', 'no-store')
  return res
}
