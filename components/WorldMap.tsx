// ================================================
// v0.2.0 | 2026-11-04 | 高級質感：陸地點陣依「已開通地區」距離發光、地區之間以弧線連接
// ------------------------------------------------
// Changelog:
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
}

const GLOW_RADIUS = 230

export default function WorldMap({ regions, lang, comingSoon }: Props) {
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
          t = Math.max(t, Math.max(0, 1 - d / GLOW_RADIUS))
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

  return (
    <svg viewBox={`0 0 ${W} ${H - 40}`} className="h-auto w-full" role="img"
         aria-label={lang === 'en' ? 'World map of service regions' : '服務地區世界地圖'}>
      <defs>
        <linearGradient id="arc" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#8c7f68" stopOpacity="0.95" />
          <stop offset="1" stopColor="#c9c0ae" stopOpacity="0.25" />
        </linearGradient>
      </defs>

      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={2.1 + d.t * 0.7}
                fill={d.t > 0 ? 'var(--accent)' : 'var(--dot)'}
                fillOpacity={d.t > 0 ? 0.22 + 0.6 * d.t * d.t : 1} />
      ))}

      {arcs.map(a => (
        <path key={a.key} d={a.d} fill="none" stroke="url(#arc)" strokeWidth={1}
              className="map-arc" />
      ))}

      {pins.map(({ rg, x, y, live: isLive }) => {
        const label = rg.name[lang]
        const pin = (
          <g className={isLive ? 'cursor-pointer' : ''}>
            {isLive && <circle cx={x} cy={y} r={11} fill="none" stroke="var(--accent)" strokeWidth={1.2}
                               className="map-pulse" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />}
            <circle cx={x} cy={y} r={isLive ? 6 : 4.5} fill={isLive ? 'var(--accent)' : 'var(--muted)'} />
            <circle cx={x} cy={y} r={isLive ? 2.2 : 1.6} fill="var(--bg)" />
            <text x={x} y={y - 18} textAnchor="middle"
                  style={{ paintOrder: 'stroke', stroke: 'var(--card)', strokeWidth: 5, strokeLinejoin: 'round', letterSpacing: '0.08em' }}
                  className={`text-[13px] font-medium ${isLive ? 'fill-[var(--ink)]' : 'fill-[var(--muted)]'}`}>
              {label}
              {!isLive && <title>{comingSoon}</title>}
            </text>
          </g>
        )
        return isLive
          ? <Link key={rg.code} href={`${rg.href}${lang === 'en' ? '?lang=en' : ''}`} aria-label={label}>{pin}</Link>
          : <g key={rg.code}>{pin}</g>
      })}
    </svg>
  )
}
