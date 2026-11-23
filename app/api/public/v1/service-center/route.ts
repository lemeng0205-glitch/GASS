// v0.1.0 | 2026-11-23 | 對外公開的唯讀 API：全球服務中心的國家、語言、類別、說明書清單、電子模板（給「海外保固頁面」等外部頁面嵌入）
// 只讀、不含任何個資、不碰保固登錄資料表、沒有寫入。回傳的欄位全部逐一挑選（不直接吐資料庫列）。
// 與網站頁面共用同一批函式（catalogFor／templatesFor），所以「已上架、勾選顯示、依國家」的過濾規則完全一致。
// 圖片網址是 1 小時有效的簽名連結 → 本 API 的快取時間遠小於 1 小時；呼叫端不要長期儲存圖片網址，每次重抓。
import { NextResponse } from 'next/server'
import { countryName, isCountryPage, countryLangsOf, TW, INTL } from '@/lib/countries'
import { getCountries } from '@/lib/countryDb'
import { getLanguages } from '@/lib/languageDb'
import { getCategories } from '@/lib/categoryDb'
import { catalogFor } from '@/lib/catalog'
import { templatesFor } from '@/lib/templates'

export const dynamic = 'force-dynamic'

const CACHE = 'public, s-maxage=300, stale-while-revalidate=600'   // 5 分鐘（簽名圖片連結 1 小時有效，遠大於此）

/** CORS：預設任何網站都能讀（內容本來就是公開頁面上的資料）；要收緊就設環境變數 PUBLIC_API_ORIGINS（逗號分隔的網域清單） */
function cors(req: Request): Record<string, string> {
  const allow = (process.env.PUBLIC_API_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
  const origin = req.headers.get('origin') || ''
  const base: Record<string, string> = { 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Max-Age': '86400' }
  if (!allow.length) return { ...base, 'Access-Control-Allow-Origin': '*' }
  return allow.includes(origin) ? { ...base, 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : { ...base, Vary: 'Origin' }
}

function json(req: Request, body: unknown, status = 200, cache = CACHE) {
  return NextResponse.json(body, { status, headers: { ...cors(req), 'Cache-Control': status === 200 ? cache : 'no-store' } })
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: cors(req) })
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    // 網站自己的網址（換網域不用改程式）：優先用環境變數，否則用這次請求的網址
    const origin = (process.env.PORTAL_PUBLIC_BASE || url.origin).replace(/\/+$/, '')
    const abs = (u: string | null | undefined) => (!u ? null : /^https?:\/\//i.test(u) ? u : `${origin}${u.startsWith('/') ? '' : '/'}${u}`)

    const ui = url.searchParams.get('ui') === 'zh' ? 'zh' : 'en'
    const countryParam = (url.searchParams.get('country') || '').toLowerCase()

    const [countries, languages, categories] = await Promise.all([getCountries(), getLanguages(), getCategories()])

    const data: Record<string, unknown> = {
      version: 1,
      portal: origin,
      countries: [
        { code: TW, name: { zh: '台灣', en: 'Taiwan' }, languages: ['zh-TW'], page_url: abs('/tw') },
        ...countries.map(c => ({ code: c.code, name: { zh: c.nameZh, en: c.nameEn }, languages: c.langs, page_url: abs(`/country/${c.code}`) })),
        { code: INTL, name: { zh: '全部海外', en: 'All overseas' }, languages: ['en'], page_url: abs(`/country/${INTL}`) },
      ],
      languages: languages.map(l => ({ code: l.value, label: l.label })),
      categories: categories.map(c => ({ key: c.key, name: { zh: c.nameZh, en: c.nameEn } })),
    }

    if (countryParam) {
      const isTw = countryParam === TW
      if (!/^[a-z]{2,5}$/.test(countryParam) || (!isTw && !isCountryPage(countryParam, countries))) {
        return json(req, { success: false, error: 'unknown country' }, 404)
      }
      const [groups, templates] = await Promise.all([catalogFor(countryParam, ui), templatesFor(countryParam)])
      data.country = {
        code: countryParam,
        name: isTw ? { zh: '台灣', en: 'Taiwan' } : countryName(countryParam, countries),
        languages: countryLangsOf(countryParam, countries),
        // 說明書：依類別分組；每個產品一筆。languages 有多筆時，每筆是一個語言版本的連結
        manual_groups: groups.filter(g => g.items.length > 0).map(g => ({
          key: g.key,
          label: g.label,                                   // 已依 ui 語言翻好
          items: g.items.map(p => ({
            slug: p.slug,
            name: p.name,
            url: abs(p.url),                                // 說明書頁（請用新分頁開啟）
            image: p.image ?? (p.noImage ? null : abs(`/portal/products/${p.slug}.png`)),
            languages: (p.alts ?? []).map(a => ({ label: a.label, url: abs(a.url) })),
          })),
        })),
        templates: templates.map(t => ({
          title: t.title, format: t.ext, size_bytes: t.size, download_url: abs(t.url), preview_image: t.cover,
        })),
      }
    }
    return json(req, { success: true, data })
  } catch {
    return json(req, { success: false, error: 'server error' }, 500)
  }
}
