import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { RedirectMap } from './data-api'
import {
  createRedirectCache,
  withBaseURL,
  withoutBaseURL,
  withRequestQuery,
} from './redirect-cache'

const list = (target = '/new'): RedirectMap => ({ '/old': { target, status_code: 301 } })

describe('createRedirectCache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('loads the list once within maxAge', async () => {
    const load = vi.fn(async () => list())
    const resolve = createRedirectCache(load, 60)

    await Promise.all([resolve('/old'), resolve('/other')])
    await vi.advanceTimersByTimeAsync(59_000)

    expect((await resolve('/old'))?.target).toBe('/new')
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('answers from the expired list while one refresh runs', async () => {
    let finish = (_list: RedirectMap) => {}
    const load = vi
      .fn<() => Promise<RedirectMap>>()
      .mockResolvedValueOnce(list('/first'))
      .mockImplementationOnce(() => new Promise((done) => (finish = done)))
    const resolve = createRedirectCache(load, 60)
    const waitUntil = vi.fn()

    await resolve('/old')
    await vi.advanceTimersByTimeAsync(60_000)

    expect((await resolve('/old', { waitUntil }))?.target).toBe('/first')
    expect((await resolve('/old', { waitUntil }))?.target).toBe('/first')
    expect(load).toHaveBeenCalledTimes(2)
    expect(waitUntil).toHaveBeenCalled()

    finish(list('/second'))
    await vi.advanceTimersByTimeAsync(0)

    expect((await resolve('/old'))?.target).toBe('/second')
  })

  it('stops waiting for a first load that hangs', async () => {
    const resolve = createRedirectCache(() => new Promise(() => {}), 60)

    const hit = resolve('/old')
    await vi.advanceTimersByTimeAsync(3000)

    await expect(hit).resolves.toBeUndefined()
  })

  it('keeps the list when a refresh fails and retries after maxAge', async () => {
    const load = vi
      .fn<() => Promise<RedirectMap>>()
      .mockResolvedValueOnce(list())
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce(list('/back'))
    const resolve = createRedirectCache(load, 60)

    await resolve('/old')
    await vi.advanceTimersByTimeAsync(60_000)
    await resolve('/old')
    await vi.advanceTimersByTimeAsync(0)

    expect((await resolve('/old'))?.target).toBe('/new')
    expect(load).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(60_000)
    await resolve('/old')
    await vi.advanceTimersByTimeAsync(0)

    expect((await resolve('/old'))?.target).toBe('/back')
  })

  it('ignores a trailing slash and URL encoding, but not case', async () => {
    const resolve = createRedirectCache(
      async () => ({
        '/old/': { target: '/new', status_code: 301 },
        '/über': { target: '/about', status_code: 301 },
      }),
      60
    )

    expect((await resolve('/old'))?.target).toBe('/new')
    expect((await resolve('/old/'))?.target).toBe('/new')
    expect((await resolve('/%C3%BCber'))?.target).toBe('/about')
    expect((await resolve('/%c3%bcber/'))?.target).toBe('/about')
    expect(await resolve('/OLD')).toBeUndefined()
    expect(await resolve('/%E0%A4%A')).toBeUndefined()
  })

  it('skips a redirect that would point at itself after normalising', async () => {
    const resolve = createRedirectCache(
      async () => ({ '/same/': { target: '/same?from=slash', status_code: 301 } }),
      60
    )

    expect(await resolve('/same')).toBeUndefined()
  })
})

describe('baseURL', () => {
  it.each([
    ['/old', '/', '/old'],
    ['/base/old', '/base/', '/old'],
    ['/base', '/base/', '/'],
    ['/baseball', '/base/', '/baseball'],
  ])('reads %s under %s as %s', (path, baseURL, expected) => {
    expect(withoutBaseURL(path, baseURL)).toBe(expected)
  })

  it.each([
    ['/new', '/', '/new'],
    ['/new', '/base/', '/base/new'],
    ['https://example.com/new', '/base/', 'https://example.com/new'],
    ['//example.com/new', '/base/', '//example.com/new'],
  ])('sends %s under %s to %s', (target, baseURL, expected) => {
    expect(withBaseURL(target, baseURL)).toBe(expected)
  })
})

describe('withRequestQuery', () => {
  it.each([
    ['/new', '', '/new'],
    ['/new', '?utm_source=x', '/new?utm_source=x'],
    ['/new?a=1', '?utm_source=x', '/new?a=1&utm_source=x'],
    ['/new?a=1', '?a=2&b=3', '/new?a=1&b=3'],
    ['/new?a=1', '?a=2', '/new?a=1'],
    ['/new#top', '?b=3', '/new?b=3#top'],
    ['https://example.com/new?a=1#top', '?b=3', 'https://example.com/new?a=1&b=3#top'],
  ])('merges into %s from "%s"', (target, search, expected) => {
    expect(withRequestQuery(target, search)).toBe(expected)
  })
})
