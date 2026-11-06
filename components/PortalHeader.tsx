// v0.5.0 | 2026-11-06 | logo 連結加「回首頁」提示（hover 變淡、tooltip、無障礙名稱）
// v0.4.0 | 2026-11-06 | 左上角改用品牌 logo 圖檔（public/portal/logo.png）
// v0.3.0 | 2026-11-06 | 語言切換抽成 LangTabs（會記住選擇）
// v0.2.0 | 2026-11-04 | 頂部列：透明毛玻璃、字距品牌、中英切換
import Link from 'next/link'
import { COPY, type PortalLang } from '@/lib/portalConfig'
import LangTabs from './LangTabs'

export default function PortalHeader({ lang, path }: { lang: PortalLang; path: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--rule)] bg-[var(--bg)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3.5">
        <Link href={`/?lang=${lang}`} aria-label={lang === 'en' ? 'eiP – back to home' : 'eiP – 回首頁'} title={lang === 'en' ? 'Back to home' : '回首頁'}
              className="flex items-center gap-3 transition-opacity hover:opacity-70">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/portal/logo.png" alt="eiP" width={450} height={249} className="h-7 w-auto" />
          <span className="text-[12px] tracking-[0.24em] text-[var(--soft)]">{COPY.brand[lang].replace(/^eiP\s*/, '')}</span>
        </Link>
        <LangTabs lang={lang} path={path} />
      </div>
    </header>
  )
}
