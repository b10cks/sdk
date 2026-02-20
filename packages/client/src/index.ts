import type {
  B10cksApiClientOptions,
  Endpoint,
  FetchClient,
  IBBaseQueryParams,
  IBCollectionResponse,
  IBMeta,
  IBResponse,
} from './types'

export interface B10cksApiClientRvOptions {
  getRv?: () => string | number
  setRv?: (value: string | number) => void
}

export * as types from './types'
export type * from './types'
export * from './data-api'
export * from './preview-bridge'

let rv: string | number = 0

type ApiResourceResponse<T> = IBResponse<T> | T
type ApiCollectionResponse<T> =
  | IBCollectionResponse<T>
  | IBResponse<IBCollectionResponse<T>>
  | T[]
  | { data: T[]; meta?: IBMeta; rv?: string | number }

export class ApiClient {
  private readonly baseUrl: string
  readonly token: string
  private readonly vid: string | null
  private readonly fetchClient: FetchClient
  private readonly getRvFn?: () => string | number
  private readonly setRvFn?: (value: string | number) => void

  constructor(options: B10cksApiClientOptions, requestUrl?: URL | string) {
    this.baseUrl = options.baseUrl.endsWith('/') ? options.baseUrl.slice(0, -1) : options.baseUrl
    this.token = options.token
    const defaultFetch =
      typeof globalThis.fetch === 'function' ? globalThis.fetch.bind(globalThis) : null
    if (options.fetchClient) {
      this.fetchClient = options.fetchClient
    } else if (defaultFetch) {
      this.fetchClient = defaultFetch as FetchClient
    } else {
      throw new Error(
        'No fetch implementation available. Provide `fetchClient` in ApiClient options.'
      )
    }

    this.getRvFn = options.getRv
    this.setRvFn = options.setRv

    const url = this.resolveRequestUrl(requestUrl)
    this.vid = url?.searchParams.get('b10cks_vid') || options.version || 'published'
    this.setRv(url?.searchParams.get('b10cks_rv') || options.rv || rv)
  }

  async get<T>(
    endpoint: Endpoint,
    params: Omit<IBBaseQueryParams, 'token'> = {}
  ): Promise<ApiResourceResponse<T>> {
    const url = this.buildUrl(endpoint, {
      vid: this.vid,
      ...params,
      rv: this.getRv(),
      token: this.token,
    })

    const payload = await this.fetchClient(url)
    const response = await this.parseResponse<ApiResourceResponse<T>>(payload)

    if (this.hasRevision(response)) {
      this.setRv(response.rv)
    }

    return response
  }

  async getAll<T>(endpoint: Endpoint, params: Omit<IBBaseQueryParams, 'token'> = {}): Promise<T[]> {
    const firstResponse = await this.get<IBCollectionResponse<T> & { meta?: IBMeta }>(endpoint, {
      ...params,
      page: 1,
    })
    const normalizedFirstResponse = this.normalizeCollectionResponse<T>(firstResponse)

    if (normalizedFirstResponse.rv) {
      this.setRv(normalizedFirstResponse.rv)
    }

    if (!normalizedFirstResponse.meta || normalizedFirstResponse.meta.last_page <= 1) {
      return normalizedFirstResponse.data
    }

    const pageRequests = Array.from(
      { length: normalizedFirstResponse.meta.last_page - 1 },
      (_, i) => this.get<IBCollectionResponse<T>>(endpoint, { ...params, page: i + 2 })
    )

    const allResponses = await Promise.all(pageRequests)

    return normalizedFirstResponse.data.concat(
      allResponses.flatMap((response) => this.normalizeCollectionResponse<T>(response).data)
    )
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

  private async parseResponse<T>(payload: unknown): Promise<T> {
    if (this.isFetchResponse(payload)) {
      if (!payload.ok) {
        throw new Error(`Request failed with status ${payload.status}`)
      }

      return (await payload.json()) as T
    }

    return payload as T
  }

  private normalizeCollectionResponse<T>(response: ApiCollectionResponse<T>) {
    if (this.isCollectionResponseEnvelope(response)) {
      const nestedResponse = response.data

      return {
        data: nestedResponse.data,
        meta: (nestedResponse as IBCollectionResponse<T> & { meta?: IBMeta }).meta,
        rv: response.rv || nestedResponse.rv,
      }
    }

    if (Array.isArray(response)) {
      return { data: response, meta: undefined, rv: undefined }
    }

    if (typeof response === 'object' && response !== null && 'data' in response) {
      const {
        data,
        meta,
        rv: responseRv,
      } = response as {
        data: T[]
        meta?: IBMeta
        rv?: string | number
      }
      return { data, meta, rv: responseRv }
    }

    return { data: [], meta: undefined, rv: undefined }
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

  private resolveRequestUrl(requestUrl?: URL | string): URL | null {
    if (!requestUrl) {
      return null
    }

    if (requestUrl instanceof URL) {
      return requestUrl
    }

    return new URL(requestUrl, 'http://localhost')
  }

  private isFetchResponse(value: unknown): value is Response {
    return (
      typeof value === 'object' &&
      value !== null &&
      'json' in value &&
      typeof (value as Response).json === 'function' &&
      'ok' in value
    )
  }

  private hasRevision(value: unknown): value is { rv: string | number } {
    return typeof value === 'object' && value !== null && 'rv' in value
  }

  private isCollectionResponseEnvelope<T>(
    value: ApiCollectionResponse<T>
  ): value is IBResponse<IBCollectionResponse<T>> {
    return (
      typeof value === 'object' &&
      value !== null &&
      'data' in value &&
      typeof value.data === 'object' &&
      value.data !== null &&
      'data' in value.data &&
      Array.isArray(value.data.data)
    )
  }
}
