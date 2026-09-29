---
'@b10cks/client': minor
---

Preview bridge protocol 2. The ready announcement now carries the protocol version, so the editor only sends what a preview understands. New events: `CONTENT_PATCH` can address a field relative to a block with `itemId`, `BLOCK_LABELS` gives the space's block display names, and the preview can ask the editor to run block actions (`previewBridge.blockAction`) and drag-and-drop moves (`previewBridge.moveBlock`). Incoming payloads are shape-checked and malformed ones dropped. `previewBridge.latest(type)` returns the last payload the editor sent, for code that attaches after the editor replayed its state. `SelectUpdateEvent.selectedItem` is typed `string | null`, matching what the editor sends to clear a selection.
