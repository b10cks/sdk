/** Addresses a field within a block, supporting nested objects and arrays. */
export type FieldPath = (string | number)[]

export type ContentUpdateEvent = {
  content: Record<string, unknown>
}

/**
 * Granular update: replace the value at `path`. With `itemId`, `path` is
 * relative to that block; without it, relative to the content tree's root.
 */
export type ContentPatchEvent = {
  itemId?: string
  path: FieldPath
  value: unknown
}

/** `selectedItem` is null when the editor clears the selection or hover. */
export type SelectUpdateEvent = {
  selectedItem: string | null
}

/** Display names of the space's blocks, keyed by block slug. */
export type BlockLabelsEvent = {
  labels: Record<string, string>
}

/**
 * Ids of every block in the edited content, at any depth, that is hidden.
 * Sent whenever that set changes. Protocol 2.
 */
export type HiddenBlocksEvent = {
  ids: string[]
}

/** `hide` and `show` set the block's visibility and do nothing when it already is. */
export type BlockAction =
  | 'move-up'
  | 'move-down'
  | 'duplicate'
  | 'delete'
  | 'insert-before'
  | 'insert-after'
  | 'hide'
  | 'show'

/**
 * Ask the editor to run a structural action on a block. The editor validates
 * it, applies it, and answers with CONTENT_UPDATE (and SELECT_UPDATE where the
 * selection moves). `insert-*` opens the editor's block picker.
 */
export type BlockActionEvent = {
  itemId: string
  action: BlockAction
}

/**
 * Drag and drop: move block `itemId` before or after block `targetId`. The
 * editor rejects moves its schema doesn't allow and answers like BLOCK_ACTION.
 */
export type BlockMoveEvent = {
  itemId: string
  targetId: string
  position: 'before' | 'after'
}

export type FieldUpdateEvent = {
  itemId: string
  /** Path to the field within the block. Preferred over `field`. */
  path?: FieldPath
  /** @deprecated Use `path`. Kept for flat string fields. */
  field?: string
  value: unknown
}

/**
 * Deep-select a specific field (e.g. a rich text field) so the editor opens
 * its own editor for that field instead of editing it inline in the preview.
 */
export type FieldSelectEvent = {
  itemId: string
  path: FieldPath
}

export type EventType =
  | 'CONTENT_UPDATE'
  | 'CONTENT_PATCH'
  | 'SELECT_UPDATE'
  | 'HOVER_UPDATE'
  | 'FIELD_UPDATE'
  | 'FIELD_SELECT'
  | 'BLOCK_LABELS'
  | 'HIDDEN_BLOCKS'
  | 'BLOCK_ACTION'
  | 'BLOCK_MOVE'

export type EventPayloadMap = {
  CONTENT_UPDATE: ContentUpdateEvent
  CONTENT_PATCH: ContentPatchEvent
  SELECT_UPDATE: SelectUpdateEvent
  HOVER_UPDATE: SelectUpdateEvent
  FIELD_UPDATE: FieldUpdateEvent
  FIELD_SELECT: FieldSelectEvent
  BLOCK_LABELS: BlockLabelsEvent
  HIDDEN_BLOCKS: HiddenBlocksEvent
  BLOCK_ACTION: BlockActionEvent
  BLOCK_MOVE: BlockMoveEvent
}

type InboundType =
  | 'CONTENT_UPDATE'
  | 'CONTENT_PATCH'
  | 'SELECT_UPDATE'
  | 'HOVER_UPDATE'
  | 'BLOCK_LABELS'
  | 'HIDDEN_BLOCKS'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isFieldPath = (value: unknown): value is FieldPath =>
  Array.isArray(value) &&
  value.every(
    (segment) =>
      typeof segment === 'string' ||
      (typeof segment === 'number' && Number.isInteger(segment) && segment >= 0)
  )

