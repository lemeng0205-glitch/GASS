'use client'
// v0.1.0 | 2026-11-06 | 快捷入口卡片（圖示、編號、細線動效）；點「產品說明書」時說明書在下方展開
import { useEffect, useRef, useState } from 'react'
import type { PortalLang, QuickLink } from '@/lib/portalConfig'

const ICONS: Record<string, string[]> = {
  warranty:  ['M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z', 'M9 12l2 2 4-4'],
  manuals:   ['M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3V4z', 'M8 8h7', 'M8 12h5'],
  templates: ['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z'],
  community: ['M16 19v-1a4 4 0 00-4-4H8a4 4 0 00-4 4v1', 'M10 11a3 3 0 100-6 3 3 0 000 6z', 'M20 19v-1a3 3 0 00-2-2.8', 'M16 5.2a3 3 0 010 5.6'],
  faq:       ['M12 21a9 9 0 100-18 9 9 0 000 18z', 'M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1-1.5 2', 'M12 17h.01'],
}

function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-[18px] w-[18px] fill-none stroke-current" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {(ICONS[name] ?? ICONS.manuals).map((d, i) => <path key={i} d={d} />)}
    </svg>
  )
}

export default function QuickLinks({ links, lang, children }: {
  links: QuickLink[]; lang: PortalLang; children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const firstRun = useRef(true)

  // 網址帶 #manuals 時直接展開
  useEffect(() => { if (window.location.hash === '#manuals') setOpen(true) }, [])

  // 展開後捲到說明書位置（第一次載入不捲）
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return }
    if (!open) return
    const t = setTimeout(() => panel.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
    return () => clearTimeout(t)
  }, [open])

  const grid = links.length === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'
  const base = 'glass glass-hover group relative flex flex-col overflow-hidden rounded-2xl p-5 text-left sm:p-6'

  const body = (l: QuickLink, i: number, isOpen: boolean) => (
    <>
      <span className="flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f7f5f1] text-[var(--accent)] ring-1 ring-[var(--rule)] transition-colors duration-300 group-hover:bg-[var(--accent)] group-hover:text-white group-hover:ring-[var(--accent)]">
          <Icon name={l.key} />
        </span>
        <span aria-hidden className="text-[11px] tracking-[0.2em] text-[var(--muted)]">{String(i + 1).padStart(2, '0')}</span>
      </span>
      <span className="mt-5 flex items-center justify-between text-[16px] font-medium">
        {l.label[lang]}
        <span aria-hidden className={`text-[var(--accent)] transition-transform duration-300 ${
          l.href === '#manuals' ? (isOpen ? '-rotate-90' : 'rotate-90') : 'group-hover:translate-x-1'}`}>→</span>
      </span>
      <span className="mt-2 text-[13px] leading-snug text-[var(--soft)]">{l.desc[lang]}</span>
      <span aria-hidden className={`absolute inset-x-0 bottom-0 h-[2px] origin-left bg-[var(--accent)] transition-transform duration-500 ${
        isOpen ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
    </>
  )

  return (
    <>
      <section className={`fade-up d3 grid gap-3 ${grid}`}>
        {links.map((l, i) => {
          if (l.href === '#manuals') {
            return (
              <button key={l.key} type="button" onClick={() => setOpen(o => !o)}
                      aria-expanded={open} aria-controls="manuals"
                      className={`${base} ${open ? '!border-[var(--accent)]' : ''}`}>
                {body(l, i, open)}
              </button>
            )
          }
          const external = l.href.startsWith('http')
          return (
            <a key={l.key} href={l.href} className={base}
               {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
              {body(l, i, false)}
            </a>
          )
        })}
      </section>

      <div id="manuals" ref={panel} aria-hidden={!open}
           className={`scroll-mt-24 grid transition-[grid-template-rows,opacity] duration-500 ease-out ${
             open ? 'grid-rows-[1fr] opacity-100' : 'invisible grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">{children}</div>
      </div>
    </>
  )
}
