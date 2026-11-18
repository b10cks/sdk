import { B10cksProvider, type B10cksProviderProps } from '@b10cks/react'
import { useSearchParams } from 'next/navigation'
import { createContext, Suspense, useEffect, useMemo, useRef, useState } from 'react'

import type { PageTranslations } from './page-translations'

export interface B10cksNextProviderProps extends Omit<B10cksProviderProps, 'requestUrl'> {
  requestUrl?: URL | string
}

export interface PageTranslationsState {
  translations: PageTranslations | null
  setTranslations: (translations: PageTranslations | null) => void
}

/** Lives in the provider, because a module-level store would be shared between server requests. */
export const PageTranslationsContext = createContext<PageTranslationsState | null>(null)

/**
 * Reports query changes after the first render. It sits in its own `Suspense`, because
 * `useSearchParams` in the provider would suspend the whole page on a static route. A page
 * below that boundary streams, and can no longer answer with a redirect or 404 status.
 */
function SearchParamsListener({ onChange }: { onChange: (search: string) => void }) {
  const search = useSearchParams().toString()
  const reported = useRef(search)

  useEffect(() => {
    if (reported.current === search) return
    reported.current = search
    onChange(search)
  }, [search, onChange])

  return null
}

export function B10cksNextProvider({ requestUrl, children, ...props }: B10cksNextProviderProps) {
  const [search, setSearch] = useState('')
  const [translations, setTranslations] = useState<PageTranslations | null>(null)
  const pageTranslations = useMemo(() => ({ translations, setTranslations }), [translations])

  const resolvedRequestUrl = useMemo(() => {
    if (requestUrl) {
      return requestUrl
    }

    if (typeof window === 'undefined') {
      return undefined
    }

    const url = new URL(window.location.href)
    const revision = url.searchParams.get('rv')

    if (revision && !url.searchParams.has('b10cks_rv')) {
      url.searchParams.set('b10cks_rv', revision)
    }

    return url
    // `search` marks a client-side navigation, which `window.location` does not announce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestUrl, search])

  return (
    <PageTranslationsContext.Provider value={pageTranslations}>
      <B10cksProvider
        {...props}
        requestUrl={resolvedRequestUrl}
      >
        <Suspense fallback={null}>
          <SearchParamsListener onChange={setSearch} />
        </Suspense>
        {children}
      </B10cksProvider>
    </PageTranslationsContext.Provider>
  )
}
