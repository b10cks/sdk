---
'@b10cks/richtext': minor
---

Add `nodes` and `marks` render options for custom HTML per node or mark type, such as responsive images, heading anchors or embeds. Renderers get the attrs, the rendered children and the built-in output, and return `null` to keep it. Export `escapeHtml`, `isSafeUrl` and `sanitizeUrl` for them. Attributes of the wrong type and malformed nodes from stored content now render safely instead of throwing.
