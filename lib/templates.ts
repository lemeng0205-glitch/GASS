// v0.1.0 | 2026-11-19 | 國家頁的「電子模板」清單：由媒體庫自動產生（類型＝電子模板、勾「顯示在保固網站」、顯示國家含該國）
// 台灣只看指定「台灣」的；海外國家看指定該國或「全部海外」的。
import 'server-only'
import { effectiveCountries } from './countries'
import { publishedTemplates } from './mediaDb'
import { fileExt } from './mediaConfig'

export interface TemplateItem { id: string; title: string; url: string; ext: string; size: number; cover: string | null }

export async function templatesFor(country: string): Promise<TemplateItem[]> {
  const docs = await publishedTemplates()
  return docs
    .filter(d => {
      const c = effectiveCountries(d)
      return c.includes(country) || (country !== 'tw' && c.includes('intl'))
    })
    .map(d => ({
      id: d.id, title: d.title, url: `/m/${d.slug}/f/${d.id}`,
      ext: fileExt(d.file_name).toUpperCase(), size: d.size_bytes, cover: d.cover_url,
    }))
}
