// v0.1.0 | 2026-11-05 | 保固登錄頁
import Link from 'next/link'
import PortalHeader from '@/components/PortalHeader'
import WarrantyForm from '@/components/WarrantyForm'
import { COPY, pickLang, type L10n } from '@/lib/portalConfig'

type Props = { searchParams: Promise<{ lang?: string | string[] }> }

const TITLE: L10n = { zh: '保固登錄', en: 'Warranty registration' }
const SUB: L10n = { zh: '登錄您的產品以享保固服務。', en: 'Register your product to activate warranty service.' }

export default async function Page({ searchParams }: Props) {
  const lang = pickLang((await searchParams).lang)
  const q = lang === 'en' ? '?lang=en' : ''
  return (
    <>
      <PortalHeader lang={lang} path="/register" />
      <main className="mx-auto max-w-3xl px-5 pb-24">
        <Link href={`/${q}`} className="fade-up mt-8 inline-block text-[13px] tracking-wider text-[var(--soft)] transition-colors hover:text-[var(--accent)]">
          {COPY.backGlobal[lang]}
        </Link>
        <section className="pt-8 pb-10">
          <p className="eyebrow fade-up">Warranty</p>
          <h1 className="fade-up d1 mt-4 text-[clamp(28px,5vw,48px)] font-light leading-tight tracking-[0.02em]">
            <span className="gold-text">{TITLE[lang]}</span>
          </h1>
          <p className="fade-up d2 mt-4 text-[15px] leading-relaxed text-[var(--soft)]">{SUB[lang]}</p>
        </section>
        <WarrantyForm lang={lang} />
      </main>
    </>
  )
}
