export type ContentUpdateEvent = {
  content: Record<string, unknown>
}

export type SelectUpdateEvent = {
  selectedItem: string
}

export type FieldUpdateEvent = {
  itemId: string
  field: string
  value: string
}

export type EventType = 'CONTENT_UPDATE' | 'SELECT_UPDATE' | 'HOVER_UPDATE' | 'FIELD_UPDATE'

export type EventPayloadMap = {
  CONTENT_UPDATE: ContentUpdateEvent
  SELECT_UPDATE: SelectUpdateEvent
  HOVER_UPDATE: SelectUpdateEvent
  FIELD_UPDATE: FieldUpdateEvent
}

type EventCallback<T> = (payload: T) => void

export type BridgeEvent = {
  type: EventType
  payload: EventPayloadMap[EventType]
  b10cksId?: string
}

export class PreviewBridge {
  private static instance: PreviewBridge
  private readonly listeners: Partial<Record<EventType, Set<EventCallback<unknown>>>> = {}
  private initialized = false

  private constructor() {}

  static getInstance() {
    if (!PreviewBridge.instance) {
      PreviewBridge.instance = new PreviewBridge()
    }
    return PreviewBridge.instance
  }

  init() {
    if (!this.isInPreviewMode() || this.initialized) {
      return
    }

    window.addEventListener('message', this.handleMessage)
    this.initialized = true
  }

  destroy() {
    if (this.initialized && typeof window !== 'undefined') {
      window.removeEventListener('message', this.handleMessage)
    }
    this.initialized = false
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
    if (!this.isInPreviewMode()) {
      return
    }

    window.parent.postMessage(
      {
        type: 'SELECT_UPDATE',
        payload: { selectedItem },
      },
      '*'
    )
  }

  updateField(itemId: string, field: string, value: string) {
    if (!this.isInPreviewMode()) {
      return
    }

    window.parent.postMessage(
      {
        type: 'FIELD_UPDATE',
        payload: { itemId, field, value },
      },
      '*'
    )
  }

  private handleMessage = (event: MessageEvent) => {
    if (!event.data || typeof event.data !== 'object') {
      return
    }

    const { type, payload } = event.data as BridgeEvent
    if (!type || !payload) {
      return
    }

    this.notify(type, payload as never)
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
