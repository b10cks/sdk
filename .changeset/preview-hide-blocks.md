---
'@b10cks/client': minor
---

Hide and show blocks from the visual editor's preview. The selection toolbar has an eye toggle that asks the editor to hide or show the block, and blocks the editor hides are dimmed and get the `b10cks-hidden` class. Both need an editor on bridge protocol 2, which sends the new HIDDEN_BLOCKS event; older editors keep the toolbar as it was. `BlockAction` gains `hide` and `show`.
