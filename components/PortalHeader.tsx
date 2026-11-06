// v0.3.0 | 2026-11-06 | 語言切換抽成 LangTabs（會記住選擇）
// v0.2.0 | 2026-11-04 | 頂部列：透明毛玻璃、字距品牌、中英切換
import Link from 'next/link'
import { COPY, type PortalLang } from '@/lib/portalConfig'
import LangTabs from './LangTabs'

export default function PortalHeader({ lang, path }: { lang: PortalLang; path: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--rule)] bg-[var(--bg)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3.5">
        <Link href={`/?lang=${lang}`} className="flex items-baseline gap-2.5">
          <span className="gold-text text-[20px] font-semibold tracking-[0.12em]">eiP</span>
          <span className="text-[12px] tracking-[0.24em] text-[var(--soft)]">{COPY.brand[lang].replace(/^eiP\s*/, '')}</span>
        </Link>
        <LangTabs lang={lang} path={path} />
      </div>
    </header>
  )
}
