// ================================================
// v0.3.0 | 2026-11-05 | 滿版無框：點陣用 SVG、地區釘點改 HTML 疊層（字級與點擊範圍不隨地圖縮放）
// ------------------------------------------------
// Changelog:
//   v0.3.0 (2026-11-05) - 去掉外框；釘點與標籤改 HTML（手機只顯示圓點，點擊範圍 44px）；寬度依視窗高度自動限制
//   v0.2.0 (2026-11-04) - 發光點陣、連線弧、脈動釘點（點陣資料移到 worldData.ts）
//   v0.1.0 (2026-11-03) - 初版
// 刻意不用政治地圖：只畫大陸輪廓的點陣，避開國界與地名爭議。
// ================================================
import Link from 'next/link'
import type { PortalLang, PortalRegion } from '@/lib/portalConfig'
import { CELL, H, LAND, W, project } from './worldData'

interface Props {
  regions:    PortalRegion[]
  lang:       PortalLang
  comingSoon: string
  explicitLang?: boolean
}

const GLOW_RADIUS = 230
const VB_H = H - 40

export default function WorldMap({ regions, lang, comingSoon, explicitLang = false }: Props) {
  const pins = regions.map(rg => ({ rg, ...project(rg.lon, rg.lat), live: !!rg.href }))
  const live = pins.filter(p => p.live)

  const dots: Array<{ x: number; y: number; t: number }> = []
  LAND.forEach((ranges, r) => {
    for (const [a, b] of ranges) {
      for (let c = a; c <= b; c++) {
        const x = c * CELL + CELL / 2
        const y = r * CELL + CELL / 2
        let t = 0
        for (const p of live) {
          const d = Math.hypot(x - p.x, y - p.y)
          // 台灣為主角；海外地點只有淡淡的光暈，點多了才不會整張地圖糊成一片
          t = Math.max(t, Math.max(0, 1 - d / (p.rg.track === 'tw' ? GLOW_RADIUS : GLOW_RADIUS * 0.5)) * (p.rg.track === 'tw' ? 1 : 0.5))
        }
        dots.push({ x, y, t })
      }
    }
  })

  // 以台灣為起點，連到其他已開通地區
  const origin = live.find(p => p.rg.code === 'tw')
  const arcs = origin
    ? live.filter(p => p !== origin).map(p => {
        const mx = (origin.x + p.x) / 2
        const my = Math.min(origin.y, p.y) - Math.abs(origin.x - p.x) * 0.28
        return { key: p.rg.code, d: `M${origin.x},${origin.y} Q${mx},${my} ${p.x},${p.y}` }
      })
    : []

  // 只有使用者明確選過語言才帶進去；否則各軌道用自己的預設（台灣中文、海外英文）
  const q = explicitLang ? `?lang=${lang}` : ''

  return (
    // 寬度：不超過視窗，也不讓整張圖高過「視窗高度 − 標題與按鈕區」，所以一個畫面放得下
    <div className="relative mx-auto"
         style={{ width: 'min(100%, calc((100svh - 610px) * 2.6667))', minWidth: 'min(100%, 340px)', aspectRatio: `${W} / ${VB_H}` }}>
      {/* 已開通地區底下的一團柔光 */}
      {live.filter(p => p.rg.track === 'tw').map(p => (
        <span key={`glow-${p.rg.code}`} aria-hidden className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / VB_H) * 100}%`, width: '26%', aspectRatio: '1',
                       background: 'radial-gradient(closest-side, rgba(140,127,104,.20), rgba(140,127,104,0))' }} />
      ))}
      <svg viewBox={`0 0 ${W} ${VB_H}`} className="map-fade absolute inset-0 h-full w-full" role="img"
           aria-label={lang === 'en' ? 'World map of service regions' : '服務地區世界地圖'}>
        <defs>
          <linearGradient id="arc" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#8c7f68" stopOpacity="0.95" />
            <stop offset="1" stopColor="#c9c0ae" stopOpacity="0.25" />
          </linearGradient>
        </defs>
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={1.6 + d.t * 0.7}
                  fill={d.t > 0 ? 'var(--accent)' : 'var(--dot)'}
                  fillOpacity={d.t > 0 ? 0.22 + 0.6 * d.t * d.t : 1} />
        ))}
        {arcs.map(a => (
          <path key={a.key} d={a.d} fill="none" stroke="url(#arc)" strokeWidth={1.2}
                vectorEffect="non-scaling-stroke" className="map-arc" />
        ))}
      </svg>

      {pins.map(({ rg, x, y, live: isLive }) => {
        const hoverOnly = !!rg.hoverLabel
        const label = rg.name[lang]
        const pos = { left: `${(x / W) * 100}%`, top: `${(y / VB_H) * 100}%` }
        const inner = (
          <>
            {isLive && <span aria-hidden className="map-pulse absolute h-3.5 w-3.5 rounded-full border border-[var(--accent)]" />}
            {isLive && <span aria-hidden className="map-pulse absolute h-3.5 w-3.5 rounded-full border border-[var(--accent)]" style={{ animationDelay: '1.6s' }} />}
            <span aria-hidden className={`pin-dot relative h-3 w-3 rounded-full border-[3px] border-[var(--card)] ring-1 ${isLive ? 'bg-[var(--accent)] ring-[var(--accent)]' : 'bg-[var(--muted)] ring-[var(--muted)]'}`} />
            <span className={`pin-label pointer-events-none absolute bottom-full mb-2 hidden whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-medium tracking-[0.12em] md:block ${isLive ? 'text-[var(--ink)]' : 'text-[var(--soft)]'} ${hoverOnly ? 'opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100' : ''}`}>
              {label}
            </span>
          </>
        )
        // 手機上地點挨得很近：海外釘點點擊範圍縮小，台灣放在最上層，避免點台灣卻被旁邊的點搶走
        const cls = `group absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center ${
          rg.track === 'tw' ? 'z-10 h-11 w-11' : 'h-6 w-6 md:h-11 md:w-11'}`
        return isLive
          ? <Link key={rg.code} href={`${rg.href}${q}`} aria-label={label} data-track={rg.track} data-code={rg.code} className={`pin ${cls}`} style={pos}>{inner}</Link>
          : <span key={rg.code} title={comingSoon} className={cls} style={pos}>{inner}</span>
      })}
    </div>
  )
}
