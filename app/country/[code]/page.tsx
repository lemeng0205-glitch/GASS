// v0.1.0 | 2026-11-18 | 各國服務頁 /country/<代碼>：顯示專員指定給該國的說明書（沒有專屬版本的產品用「全部海外」版）
// /country/intl = 地圖上沒列出的其他國家，只顯示「全部海外」的說明書。
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import RegionPage from '@/components/RegionPage'
import { COPY, US_LINKS, type L10n } from '@/lib/portalConfig'
import { INTL, countryName, isCountryPage } from '@/lib/countries'
import { catalogFor } from '@/lib/catalog'
import { getLang } from '@/lib/serverLang'

type Props = { params: Promise<{ code: string }> }

function titleFor(code: string): L10n {
  const n = countryName(code)
  if (code === INTL || !n) return COPY.usTitle
  return { zh: `${n.zh}${COPY.countrySuffix.zh}`, en: `${n.en} ${COPY.countrySuffix.en}` }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  return isCountryPage(code) ? { title: `${titleFor(code).en} | eiP` } : {}
}

export default async function Page({ params }: Props) {
  const { code } = await params
  if (!isCountryPage(code)) notFound()
  const lang = await getLang()
  const groups = await catalogFor(code, lang)
  return <RegionPage lang={lang} path={`/country/${code}`} title={titleFor(code)} sub={COPY.usSub} links={US_LINKS} groups={groups} />
}
