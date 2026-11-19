// v0.3.0 | 2026-11-19 | 預覽圖依第一頁的比例顯示（不再固定正方形）
// v0.2.0 | 2026-11-19 | 卡片改為「預覽圖在上、資訊在下」：預覽圖是檔案第一頁（沒有時顯示格式標籤）
// v0.1.0 | 2026-11-19 | 電子模板清單：每個模板一張卡片，按下直接下載（檔名、格式、大小）
import type { TemplateItem } from '@/lib/templates'

function size(n: number): string {
  if (n >= 1048576) return `${(n / 1048576).toFixed(1)} MB`
  return `${Math.max(1, Math.round(n / 1024))} KB`
}

export default function TemplateList({ items, downloadLabel }: { items: TemplateItem[]; downloadLabel: string }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map(t => (
        <li key={t.id}>
          <a href={t.url} download
             className="glass glass-hover group flex h-full flex-col overflow-hidden rounded-2xl">
            {/* 預覽：依第一頁自己的比例顯示（橫式就橫、直式就直，不裁切）；太高的直式頁面限制高度。
                同一排的卡片等高，比較矮的預覽圖在淡米色底中置中 */}
            <span className="relative flex min-h-[8rem] flex-1 items-center justify-center overflow-hidden bg-[#f1eee8] p-4">
              {t.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.cover} alt={t.title} loading="lazy" decoding="async"
                     className="block h-auto max-h-72 w-auto max-w-full object-contain drop-shadow-[0_6px_14px_rgba(60,50,30,0.18)] transition-transform duration-500 group-hover:scale-[1.03]" />
              ) : (
                <span className="text-[22px] font-light tracking-[0.25em] text-[var(--muted)]">{t.ext}</span>
              )}
            </span>
            <span className="flex flex-col gap-1 p-4">
              <span className="line-clamp-2 text-[15px] font-medium leading-snug">{t.title}</span>
              <span className="mt-auto flex items-center justify-between pt-2 text-[12px] tracking-wider text-[var(--muted)]">
                <span>{t.ext} · {size(t.size)}</span>
                <span className="flex items-center gap-1 text-[13px] text-[var(--accent)]">
                  {downloadLabel}
                  <span aria-hidden className="transition-transform group-hover:translate-y-0.5">↓</span>
                </span>
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}
