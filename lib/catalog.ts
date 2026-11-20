// v0.5.0 | 2026-11-20 | 說明書卡片主圖：專員上傳的主圖優先
// v0.4.0 | 2026-11-19 | 每個產品都帶語言標籤；語言名稱讀資料庫
// v0.3.0 | 2026-11-19 | 類別清單改由資料庫提供（含英文名稱，海外頁顯示英文）
// v0.2.0 | 2026-11-19 | 說明書類別：依專員指定的類別分組（觸控筆／鍵盤保護殼／自訂），未指定沿用產品設定
// v0.1.0 | 2026-11-18 | 國家頁的說明書清單：由媒體庫自動產生（專員上傳並選了國家就會出現）
// 產品名稱與圖片：portalConfig 的 PRODUCTS 有的用設定；沒有的（新產品）用文件名稱 + eiP 佔位圖。
import 'server-only'
import { COPY, PRODUCTS, manualUrl, type PortalLang } from './portalConfig'
import { getCategories } from './categoryDb'
import { countryLangsOf, docsForCountry } from './countries'
import { getAllCountries } from './countryDb'
import { getLanguages, labelMap } from './languageDb'
import { coverUrl, publishedManuals, type PublicDoc } from './mediaDb'
import type { ManualGroup, ManualItem } from '@/components/ManualTabs'

export async function catalogFor(country: string, ui: PortalLang): Promise<ManualGroup[]> {
  const bySlug = new Map<string, PublicDoc[]>()
  for (const d of await publishedManuals()) bySlug.set(d.slug, [...(bySlug.get(d.slug) ?? []), d])

  const langName = labelMap(await getLanguages())
  const langLabel = (l: string) => langName.get(l) ?? l
  const pref = countryLangsOf(country, await getAllCountries())
  const rank = (l: string) => { const i = pref.indexOf(l); return i < 0 ? 99 : i }
  const items: Array<ManualItem & { line: string; order: number }> = []
  const coverJobs: Array<Promise<void>> = []

  for (const [slug, docs] of bySlug) {
    const chosen = docsForCountry(docs, country)
    if (!chosen.length) continue                       // 這個國家沒有指定這個產品 → 不顯示
    const langs = [...new Set(chosen.map(d => d.lang))].sort((a, b) => rank(a) - rank(b))
    const main = chosen.find(d => d.lang === langs[0]) ?? chosen[0]
    const meta = PRODUCTS.find(p => p.slug === slug)
    const item: ManualItem & { line: string; order: number } = {
      slug,
      name: meta ? (ui === 'en' && meta.nameEn ? meta.nameEn : meta.name) : main.title,
      url: manualUrl(slug, country, pref),
      noImage: !meta || !!meta.noImage,
      alts: langs.map(l => ({ label: langLabel(l), url: manualUrl(slug, country, pref, l) })),   // 單一語言也帶（卡片上顯示語言標籤）
      // 專員在媒體庫指定的類別優先；沒指定就用產品設定檔的分類，都沒有歸「其他」
      line: (chosen.find(d => d.category)?.category || meta?.line || 'other') as string,
      order: meta ? PRODUCTS.indexOf(meta) : 10_000,
    }
    // 主圖：專員在 ERP 上傳的優先（主要語言那份優先，沒有就用同產品其他語言的）；沒有才用內建圖片，再沒有顯示 eiP 佔位
    const cp = (main.cover_path ? main : chosen.find(d => d.cover_path))?.cover_path
    if (cp) coverJobs.push(coverUrl(cp).then(u => { if (u) { item.image = u; item.noImage = false } }))
    items.push(item)
  }

  await Promise.all(coverJobs)

  // 類別清單來自資料庫（專員在 ERP「類別管理」維護，依排序）；英文介面顯示英文名稱 → 其他
  const cats = await getCategories()
  const known = new Set<string>([...cats.map(c => c.key), 'other'])
  const lines = [
    ...cats.map(c => ({ key: c.key, label: ui === 'en' ? c.nameEn : c.nameZh })),
    { key: 'other', label: COPY.otherGroup[ui] },
  ]
  for (const i of items) if (!known.has(i.line)) i.line = 'other'   // 類別已被刪除／不存在 → 其他
  return lines.map(g => ({
    key: g.key,
    label: g.label,
    items: items.filter(i => i.line === g.key)
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
      .map(({ line: _l, order: _o, ...rest }) => rest),
  }))
}
