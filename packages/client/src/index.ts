import type {
  B10cksApiClientOptions,
  Endpoint,
  FetchClient,
  IBBaseQueryParams,
  IBCollectionResponse,
  IBMeta,
  IBResponse,
  RequestOptions,
} from './types'

export interface B10cksApiClientRvOptions {
  getRv?: () => string | number
  setRv?: (value: string | number) => void
}

/**
 * Error thrown for non-2xx API responses and transport failures. Carries the
 * HTTP `status` (0 for network/timeout errors), the requested `endpoint`, and a
 * best-effort parsed `body` so callers can branch on status (e.g. render a 404
 * page) without string-matching the message. Messages name the endpoint, never
 * the request URL, so the access token stays out of logs.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly endpoint: string,
    public readonly body?: unknown,
    /** Delay the API asked for in a `Retry-After` header, in milliseconds. */
    public readonly retryAfterMs?: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** A `Retry-After` longer than this is not waited for: the request fails instead. */
const MAX_RETRY_AFTER_MS = 10_000

/** Network errors and timeouts (status 0), rate limits and server errors. */
const isRetryableStatus = (status: number): boolean =>
  status === 0 || status === 429 || (status >= 500 && status <= 599)

/** Wait for `ms`, or reject with the signal's reason when it aborts first. */
const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  abortable(new Promise((resolve) => setTimeout(resolve, ms)), signal)

/** `promise`, or a rejection with the signal's reason when it aborts first. */
function abortable<T>(promise: Promise<T>, signal: AbortSignal | undefined): Promise<T> {
  if (!signal) return promise
  if (signal.aborted) return Promise.reject(signal.reason)
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(signal.reason)
    signal.addEventListener('abort', onAbort, { once: true })
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort))
  })
}

/** Milliseconds from a `Retry-After` header: delay seconds or an HTTP date. */
function parseRetryAfter(value: string | null | undefined): number | undefined {
  if (!value) return undefined
  const seconds = Number(value)
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
  const date = Date.parse(value)
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now())
}

function retryAfterOf(response: unknown): number | undefined {
  if (typeof response !== 'object' || response === null || !('headers' in response)) return
  const { headers } = response as { headers: unknown }
  return headers instanceof Headers ? parseRetryAfter(headers.get('retry-after')) : undefined
}

/** The HTTP status and parsed body of an error a fetch client throws itself, like Nuxt's `$fetch`. */
function httpErrorOf(error: unknown): { status: number; body: unknown; response: unknown } | null {
  if (typeof error !== 'object' || error === null) return null
  const { status, statusCode, data, response } = error as Record<string, unknown>
  const code = typeof status === 'number' ? status : statusCode
  return typeof code === 'number' && code > 0 ? { status: code, body: data, response } : null
}

