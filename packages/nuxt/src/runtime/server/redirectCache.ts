import type { RedirectMap } from '@b10cks/client'

type Redirect = RedirectMap[string]

/** Keeps work alive after the response is sent. An h3 event fits. */
export interface BackgroundTasks {
  waitUntil(promise: Promise<unknown>): void
}

/** How long requests wait for the first list before they render without redirects. */
const COLD_START_WAIT_MS = 3000

/** Ends a hung refresh, so that a later one can start. */
const REFRESH_TIMEOUT_MS = 30_000

/** Redirects match without a trailing slash and with the path decoded. */
function normalizePath(path: string): string {
  let end = path.length
  while (end > 1 && path[end - 1] === '/') end--
  const trimmed = path.slice(0, end)

  try {
    return decodeURI(trimmed)
  } catch {
    return trimmed
  }
}

function indexRedirects(redirects: RedirectMap): Map<string, Redirect> {
  const index = new Map<string, Redirect>()
  for (const [source, redirect] of Object.entries(redirects)) {
    const path = normalizePath(source)
    // `/a/` to `/a` is one path after normalising and would redirect to itself forever.
    if (normalizePath(redirect.target.replace(/[?#].*$/s, '')) !== path) index.set(path, redirect)
  }
  return index
}

function settleWithin(task: Promise<void>, ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms)
    void task.finally(() => {
      clearTimeout(timer)
      resolve()
    })
  })
}

/**
 * A redirect list kept in memory for `maxAge` seconds.
 *
 * An expired list keeps answering while one refresh runs behind it, so only
 * the first requests of an instance ever wait, and for a limited time. A failed
 * refresh keeps the list it had and tries again after the next `maxAge`.
 */
export function createRedirectCache(
  load: (signal: AbortSignal) => Promise<RedirectMap>,
  maxAge: number
) {
  let redirects = new Map<string, Redirect>()
  let expiresAt = 0
  let refreshing: Promise<void> | undefined
  let firstLoad: Promise<void> | undefined

  const refresh = () => {
    refreshing ??= load(AbortSignal.timeout(REFRESH_TIMEOUT_MS))
      .then(
        (list) => {
          redirects = indexRedirects(list)
        },
        (error: unknown) => console.warn('[b10cks] Could not load redirects', error)
      )
      .finally(() => {
        expiresAt = Date.now() + maxAge * 1000
        refreshing = undefined
      })
    return refreshing
  }

  return async (path: string, tasks?: BackgroundTasks): Promise<Redirect | undefined> => {
    if (Date.now() >= expiresAt) {
      const running = refresh()
      tasks?.waitUntil(running)
      firstLoad ??= settleWithin(running, COLD_START_WAIT_MS)
    }
    await firstLoad

    return redirects.get(normalizePath(path))
  }
}

/** The site path of a request. Redirects are stored without the app's `baseURL`. */
export function withoutBaseURL(path: string, baseURL: string): string {
  const base = baseURL.replace(/\/$/, '')
  if (!base) return path
  if (path === base) return '/'
  return path.startsWith(`${base}/`) ? path.slice(base.length) : path
}

/** Puts a redirect target on the app's `baseURL`, unless it is on another host. */
export function withBaseURL(target: string, baseURL: string): string {
  const isSitePath = target.startsWith('/') && !target.startsWith('//')
  return isSitePath ? `${baseURL.replace(/\/$/, '')}${target}` : target
}

/** Adds the request's query to a redirect target. A key the target sets keeps its value. */
export function withRequestQuery(target: string, search: string): string {
  const hashAt = target.indexOf('#')
  const url = hashAt < 0 ? target : target.slice(0, hashAt)
  const hash = hashAt < 0 ? '' : target.slice(hashAt)
  const queryAt = url.indexOf('?')

  const added = new URLSearchParams(search)
  if (queryAt >= 0) {
    for (const key of new URLSearchParams(url.slice(queryAt)).keys()) added.delete(key)
  }

  const query = added.toString()
  if (!query) return target
  return `${url}${queryAt < 0 ? '?' : '&'}${query}${hash}`
}
