import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createB10cksRedirects } from './middleware'

const fetchClient = vi.fn(async (input: RequestInfo | URL) => {
  const body = String(input).includes('/redirects')
    ? {
        data: [
          { source: '/old', target: '/new?a=1', status_code: 302 },
          { source: '/away', target: 'https://example.com/landing', status_code: 301 },
        ],
      }
    : { data: { rv: 1 } }
  return Response.json(body)
})

const redirects = () =>
  createB10cksRedirects({ token: 'token', baseUrl: 'https://api.test', fetchClient })

afterEach(() => fetchClient.mockClear())

describe('createB10cksRedirects', () => {
  it('answers a redirect with its status and keeps the query', async () => {
    const response = await redirects()(new NextRequest('https://site.test/old/?utm=x'))

    expect(response?.status).toBe(302)
    expect(response?.headers.get('Location')).toBe('https://site.test/new?a=1&utm=x')
  })

  it('keeps a target on another host', async () => {
    const response = await redirects()(new NextRequest('https://site.test/away'))

    expect(response?.headers.get('Location')).toBe('https://example.com/landing')
  })

  it('applies the basePath to the target', async () => {
    const request = new NextRequest('https://site.test/docs/old', {
      nextConfig: { basePath: '/docs' },
    })

    const response = await redirects()(request)

    expect(response?.headers.get('Location')).toBe('https://site.test/docs/new?a=1')
  })

  it('passes other paths, writes and editor previews through', async () => {
    const handler = redirects()

    expect(await handler(new NextRequest('https://site.test/other'))).toBeUndefined()
    expect(
      await handler(new NextRequest('https://site.test/old', { method: 'POST' }))
    ).toBeUndefined()
    expect(await handler(new NextRequest('https://site.test/old?b10cks_vid=1'))).toBeUndefined()
  })
})
