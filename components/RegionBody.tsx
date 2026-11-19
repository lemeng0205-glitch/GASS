'use client'
// v0.1.0 | 2026-11-19 | 快捷卡片「產品說明書」「電子模板」改為切換下方內容（不再兩區塊疊在一起），目前選中的卡片會亮起
// 兩個區塊都先渲染在頁面裡（只用 hidden 切換顯示）：不靠 JavaScript 也找得到內容，切換時說明書的分頁狀態也不會重置。
import { useEffect, useState } from 'react'
import type { PortalLang, QuickLink } from '@/lib/portalConfig'
import type { TemplateItem } from '@/lib/templates'
import QuickLinks from './QuickLinks'
import ManualTabs, { type ManualGroup } from './ManualTabs'
import TemplateList from './TemplateList'

type Tab = 'manuals' | 'templates'

export default function RegionBody(props: {
  lang: PortalLang; links: QuickLink[]; groups: ManualGroup[]; templates: TemplateItem[]
  manualsTitle: string; templatesTitle: string; openLabel: string; downloadLabel: string
}) {
  const { lang, links, groups, templates } = props
  const [tab, setTab] = useState<Tab>('manuals')
  const hasTemplates = templates.length > 0

  // 從別處帶著 #templates 進來時，直接打開模板
  useEffect(() => { if (hasTemplates && window.location.hash === '#templates') setTab('templates') }, [hasTemplates])

  function select(key: string) {
    if (key !== 'manuals' && key !== 'templates') return
    setTab(key)
    // 等切換完成再捲到內容區（捲到標題，不要停在卡片上）
    requestAnimationFrame(() => document.getElementById(key)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <>
      <QuickLinks links={links} lang={lang} activeKey={tab} onSelect={select} />

      <section id="manuals" hidden={tab !== 'manuals'} className="mt-10 scroll-mt-24">
        <h2 className="sr-only">{props.manualsTitle}</h2>
        <ManualTabs groups={groups} openLabel={props.openLabel} />
      </section>

      {hasTemplates && (
        <section id="templates" hidden={tab !== 'templates'} className="mt-10 scroll-mt-24">
          {/* 畫面上不顯示標題（上方卡片已經標示是「電子模板」），只留給螢幕閱讀器 */}
          <h2 className="sr-only">{props.templatesTitle}</h2>
          <TemplateList items={templates} downloadLabel={props.downloadLabel} />
        </section>
      )}
    </>
  )
}
