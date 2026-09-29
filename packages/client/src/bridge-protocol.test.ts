// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { EventPayloadMap, EventType } from './preview-bridge'
import { BRIDGE_PROTOCOL, previewBridge } from './preview-bridge'

/**
 * Drift alarm for the preview bridge protocol. The fixture is shared
 * byte-identical with the CMS repo (tests/fixtures/bridge-protocol.json), whose
 * suite asserts the editor side against the same messages.
 */
type ProtocolMessage = {
  type: EventType
  direction: 'editor-to-preview' | 'preview-to-editor'
  since: number
  examples: Record<string, unknown>[]
  invalid?: Record<string, unknown>[]
}

const fixture: {
  protocol: number
  ready: { type: string; payload: { protocol: number } }
  messages: ProtocolMessage[]
} = JSON.parse(readFileSync(join(__dirname, '__fixtures__', 'bridge-protocol.json'), 'utf8'))

const inbound = fixture.messages.filter((message) => message.direction === 'editor-to-preview')
const outbound = fixture.messages.filter((message) => message.direction === 'preview-to-editor')
const outboundOnly = outbound.filter(
  ({ type }) => !inbound.some((message) => message.type === type)
)

type OutboundType =
  | 'SELECT_UPDATE'
  | 'FIELD_UPDATE'
  | 'FIELD_SELECT'
  | 'BLOCK_ACTION'
  | 'BLOCK_MOVE'

/** How the bridge's public API emits each preview-to-editor message. */
const emitters: { [K in OutboundType]: (payload: EventPayloadMap[K]) => void } = {
  SELECT_UPDATE: ({ selectedItem }) => selectedItem && previewBridge.selectItem(selectedItem),
  FIELD_UPDATE: ({ itemId, path, field, value }) =>
    path
      ? previewBridge.updateFieldAt(itemId, path, value)
      : previewBridge.updateField(itemId, field ?? '', String(value)),
  FIELD_SELECT: ({ itemId, path }) => previewBridge.selectField(itemId, path),
  BLOCK_ACTION: ({ itemId, action }) => previewBridge.blockAction(itemId, action),
  BLOCK_MOVE: ({ itemId, targetId, position }) =>
    previewBridge.moveBlock(itemId, targetId, position),
}

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
})

describe('bridge protocol fixture', () => {
  it('announces the fixture protocol version', () => {
    expect(BRIDGE_PROTOCOL).toBe(fixture.protocol)
    expect(postMessage).toHaveBeenCalledWith(fixture.ready, '*')
  })

  it.each(inbound)('delivers editor $type messages to listeners', ({ type, examples }) => {
    const listener = vi.fn()
    previewBridge.on(type, listener)

    for (const payload of examples) {
      window.dispatchEvent(new MessageEvent('message', { data: { type, payload } }))
    }

    expect(listener.mock.calls).toEqual(examples.map((payload) => [payload]))
  })

  it.each(inbound)('drops invalid editor $type payloads', ({ type, invalid = [] }) => {
    const listener = vi.fn()
    previewBridge.on(type, listener)

    for (const payload of invalid) {
      window.dispatchEvent(new MessageEvent('message', { data: { type, payload } }))
    }

    expect(listener).not.toHaveBeenCalled()
  })

  it.each(outboundOnly)('ignores $type sent to the preview', ({ type, examples }) => {
    const listener = vi.fn()
    previewBridge.on(type, listener)

    for (const payload of examples) {
      window.dispatchEvent(new MessageEvent('message', { data: { type, payload } }))
    }

    expect(listener).not.toHaveBeenCalled()
  })

  it('emits exactly the preview-to-editor messages of the fixture', () => {
    expect(Object.keys(emitters).sort()).toEqual(outbound.map(({ type }) => type).sort())
  })

  it.each(outbound)('emits $type messages as the fixture describes', ({ type, examples }) => {
    postMessage.mockClear()
    const emit = emitters[type as OutboundType] as (payload: unknown) => void

    examples.forEach(emit)

    expect(postMessage.mock.calls).toEqual(
      examples.map((payload) => [{ type, payload }, expect.any(String)])
    )
  })
})
