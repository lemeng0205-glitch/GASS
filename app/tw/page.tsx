// v0.1.0 | 2026-11-04 | 台灣售後服務中心
import RegionPage from '@/components/RegionPage'
import { COPY, TW_LINKS, pickLang } from '@/lib/portalConfig'

type Props = { searchParams: Promise<{ lang?: string | string[] }> }

export default async function Page({ searchParams }: Props) {
  const lang = pickLang((await searchParams).lang)
  return <RegionPage lang={lang} path="/tw" market="tw" title={COPY.twTitle} sub={COPY.twSub} links={TW_LINKS} />
}
