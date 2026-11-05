// v0.1.0 | 2026-11-04 | 北美／海外售後服務中心
import RegionPage from '@/components/RegionPage'
import { COPY, US_LINKS, pickLang } from '@/lib/portalConfig'

type Props = { searchParams: Promise<{ lang?: string | string[] }> }

export default async function Page({ searchParams }: Props) {
  const lang = pickLang((await searchParams).lang)
  return <RegionPage lang={lang} path="/us" title={COPY.usTitle} sub={COPY.usSub} links={US_LINKS} />
}
