// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { previewBridge } from './preview-bridge'

const EDITOR_ORIGIN = 'https://editor.b10cks.test'
const OTHER_ORIGIN = 'https://evil.example'

let postMessage: ReturnType<typeof vi.fn>

/** Put the bridge into "preview" state: an iframe whose parent posts messages. */
function enterPreviewMode() {
  postMessage = vi.fn()
  Object.defineProperty(window, 'top', { value: {}, configurable: true })
  Object.defineProperty(window, 'parent', {
    value: { postMessage },
    configurable: true,
  })
}

function leavePreviewMode() {
  Object.defineProperty(window, 'top', { value: window, configurable: true })
}

function dispatchMessage(data: unknown, origin = EDITOR_ORIGIN) {
  window.dispatchEvent(new MessageEvent('message', { data, origin }))
}

beforeEach(() => {
  enterPreviewMode()
})

afterEach(() => {
  previewBridge.destroy()
  leavePreviewMode()
})

describe('isInPreviewMode', () => {
  it('is true inside an iframe and false at the top level', () => {
    expect(previewBridge.isInPreviewMode()).toBe(true)
    leavePreviewMode()
    expect(previewBridge.isInPreviewMode()).toBe(false)
  })
})

describe('init', () => {
  it('announces readiness to the parent frame', () => {
    previewBridge.init()
    expect(postMessage).toHaveBeenCalledWith({ type: 'B10CKS_BRIDGE_READY' }, '*')
  })

  it('does nothing outside preview mode', () => {
    leavePreviewMode()
    previewBridge.init()
    expect(postMessage).not.toHaveBeenCalled()
  })
})

describe('incoming messages', () => {
  it('notifies listeners for valid events', () => {
    previewBridge.init()
    const cb = vi.fn()
    previewBridge.on('SELECT_UPDATE', cb)

    dispatchMessage({ type: 'SELECT_UPDATE', payload: { selectedItem: 'block-1' } })

    expect(cb).toHaveBeenCalledWith({ selectedItem: 'block-1' })
  })

  it('ignores unknown event types and malformed payloads', () => {
    previewBridge.init()
    const cb = vi.fn()
    previewBridge.on('SELECT_UPDATE', cb)

    dispatchMessage({ type: 'NOT_A_REAL_EVENT', payload: { selectedItem: 'x' } })
    dispatchMessage({ type: 'SELECT_UPDATE' })
    dispatchMessage('a string, not an object')

    expect(cb).not.toHaveBeenCalled()
  })

  it('stops notifying after the returned unsubscribe is called', () => {
    previewBridge.init()
    const cb = vi.fn()
    const off = previewBridge.on('SELECT_UPDATE', cb)

    off()
    dispatchMessage({ type: 'SELECT_UPDATE', payload: { selectedItem: 'x' } })

    expect(cb).not.toHaveBeenCalled()
  })

  it('stops notifying after destroy', () => {
    previewBridge.init()
    const cb = vi.fn()
    previewBridge.on('SELECT_UPDATE', cb)

    previewBridge.destroy()
    dispatchMessage({ type: 'SELECT_UPDATE', payload: { selectedItem: 'x' } })

    expect(cb).not.toHaveBeenCalled()
  })
})

describe('origin trust', () => {
  it('locks onto the first trusted origin and rejects other origins', () => {
    previewBridge.init()
    const cb = vi.fn()
    previewBridge.on('SELECT_UPDATE', cb)

    // First message locks the origin.
    dispatchMessage({ type: 'SELECT_UPDATE', payload: { selectedItem: 'a' } }, EDITOR_ORIGIN)
    // A message from a different origin must be ignored.
    dispatchMessage({ type: 'SELECT_UPDATE', payload: { selectedItem: 'b' } }, OTHER_ORIGIN)

    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith({ selectedItem: 'a' })
  })

  it('honors an explicit allowedOrigins list', () => {
    previewBridge.init({ allowedOrigins: [EDITOR_ORIGIN] })
    const cb = vi.fn()
    previewBridge.on('SELECT_UPDATE', cb)

    dispatchMessage({ type: 'SELECT_UPDATE', payload: { selectedItem: 'a' } }, OTHER_ORIGIN)

    expect(cb).not.toHaveBeenCalled()
  })
})

describe('outgoing messages', () => {
  it('posts selectItem to the locked editor origin', () => {
    previewBridge.init()
    // Lock the origin via an inbound message first.
    dispatchMessage({ type: 'SELECT_UPDATE', payload: { selectedItem: 'a' } })
    postMessage.mockClear()

    previewBridge.selectItem('block-9')

    expect(postMessage).toHaveBeenCalledWith(
      { type: 'SELECT_UPDATE', payload: { selectedItem: 'block-9' } },
      EDITOR_ORIGIN
    )
  })

  it('streams inline field edits addressed by path', () => {
    previewBridge.init()
    dispatchMessage({ type: 'SELECT_UPDATE', payload: { selectedItem: 'a' } })
    postMessage.mockClear()

    previewBridge.updateFieldAt('block-9', ['title'], 'Hello')

    expect(postMessage).toHaveBeenCalledWith(
      { type: 'FIELD_UPDATE', payload: { itemId: 'block-9', path: ['title'], value: 'Hello' } },
      EDITOR_ORIGIN
    )
  })
})
