// @vitest-environment happy-dom
import { previewBridge } from '@b10cks/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, type Directive, h, nextTick, shallowRef, withDirectives } from 'vue'

import { EditableContentDirective } from './v-editable-content'

let postMessage: ReturnType<typeof vi.fn>

beforeEach(() => {
  postMessage = vi.fn()
  Object.defineProperty(window, 'top', { value: {}, configurable: true })
  Object.defineProperty(window, 'parent', { value: { postMessage }, configurable: true })
  previewBridge.init()
})

afterEach(() => {
  previewBridge.destroy()
  Object.defineProperty(window, 'top', { value: window, configurable: true })
  document.body.innerHTML = ''
})

describe('v-editable-field', () => {
  it('edits the item at its new index after a keyed reorder', async () => {
    const items = shallowRef([
      { key: 'a', label: 'First' },
      { key: 'b', label: 'Second' },
    ])
    const root = document.createElement('div')
    document.body.append(root)
    const app = createApp(() =>
      h(
        'ul',
        items.value.map((item, index) =>
          withDirectives(h('li', { key: item.key, 'data-key': item.key }, item.label), [
            [
              EditableContentDirective as Directive,
              { id: 'list-1', path: ['items', index, 'label'], mode: 'inline' },
            ],
          ])
        )
      )
    )
    app.mount(root)

    items.value = [items.value[1]!, items.value[0]!]
    await nextTick()
    const first = root.querySelector<HTMLElement>('[data-key="a"]')!
    first.innerText = 'Edited'
    first.dispatchEvent(new Event('input'))

    const updates = postMessage.mock.calls
      .map(([message]) => message as { type: string; payload: unknown })
      .filter((message) => message.type === 'FIELD_UPDATE')
    expect(updates.map((message) => message.payload)).toEqual([
      { itemId: 'list-1', path: ['items', 1, 'label'], value: 'Edited' },
    ])
    app.unmount()
  })
})
