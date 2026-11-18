// @vitest-environment happy-dom
import type { B10cksDataApi, IBContent } from '@b10cks/client'
import { act, type ReactNode, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { type AsyncState, useB10cksApi } from './hooks'
import { B10cksProvider } from './provider'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

type GetContent = (
  slug: string,
  params: unknown,
  options: { signal: AbortSignal }
) => Promise<unknown>

function fakeApi(getContent: GetContent) {
  return { getContent } as unknown as B10cksDataApi
}

const entry = (name: string) => ({ id: name, full_slug: name }) as unknown as IBContent

let root: Root | undefined

async function render(node: ReactNode) {
  root = createRoot(document.createElement('div'))
  await act(async () => root?.render(node))
}

afterEach(async () => {
  await act(async () => root?.unmount())
  root = undefined
})

describe('useB10cksApi', () => {
  it('aborts the previous request when the slug changes and on unmount', async () => {
    const signals: AbortSignal[] = []
    const dataApi = fakeApi((_slug, _params, { signal }) => {
      signals.push(signal)
      return new Promise(() => {})
    })
    const Query = ({ slug }: { slug: string }) => {
      useB10cksApi().useContent(slug)
      return null
    }
    const page = (slug: string) => (
      <B10cksProvider dataApi={dataApi}>
        <Query slug={slug} />
      </B10cksProvider>
    )

    await render(page('a'))
    await act(async () => root?.render(page('b')))

    expect(signals.map((signal) => signal.aborted)).toEqual([true, false])

    await act(async () => root?.unmount())
    root = undefined

    expect(signals[1]?.aborted).toBe(true)
  })

  it('keeps a stale response out of the state', async () => {
    const answers = new Map<string, (value: IBContent) => void>()
    const dataApi = fakeApi((slug) => new Promise((resolve) => answers.set(slug, resolve)))
    let state: AsyncState<IBContent> | undefined
    const Query = ({ slug }: { slug: string }) => {
      state = useB10cksApi().useContent(slug)
      return null
    }
    const page = (slug: string) => (
      <B10cksProvider dataApi={dataApi}>
        <Query slug={slug} />
      </B10cksProvider>
    )

    await render(page('a'))
    await act(async () => root?.render(page('b')))
    await act(async () => {
      answers.get('b')?.(entry('b'))
      answers.get('a')?.(entry('a'))
    })

    expect(state?.data?.id).toBe('b')
  })

  it('types and stores the result of transform', async () => {
    const dataApi = fakeApi(async () => entry('a'))
    let title: string | null | undefined
    const Query = () => {
      const { data } = useB10cksApi().useContent(
        'a',
        {},
        {
          transform: (content: IBContent) => `title of ${content.id}`,
        }
      )
      title = data
      return null
    }

    await render(
      <B10cksProvider dataApi={dataApi}>
        <Query />
      </B10cksProvider>
    )

    expect(title).toBe('title of a')
  })

  it('refetches a manual query once it ran and its input changes', async () => {
    const getContent = vi.fn<GetContent>(async () => entry('a'))
    let state: AsyncState<IBContent> | undefined
    const Query = ({ slug }: { slug: string }) => {
      state = useB10cksApi().useContent(slug, {}, { immediate: false })
      return null
    }
    const dataApi = fakeApi(getContent)
    const page = (slug: string) => (
      <StrictMode>
        <B10cksProvider dataApi={dataApi}>
          <Query slug={slug} />
        </B10cksProvider>
      </StrictMode>
    )

    await render(page('a'))
    await act(async () => root?.render(page('b')))
    expect(getContent).not.toHaveBeenCalled()

    await act(async () => void (await state?.execute()))
    expect(getContent).toHaveBeenCalledTimes(1)

    await act(async () => root?.render(page('c')))
    expect(getContent).toHaveBeenCalledTimes(2)
    expect(getContent.mock.calls[1]?.[0]).toBe('c')
  })
})
