// v0.3.0 | 2026-11-05 | 首頁：地圖滿版無框、一個畫面放得下；地區改為大按鈕（已開通在前），手機以按鈕為主
// 保固承諾區塊：正式條款未提供前不顯示（避免公開頁出現「待提供」字樣）。
import Link from 'next/link'
import { COPY, REGIONS, OTHER_REGION, pickLang } from '@/lib/portalConfig'
import PortalHeader from '@/components/PortalHeader'
import WorldMap from '@/components/WorldMap'

type Props = { searchParams: Promise<{ lang?: string | string[] }> }

export default async function Home({ searchParams }: Props) {
  const lang = pickLang((await searchParams).lang)
  const q = lang === 'en' ? '?lang=en' : ''
  const all = [...REGIONS.map(r => ({ key: r.code, name: r.name, href: r.href })),
               { key: 'other', name: OTHER_REGION.name, href: OTHER_REGION.href }]
  // 已開通的排前面
  const regions = [...all.filter(r => r.href), ...all.filter(r => !r.href)]

  return (
    <>
      <PortalHeader lang={lang} path="/" />
      <main className="flex min-h-[calc(100svh-57px)] flex-col">
        <section className="px-5 pt-12 text-center sm:pt-16">
          <p className="eyebrow fade-up">Global Service &amp; Warranty</p>
          <h1 className="fade-up d1 mx-auto mt-4 max-w-4xl text-balance text-[clamp(26px,4.4vw,52px)] font-light leading-[1.15] tracking-[0.02em]">
            <span className="gold-text">{COPY.heroTitle[lang]}</span>
          </h1>
          <p className="fade-up d2 mx-auto mt-4 max-w-xl text-[14px] leading-relaxed text-[var(--soft)] sm:text-[15px]">{COPY.heroSub[lang]}</p>
        </section>

        <div className="fade-up d3 flex flex-1 items-center py-8 sm:py-12">
          <WorldMap regions={REGIONS} lang={lang} comingSoon={COPY.comingSoon[lang]} />
        </div>

        <section className="fade-up d4 px-5 pb-10 sm:pb-12">
          <h2 className="eyebrow mb-4 text-center">{COPY.pickRegion[lang]}</h2>
          <ul className="mx-auto grid max-w-3xl grid-cols-2 gap-3 md:flex md:max-w-none md:flex-wrap md:justify-center">
            {regions.map(r => (
              <li key={r.key} className="md:min-w-[170px]">
                {r.href ? (
                  <Link href={`${r.href}${q}`}
                        className="btn-gold group flex h-14 items-center justify-between gap-3 rounded-full px-6 text-[15px] font-semibold tracking-wider">
                    {r.name[lang]}
                    <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                ) : (
                  <div className="flex h-14 flex-col items-center justify-center rounded-full border border-dashed border-[var(--rule)] px-4 text-center leading-tight text-[var(--muted)]">
                    <span className="text-[14px]">{r.name[lang]}</span>
                    <span className="mt-0.5 text-[10px] tracking-[0.18em]">{COPY.comingSoon[lang]}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>
      <footer className="border-t border-[var(--rule)] py-8 text-center text-[11px] tracking-[0.2em] text-[var(--muted)]">
        © {new Date().getFullYear()} LEMENG · eiP
      </footer>
    </>
  )
}
