// v0.1.0 | 2026-11-26 | 公開頁面的資料快取（5 分鐘）：國家清單、說明書清單、電子模板清單
// 原本每次開頁都即時查資料庫（一頁 4～5 秒）。ERP 經管理 API 修改媒體庫／國家／類別／語言時會立刻清除（revalidateTag），
// 所以專員改完馬上看得到；5 分鐘只是保底。說明書封面的簽名連結 1 小時有效，快取 5 分鐘不會拿到過期連結。
// 只給公開頁面用；管理 API 一律直接查資料庫。
import 'server-only'
import { unstable_cache } from 'next/cache'
import { getCountries } from './countryDb'
import { catalogFor } from './catalog'
import { templatesFor } from './templates'
import type { PortalLang } from './portalConfig'

export const PORTAL_TAG = 'portal-content'
const opt = { revalidate: 300, tags: [PORTAL_TAG] }

export const cachedCountries = unstable_cache(() => getCountries(), ['portal-countries'], opt)
export const cachedCatalog = unstable_cache((code: string, lang: PortalLang) => catalogFor(code, lang), ['portal-catalog'], opt)
export const cachedTemplates = unstable_cache((code: string) => templatesFor(code), ['portal-templates'], opt)
