/** Addresses a field within a block, supporting nested objects and arrays. */
export type FieldPath = (string | number)[]

export type ContentUpdateEvent = {
  content: Record<string, unknown>
}

/** Granular update: replace the value at `path` within the content tree. */
export type ContentPatchEvent = {
  path: FieldPath
  value: unknown
}

export type SelectUpdateEvent = {
  selectedItem: string
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

export type EventPayloadMap = {
  CONTENT_UPDATE: ContentUpdateEvent
  CONTENT_PATCH: ContentPatchEvent
  SELECT_UPDATE: SelectUpdateEvent
  HOVER_UPDATE: SelectUpdateEvent
  FIELD_UPDATE: FieldUpdateEvent
  FIELD_SELECT: FieldSelectEvent
}

const EVENT_TYPES: ReadonlySet<string> = new Set<EventType>([
  'CONTENT_UPDATE',
  'CONTENT_PATCH',
  'SELECT_UPDATE',
  'HOVER_UPDATE',
  'FIELD_UPDATE',
  'FIELD_SELECT',
])

/** Sent by the preview to announce it is ready to receive events. */
const BRIDGE_READY = 'B10CKS_BRIDGE_READY'

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
    window.parent.postMessage({ type: BRIDGE_READY }, '*')
  }

  destroy() {
    if (this.initialized && typeof window !== 'undefined') {
      window.removeEventListener('message', this.handleMessage)
    }
    this.initialized = false
    this.parentOrigin = null
    for (const eventType of Object.keys(this.listeners) as EventType[]) {
      this.listeners[eventType]?.clear()
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

    const { type, payload } = event.data as BridgeEvent
    if (!type || !EVENT_TYPES.has(type) || !payload) {
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
