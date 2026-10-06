import type { FetchClient } from '@b10cks/client'

/**
 * Nuxt's `$fetch` as the client's fetch, with its own retry turned off so the
 * `retries` option is the only retry policy. `$fetch` parses the body itself;
 * the client passes such payloads through and turns its errors into `ApiError`.
 */
export function createFetchClient(): FetchClient {
  // Its init type (NitroFetchOptions) is wider than RequestInit, so the cast is required.
  const fetch = $fetch as unknown as (
    input: string,
    init: RequestInit & { retry: number }
  ) => Promise<unknown>
  return (input, init) => fetch(String(input), { ...init, retry: 0 })
}
