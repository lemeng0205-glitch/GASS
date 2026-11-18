// v0.3.0 | 2026-11-18 | 說明書清單由媒體庫自動產生（顯示國家含「台灣」的說明書）
// v0.2.0 | 2026-11-06 | 語言改由 getLang() 取得（網址 ＞ 使用者上次選擇 ＞ 預設中文）
// v0.1.0 | 2026-11-04 | 台灣售後服務中心
import RegionPage from '@/components/RegionPage'
import { COPY, TW_LINKS } from '@/lib/portalConfig'
import { catalogFor } from '@/lib/catalog'
import { getLang } from '@/lib/serverLang'

export default async function Page() {
  const lang = await getLang()
  const groups = await catalogFor('tw', lang)
  return <RegionPage lang={lang} path="/tw" title={COPY.twTitle} sub={COPY.twSub} links={TW_LINKS} groups={groups} />
}
