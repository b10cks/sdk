export type ContentUpdateEvent = {
  content: Record<string, unknown>
}

export type SelectUpdateEvent = {
  selectedItem: string
}

export type EventType = 'CONTENT_UPDATE' | 'SELECT_UPDATE' | 'HOVER_UPDATE'

export type EventPayloadMap = {
  CONTENT_UPDATE: ContentUpdateEvent
  SELECT_UPDATE: SelectUpdateEvent
  HOVER_UPDATE: SelectUpdateEvent
}

export type BridgeEvent = {
  type: EventType
  payload: ContentUpdateEvent | SelectUpdateEvent
  b10cksId?: string
}

type EventCallback<T> = (payload: T) => void

class PreviewBridge {
  private static instance: PreviewBridge
  private eventListeners: {
    [key in EventType]?: Array<EventCallback<EventPayloadMap[key]>>
  } = {}

  private isEnabled = false

  private constructor() {
    this.isEnabled = this.isIframe()
  }

  public init(): void {
    if (this.isEnabled && window) {
      window.addEventListener('message', this.handleMessage)
    }
  }

  public static getInstance(): PreviewBridge {
    if (!PreviewBridge.instance) {
      PreviewBridge.instance = new PreviewBridge()
    }
    return PreviewBridge.instance
  }

  public isInPreviewMode(): boolean {
    return this.isEnabled
  }

  private isIframe(): boolean {
    return window && window.self !== window.top
  }

  private handleMessage = (event: MessageEvent): void => {
    if (!event.data || typeof event.data !== 'object') return
    const { type, payload } = event.data as BridgeEvent

    this.notifyListeners(type as EventType, payload)
  }

  private notifyListeners<T extends EventType>(type: T, payload: EventPayloadMap[T]): void {
    const listeners = this.eventListeners[type] as Array<EventCallback<EventPayloadMap[T]>> | undefined

    if (listeners) {
      listeners.forEach((listener) => {
        listener(payload)
      })
    }
  }

  public on<T extends EventType>(eventType: T, callback: EventCallback<EventPayloadMap[T]>): () => void {
    if (!this.isEnabled) return () => {}

    if (!this.eventListeners[eventType]) {
      this.eventListeners[eventType] = []
    }

    ;(this.eventListeners[eventType] as Array<EventCallback<EventPayloadMap[T]>>).push(callback)

    return () => {
      this.eventListeners[eventType] = (
        this.eventListeners[eventType] as Array<EventCallback<EventPayloadMap[T]>>
      ).filter((listener) => listener !== callback) as never
    }
  }

  public selectItem(selectedItem: string): void {
    if (!this.isEnabled) return

    window.parent.postMessage(
      {
        type: 'SELECT_UPDATE',
        payload: { selectedItem },
      },
      '*'
    )
  }

  public updateField(itemId: string, field: string, value: string): void {
    if (!this.isEnabled) return

    window.parent.postMessage(
      {
        type: 'FIELD_UPDATE',
        payload: { itemId, field, value },
      },
      '*'
    )
  }

  public destroy(): void {
    if (this.isEnabled) {
      window.removeEventListener('message', this.handleMessage)
      this.isEnabled = false
    }
    this.eventListeners = {}
  }
}

export const previewBridge = PreviewBridge.getInstance()