const isSelection = (payload: Record<string, unknown>) =>
  payload.selectedItem === null || typeof payload.selectedItem === 'string'

/**
 * Events the editor sends to the preview, with a shape check for each payload.
 * Anything else inbound is dropped, so a malformed message can't throw in a
 * listener.
 */
const INBOUND_GUARDS: Record<InboundType, (payload: Record<string, unknown>) => boolean> = {
  CONTENT_UPDATE: (payload) => isRecord(payload.content),
  CONTENT_PATCH: (payload) =>
    isFieldPath(payload.path) &&
    'value' in payload &&
    (payload.itemId === undefined || typeof payload.itemId === 'string'),
  SELECT_UPDATE: isSelection,
  HOVER_UPDATE: isSelection,
  BLOCK_LABELS: (payload) =>
    isRecord(payload.labels) &&
    Object.values(payload.labels).every((label) => typeof label === 'string'),
  HIDDEN_BLOCKS: (payload) =>
    Array.isArray(payload.ids) && payload.ids.every((id) => typeof id === 'string'),
}

const isInboundType = (type: unknown): type is InboundType =>
  typeof type === 'string' && Object.hasOwn(INBOUND_GUARDS, type)

/** Sent by the preview to announce it is ready to receive events. */
const BRIDGE_READY = 'B10CKS_BRIDGE_READY'

/**
 * Bridge protocol version, sent with the ready announcement. Previews that
 * announce without a payload (protocol 0) only understand CONTENT_UPDATE,
 * SELECT_UPDATE, and HOVER_UPDATE, so the editor must not send them patches
 * or labels. Protocol 2 adds HIDDEN_BLOCKS and the `hide` and `show` block
 * actions.
 */
export const BRIDGE_PROTOCOL = 2

/** Payload of the ready announcement. */
export type BridgeReadyPayload = {
  protocol: number
}

type EventCallback<T> = (payload: T) => void

export type BridgeEvent = {
  type: EventType
  payload: EventPayloadMap[EventType]
  b10cksId?: string
}

export interface PreviewBridgeInitOptions {
  /**
   * Origins the editor is allowed to post from. When provided, messages from
   * any other origin are ignored. When omitted, the bridge locks onto the
   * origin of the first valid message it receives (trust-on-first-use).
   */
  allowedOrigins?: string[]
}

export class PreviewBridge {
  private static instance: PreviewBridge
  private readonly listeners: Partial<Record<EventType, Set<EventCallback<unknown>>>> = {}
  /** Last payload received per event type, for consumers that attach late. */
  private readonly received: Partial<EventPayloadMap> = {}
  private initialized = false
  private allowedOrigins: string[] | null = null
  /** Origin of the editor, captured from the first trusted message. */
  private parentOrigin: string | null = null

  private constructor() {}

  static getInstance() {
    if (!PreviewBridge.instance) {
      PreviewBridge.instance = new PreviewBridge()
    }
    return PreviewBridge.instance
  }

  init(options: PreviewBridgeInitOptions = {}) {
    if (!this.isInPreviewMode()) {
      return
    }

    if (this.initialized) {
      // A later init may carry the configured allowlist (e.g. a provider whose
      // effect runs after a child component already initialized the bridge).
      // Adopt it, and drop a trust-on-first-use origin it does not cover.
      if (options.allowedOrigins && !this.allowedOrigins) {
        this.allowedOrigins = options.allowedOrigins
        if (this.parentOrigin && !this.allowedOrigins.includes(this.parentOrigin)) {
          this.parentOrigin = null
        }
      }
      return
    }

    this.allowedOrigins = options.allowedOrigins ?? null
    window.addEventListener('message', this.handleMessage)
    this.initialized = true

    // Announce readiness so the editor can target this preview by origin.
    const payload: BridgeReadyPayload = { protocol: BRIDGE_PROTOCOL }
    window.parent.postMessage({ type: BRIDGE_READY, payload }, '*')
  }

