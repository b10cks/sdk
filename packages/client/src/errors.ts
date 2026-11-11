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

/**
 * Thrown by `getContent` for a slug that has a redirect. The delivery API
 * answers such a slug with the redirect instead of an entry, so there is no
 * content to return. `status` is the redirect's status code.
 */
export class ContentRedirectError extends ApiError {
  constructor(
    endpoint: string,
    /** Where the slug redirects to: a path or an absolute URL. */
    public readonly target: string,
    status: number,
    body?: unknown
  ) {
    super(`"${endpoint}" redirects to "${target}"`, status, endpoint, body)
    this.name = 'ContentRedirectError'
  }
}
