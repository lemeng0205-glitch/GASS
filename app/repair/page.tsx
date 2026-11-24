// v0.1.0 | 2026-11-24 | 維修諮詢頁：表單送出後寄信給客服
import Link from 'next/link'
import PortalHeader from '@/components/PortalHeader'
import RepairForm from '@/components/RepairForm'
import { COPY, type L10n } from '@/lib/portalConfig'
import { getLang } from '@/lib/serverLang'

const TITLE: L10n = { zh: '維修諮詢', en: 'Repair inquiry' }
const SUB: L10n = { zh: '描述您遇到的問題，客服會以 Email 回覆。', en: 'Tell us what is wrong and our support team will reply by email.' }

export default async function Page() {
  const lang = await getLang()
  const q = lang === 'en' ? '?lang=en' : ''
  return (
    <>
      <PortalHeader lang={lang} path="/repair" />
      <main className="mx-auto max-w-3xl px-5 pb-24">
        <Link href={`/${q}`} className="fade-up mt-8 inline-block text-[13px] tracking-wider text-[var(--soft)] transition-colors hover:text-[var(--accent)]">
          {COPY.backGlobal[lang]}
        </Link>
        <section className="pt-8 pb-10">
          <p className="eyebrow fade-up">Support</p>
          <h1 className="fade-up d1 mt-4 text-[clamp(28px,5vw,48px)] font-light leading-tight tracking-[0.02em]">
            <span className="gold-text">{TITLE[lang]}</span>
          </h1>
          <p className="fade-up d2 mt-4 text-[15px] leading-relaxed text-[var(--soft)]">{SUB[lang]}</p>
        </section>
        <RepairForm lang={lang} />
      </main>
    </>
  )
}
