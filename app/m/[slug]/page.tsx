// v0.2.0 | 2026-11-18 | 支援 ?country=<代碼>：先依「顯示國家」挑文件，再依語言挑
// v0.1.0 | 2026-11-18 | 說明書（消費者頁，公開）：由 ERP 搬來
// 網址 /m/<編號>（編號通常是商品編號，印在 QR 上永不變）。後台覆蓋檔案後這裡自動顯示新版。
//   - 只有一份文件 → 直接開檔案（開啟次數在 /f/ 那邊計）
//   - 網址帶 ?lang=ja（可用逗號指定順序：ja,en）：有該語言就直接開；沒有就退回英文；都沒有才顯示選擇頁
//   - 沒帶語言且有多種語言 → 顯示選擇頁
// 只讀已上架且有目前版本的文件，且只讀公開需要的欄位。
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PRODUCTS } from '@/lib/portalConfig'
import { langPreference } from '@/lib/mediaConfig'
import { getLanguages } from '@/lib/languageDb'
import { publishedBySlug } from '@/lib/mediaDb'
import { getLang } from '@/lib/serverLang'
import { allowedCodes, docsForCountry, isCountryCode } from '@/lib/countries'
import { getAllCountries } from '@/lib/countryDb'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '產品資料 | Product manuals' }

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string | string[]; country?: string | string[] }> }

const T = {
  zh: { heading: '產品資料', open: '開啟', updated: '更新於', none: '找不到資料', noneSub: '這個檔案可能已下架，或連結有誤。', kind: { manual: '說明書', image: '圖片', document: '文件', other: '其他' } },
  en: { heading: 'Product manuals', open: 'Open', updated: 'Updated', none: 'Not found', noneSub: 'This file may have been removed, or the link is incorrect.', kind: { manual: 'Manual', image: 'Image', document: 'Document', other: 'Other' } },
} as const

function safeSlug(raw: string): string {
  try { return decodeURIComponent(raw).toLowerCase() } catch { return '' }
}

export default async function ManualPage({ params, searchParams }: Props) {
  const slug = safeSlug((await params).slug)
  const sp = await searchParams
  const langParam = sp.lang
  // 國家代碼要在清單內（含已停用的，舊連結才不會失效）；亂填的忽略
  const country = typeof sp.country === 'string' && sp.country
    && isCountryCode(sp.country, allowedCodes(await getAllCountries(), true)) ? sp.country : null
  const ui = await getLang()
  const t = T[ui]

  // 帶了國家：先挑出給該國的文件（專屬該國的優先，否則用全部海外）；
  // 該國完全沒有指定這個產品時，退回全部文件，避免連結打不開
  const all = await publishedBySlug(slug)
  const forCountry = country ? docsForCountry(all, country) : all
  const docs = forCountry.length ? forCountry : all
  if (docs.length === 1) redirect(`/m/${encodeURIComponent(slug)}/f/${docs[0].id}`)
  for (const want of langPreference(typeof langParam === 'string' ? langParam : undefined)) {
    const hit = docs.find(d => d.lang.toLowerCase() === want)
    if (hit) redirect(`/m/${encodeURIComponent(slug)}/f/${hit.id}`)
  }

  if (docs.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold">{t.none}</p>
          <p className="mt-2 text-sm text-[var(--soft)]">{t.noneSub}</p>
        </div>
      </main>
    )
  }

  const langList = await getLanguages()
  const langLabel = (l: string) => langList.find(x => x.value === l)?.label ?? l
  const order = (l: string) => { const i = langList.findIndex(x => x.value === l); return i < 0 ? 99 : i }
  const sorted = [...docs].sort((a, b) => order(a.lang) - order(b.lang))
  const product = PRODUCTS.find(p => p.slug === slug)
  const name = product ? (ui === 'en' && product.nameEn ? product.nameEn : product.name) : sorted[0].title
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(ui === 'en' ? 'en-US' : 'zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' })

  return (
    <main className="px-4 py-10">
      <div className="mx-auto max-w-md">
        {product && !product.noImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/portal/products/${product.slug}.png`} alt="" className="plinth mx-auto mb-4 h-36 w-36 rounded-2xl object-contain p-2" />
        )}
        <h1 className="text-center text-xl font-bold">{name}</h1>
        <p className="mt-1 text-center text-sm text-[var(--soft)]">{t.heading}</p>

        <ul className="mt-6 space-y-3">
          {sorted.map(d => (
            <li key={d.id}>
              <a href={`/m/${encodeURIComponent(slug)}/f/${d.id}`} className="glass glass-hover block rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{d.title}</p>
                    <p className="mt-0.5 text-xs text-[var(--soft)]">
                      {t.kind[d.kind as keyof typeof t.kind] ?? d.kind}・{langLabel(d.lang)}・{t.updated} {fmt(d.updated_at)}
                    </p>
                  </div>
                  <span className="btn-gold shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold">{t.open}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
