import { B10cksProvider, type B10cksProviderProps } from '@b10cks/react'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

export interface B10cksNextProviderProps extends Omit<B10cksProviderProps, 'requestUrl'> {
  requestUrl?: URL | string
}

export function B10cksNextProvider({ requestUrl, ...props }: B10cksNextProviderProps) {
  const searchParams = useSearchParams()

  const resolvedRequestUrl = useMemo(() => {
    if (requestUrl) {
      return requestUrl
    }

    if (typeof window === 'undefined') {
      return undefined
    }

    const url = new URL(window.location.href)
    const revision = searchParams.get('b10cks_rv') || searchParams.get('rv')
    const version = searchParams.get('b10cks_vid')

    if (revision) {
      url.searchParams.set('b10cks_rv', revision)
    }

    if (version) {
      url.searchParams.set('b10cks_vid', version)
    }

    return url
  }, [requestUrl, searchParams])

  return (
    <B10cksProvider
      {...props}
      requestUrl={resolvedRequestUrl}
    />
  )
}
