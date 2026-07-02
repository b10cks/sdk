// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { attachEditable, attachEditableField } from './editable'
import { previewBridge } from './preview-bridge'

const EDITOR_ORIGIN = 'https://editor.b10cks.test'

let postMessage: ReturnType<typeof vi.fn>

function enterPreviewMode() {
  postMessage = vi.fn()
  Object.defineProperty(window, 'top', { value: {}, configurable: true })
  Object.defineProperty(window, 'parent', { value: { postMessage }, configurable: true })
}

function leavePreviewMode() {
  Object.defineProperty(window, 'top', { value: window, configurable: true })
}

/** Push an editor-origin event through the real bridge. */
function dispatchBridgeEvent(type: string, payload: unknown) {
  window.dispatchEvent(
    new MessageEvent('message', { data: { type, payload }, origin: EDITOR_ORIGIN })
  )
}

beforeEach(() => {
  enterPreviewMode()
  previewBridge.init()
})

afterEach(() => {
  previewBridge.destroy()
  leavePreviewMode()
  document.body.innerHTML = ''
})

describe('attachEditable', () => {
  it('is a no-op outside preview mode', () => {
    previewBridge.destroy()
    leavePreviewMode()
    postMessage.mockClear()
    const el = document.createElement('div')
    const cleanup = attachEditable(el, { id: 'b1' })

    el.click()

    expect(el.classList.contains('b10cks-preview')).toBe(false)
    expect(postMessage).not.toHaveBeenCalled()
    expect(typeof cleanup).toBe('function')
  })

  it('selects the block in the editor on click', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    attachEditable(el, { id: 'b1' })

    expect(el.classList.contains('b10cks-preview')).toBe(true)
    el.click()

    expect(postMessage).toHaveBeenCalledWith(
      { type: 'SELECT_UPDATE', payload: { selectedItem: 'b1' } },
      '*'
    )
  })

  it('toggles the selected class and fires the callback on SELECT_UPDATE', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const onSelectChange = vi.fn()
    attachEditable(el, { id: 'b1', onSelectChange, scrollOnSelect: false })

    dispatchBridgeEvent('SELECT_UPDATE', { selectedItem: 'b1' })
    expect(el.classList.contains('b10cks-selected')).toBe(true)
    expect(onSelectChange).toHaveBeenLastCalledWith(true)

    dispatchBridgeEvent('SELECT_UPDATE', { selectedItem: 'other' })
    expect(el.classList.contains('b10cks-selected')).toBe(false)
    expect(onSelectChange).toHaveBeenLastCalledWith(false)
  })

  it('cleanup removes classes and stops reacting to events', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const onSelectChange = vi.fn()
    const cleanup = attachEditable(el, { id: 'b1', onSelectChange, scrollOnSelect: false })

    cleanup()
    expect(el.classList.contains('b10cks-preview')).toBe(false)

    dispatchBridgeEvent('SELECT_UPDATE', { selectedItem: 'b1' })
    expect(onSelectChange).not.toHaveBeenCalled()

    postMessage.mockClear()
    el.click()
    expect(postMessage).not.toHaveBeenCalled()
  })
})

describe('attachEditableField', () => {
  it('makes the element contenteditable and streams input by path', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    // Lock the bridge origin so posts target the editor.
    dispatchBridgeEvent('SELECT_UPDATE', { selectedItem: 'noop' })

    attachEditableField(el, { id: 'b1', path: ['title'] })
    expect(el.getAttribute('contenteditable')).toBe('true')

    el.innerText = 'Edited'
    el.dispatchEvent(new Event('input'))

    expect(postMessage).toHaveBeenCalledWith(
      { type: 'FIELD_UPDATE', payload: { itemId: 'b1', path: ['title'], value: 'Edited' } },
      EDITOR_ORIGIN
    )
  })

  it('in select mode, deep-selects the field instead of editing inline', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    attachEditableField(el, { id: 'b1', path: ['body'], mode: 'select' })

    expect(el.getAttribute('contenteditable')).toBeNull()
    el.click()

    expect(postMessage).toHaveBeenCalledWith(
      { type: 'FIELD_SELECT', payload: { itemId: 'b1', path: ['body'] } },
      '*'
    )
  })
})
