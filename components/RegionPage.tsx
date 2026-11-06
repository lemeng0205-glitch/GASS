// v0.4.0 | 2026-11-06 | 移除「一鍵複製訂單資訊」；快捷卡片改為 QuickLinks，點「產品說明書」於下方展開
// v0.3.0 | 2026-11-05 | 產品依市場（台灣／海外）篩選；尚無圖片的產品顯示 eiP 底座
// v0.2.0 | 2026-11-04 | 地區服務中心：高級質感版型（快捷入口 + 一鍵複製 + 產品說明書）
import Link from 'next/link'
import {
  COPY, PRODUCTS, PRODUCT_LINES, manualUrl,
  type PortalLang, type QuickLink, type L10n, type Market,
} from '@/lib/portalConfig'
import PortalHeader from './PortalHeader'
import QuickLinks from './QuickLinks'

export default function RegionPage(props: {
  lang: PortalLang; path: string; market: Market; title: L10n; sub: L10n; links: QuickLink[]
}) {
  const { lang, path, market, title, sub, links } = props
  const q = `?lang=${lang}`
  return (
    <>
      <PortalHeader lang={lang} path={path} />
      <main className="mx-auto max-w-6xl px-5 pb-24">
        <Link href={`/${q}`} className="fade-up mt-8 inline-block text-[13px] tracking-wider text-[var(--soft)] transition-colors hover:text-[var(--accent)]">
          {COPY.backGlobal[lang]}
        </Link>

        <section className="pt-8 pb-10">
          <p className="eyebrow fade-up">eiP Service</p>
          <h1 className="fade-up d1 mt-4 text-[clamp(28px,5vw,52px)] font-light leading-tight tracking-[0.02em]">
            <span className="gold-text">{title[lang]}</span>
          </h1>
          <p className="fade-up d2 mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--soft)]">{sub[lang]}</p>
        </section>

        <QuickLinks links={links} lang={lang}>
        <section className="pt-14">
          <h2 className="eyebrow">{COPY.manuals[lang]}</h2>
          {PRODUCT_LINES.map(line => (
            <div key={line.key} className="mt-8">
              <h3 className="mb-4 text-[15px] font-medium tracking-wider">{line.label[lang]}</h3>
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {PRODUCTS.filter(p => p.line === line.key && p.markets.includes(market)).map(p => (
                  <li key={p.slug}>
                    <a href={manualUrl(p.slug)} target="_blank" rel="noopener noreferrer"
                       className="glass glass-hover group flex h-full flex-col overflow-hidden rounded-2xl">
                      {p.noImage ? (
                        <div aria-hidden className="plinth flex aspect-square w-full items-center justify-center text-[22px] font-light tracking-[0.3em] text-[var(--muted)]">eiP</div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`/portal/products/${p.slug}.png`} alt="" loading="lazy"
                             className="plinth aspect-square w-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]" />
                      )}
                      <div className="flex flex-1 flex-col p-4">
                        <p className="text-[14px] font-medium leading-snug">{lang === 'en' && p.nameEn ? p.nameEn : p.name}</p>
                        <span className="mt-auto pt-3 text-[12px] tracking-wider text-[var(--accent)]">{COPY.openManual[lang]} →</span>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
        </QuickLinks>
      </main>
      <footer className="border-t border-[var(--rule)] py-8 text-center text-[11px] tracking-[0.2em] text-[var(--muted)]">
        © {new Date().getFullYear()} LEMENG · eiP
      </footer>
    </>
  )
}
