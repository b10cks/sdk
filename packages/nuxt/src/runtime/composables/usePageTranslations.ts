import { buildLocalizedPath } from '@b10cks/client'
import type { IBContent } from '@b10cks/client'

import { useState } from '#app'

type ContentForTranslations = Pick<IBContent, 'language_iso' | 'full_slug' | 'translations'>

/**
 * Maintains a reactive locale → rooted-path map built from an `IBContent` entry and its
 * `translations`. Useful for building language-switcher links in multilingual sites.
 *
 * @example
 * const { translations, setFromContent, clear } = usePageTranslations()
 * setFromContent(content)  // { en: '/en/about', de: '/de/ueber-uns' }
 */
export const usePageTranslations = () => {
  const translations = useState<Record<string, string> | null>('b10cks:pageTranslations', () => null)

  const setFromContent = (content: ContentForTranslations) => {
    const map: Record<string, string> = {
      [content.language_iso]: buildLocalizedPath(content.full_slug, content.language_iso),
    }
    for (const t of content.translations) {
      map[t.language_iso] = buildLocalizedPath(t.full_slug, t.language_iso)
    }
    translations.value = map
  }

  const setTranslations = (map: Record<string, string> | null) => {
    translations.value = map
  }

  const clear = () => {
    translations.value = null
  }

  return { translations, setFromContent, setTranslations, clear }
}
