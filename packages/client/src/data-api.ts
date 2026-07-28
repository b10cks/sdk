import type {
  IBCollectionResponse,
  Endpoint,
  IBBaseQueryParams,
  IBBlock,
  IBBreadcrumbLevel,
  IBBreadcrumbParams,
  IBBreadcrumbResponse,
  IBContent,
  IBContentQueryParams,
  IBDataEntry,
  IBDataSource,
  IBGetBlocksParams,
  IBGetContentsParams,
  IBGetRedirectsParams,
  IBRedirect,
  IBRedirectLookupResult,
  IBSearchParams,
  IBSearchResponse,
  IBSitemapEntry,
  IBSpace,
} from './types'

type ApiQueryParams = Omit<IBBaseQueryParams, 'token'> & Record<string, unknown>
type ApiCollectionResponse<T> =
  | T[]
  | IBCollectionResponse<T>
  | { data: T[]; rv?: string | number }
  | { data: IBCollectionResponse<T>; rv?: string | number }
type ApiCollectionResult<T> =
  | ApiCollectionResponse<T>
  | { data: ApiCollectionResponse<T>; rv?: string | number }

export interface CollectionFetchOptions {
  allPages?: boolean
}

export interface RedirectFetchOptions extends CollectionFetchOptions {
  forceRefresh?: boolean
}

export interface DataApiClient {
  get<T>(
    endpoint: Endpoint,
    params?: ApiQueryParams
  ): Promise<T | { data: T; rv?: string | number }>
  getAll<T>(endpoint: Endpoint, params?: ApiQueryParams): Promise<T[]>
  post?<T>(endpoint: string, body?: unknown, params?: ApiQueryParams): Promise<T>
  setRv(value: string | number): void
  getRv?(): string | number
}

export type RedirectMap = Record<string, { target: string; status_code: number }>

export interface GetConfigOptions extends Omit<IBContentQueryParams, 'token' | 'full_slug'> {
  slug?: string
  language?: string
  bypassCache?: boolean
}

function serializeFilterValue(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'boolean') return String(value)
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return value

  if (typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>

    if ('null' in obj) return 'null:'
    if ('!null' in obj) return '!null:'
    if ('between' in obj) {
      const between = obj.between
      if (!Array.isArray(between) || between.length !== 2) return undefined
      const [from, to] = between as [string, string]
      return `${from}...${to}`
    }

    const ops = [
      'eq', 'neq', 'like', '!like', '^like', 'like$',
      'lt', 'gt', 'lte', 'gte', 'in', '!in', 'empty', '!empty',
    ] as const
    for (const op of ops) {
      if (op in obj) {
        const val = obj[op]
        if (Array.isArray(val)) return `${op}:${val.join(',')}`
        return `${op}:${String(val)}`
      }
    }
  }

  return undefined
}

export function serializeFilter(filter: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(filter)) {
    const serialized = serializeFilterValue(value)
    if (serialized !== undefined) {
      result[key] = serialized
    }
  }
  return result
}

function buildParamsWithFilter(
  params: Record<string, unknown>,
  filter: unknown,
  sort: string | string[] | undefined
): ApiQueryParams {
  const filterParams =
    filter && typeof filter === 'object'
      ? serializeFilter(filter as Record<string, unknown>)
      : {}
  const sortParam =
    Array.isArray(sort) ? { sort: sort.join(',') } : sort != null ? { sort } : {}
  return { ...params, ...filterParams, ...sortParam }
}

/** Maximum number of distinct config entries kept in memory (LRU-evicted). */
const CONFIG_CACHE_MAX = 128

export class B10cksDataApi {
  private readonly redirectsCache = new Map<string, RedirectMap>()
  private readonly configCache = new Map<string, unknown>()
  /** In-flight config requests, keyed like `configCache`, to dedupe stampedes. */
  private readonly configInflight = new Map<string, Promise<unknown>>()

  constructor(private readonly client: DataApiClient) {}

  async getResource<T>(endpoint: Endpoint, params: ApiQueryParams = {}): Promise<T> {
    const response = await this.client.get<T>(endpoint, params)
    return this.unwrapResource(response)
  }

  async getCollection<T>(
    endpoint: Endpoint,
    params: ApiQueryParams = {},
    options: CollectionFetchOptions = {}
  ): Promise<T[]> {
    if (options.allPages) {
      return this.client.getAll<T>(endpoint, params)
    }

    const response = await this.client.get<ApiCollectionResponse<T>>(endpoint, params)
    return this.unwrapCollection(response)
  }

  async getContent<T = Record<string, unknown>>(
    fullSlug: string,
    params: Omit<IBContentQueryParams, 'token' | 'full_slug'> = {}
  ): Promise<IBContent<T>> {
    return this.getResource<IBContent<T>>(`contents/${fullSlug}`, params)
  }

