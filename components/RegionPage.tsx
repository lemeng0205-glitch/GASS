// v0.9.0 | 2026-11-26 | 傳入 warranty 時，「保固登錄」卡片改為在頁面內顯示表單（#warranty）
// v0.8.0 | 2026-11-19 | 「產品說明書」「電子模板」卡片改為切換下方內容（RegionBody）；電子模板清單由媒體庫自動產生
// v0.7.0 | 2026-11-18 | 說明書清單改由呼叫端傳入（依國家從媒體庫自動產生，見 lib/catalog.ts）
// v0.6.0 | 2026-11-06 | 移除標題上方的「eiP Service」小字
// v0.5.0 | 2026-11-06 | 說明書直接顯示，先選「觸控筆／鍵盤保護殼」再看產品（ManualTabs）
// v0.4.0 | 2026-11-06 | 移除「一鍵複製訂單資訊」；快捷卡片改為 QuickLinks
// v0.3.0 | 2026-11-05 | 產品依市場（台灣／海外）篩選；尚無圖片的產品顯示 eiP 底座
// v0.2.0 | 2026-11-04 | 地區服務中心：高級質感版型（快捷入口 + 一鍵複製 + 產品說明書）
import Link from 'next/link'
import { COPY, type PortalLang, type QuickLink, type L10n } from '@/lib/portalConfig'
import PortalHeader from './PortalHeader'
import RegionBody from './RegionBody'
import type { ManualGroup } from './ManualTabs'
import type { TemplateItem } from '@/lib/templates'

export default function RegionPage(props: {
  lang: PortalLang; path: string; title: L10n; sub: L10n; links: QuickLink[]; groups: ManualGroup[]; templates?: TemplateItem[]
  warranty?: { products: { category: string; name: string }[]; supportEmail?: string }
}) {
  const { lang, path, title, sub, groups } = props
  const templates = props.templates ?? []
  // 有上傳電子模板就捲到下方清單；還沒上傳時沿用原本的外部連結
  const links = props.links.map(l =>
    l.key === 'templates' && templates.length ? { ...l, href: '#templates' }
    : l.key === 'warranty' && props.warranty ? { ...l, href: '#warranty' }
    : l)
  const q = `?lang=${lang}`
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

        {/* 點「產品說明書」「電子模板」卡片 → 下方內容切換（RegionBody 是 client component） */}
        <RegionBody lang={lang} links={links} groups={groups} templates={templates}
          manualsTitle={COPY.manuals[lang]} templatesTitle={COPY.templates[lang]}
          openLabel={COPY.openManual[lang]} downloadLabel={COPY.download[lang]} warranty={props.warranty} />
      </main>
      <footer className="border-t border-[var(--rule)] py-8 text-center text-[11px] tracking-[0.2em] text-[var(--muted)]">
        © {new Date().getFullYear()} LEMENG · eiP
      </footer>
    </>
  )
}
