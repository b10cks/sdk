import {
  ApiClient,
  createB10cksDataApi,
  ensurePreviewStyles,
  previewBridge,
  setPreviewScrollOffset,
  type B10cksApiClientOptions,
  type B10cksDataApi,
} from '@b10cks/client'
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

export interface B10cksProviderProps extends PropsWithChildren {
  apiClientOptions?: B10cksApiClientOptions
  client?: ApiClient
  dataApi?: B10cksDataApi
  requestUrl?: URL | string
  /**
   * Offset applied when a selected block is scrolled into view, so selection
   * clears a fixed app header. A number is pixels; strings are used verbatim.
   */
  scrollOffset?: number | string
  /** Editor origins allowed to drive the preview bridge. */
  allowedOrigins?: string[]
}

type B10cksContextValue = {
  client: ApiClient | null
  dataApi: B10cksDataApi | null
}

const B10cksContext = createContext<B10cksContextValue>({
  client: null,
  dataApi: null,
})

export function B10cksProvider({
  children,
  apiClientOptions,
  client: clientOverride,
  dataApi: dataApiOverride,
  requestUrl,
  scrollOffset,
  allowedOrigins,
}: B10cksProviderProps) {
  const [bridgeIsReady, setBridgeIsReady] = useState(false)

  const client = useMemo(() => {
    if (clientOverride) {
      return clientOverride
    }

    if (!apiClientOptions) {
      return null
    }

    return new ApiClient(apiClientOptions, requestUrl)
  }, [apiClientOptions, clientOverride, requestUrl])

  const dataApi = useMemo(() => {
    if (dataApiOverride) {
      return dataApiOverride
    }

    if (!client) {
      return null
    }

    return createB10cksDataApi(client)
  }, [client, dataApiOverride])

  const value = useMemo(
    () => ({
      client,
      dataApi,
    }),
    [client, dataApi]
  )

  useEffect(() => {
    if (bridgeIsReady || !previewBridge.isInPreviewMode()) {
      return
    }

    previewBridge.init({ allowedOrigins })
    ensurePreviewStyles()
    if (scrollOffset !== undefined) {
      setPreviewScrollOffset(scrollOffset)
    }
    setBridgeIsReady(true)
  }, [bridgeIsReady, scrollOffset, allowedOrigins])

  return <B10cksContext.Provider value={value}>{children}</B10cksContext.Provider>
}

export function useB10cksDataApi(): B10cksDataApi {
  const context = useContext(B10cksContext)

  if (!context.dataApi) {
    throw new Error(
      'B10cks data API is missing from context. Wrap your tree in <B10cksProvider> and provide client credentials.'
    )
  }

  return context.dataApi
}

export function useB10cksClient() {
  const context = useContext(B10cksContext)
  return context.client
}

export function usePreviewSelection(blockId?: string | null) {
  const [isSelected, setIsSelected] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const blockIdRef = useRef(blockId)

  blockIdRef.current = blockId

  useEffect(() => {
    if (!previewBridge.isInPreviewMode()) {
      return
    }

    const offSelect = previewBridge.on('SELECT_UPDATE', ({ selectedItem }) => {
      setIsSelected(Boolean(blockIdRef.current && selectedItem === blockIdRef.current))
    })

    const offHover = previewBridge.on('HOVER_UPDATE', ({ selectedItem }) => {
      setIsHovered(Boolean(blockIdRef.current && selectedItem === blockIdRef.current))
    })

    return () => {
      offSelect()
      offHover()
    }
  }, [])

  return { isSelected, isHovered }
}
