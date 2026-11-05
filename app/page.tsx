// v0.2.0 | 2026-11-04 | 首頁：高級質感改版（大標題 + 發光世界地圖 + 地區入口）
// 保固承諾區塊：正式條款未提供前不顯示（避免公開頁出現「待提供」字樣）。
import Link from 'next/link'
import { COPY, REGIONS, OTHER_REGION, pickLang } from '@/lib/portalConfig'
import PortalHeader from '@/components/PortalHeader'
import WorldMap from '@/components/WorldMap'

type Props = { searchParams: Promise<{ lang?: string | string[] }> }

export default async function Home({ searchParams }: Props) {
  const lang = pickLang((await searchParams).lang)
  const q = lang === 'en' ? '?lang=en' : ''
  const regionsAll = [...REGIONS.map(r => ({ key: r.code, name: r.name, href: r.href })),
                      { key: 'other', name: OTHER_REGION.name, href: OTHER_REGION.href }]

  return (
    <>
      <PortalHeader lang={lang} path="/" />
      <main className="mx-auto max-w-6xl px-5 pb-24">
        <section className="pt-16 pb-10 text-center sm:pt-24">
          <p className="eyebrow fade-up">Global Service &amp; Warranty</p>
          <h1 className="fade-up d1 mx-auto mt-6 max-w-4xl text-balance text-[clamp(30px,5.2vw,58px)] font-light leading-[1.15] tracking-[0.02em]">
            <span className="gold-text">{COPY.heroTitle[lang]}</span>
          </h1>
          <p className="fade-up d2 mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-[var(--soft)]">{COPY.heroSub[lang]}</p>
        </section>

        <section className="glass fade-up d3 rounded-[28px] p-4 sm:p-10">
          <WorldMap regions={REGIONS} lang={lang} comingSoon={COPY.comingSoon[lang]} />
        </section>

        <section className="fade-up d4 mt-14">
          <h2 className="eyebrow mb-5">{COPY.pickRegion[lang]}</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {regionsAll.map(r => (
              <li key={r.key}>
                {r.href ? (
                  <Link href={`${r.href}${q}`}
                        className="glass glass-hover group flex items-center justify-between rounded-2xl px-6 py-5 text-[16px] font-medium">
                    {r.name[lang]}
                    <span aria-hidden className="text-[var(--accent)] transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                ) : (
                  <div className="flex items-center justify-between rounded-2xl border border-dashed border-[var(--rule)] px-6 py-5 text-[var(--muted)]">
                    {r.name[lang]}
                    <span className="text-[11px] tracking-[0.18em]">{COPY.comingSoon[lang]}</span>
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
