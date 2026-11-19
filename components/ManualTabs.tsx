// v0.3.0 | 2026-11-19 | 每張說明書卡片都顯示語言標籤（多語言可點選、單一語言為純標示）
'use client'
// v0.2.0 | 2026-11-18 | 同一產品有多種語言時，卡片下方顯示語言小按鈕（例：加拿大的 English／Français）
// v0.1.0 | 2026-11-06 | 說明書區：先選「觸控筆／鍵盤保護殼」，再顯示該分類的產品
import { useState } from 'react'

export interface ManualAlt { label: string; url: string }
export interface ManualItem { slug: string; name: string; url: string; noImage?: boolean; alts?: ManualAlt[] }
export interface ManualGroup { key: string; label: string; items: ManualItem[] }

export default function ManualTabs({ groups, openLabel }: { groups: ManualGroup[]; openLabel: string }) {
  const shown = groups.filter(g => g.items.length > 0)
  const [active, setActive] = useState(shown[0]?.key)
  const current = shown.find(g => g.key === active) ?? shown[0]
  if (!current) return null

  return (
    <div>
      {shown.length > 1 && (
        <div role="tablist" className="mb-6 inline-flex rounded-full border border-[var(--rule)] bg-white/70 p-1">
          {shown.map(g => {
            const on = g.key === current.key
            return (
              <button key={g.key} role="tab" type="button" aria-selected={on} aria-controls={`manual-panel-${g.key}`}
                      onClick={() => setActive(g.key)}
                      className={`flex h-10 items-center gap-2 rounded-full px-5 text-[14px] font-medium tracking-wider transition-colors duration-300 ${
                        on ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--soft)] hover:text-[var(--ink)]'}`}>
                {g.label}
                <span className={`text-[11px] tabular-nums ${on ? 'text-white/70' : 'text-[var(--muted)]'}`}>{g.items.length}</span>
              </button>
            )
          })}
        </div>
      )}

      <ul key={current.key} id={`manual-panel-${current.key}`} role="tabpanel"
          className="fade-up grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {current.items.map(p => (
          <li key={p.slug} className="glass glass-hover flex h-full flex-col overflow-hidden rounded-2xl">
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="group flex flex-1 flex-col">
              {p.noImage ? (
                <div aria-hidden className="plinth flex aspect-square w-full items-center justify-center text-[22px] font-light tracking-[0.3em] text-[var(--muted)]">eiP</div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/portal/products/${p.slug}.png`} alt="" loading="lazy"
                     className="plinth aspect-square w-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]" />
              )}
              <div className="flex flex-1 flex-col p-4">
                <p className="text-[14px] font-medium leading-snug">{p.name}</p>
                <span className="mt-auto pt-3 text-[12px] tracking-wider text-[var(--accent)]">{openLabel} →</span>
              </div>
            </a>
            {p.alts && p.alts.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-4 pb-4">
                {p.alts.length > 1 ? p.alts.map(a => (
                  <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer"
                     className="rounded-full border border-[var(--rule)] px-2.5 py-0.5 text-[11px] tracking-wider text-[var(--soft)] transition-colors hover:border-[var(--accent)] hover:text-[var(--ink)]">
                    {a.label}
                  </a>
                )) : (
                  // 只有一種語言：不用連結，只標示這份說明書是什麼語言
                  <span className="rounded-full border border-[var(--rule)] px-2.5 py-0.5 text-[11px] tracking-wider text-[var(--soft)]">{p.alts[0].label}</span>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
