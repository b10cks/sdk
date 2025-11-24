import type { B10cksApiClientOptions, IBBaseQueryParams, IBCollectionResponse, IBMeta, IBResponse, } from './types'

export type FetchClient = typeof fetch
export type Endpoint = 'blocks' | 'contents' | `contents/${string}` | `datasources/${string}/entries` | 'datasources' | 'spaces/me'

export interface B10cksApiClientRvOptions {
  getRv?: () => string | number
  setRv?: (value: string | number) => void
}

export * as types from './types'
export type { IBBlock, IBResponse, IBContent, B10cksApiClientOptions } from './types'
let rv: string | number = 0

export class ApiClient {
  private readonly baseUrl: string
  private readonly token: string
  private readonly vid: string | null
  private readonly fetchClient: FetchClient
  private readonly getRvFn?: () => string | number
  private readonly setRvFn?: (value: string | number) => void

  constructor(options: B10cksApiClientOptions, url: URL) {
    this.baseUrl = options.baseUrl.endsWith('/') ? options.baseUrl.slice(0, -1) : options.baseUrl
    this.token = options.token
    this.fetchClient = options.fetchClient
    this.getRvFn = options.getRv
    this.setRvFn = options.setRv

    this.vid = url.searchParams.get('b10cks_vid') || options.version || 'published'
    this.setRv(url.searchParams.get('b10cks_rv') || options.rv || rv)
  }

  async get<T>(endpoint: Endpoint, params: Omit<IBBaseQueryParams, 'token'> = {}): Promise<T> {
    const url = this.buildUrl(endpoint, {
      vid: this.vid,
      ...params,
      rv: this.getRv(),
      token: this.token
    })

    const response = await this.fetchClient(url) as unknown as IBResponse<T>
    if (response.rv) {
      this.setRv(response.rv)
    }

    return response as T
  }

  async getAll<T>(endpoint: Endpoint, params: Omit<IBBaseQueryParams, 'token'> = {}): Promise<T[]> {
    const response = await this.get<IBCollectionResponse<T> & { meta?: IBMeta }>(
      endpoint,
      { ...params, page: 1 }
    )
    if (response.rv) {
      this.setRv(response.rv)
    }

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

  setRv(value: string | number) {
    if (this.setRvFn) {
      this.setRvFn(value)
    } else {
      rv = value
    }
  }

  getRv() {
    if (this.getRvFn) {
      return this.getRvFn()
    }
    return rv
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