  destroy() {
    if (this.initialized && typeof window !== 'undefined') {
      window.removeEventListener('message', this.handleMessage)
    }
    this.initialized = false
    this.parentOrigin = null
    for (const eventType of Object.keys(this.listeners) as EventType[]) {
      this.listeners[eventType]?.clear()
      delete this.received[eventType]
    }
  }

  isInPreviewMode(): boolean {
    return typeof window !== 'undefined' && window.self !== window.top
  }

  on<T extends EventType>(eventType: T, callback: EventCallback<EventPayloadMap[T]>): () => void {
    if (!this.isInPreviewMode()) {
      return () => {}
    }

    const listeners = this.listeners[eventType] || new Set<EventCallback<unknown>>()
    this.listeners[eventType] = listeners
    listeners.add(callback as EventCallback<unknown>)

    return () => {
      listeners.delete(callback as EventCallback<unknown>)
    }
  }

  /**
   * The last payload the editor sent for `eventType`. The editor replays state
   * right after the ready announcement, often before components mount.
   */
  latest<T extends EventType>(eventType: T): EventPayloadMap[T] | undefined {
    return this.received[eventType]
  }

  selectItem(selectedItem: string) {
    this.post('SELECT_UPDATE', { selectedItem })
  }

  /** Deep-select a nested field (e.g. a rich text field) in the editor. */
  selectField(itemId: string, path: FieldPath) {
    this.post('FIELD_SELECT', { itemId, path })
  }

  /** @deprecated Prefer {@link updateFieldAt} with a path. */
  updateField(itemId: string, field: string, value: string) {
    this.post('FIELD_UPDATE', { itemId, field, value })
  }

  /** Stream an inline edit back to the editor, addressed by path. */
  updateFieldAt(itemId: string, path: FieldPath, value: unknown) {
    this.post('FIELD_UPDATE', { itemId, path, value })
  }

  /** Ask the editor to move, duplicate, delete, hide, show, or insert next to a block. */
  blockAction(itemId: string, action: BlockAction) {
    this.post('BLOCK_ACTION', { itemId, action })
  }

  /** Ask the editor to move a block before or after another block. */
  moveBlock(itemId: string, targetId: string, position: BlockMoveEvent['position']) {
    this.post('BLOCK_MOVE', { itemId, targetId, position })
  }

  private post<T extends EventType>(type: T, payload: EventPayloadMap[T]) {
    if (!this.isInPreviewMode()) {
      return
    }

    window.parent.postMessage({ type, payload }, this.parentOrigin ?? '*')
  }

  private handleMessage = (event: MessageEvent) => {
    if (!this.isOriginTrusted(event.origin)) {
      return
    }

    if (!event.data || typeof event.data !== 'object') {
      return
    }

    const { type, payload } = event.data as { type?: unknown; payload?: unknown }
    if (!isInboundType(type) || !isRecord(payload) || !INBOUND_GUARDS[type](payload)) {
      return
    }

    // Lock onto the editor's origin on the first trusted, valid message.
    if (!this.parentOrigin && event.origin && event.origin !== 'null') {
      this.parentOrigin = event.origin
    }

    this.notify(type, payload as never)
  }

  private isOriginTrusted(origin: string): boolean {
    if (this.parentOrigin) {
      return origin === this.parentOrigin
    }
    if (this.allowedOrigins) {
      return this.allowedOrigins.includes(origin)
    }
    // Trust-on-first-use: accept the first message and lock onto its origin.
    return true
  }

  private notify<T extends EventType>(type: T, payload: EventPayloadMap[T]) {
    this.received[type] = payload
    const callbacks = this.listeners[type]
    if (!callbacks) {
      return
    }

    for (const callback of callbacks) {
      ;(callback as EventCallback<EventPayloadMap[T]>)(payload)
    }
  }
}

export const previewBridge = PreviewBridge.getInstance()
