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

/**
 * Error thrown for non-2xx API responses and transport failures. Carries the
 * HTTP `status` (0 for network/timeout errors), the requested `endpoint`, and a
 * best-effort parsed `body` so callers can branch on status (e.g. render a 404
 * page) without string-matching the message.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly endpoint: string,
    public readonly body?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const isRetryableStatus = (status: number): boolean =>
  status === 429 || (status >= 500 && status <= 599)

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

export * from './breadcrumb'
export * from './content'
export * from './data-api'
export * from './editable'
export * from './preview-bridge'
export * from './preview-store'
export * from './sitemap'
export type * from './types'
export * as types from './types'

type ApiResourceResponse<T> = IBResponse<T> | T
type ApiCollectionResponse<T> =
  | IBCollectionResponse<T>
  | IBResponse<IBCollectionResponse<T>>
  | T[]
  | { data: T[]; meta?: IBMeta; rv?: string | number }

export class ApiClient {
  private readonly baseUrl: string
  readonly token: string
  private readonly vid: string
  private readonly fetchClient: FetchClient
  private readonly getRvFn?: () => string | number
  private readonly setRvFn?: (value: string | number) => void
  private readonly timeoutMs?: number
  private readonly retries: number
  private readonly maxConcurrency: number
  /**
   * Per-instance revision store, used when no `getRv`/`setRv` callbacks are
   * supplied. Kept on the instance (not module scope) so concurrent requests
   * in a server runtime cannot leak revisions into one another. Server callers
   * that need request-scoped persistence should pass `getRv`/`setRv`.
   */
  private rvValue: string | number = 0

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
    this.timeoutMs = options.timeoutMs
    this.retries = Math.max(0, options.retries ?? 0)
    this.maxConcurrency = Math.max(1, options.maxConcurrency ?? 6)

    const url = this.resolveRequestUrl(requestUrl)
    this.vid = options.version || 'published'
    this.setRv(url?.searchParams.get('b10cks_rv') || options.rv || 0)
  }

  async get<T>(
    endpoint: Endpoint,
    params: Omit<IBBaseQueryParams, 'token'> & Record<string, unknown> = {}
  ): Promise<ApiResourceResponse<T>> {
    const url = this.buildUrl(endpoint, {
      vid: this.vid,
      rv: this.getRv(),
      ...params,
      token: this.token,
    })

    const response = await this.requestWithRetry<ApiResourceResponse<T>>(url, endpoint)

    if (this.hasRevision(response)) {
      this.setRv(response.rv)
    }

    return response
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    params: Omit<IBBaseQueryParams, 'token'> & Record<string, unknown> = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint, {
      vid: this.vid,
      rv: this.getRv(),
      ...params,
      token: this.token,
    })

    // POST is not retried (non-idempotent), but still honors the timeout.
    const payload = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    return this.parseResponse<T>(payload, endpoint)
  }

  private async fetchWithTimeout(url: string, init?: RequestInit): Promise<unknown> {
    if (!this.timeoutMs) {
      return this.fetchClient(url, init)
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      return await this.fetchClient(url, { ...init, signal: controller.signal })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(`Request timed out after ${this.timeoutMs}ms`, 0, url)
      }
      throw error
    } finally {
      clearTimeout(timer)
    }
  }

  private async requestWithRetry<T>(url: string, endpoint: string): Promise<T> {
    let lastError: unknown
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const payload = await this.fetchWithTimeout(url)
        return await this.parseResponse<T>(payload, endpoint)
      } catch (error) {
        lastError = error
        const retryable =
          attempt < this.retries &&
          (!(error instanceof ApiError) || error.status === 0 || isRetryableStatus(error.status))
        if (!retryable) {
          throw error
        }
        // Exponential backoff: 200ms, 400ms, 800ms, …
        await sleep(200 * 2 ** attempt)
      }
    }
    throw lastError
  }

  async getAll<T>(
    endpoint: Endpoint,
    params: Omit<IBBaseQueryParams, 'token'> & Record<string, unknown> = {}
  ): Promise<T[]> {
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

    const pages = Array.from(
      { length: normalizedFirstResponse.meta.last_page - 1 },
      (_, i) => i + 2
    )

    const allResponses = await this.mapWithConcurrency(pages, (page) =>
      this.get<IBCollectionResponse<T>>(endpoint, { ...params, page })
    )

    return normalizedFirstResponse.data.concat(
      allResponses.flatMap((response) => this.normalizeCollectionResponse<T>(response).data)
    )
  }

  /**
   * Runs `task` over `items` preserving order, with at most `maxConcurrency`
   * requests in flight, so paginated fan-out cannot open hundreds of sockets
   * at once and trip API rate limits.
   */
  private async mapWithConcurrency<I, O>(items: I[], task: (item: I) => Promise<O>): Promise<O[]> {
    const results: O[] = Array.from({ length: items.length })
    let cursor = 0

    const worker = async (): Promise<void> => {
      while (cursor < items.length) {
        const index = cursor++
        results[index] = await task(items[index] as I)
      }
    }

    const workers = Array.from({ length: Math.min(this.maxConcurrency, items.length) }, () =>
      worker()
    )
    await Promise.all(workers)

    return results
  }

  setRv(value: string | number) {
    if (this.setRvFn) {
      this.setRvFn(value)
    } else {
      this.rvValue = value
    }
  }

  getRv() {
    if (this.getRvFn) {
      return this.getRvFn()
    }
    return this.rvValue
  }

  private async parseResponse<T>(payload: unknown, endpoint: string): Promise<T> {
    if (this.isFetchResponse(payload)) {
      if (!payload.ok) {
        const body = await this.readErrorBody(payload)
        throw new ApiError(
          `Request to "${endpoint}" failed with status ${payload.status}`,
          payload.status,
          endpoint,
          body
        )
      }

      return (await payload.json()) as T
    }

    return payload as T
  }

  private async readErrorBody(response: Response): Promise<unknown> {
    try {
      const text = await response.text()
      if (!text) return undefined
      try {
        return JSON.parse(text)
      } catch {
        return text
      }
    } catch {
      return undefined
    }
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
    return (
      typeof value === 'object' &&
      value !== null &&
      'rv' in value &&
      (value as { rv: unknown }).rv != null
    )
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
