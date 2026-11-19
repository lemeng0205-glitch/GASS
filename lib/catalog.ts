// v0.1.0 | 2026-11-18 | 國家頁的說明書清單：由媒體庫自動產生（專員上傳並選了國家就會出現）
// 產品名稱與圖片：portalConfig 的 PRODUCTS 有的用設定；沒有的（新產品）用文件名稱 + eiP 佔位圖。
import 'server-only'
import { COPY, PRODUCTS, PRODUCT_LINES, manualUrl, type PortalLang } from './portalConfig'
import { countryLangsOf, docsForCountry } from './countries'
import { getAllCountries } from './countryDb'
import { langLabel } from './mediaConfig'
import { publishedManuals, type PublicDoc } from './mediaDb'
import type { ManualGroup, ManualItem } from '@/components/ManualTabs'

export async function catalogFor(country: string, ui: PortalLang): Promise<ManualGroup[]> {
  const bySlug = new Map<string, PublicDoc[]>()
  for (const d of await publishedManuals()) bySlug.set(d.slug, [...(bySlug.get(d.slug) ?? []), d])

  const pref = countryLangsOf(country, await getAllCountries())
  const rank = (l: string) => { const i = pref.indexOf(l); return i < 0 ? 99 : i }
  const items: Array<ManualItem & { line: string; order: number }> = []

  for (const [slug, docs] of bySlug) {
    const chosen = docsForCountry(docs, country)
    if (!chosen.length) continue                       // 這個國家沒有指定這個產品 → 不顯示
    const langs = [...new Set(chosen.map(d => d.lang))].sort((a, b) => rank(a) - rank(b))
    const main = chosen.find(d => d.lang === langs[0]) ?? chosen[0]
    const meta = PRODUCTS.find(p => p.slug === slug)
    items.push({
      slug,
      name: meta ? (ui === 'en' && meta.nameEn ? meta.nameEn : meta.name) : main.title,
      url: manualUrl(slug, country, pref),
      noImage: !meta || !!meta.noImage,
      alts: langs.length > 1 ? langs.map(l => ({ label: langLabel(l), url: manualUrl(slug, country, pref, l) })) : undefined,
      line: meta?.line ?? 'other',
      order: meta ? PRODUCTS.indexOf(meta) : 10_000,
    })
  }

  const lines = [...PRODUCT_LINES.map(l => ({ key: l.key as string, label: l.label[ui] })), { key: 'other', label: COPY.otherGroup[ui] }]
  return lines.map(g => ({
    key: g.key,
    label: g.label,
    items: items.filter(i => i.line === g.key)
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
      .map(({ line: _l, order: _o, ...rest }) => rest),
  }))
}