export * from './breadcrumb'
export * from './content'
export * from './data-api'
export * from './editable'
export * from './preview-bridge'
export * from './preview-store'
export * from './rich-text-field'
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
    params: Omit<IBBaseQueryParams, 'token'> & Record<string, unknown> = {},
    options: RequestOptions = {}
  ): Promise<ApiResourceResponse<T>> {
    const url = this.buildUrl(endpoint, {
      vid: this.vid,
      rv: this.getRv(),
      ...params,
      token: this.token,
    })

    const response = await this.requestWithRetry<ApiResourceResponse<T>>(
      url,
      endpoint,
      options.signal
    )

    if (this.hasRevision(response)) {
      this.setRv(response.rv)
    }

    return response
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    params: Omit<IBBaseQueryParams, 'token'> & Record<string, unknown> = {},
    options: RequestOptions = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint, {
      vid: this.vid,
      rv: this.getRv(),
      ...params,
      token: this.token,
    })

    // POST is not retried (non-idempotent), but still honors the timeout and the signal.
    return this.request<T>(
      url,
      endpoint,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      },
      options.signal
    )
  }

  /**
   * One attempt: the fetch and reading its body, both within `timeoutMs`.
   * Failures reject with an {@link ApiError}, except an abort through `signal`,
   * which rejects with the signal's reason.
   */
  private async request<T>(
    url: string,
    endpoint: string,
    init: RequestInit | undefined,
    signal: AbortSignal | undefined
  ): Promise<T> {
    signal?.throwIfAborted()
    if (!signal && !this.timeoutMs) {
      return this.fetchAndParse<T>(url, endpoint, init)
    }

    const controller = new AbortController()
    const onAbort = () => controller.abort(signal?.reason)
    signal?.addEventListener('abort', onAbort, { once: true })
    let timedOut = false
    const timer = this.timeoutMs
      ? setTimeout(() => {
          timedOut = true
          controller.abort()
        }, this.timeoutMs)
      : undefined

    try {
      const attempt = this.fetchAndParse<T>(url, endpoint, { ...init, signal: controller.signal })
      // Settle on abort even when the fetch client ignores the signal.
      return await abortable(attempt, controller.signal)
    } catch (error) {
      if (signal?.aborted) throw signal.reason
      if (timedOut) {
        throw new ApiError(
          `Request to "${endpoint}" timed out after ${this.timeoutMs}ms`,
          0,
          endpoint
        )
      }
      throw error
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
    }
  }

  private async fetchAndParse<T>(
    url: string,
    endpoint: string,
    init: RequestInit | undefined
  ): Promise<T> {
    let payload: unknown
    try {
      payload = await this.fetchClient(url, init)
    } catch (error) {
      if (init?.signal?.aborted) throw error
      // Nuxt's `$fetch` throws for non-2xx statuses; its message holds the URL and token.
      const http = httpErrorOf(error)
      if (http) {
        throw new ApiError(
          `Request to "${endpoint}" failed with status ${http.status}`,
          http.status,
          endpoint,
          http.body,
          retryAfterOf(http.response)
        )
      }
      throw new ApiError(`Request to "${endpoint}" failed: network error`, 0, endpoint)
    }
    return this.parseResponse<T>(payload, endpoint)
  }

  private async requestWithRetry<T>(
    url: string,
    endpoint: string,
    signal: AbortSignal | undefined
  ): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.request<T>(url, endpoint, undefined, signal)
      } catch (error) {
        const delay = attempt < this.retries ? retryDelay(error, attempt) : undefined
        if (delay === undefined) throw error
        await sleep(delay, signal)
      }
    }
  }

  async getAll<T>(
    endpoint: Endpoint,
    params: Omit<IBBaseQueryParams, 'token'> & Record<string, unknown> = {},
    options: RequestOptions = {}
  ): Promise<T[]> {
    const firstResponse = await this.get<IBCollectionResponse<T> & { meta?: IBMeta }>(
      endpoint,
      { ...params, page: 1 },
      options
    )
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

    // A failed page cancels the pages still loading, and so does the caller's signal.
    const controller = new AbortController()
    const { signal } = options
    const onAbort = () => controller.abort(signal?.reason)
    signal?.addEventListener('abort', onAbort, { once: true })
    const loadPage = async (page: number) => {
      try {
        return await this.get<IBCollectionResponse<T>>(
          endpoint,
          { ...params, page },
          { signal: controller.signal }
        )
      } catch (error) {
        controller.abort(error)
        throw error
      }
    }

    try {
      const allResponses = await this.mapWithConcurrency(pages, loadPage, controller.signal)
      return normalizedFirstResponse.data.concat(
        allResponses.flatMap((response) => this.normalizeCollectionResponse<T>(response).data)
      )
    } finally {
      signal?.removeEventListener('abort', onAbort)
    }
  }

  /**
   * Runs `task` over `items` preserving order, with at most `maxConcurrency`
   * requests in flight, so paginated fan-out cannot open hundreds of sockets
   * at once and trip API rate limits.
   */
  private async mapWithConcurrency<I, O>(
    items: I[],
    task: (item: I) => Promise<O>,
    signal: AbortSignal
  ): Promise<O[]> {
    const results: O[] = Array.from({ length: items.length })
    let cursor = 0

    const worker = async (): Promise<void> => {
      while (cursor < items.length && !signal.aborted) {
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
          body,
          retryAfterOf(payload)
        )
      }

      try {
        return (await payload.json()) as T
      } catch {
        throw new ApiError(
          `Response from "${endpoint}" is not valid JSON`,
          payload.status,
          endpoint
        )
      }
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

/** How long to wait before retrying a failed GET, or undefined to fail now. */
function retryDelay(error: unknown, attempt: number): number | undefined {
  // Aborts reject with the signal's reason, not an ApiError, so they never retry.
  if (!(error instanceof ApiError) || !isRetryableStatus(error.status)) return undefined
  if (error.retryAfterMs === undefined) {
    // Exponential backoff: 200ms, 400ms, 800ms, …
    return 200 * 2 ** attempt
  }
  return error.retryAfterMs <= MAX_RETRY_AFTER_MS ? error.retryAfterMs : undefined
}
