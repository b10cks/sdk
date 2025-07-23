import type { B10cksApiClientOptions, IBBaseQueryParams, IBCollectionResponse, IBMeta, } from './types'

export type FetchClient = typeof fetch
export type Endpoint = 'blocks' | 'contents' | `datasources/${string}/entries` | 'datasources' | 'spaces/me'

export * as types from './types'

export class ApiClient {
  private readonly baseUrl: string
  private readonly token: string
  private readonly version: string
  private readonly vid: string | null
  private readonly fetchClient: FetchClient

  constructor(options: B10cksApiClientOptions, url: URL) {
    this.baseUrl = options.baseUrl.endsWith('/') ? options.baseUrl.slice(0, -1) : options.baseUrl
    this.token = options.token
    this.fetchClient = options.fetchClient

    this.version = options.version || url.searchParams.get('b10cks_mode') || 'published'
    this.vid = url.searchParams.get('b10cks_vid')
  }

  async get<T>(endpoint: Endpoint, params: Omit<IBBaseQueryParams, 'token'> = {}): Promise<T> {
    const url = this.buildUrl(endpoint, {
      ...params,
      version: this.version,
      vid: this.vid,
      token: this.token
    })

    return await this.fetchClient(url)
  }

  async getAll<T>(endpoint: Endpoint, params: Omit<IBBaseQueryParams, 'token'> = {}): Promise<T[]> {
    const response = await this.get<IBCollectionResponse<T> & { meta?: IBMeta }>(
      endpoint,
      { ...params, page: 1 }
    )

    if (!response.meta || response.meta.last_page <= 1) {
      return 'data' in response ? response.data : (response as unknown as T[])
    }

    const pageRequests = Array.from(
      { length: response.meta.last_page },
      (_, i) => this.get<IBCollectionResponse<T>>(endpoint, { ...params, page: i + 1 })
    )

    const allResponses = await Promise.all(pageRequests)

    return allResponses.flatMap(r => r.data)
  }

  private buildUrl(endpoint: string, params: Record<string, unknown>): string {
    const url = new URL(`${this.baseUrl}/v1/${endpoint}`)

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })

    return url.toString()
  }
}