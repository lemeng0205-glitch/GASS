// v0.5.0 | 2026-11-05 | 下方改為「台灣」大按鈕 + 各國小按鈕（日本、美國…全部進同一個海外頁），滑過國家按鈕時地圖對應的點亮起
// v0.4.0 | 2026-11-05 | 首頁兩條軌道：台灣／海外。地圖顯示海外各地；語言依瀏覽器判斷
// v0.3.0 | 2026-11-05 | 地圖滿版無框、一個畫面放得下
// 保固承諾區塊：正式條款未提供前不顯示（避免公開頁出現「待提供」字樣）。
import Link from 'next/link'
import { COPY, REGIONS, OTHER_REGION } from '@/lib/portalConfig'
import { getLang } from '@/lib/serverLang'
import PortalHeader from '@/components/PortalHeader'
import WorldMap from '@/components/WorldMap'

type Props = { searchParams: Promise<{ lang?: string | string[] }> }

export default async function Home({ searchParams }: Props) {
  const param = (await searchParams).lang
  const explicitLang = param === 'zh' || param === 'en'
  // 語言：網址 ?lang= ＞ 使用者上次選的 ＞ 瀏覽器語言（中文就中文，其他英文），由 middleware 統一判斷
  const lang = await getLang()
  const q = explicitLang ? `?lang=${lang}` : ''

  const taiwan = REGIONS.find(r => r.track === 'tw')!
  const countries = REGIONS.filter(r => r.track === 'intl')

  // 滑過某國按鈕 ↔ 地圖上同一個國家的點，彼此呼應（只有常數代碼，沒有使用者輸入）
  const hoverCss = countries.map(c =>
    `.track-home:has(.pill[data-code="${c.code}"]:hover) .pin[data-code="${c.code}"] .pin-dot{transform:scale(1.6)}` +
    `.track-home:has(.pill[data-code="${c.code}"]:hover) .pin[data-code="${c.code}"] .pin-label{opacity:1;border-color:var(--accent)}` +
    `.track-home:has(.pin[data-code="${c.code}"]:hover) .pill[data-code="${c.code}"]{border-color:var(--accent);background:#fff;transform:translateY(-1px)}`
  ).join('')

  return (
    <>
      <style>{hoverCss}</style>
      <PortalHeader lang={lang} path="/" />
      <main className="track-home hero-glow flex min-h-[calc(100svh-57px)] flex-col">
        <section className="px-5 pt-10 text-center sm:pt-12">
          <p className="eyebrow fade-up">Global Service Center</p>
          <h1 className="fade-up d1 mx-auto mt-4 max-w-4xl text-balance text-[clamp(26px,4.4vw,52px)] font-light leading-[1.15] tracking-[0.02em]">
            <span className="gold-text">{COPY.heroTitle[lang]}</span>
          </h1>
          <span aria-hidden className="hairline fade-up d2 mx-auto mt-6" />
          <p className="fade-up d2 mx-auto mt-5 max-w-xl text-[14px] leading-relaxed text-[var(--soft)] sm:text-[15px]">{COPY.heroSub[lang]}</p>
        </section>

        <div className="fade-up d3 flex flex-1 items-center justify-center overflow-hidden py-6 sm:py-8">
          <WorldMap regions={REGIONS} lang={lang} comingSoon={COPY.comingSoon[lang]} explicitLang={explicitLang} />
        </div>

        <section className="fade-up d4 px-5 pb-10 sm:pb-12">
          <div className="mx-auto mb-5 flex max-w-xl items-center gap-4">
            <span aria-hidden className="h-px flex-1 bg-[var(--rule)]" />
            <h2 className="eyebrow">{COPY.pickRegion[lang]}</h2>
            <span aria-hidden className="h-px flex-1 bg-[var(--rule)]" />
          </div>

          <div className="mx-auto flex max-w-4xl flex-col items-center">
            <Link href={`${taiwan.href}${q}`} data-track="tw"
                  className="track-btn btn-gold group flex h-14 w-full max-w-[240px] items-center justify-between gap-3 rounded-full px-7 text-[15px] font-semibold tracking-wider">
              {taiwan.name[lang]}
              <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
            </Link>

            <p className="mb-3 mt-6 text-[11px] tracking-[0.3em] text-[var(--muted)]">{COPY.overseas[lang]}</p>
            <ul className="flex flex-wrap justify-center gap-2">
              {countries.map(c => (
                <li key={c.code}>
                  <Link href={`${c.href}${q}`} data-code={c.code}
                        className="pill track-pill flex h-10 items-center rounded-full px-4 text-[13px] font-medium tracking-wider">
                    {c.name[lang]}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={`${OTHER_REGION.href}${q}`}
                      className="track-pill flex h-10 items-center rounded-full px-4 text-[13px] font-medium tracking-wider text-[var(--soft)]">
                  {OTHER_REGION.name[lang]}
                </Link>
              </li>
            </ul>
          </div>
        </section>
      </main>
      <footer className="border-t border-[var(--rule)] py-8 text-center text-[11px] tracking-[0.2em] text-[var(--muted)]">
        © {new Date().getFullYear()} LEMENG · eiP
      </footer>
    </>
  )
}
