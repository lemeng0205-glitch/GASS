'use client'
// v0.2.0 | 2026-11-26 | 新增「保固登錄」切換：表單直接顯示在下方（WarrantyPanel），跟說明書、模板同一套切換
// v0.1.0 | 2026-11-19 | 快捷卡片「產品說明書」「電子模板」改為切換下方內容（不再兩區塊疊在一起），目前選中的卡片會亮起
// 兩個區塊都先渲染在頁面裡（只用 hidden 切換顯示）：不靠 JavaScript 也找得到內容，切換時說明書的分頁狀態也不會重置。
import { useEffect, useState } from 'react'
import type { PortalLang, QuickLink } from '@/lib/portalConfig'
import type { TemplateItem } from '@/lib/templates'
import QuickLinks from './QuickLinks'
import ManualTabs, { type ManualGroup } from './ManualTabs'
import TemplateList from './TemplateList'
import WarrantyPanel from './warranty/WarrantyPanel'

type Tab = 'manuals' | 'templates' | 'warranty'
const TABS: string[] = ['manuals', 'templates', 'warranty']

export default function RegionBody(props: {
  lang: PortalLang; links: QuickLink[]; groups: ManualGroup[]; templates: TemplateItem[]
  manualsTitle: string; templatesTitle: string; openLabel: string; downloadLabel: string
  /** 有傳就在頁面內顯示保固表單（海外各國頁） */
  warranty?: { products: { category: string; name: string }[]; supportEmail?: string }
}) {
  const { lang, links, groups, templates } = props
  const [tab, setTab] = useState<Tab>('manuals')
  const hasTemplates = templates.length > 0
  const hasWarranty = !!props.warranty

  // 從別處帶著 #templates 進來時，直接打開模板
  useEffect(() => {
    const h = window.location.hash
    if (hasTemplates && h === '#templates') setTab('templates')
    if (hasWarranty && h === '#warranty') setTab('warranty')
  }, [hasTemplates, hasWarranty])

  function select(key: string) {
    if (!TABS.includes(key)) return
    setTab(key as Tab)
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

      {props.warranty && (
        <section id="warranty" hidden={tab !== 'warranty'} className="mt-10 scroll-mt-24">
          <h2 className="sr-only">Warranty &amp; Support</h2>
          <WarrantyPanel products={props.warranty.products} supportEmail={props.warranty.supportEmail} />
        </section>
      )}
    </>
  )
}
