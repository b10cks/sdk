import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { B10cksComponent } from './B10cksComponent'

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
