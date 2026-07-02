---
"@b10cks/vue": patch
---

Memoize async block components by name in `B10cksComponent`. Previously each recompute of the resolved component (e.g. a live-preview `CONTENT_UPDATE` on every keystroke) produced a brand-new `defineAsyncComponent`, remounting the entire block subtree — causing flicker, lost focus, and repeated child `onMounted`/refetches.