  async getContents<T = Record<string, unknown>>(
    params: IBGetContentsParams = {},
    options: CollectionFetchOptions = {}
  ): Promise<IBContent<T>[]> {
    const { filter, sort, ...rest } = params
    return this.getCollection<IBContent<T>>(
      'contents',
      buildParamsWithFilter(rest, filter, sort),
      options
    )
  }

  /**
   * The ancestor trail of an entry, ordered from the tree root down to the
   * entry itself. Addressed by full slug or by content id.
   *
   * Unpublished ancestors are omitted rather than blanked, so the position in
   * the trail is not the position in the tree — read `depth` for that, and pass
   * `ancestors: 'all'` when structural levels are never published by design.
   */
  async getBreadcrumb<T = Record<string, unknown>>(
    slug: string,
    params: IBBreadcrumbParams = {}
  ): Promise<IBBreadcrumbLevel<T>[]> {
    const response = await this.getBreadcrumbResponse<T>(slug, params)
    return response?.breadcrumb ?? []
  }

  /**
   * Like {@link getBreadcrumb}, but keeps the response's `meta` block — the
   * resolved language, its fallback, the space's i18n mode, and the root and
   * current ids.
   */
  async getBreadcrumbResponse<T = Record<string, unknown>>(
    slug: string,
    params: IBBreadcrumbParams = {}
  ): Promise<IBBreadcrumbResponse<T>> {
    // Leading slashes are stripped so a `full_slug` taken straight off an entry
    // (`/products/shoes`) does not produce a double slash in the URL.
    const response = await this.client.get<IBBreadcrumbResponse<T>>(
      `breadcrumbs/${slug.replace(/^\/+/, '')}`,
      params as ApiQueryParams
    )

    return this.unwrapResource(response)
  }

  async getBlock(blockId: string, params: ApiQueryParams = {}): Promise<IBBlock> {
    return this.getResource<IBBlock>(`blocks/${blockId}`, params)
  }

  async getBlocks(
    params: IBGetBlocksParams = {},
    options: CollectionFetchOptions = {}
  ): Promise<IBBlock[]> {
    const { filter, ...rest } = params
    return this.getCollection<IBBlock>(
      'blocks',
      buildParamsWithFilter(rest, filter, undefined),
      options
    )
  }

  async search<T = Record<string, unknown>>(
    params: IBSearchParams
  ): Promise<IBSearchResponse<T>> {
    const response = await this.client.get<IBSearchResponse<T>>(
      'search',
      params as unknown as ApiQueryParams
    )
    if (
      typeof response === 'object' &&
      response !== null &&
      'data' in response &&
      'meta' in (response as Record<string, unknown>)
    ) {
      return response as IBSearchResponse<T>
    }
    if (typeof response === 'object' && response !== null && 'data' in response) {
      const inner = (response as { data: unknown }).data
      if (
        typeof inner === 'object' &&
        inner !== null &&
        'meta' in inner &&
        'data' in inner
      ) {
        return inner as IBSearchResponse<T>
      }
    }
    return response as unknown as IBSearchResponse<T>
  }

  /** The default sitemap, covering every block type configured in `settings.sitemap.types`. */
  async getSitemap(
    params: Omit<IBContentQueryParams, 'token'> = {},
    options: CollectionFetchOptions = {}
  ): Promise<IBSitemapEntry[]> {
    return this.getCollection<IBSitemapEntry>('sitemap', params, options)
  }

  /**
   * A named sitemap from `settings.sitemaps`, e.g. one sitemap for pages and a
   * separate one for news. Unknown names respond with 404.
   */
  async getNamedSitemap(
    name: string,
    params: Omit<IBContentQueryParams, 'token'> = {},
    options: CollectionFetchOptions = {}
  ): Promise<IBSitemapEntry[]> {
    return this.getCollection<IBSitemapEntry>(
      `sitemaps/${encodeURIComponent(name)}`,
      params,
      options
    )
  }

  async getDataEntries(
    source: string,
    params: ApiQueryParams = {},
    options: CollectionFetchOptions = {}
  ): Promise<IBDataEntry[]> {
    return this.getCollection<IBDataEntry>(`datasources/${source}/entries`, params, options)
  }

  async getDataSources(
    params: ApiQueryParams = {},
    options: CollectionFetchOptions = {}
  ): Promise<IBDataSource[]> {
    return this.getCollection<IBDataSource>('datasources', params, options)
  }

  async getSpace(params: ApiQueryParams = {}): Promise<IBSpace> {
    return this.getResource<IBSpace>('spaces/me', params)
  }

