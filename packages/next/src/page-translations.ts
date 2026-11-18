import { buildLocalizedPath, type IBContent } from '@b10cks/client'

/** Rooted paths of a page by locale, e.g. `{ en: '/en/about', de: '/de/ueber-uns' }`. */
export type PageTranslations = Record<string, string>

export type ContentForTranslations = Pick<IBContent, 'language_iso' | 'full_slug' | 'translations'>

/** The language-switcher links of an entry. Works in Server Components. */
export function getPageTranslations(content: ContentForTranslations): PageTranslations {
  const translations: PageTranslations = {
    [content.language_iso]: buildLocalizedPath(content.full_slug, content.language_iso),
  }
  for (const translation of content.translations) {
    translations[translation.language_iso] = buildLocalizedPath(
      translation.full_slug,
      translation.language_iso
    )
  }
  return translations
}
