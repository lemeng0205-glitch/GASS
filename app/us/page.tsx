// v0.3.0 | 2026-11-06 | 語言改由 getLang() 取得（網址 ＞ 使用者上次選擇 ＞ 預設英文）
// v0.2.0 | 2026-11-05 | 海外售後服務中心：預設英文
// v0.1.0 | 2026-11-04 | 北美／海外售後服務中心
import RegionPage from '@/components/RegionPage'
import { COPY, US_LINKS } from '@/lib/portalConfig'
import { getLang } from '@/lib/serverLang'

export default async function Page() {
  const lang = await getLang()
  return <RegionPage lang={lang} path="/us" market="us" title={COPY.usTitle} sub={COPY.usSub} links={US_LINKS} />
}
