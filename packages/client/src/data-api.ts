import type {
  IBCollectionResponse,
  Endpoint,
  IBBaseQueryParams,
  IBBlock,
  IBContent,
  IBContentQueryParams,
  IBDataEntry,
  IBDataSource,
  IBRedirect,
  IBSitemapEntry,
  IBSpace,
} from './types'

type ApiQueryParams = Omit<IBBaseQueryParams, 'token'>
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
  setRv(value: string | number): void
}

export type RedirectMap = Record<string, { target: string; status_code: number }>

export interface GetConfigOptions extends Omit<IBContentQueryParams, 'token' | 'full_slug'> {
  slug?: string
  language?: string
  bypassCache?: boolean
}

export class B10cksDataApi {
  private redirectsCache: RedirectMap | null = null
  private readonly configCache = new Map<string, unknown>()

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
    params: Omit<IBContentQueryParams, 'token'> = {},
    options: CollectionFetchOptions = {}
  ): Promise<IBContent<T>[]> {
    return this.getCollection<IBContent<T>>('contents', params, options)
  }

  async getBlocks(params: ApiQueryParams = {}, options: CollectionFetchOptions = {}): Promise<IBBlock[]> {
    return this.getCollection<IBBlock>('blocks', params, options)
  }

  async getSitemap(
    params: Omit<IBContentQueryParams, 'token'> = {},
    options: CollectionFetchOptions = {}
  ): Promise<IBSitemapEntry[]> {
    return this.getCollection<IBSitemapEntry>('sitemap', params, options)
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

  async getRedirects(params?: ApiQueryParams, forceRefresh?: boolean): Promise<RedirectMap>
  async getRedirects(params?: ApiQueryParams, options?: RedirectFetchOptions): Promise<RedirectMap>
  async getRedirects(
    params: ApiQueryParams = {},
    forceRefreshOrOptions: boolean | RedirectFetchOptions = false
  ): Promise<RedirectMap> {
    const { allPages = false, forceRefresh = false } =
      typeof forceRefreshOrOptions === 'boolean'
        ? { allPages: true, forceRefresh: forceRefreshOrOptions }
        : forceRefreshOrOptions

    if (allPages && this.redirectsCache && !forceRefresh) {
      return this.redirectsCache
    }

    const redirects = await this.getCollection<IBRedirect>('redirects', params, { allPages })
    const map = Object.fromEntries(
      redirects.map(({ source, target, status_code }) => [source, { target, status_code }])
    )

    if (allPages) {
      this.redirectsCache = map
    }

    return map
  }

  async getConfig<T = Record<string, unknown>>({
    slug = '_config',
    language_iso,
    language,
    bypassCache = false,
    ...params
  }: GetConfigOptions = {}): Promise<T> {
    const normalizedLanguage = language_iso ?? language
    const cacheKey = JSON.stringify({ slug, language_iso: normalizedLanguage, ...params })
    if (!bypassCache && this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey) as T
    }

    const configContent = await this.getContent<Record<string, unknown>>(slug, {
      ...params,
      language_iso: normalizedLanguage,
    })
    const value = (configContent.content ?? {}) as T

    if (!bypassCache) {
      this.configCache.set(cacheKey, value)
    }

    return value
  }

  async syncRevision(fallbackRv = 426713400): Promise<string | number> {
    const space = await this.getSpace()
    const nextRv = space.rv || fallbackRv
    this.client.setRv(nextRv)
    return nextRv
  }

  clearCache() {
    this.redirectsCache = null
    this.configCache.clear()
  }

  private unwrapResource<T>(response: T | { data: T }): T {
    if (typeof response === 'object' && response !== null && 'data' in response) {
      return response.data
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
