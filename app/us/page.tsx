// v0.2.0 | 2026-11-05 | 海外售後服務中心：預設英文
// v0.1.0 | 2026-11-04 | 北美／海外售後服務中心
import RegionPage from '@/components/RegionPage'
import { COPY, US_LINKS, pickLang } from '@/lib/portalConfig'

type Props = { searchParams: Promise<{ lang?: string | string[] }> }

export default async function Page({ searchParams }: Props) {
  // 海外頁預設英文（仍可用右上角切換）
  const lang = pickLang((await searchParams).lang, 'en')
  return <RegionPage lang={lang} path="/us" market="us" title={COPY.usTitle} sub={COPY.usSub} links={US_LINKS} />
}
