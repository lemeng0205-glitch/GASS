// v0.2.0 | 2026-11-04 | 地區服務中心：高級質感版型（快捷入口 + 一鍵複製 + 產品說明書）
import Link from 'next/link'
import {
  COPY, PRODUCTS, PRODUCT_LINES, manualUrl,
  type PortalLang, type QuickLink, type L10n,
} from '@/lib/portalConfig'
import PortalHeader from './PortalHeader'
import CopyOrderInfo from './CopyOrderInfo'

export default function RegionPage(props: {
  lang: PortalLang; path: string; title: L10n; sub: L10n; links: QuickLink[]
}) {
  const { lang, path, title, sub, links } = props
  const q = lang === 'en' ? '?lang=en' : ''
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

        <section className="fade-up d3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {links.map(l => {
            const external = l.href.startsWith('http')
            return (
              <a key={l.key} href={l.href}
                 {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                 className="glass glass-hover group rounded-2xl p-5 sm:p-6">
                <p className="flex items-center justify-between text-[16px] font-medium">
                  {l.label[lang]}
                  <span aria-hidden className="text-[var(--accent)] transition-transform group-hover:translate-x-1">→</span>
                </p>
                <p className="mt-2 text-[13px] leading-snug text-[var(--soft)]">{l.desc[lang]}</p>
              </a>
            )
          })}
        </section>

        <CopyOrderInfo lang={lang} />

        <section id="manuals" className="mt-20 scroll-mt-24">
          <h2 className="eyebrow">{COPY.manuals[lang]}</h2>
          {PRODUCT_LINES.map(line => (
            <div key={line.key} className="mt-8">
              <h3 className="mb-4 text-[15px] font-medium tracking-wider">{line.label[lang]}</h3>
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {PRODUCTS.filter(p => p.line === line.key).map(p => (
                  <li key={p.slug}>
                    <a href={manualUrl(p.slug)} target="_blank" rel="noopener noreferrer"
                       className="glass glass-hover group flex h-full flex-col overflow-hidden rounded-2xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/portal/products/${p.slug}.png`} alt="" loading="lazy"
                           className="plinth aspect-square w-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]" />
                      <div className="flex flex-1 flex-col p-4">
                        <p className="text-[14px] font-medium leading-snug">{p.name}</p>
                        <span className="mt-auto pt-3 text-[12px] tracking-wider text-[var(--accent)]">{COPY.openManual[lang]} →</span>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </main>
      <footer className="border-t border-[var(--rule)] py-8 text-center text-[11px] tracking-[0.2em] text-[var(--muted)]">
        © {new Date().getFullYear()} LEMENG · eiP
      </footer>
    </>
  )
}
