import {
  ApiError,
  ContentRedirectError,
  type IBContent,
  type IBContentQueryParams,
} from '@b10cks/client'
import {
  type AsyncState,
  useB10cksApi as useReactB10cksApi,
  type UseB10cksContentOptions,
} from '@b10cks/react'
import { notFound, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useContext, useEffect } from 'react'

import { type ContentForTranslations, getPageTranslations } from './page-translations'
import { PageTranslationsContext } from './provider'

export type UseB10cksNextContentOptions<T, R = IBContent<T>> = UseB10cksContentOptions<T, R> & {
  /**
   * The entry is the page of the current route. A slug that has a redirect
   * navigates to its target, and a missing slug renders the nearest
   * `not-found` page. Without it both cases only set `error`.
   */
  forRoute?: boolean
}

/** A redirect target on another host, which the App Router cannot navigate to. */
const ABSOLUTE_URL = /^(?:[a-z][a-z\d+.-]*:)?\/\//i

/** The hooks of `@b10cks/react`, with `useContent` able to answer for the current route. */
export function useB10cksApi() {
  const api = useReactB10cksApi()
  const router = useRouter()

  const useContent = <T = Record<string, unknown>, R = IBContent<T>>(
    fullSlug: string,
    params: Omit<IBContentQueryParams, 'token' | 'full_slug'> = {},
    { forRoute = false, ...options }: UseB10cksNextContentOptions<T, R> = {}
  ): AsyncState<R> => {
    const state = api.useContent<T, R>(fullSlug, params, options)
    const error = forRoute ? state.error : null
    const target = error instanceof ContentRedirectError ? error.target : null

    useEffect(() => {
      if (!target) return
      if (ABSOLUTE_URL.test(target)) window.location.replace(target)
      else router.replace(target)
    }, [router, target])

    if (error instanceof ApiError && error.status === 404) notFound()

    return state
  }

  return { ...api, useContent }
}

/**
 * The content version to read, taken from the `?b10cks_vid` query param the
 * visual editor appends, and defaulting to `published`.
 */
export function useB10cksVersion(): string {
  return useSearchParams().get('b10cks_vid') || 'published'
}

/**
 * A locale to path map shared below `B10cksNextProvider`, for a language switcher
 * outside the page, e.g. in a layout.
 *
 * ```tsx
 * const { setFromContent, clear } = usePageTranslations()
 * useEffect(() => {
 *   setFromContent(content)
 *   return clear
 * }, [content, setFromContent, clear])
 * ```
 */
export function usePageTranslations() {
  const state = useContext(PageTranslationsContext)
  if (!state) {
    throw new Error('usePageTranslations needs a <B10cksNextProvider> above it.')
  }

  const { translations, setTranslations } = state
  const setFromContent = useCallback(
    (content: ContentForTranslations) => setTranslations(getPageTranslations(content)),
    [setTranslations]
  )
  const clear = useCallback(() => setTranslations(null), [setTranslations])

  return { translations, setFromContent, setTranslations, clear }
}
