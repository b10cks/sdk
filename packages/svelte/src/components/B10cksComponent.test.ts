// @vitest-environment happy-dom
import { flushSync, mount, unmount } from 'svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'

import B10cksComponent from './B10cksComponent.svelte'
import Broken from './Broken.test.svelte'
import Hero from './Hero.test.svelte'

const components = { broken: Broken, hero: Hero }
const mounted: ReturnType<typeof mount>[] = []

function render(block: { id: string; block: string }) {
  const target = document.createElement('div')
  document.body.append(target)
  mounted.push(mount(B10cksComponent, { target, props: { block, components } }))
  flushSync()
  return target
}

afterEach(() => {
  for (const component of mounted.splice(0)) unmount(component)
  Object.defineProperty(window, 'top', { value: window, configurable: true })
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('B10cksComponent error boundary', () => {
  it('renders nothing for a broken block and logs once', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(render({ id: 'a', block: 'broken' }).textContent).toBe('')
    expect(render({ id: 'b', block: 'hero' }).textContent).toBe('hero')
    expect(error).toHaveBeenCalledTimes(1)
    expect(error.mock.calls[0]?.[0]).toBe('[b10cks] Block "broken" failed to render.')
  })

  it('renders a placeholder naming the block in preview mode', () => {
    Object.defineProperty(window, 'top', { value: {}, configurable: true })
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const target = render({ id: 'a', block: 'broken' })

    expect(target.querySelector('[data-b10cks-error]')?.textContent?.trim()).toBe(
      'Block "broken" failed to render: boom'
    )
  })
})
