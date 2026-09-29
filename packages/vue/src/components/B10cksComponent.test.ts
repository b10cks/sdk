// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, createSSRApp, defineComponent, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'

import B10cksComponent from './B10cksComponent.vue'

const Broken = defineComponent(() => () => {
  throw new Error('boom')
})
const Hero = defineComponent({ props: ['block'], setup: () => () => h('p', 'hero') })

const Page = () => [
  h(B10cksComponent, { block: { id: 'a', block: 'broken' } }),
  h(B10cksComponent, { block: { id: 'b', block: 'hero' } }),
]

function mount() {
  const root = document.createElement('div')
  document.body.append(root)
  createApp(Page).component('Broken', Broken).component('Hero', Hero).mount(root)
  return root
}

afterEach(() => {
  Object.defineProperty(window, 'top', { value: window, configurable: true })
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('B10cksComponent error boundary', () => {
  it('renders nothing for a broken block, keeps the page, and logs once', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    const root = mount()
    await nextTick()

    expect(root.innerHTML).toBe('<!--v-if--><p>hero</p>')
    expect(error).toHaveBeenCalledTimes(1)
    expect(error.mock.calls[0]?.[0]).toBe('[b10cks] Block "broken" failed to render.')
  })

  it('renders a placeholder naming the block in preview mode', async () => {
    Object.defineProperty(window, 'top', { value: {}, configurable: true })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    const root = mount()
    await nextTick()

    expect(root.querySelector('[data-b10cks-error]')?.textContent?.trim()).toBe(
      'Block "broken" failed to render: boom'
    )
    expect(root.querySelector('p')?.textContent).toBe('hero')
  })

  it('reports to the app errorHandler instead of the console', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errorHandler = vi.fn()
    const root = document.createElement('div')
    const app = createApp(Page).component('Broken', Broken).component('Hero', Hero)
    app.config.errorHandler = errorHandler

    app.mount(root)

    expect(errorHandler).toHaveBeenCalledTimes(1)
    expect(error).not.toHaveBeenCalled()
  })

  it('keeps server rendering going', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const app = createSSRApp(Page).component('Broken', Broken).component('Hero', Hero)

    expect(await renderToString(app)).toContain('<p>hero</p>')
  })
})
