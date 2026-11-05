// v0.2.0 | 2026-11-04 | 頂部列：透明毛玻璃、字距品牌、中英切換
import Link from 'next/link'
import { COPY, type PortalLang } from '@/lib/portalConfig'

export default function PortalHeader({ lang, path }: { lang: PortalLang; path: string }) {
  const tab = (l: PortalLang, text: string) => (
    <Link
      href={`${path}?lang=${l}`}
      aria-current={lang === l ? 'true' : undefined}
      className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold tracking-wider transition-colors ${
        lang === l ? 'btn-gold' : 'text-[var(--soft)] hover:text-[var(--ink)]'
      }`}
    >
      {text}
    </Link>
  )
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--rule)] bg-[var(--bg)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3.5">
        <Link href={`/?lang=${lang}`} className="flex items-baseline gap-2.5">
          <span className="gold-text text-[20px] font-semibold tracking-[0.12em]">eiP</span>
          <span className="text-[12px] tracking-[0.24em] text-[var(--soft)]">{COPY.brand[lang].replace(/^eiP\s*/, '')}</span>
        </Link>
        <nav className="glass ml-auto flex rounded-full p-0.5" aria-label="Language">
          {tab('zh', '中文')}
          {tab('en', 'EN')}
        </nav>
      </div>
    </header>
  )
}
