// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { B10cksComponent, type B10cksComponents } from './B10cksComponent'

const BLOCK_ID = '01kh6h981yh1s5z7s3f80wmrw2'
const components = { hero: () => <p>hero</p> }

describe('B10cksComponent anchors', () => {
  it('renders the block id on the wrapper', () => {
    const html = renderToString(
      <B10cksComponent
        block={{ id: BLOCK_ID, block: 'hero' }}
        components={components}
      />
    )
    expect(html).toBe(`<div id="${BLOCK_ID}"><p>hero</p></div>`)
  })

  it('lets an id prop win', () => {
    const html = renderToString(
      <B10cksComponent
        id="own"
        block={{ id: BLOCK_ID, block: 'hero' }}
        components={components}
      />
    )
    expect(html).toBe('<div id="own"><p>hero</p></div>')
  })

  it('renders no id when opted out or the block has none', () => {
    const optedOut = renderToString(
      <B10cksComponent
        anchor={false}
        block={{ id: BLOCK_ID, block: 'hero' }}
        components={components}
      />
    )
    const withoutId = renderToString(
      <B10cksComponent
        block={{ block: 'hero' }}
        components={components}
      />
    )
    expect(optedOut).toBe('<div><p>hero</p></div>')
    expect(withoutId).toBe('<div><p>hero</p></div>')
  })
})

describe('B10cksComponent error boundary', () => {
  const Broken = () => {
    throw new Error('boom')
  }
  const blocks = { hero: () => <p>hero</p>, broken: Broken }

  afterEach(() => {
    Object.defineProperty(window, 'top', { value: window, configurable: true })
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  function render() {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
    const container = document.createElement('div')
    document.body.append(container)
    act(() => {
      createRoot(container).render(
        <>
          <B10cksComponent
            block={{ id: 'a', block: 'broken' }}
            components={blocks}
          />
          <B10cksComponent
            block={{ id: 'b', block: 'hero' }}
            components={blocks}
          />
        </>
      )
    })
    return container
  }

  it('renders nothing for a broken block and keeps the rest of the page', () => {
    const container = render()

    expect(container.innerHTML).toBe('<div id="a"></div><div id="b"><p>hero</p></div>')
  })

  it('renders a placeholder naming the block in preview mode', () => {
    Object.defineProperty(window, 'top', { value: {}, configurable: true })
    const container = render()

    expect(container.querySelector('[data-b10cks-error]')?.textContent).toBe(
      'Block "broken" failed to render: boom'
    )
    expect(container.querySelector('#b')?.innerHTML).toBe('<p>hero</p>')
  })
})

describe('B10cksComponents', () => {
  interface Hero {
    id: string
    block: 'hero'
    title: string
  }
  interface Card {
    id: string
    block: 'card'
    text: string
  }

  it('types each component with its own block', () => {
    const components: B10cksComponents<Hero | Card> = {
      hero: ({ block }) => <h1>{block.title}</h1>,
      card: ({ block }) => <p>{block.text}</p>,
    }
    const wrong: B10cksComponents<Hero | Card> = {
      // @ts-expect-error a card component can't render a hero
      hero: ({ block }: { block: Card }) => <p>{block.text}</p>,
    }
    const block: Hero | Card = { id: BLOCK_ID, block: 'hero', title: 'Hi' }

    expect(
      renderToString(
        <B10cksComponent
          block={block}
          components={components}
        />
      )
    ).toBe(`<div id="${BLOCK_ID}"><h1>Hi</h1></div>`)
    expect(wrong.hero).toBeDefined()
  })
})
