// v0.1.0 | 2026-11-06 | 伺服器端取得本次請求的語言（由 middleware 算出）
import 'server-only'
import { headers } from 'next/headers'
import { LANG_HEADER, type Lang } from './lang'

export async function getLang(): Promise<Lang> {
  return (await headers()).get(LANG_HEADER) === 'en' ? 'en' : 'zh'
}
