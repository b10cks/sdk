import type {
  Endpoint,
  IBBaseQueryParams,
  IBBlock,
  IBContent,
  IBContentQueryParams,
  IBDataEntry,
  IBDataSource,
  IBRedirect,
  IBSpace,
} from './types'

type ApiQueryParams = Omit<IBBaseQueryParams, 'token'>

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

  async getCollection<T>(endpoint: Endpoint, params: ApiQueryParams = {}): Promise<T[]> {
    return this.client.getAll<T>(endpoint, params)
  }

  async getContent<T = Record<string, unknown>>(
    fullSlug: string,
    params: Omit<IBContentQueryParams, 'token' | 'full_slug'> = {}
  ): Promise<IBContent<T>> {
    return this.getResource<IBContent<T>>(`contents/${fullSlug}`, params)
  }

  async getContents<T = Record<string, unknown>>(
    params: Omit<IBContentQueryParams, 'token'> = {}
  ): Promise<IBContent<T>[]> {
    return this.getCollection<IBContent<T>>('contents', params)
  }

  async getBlocks(params: ApiQueryParams = {}): Promise<IBBlock[]> {
    return this.getCollection<IBBlock>('blocks', params)
  }

  async getDataEntries(source: string, params: ApiQueryParams = {}): Promise<IBDataEntry[]> {
    return this.getCollection<IBDataEntry>(`datasources/${source}/entries`, params)
  }

  async getDataSources(params: ApiQueryParams = {}): Promise<IBDataSource[]> {
    return this.getCollection<IBDataSource>('datasources', params)
  }

  async getSpace(params: ApiQueryParams = {}): Promise<IBSpace> {
    return this.getResource<IBSpace>('spaces/me', params)
  }

  async getRedirects(params: ApiQueryParams = {}, forceRefresh = false): Promise<RedirectMap> {
    if (this.redirectsCache && !forceRefresh) {
      return this.redirectsCache
    }

    const redirects = await this.getCollection<IBRedirect>('redirects', params)
    const map = Object.fromEntries(
      redirects.map(({ source, target, status_code }) => [source, { target, status_code }])
    )
    this.redirectsCache = map
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
}

export function createB10cksDataApi(client: DataApiClient): B10cksDataApi {
  return new B10cksDataApi(client)
}
