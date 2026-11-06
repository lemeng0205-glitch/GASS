// v0.6.0 | 2026-11-06 | 移除標題上方的「eiP Service」小字
// v0.5.0 | 2026-11-06 | 說明書直接顯示，先選「觸控筆／鍵盤保護殼」再看產品（ManualTabs）
// v0.4.0 | 2026-11-06 | 移除「一鍵複製訂單資訊」；快捷卡片改為 QuickLinks
// v0.3.0 | 2026-11-05 | 產品依市場（台灣／海外）篩選；尚無圖片的產品顯示 eiP 底座
// v0.2.0 | 2026-11-04 | 地區服務中心：高級質感版型（快捷入口 + 一鍵複製 + 產品說明書）
import Link from 'next/link'
import {
  COPY, PRODUCTS, PRODUCT_LINES, manualUrl,
  type PortalLang, type QuickLink, type L10n, type Market,
} from '@/lib/portalConfig'
import PortalHeader from './PortalHeader'
import QuickLinks from './QuickLinks'
import ManualTabs from './ManualTabs'

export default function RegionPage(props: {
  lang: PortalLang; path: string; market: Market; title: L10n; sub: L10n; links: QuickLink[]
}) {
  const { lang, path, market, title, sub, links } = props
  const q = `?lang=${lang}`
  const groups = PRODUCT_LINES.map(line => ({
    key: line.key,
    label: line.label[lang],
    items: PRODUCTS.filter(p => p.line === line.key && p.markets.includes(market)).map(p => ({
      slug: p.slug,
      name: lang === 'en' && p.nameEn ? p.nameEn : p.name,
      url: manualUrl(p.slug, market),
      noImage: p.noImage,
    })),
  }))
  return (
    <>
      <PortalHeader lang={lang} path={path} />
      <main className="mx-auto max-w-6xl px-5 pb-24">
        <Link href={`/${q}`} className="fade-up mt-8 inline-block text-[13px] tracking-wider text-[var(--soft)] transition-colors hover:text-[var(--accent)]">
          {COPY.backGlobal[lang]}
        </Link>

        <section className="pt-8 pb-10">
          <h1 className="fade-up d1 mt-4 text-[clamp(28px,5vw,52px)] font-light leading-tight tracking-[0.02em]">
            <span className="gold-text">{title[lang]}</span>
          </h1>
          <p className="fade-up d2 mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--soft)]">{sub[lang]}</p>
        </section>

        <QuickLinks links={links} lang={lang} />

        <section id="manuals" className="mt-16 scroll-mt-24">
          <h2 className="eyebrow mb-5">{COPY.manuals[lang]}</h2>
          <ManualTabs groups={groups} openLabel={COPY.openManual[lang]} />
        </section>
      </main>
      <footer className="border-t border-[var(--rule)] py-8 text-center text-[11px] tracking-[0.2em] text-[var(--muted)]">
        © {new Date().getFullYear()} LEMENG · eiP
      </footer>
    </>
  )
}
