// v0.1.0 | 2026-11-19 | 電子模板清單：每個模板一張卡片，按下直接下載（檔名、格式、大小）
import type { TemplateItem } from '@/lib/templates'

function size(n: number): string {
  if (n >= 1048576) return `${(n / 1048576).toFixed(1)} MB`
  return `${Math.max(1, Math.round(n / 1024))} KB`
}

export default function TemplateList({ items, downloadLabel }: { items: TemplateItem[]; downloadLabel: string }) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(t => (
        <li key={t.id}>
          <a href={t.url} download
             className="glass glass-hover group flex items-center justify-between gap-4 rounded-2xl p-5">
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-medium">{t.title}</span>
              <span className="mt-1 block text-[12px] tracking-wider text-[var(--muted)]">{t.ext} · {size(t.size)}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-[13px] text-[var(--accent)]">
              {downloadLabel}
              <span aria-hidden className="transition-transform group-hover:translate-y-0.5">↓</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}
