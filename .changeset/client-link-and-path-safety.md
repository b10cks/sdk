---
'@b10cks/client': patch
---

`resolveB10cksLink` applies the rich text URL policy, so `javascript:` and other disallowed schemes resolve to `#`; pass `{ allowedSchemes }` to change it. The preview ignores field paths with a `__proto__` key, more than 64 segments, or an index past the end of an array.
