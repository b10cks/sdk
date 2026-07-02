---
"@b10cks/react": patch
"@b10cks/vue": patch
"@b10cks/svelte": patch
---

`usePreviewContent`/`createPreviewContent` now react to a changing `initial` content tree instead of capturing it once. In React the preview store resets when `initial` changes identity; Vue's `usePreviewContent` accepts a ref/getter and resets on change; Svelte's `createPreviewContent` accepts a readable store whose updates reset the store. This fixes stale content rendering when a persistent layout survives navigation (route change, revalidation, locale switch). Plain-value usage is unchanged.
