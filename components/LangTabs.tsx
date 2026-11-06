'use client'
// v0.1.0 | 2026-11-06 | 中／EN 切換：點選時記住偏好（cookie，一年），下次直接進來沿用
import Link from 'next/link'
import type { PortalLang } from '@/lib/portalConfig'
import { LANG_COOKIE } from '@/lib/lang'

function remember(l: PortalLang) {
  try { document.cookie = `${LANG_COOKIE}=${l}; max-age=31536000; path=/; samesite=lax` } catch { /* 無法寫入就算了 */ }
}

export default function LangTabs({ lang, path }: { lang: PortalLang; path: string }) {
  const tab = (l: PortalLang, text: string) => (
    <Link
      href={`${path}?lang=${l}`}
      onClick={() => remember(l)}
      aria-current={lang === l ? 'true' : undefined}
      className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold tracking-wider transition-colors ${
        lang === l ? 'btn-gold' : 'text-[var(--soft)] hover:text-[var(--ink)]'
      }`}
    >
      {text}
    </Link>
  )
  return (
    <nav className="glass ml-auto flex rounded-full p-0.5" aria-label="Language">
      {tab('zh', '中文')}
      {tab('en', 'EN')}
    </nav>
  )
}
