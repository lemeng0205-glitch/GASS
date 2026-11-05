// v0.4.0 | 2026-11-05 | 首頁改為兩條軌道：台灣／海外。地圖顯示海外各地，點進去都是同一個海外頁；語言依瀏覽器判斷
// v0.3.0 | 2026-11-05 | 地圖滿版無框、一個畫面放得下
// 保固承諾區塊：正式條款未提供前不顯示（避免公開頁出現「待提供」字樣）。
import Link from 'next/link'
import { headers } from 'next/headers'
import { COPY, REGIONS, TRACKS, pickLang } from '@/lib/portalConfig'
import PortalHeader from '@/components/PortalHeader'
import WorldMap from '@/components/WorldMap'

type Props = { searchParams: Promise<{ lang?: string | string[] }> }

export default async function Home({ searchParams }: Props) {
  const param = (await searchParams).lang
  const explicitLang = param === 'zh' || param === 'en'
  // 沒選過語言：瀏覽器語言是中文就用中文，其他一律英文（首頁是全球入口）
  const accept = (await headers()).get('accept-language') ?? ''
  const lang = pickLang(param, /^zh/i.test(accept.trim()) ? 'zh' : 'en')
  const q = explicitLang ? `?lang=${lang}` : ''

  return (
    <>
      <PortalHeader lang={lang} path="/" />
      <main className="track-home hero-glow flex min-h-[calc(100svh-57px)] flex-col">
        <section className="px-5 pt-12 text-center sm:pt-16">
          <p className="eyebrow fade-up">Global Service &amp; Warranty</p>
          <h1 className="fade-up d1 mx-auto mt-4 max-w-4xl text-balance text-[clamp(26px,4.4vw,52px)] font-light leading-[1.15] tracking-[0.02em]">
            <span className="gold-text">{COPY.heroTitle[lang]}</span>
          </h1>
          <span aria-hidden className="hairline fade-up d2 mx-auto mt-6" />
          <p className="fade-up d2 mx-auto mt-5 max-w-xl text-[14px] leading-relaxed text-[var(--soft)] sm:text-[15px]">{COPY.heroSub[lang]}</p>
        </section>

        <div className="fade-up d3 flex flex-1 items-center py-8 sm:py-12">
          <WorldMap regions={REGIONS} lang={lang} comingSoon={COPY.comingSoon[lang]} explicitLang={explicitLang} />
        </div>

        <section className="fade-up d4 px-5 pb-10 sm:pb-12">
          <div className="mx-auto mb-5 flex max-w-xl items-center gap-4">
            <span aria-hidden className="h-px flex-1 bg-[var(--rule)]" />
            <h2 className="eyebrow">{COPY.pickRegion[lang]}</h2>
            <span aria-hidden className="h-px flex-1 bg-[var(--rule)]" />
          </div>
          <ul className="mx-auto grid max-w-md grid-cols-2 gap-3 md:max-w-xl md:gap-4">
            {TRACKS.map(t => (
              <li key={t.key}>
                <Link href={`${t.href}${q}`} data-track={t.key}
                      className="track-btn btn-gold group flex h-14 items-center justify-between gap-3 rounded-full px-6 text-[15px] font-semibold tracking-wider">
                  {t.name[lang]}
                  <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
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