  async lookupRedirect(source: string): Promise<IBRedirectLookupResult | false> {
    if (!this.client.post) {
      throw new Error(
        'lookupRedirect requires a client that supports POST. Use ApiClient from @b10cks/client.'
      )
    }
    return this.client.post<IBRedirectLookupResult | false>('redirects/lookup', { source })
  }

  async getRedirects(params?: IBGetRedirectsParams, forceRefresh?: boolean): Promise<RedirectMap>
  async getRedirects(
    params?: IBGetRedirectsParams,
    options?: RedirectFetchOptions
  ): Promise<RedirectMap>
  async getRedirects(
    params: IBGetRedirectsParams = {},
    forceRefreshOrOptions: boolean | RedirectFetchOptions = false
  ): Promise<RedirectMap> {
    const { allPages = false, forceRefresh = false } =
      typeof forceRefreshOrOptions === 'boolean'
        ? { allPages: true, forceRefresh: forceRefreshOrOptions }
        : forceRefreshOrOptions

    // Key the cache on the params (and current revision) so a filtered lookup
    // can never serve its result to an unfiltered caller, and vice versa.
    const cacheKey = JSON.stringify({ params, rv: this.currentRv() })
    if (allPages && !forceRefresh) {
      const cached = this.redirectsCache.get(cacheKey)
      if (cached) return cached
    }

    const { filter, ...rest } = params
    const flatParams = buildParamsWithFilter(rest, filter, undefined)
    const redirects = await this.getCollection<IBRedirect>('redirects', flatParams, { allPages })
    const map = Object.fromEntries(
      redirects.map(({ source, target, status_code }) => [source, { target, status_code }])
    )

    if (allPages) {
      this.redirectsCache.set(cacheKey, map)
    }

    return map
  }

  private currentRv(): string | number {
    return typeof this.client.getRv === 'function' ? this.client.getRv() : ''
  }

  async getConfig<T = Record<string, unknown>>({
    slug = '_config',
    language_iso,
    language,
    bypassCache = false,
    ...params
  }: GetConfigOptions = {}): Promise<T> {
    const normalizedLanguage = language_iso ?? language
    // Include the current revision so a published config change is not masked
    // by a stale cache entry from a previous revision.
    const cacheKey = JSON.stringify({
      slug,
      language_iso: normalizedLanguage,
      rv: this.currentRv(),
      ...params,
    })
    if (!bypassCache && this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey) as T
    }

    // Dedupe concurrent misses so a cold-start burst issues one upstream fetch.
    const inflight = this.configInflight.get(cacheKey)
    if (!bypassCache && inflight) {
      return inflight as Promise<T>
    }

    const fetchPromise = this.getContent<Record<string, unknown>>(slug, {
      ...params,
      language_iso: normalizedLanguage,
    })
      .then((configContent) => {
        const value = (configContent.content ?? {}) as T
        if (!bypassCache) {
          this.setConfigCache(cacheKey, value)
        }
        return value
      })
      .finally(() => {
        this.configInflight.delete(cacheKey)
      })

    if (!bypassCache) {
      this.configInflight.set(cacheKey, fetchPromise)
    }

    return fetchPromise
  }

  private setConfigCache(key: string, value: unknown): void {
    // Simple LRU: refresh recency by re-inserting, evict oldest past the cap.
    this.configCache.delete(key)
    this.configCache.set(key, value)
    if (this.configCache.size > CONFIG_CACHE_MAX) {
      const oldest = this.configCache.keys().next().value
      if (oldest !== undefined) this.configCache.delete(oldest)
    }
  }

  async syncRevision(fallbackRv = 426713400): Promise<string | number> {
    const space = await this.getSpace()
    const nextRv = space.rv || fallbackRv
    this.client.setRv(nextRv)
    return nextRv
  }

  clearCache() {
    this.redirectsCache.clear()
    this.configCache.clear()
    this.configInflight.clear()
  }

  private unwrapResource<T>(response: T | { data: T }): T {
    if (typeof response === 'object' && response !== null && 'data' in response) {
      return (response as { data: T }).data
    }

    return response
  }

  private unwrapCollection<T>(response: ApiCollectionResult<T>): T[] {
    if (Array.isArray(response)) {
      return response
    }

    if (typeof response === 'object' && response !== null && 'data' in response) {
      if (Array.isArray(response.data)) {
        return response.data
      }

      if (
        typeof response.data === 'object' &&
        response.data !== null &&
        'data' in response.data &&
        Array.isArray(response.data.data)
      ) {
        return response.data.data
      }
    }

    return []
  }
}

export function createB10cksDataApi(client: DataApiClient): B10cksDataApi {
  return new B10cksDataApi(client)
}
