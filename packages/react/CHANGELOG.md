# @b10cks/react

## 0.5.1

### Patch Changes

- 12f184b: Fix broken CJS entry points: the CommonJS bundle was emitted as `index.js` inside `"type": "module"` packages, so `require()` resolved it as ESM and returned an empty module. CJS bundles are now emitted as `.cjs` and `main`/`exports.require` updated accordingly. The `svelte` export condition now points at the ESM bundle.
- 955ac1f: `usePreviewContent`/`createPreviewContent` now react to a changing `initial` content tree instead of capturing it once. In React the preview store resets when `initial` changes identity; Vue's `usePreviewContent` accepts a ref/getter and resets on change; Svelte's `createPreviewContent` accepts a readable store whose updates reset the store. This fixes stale content rendering when a persistent layout survives navigation (route change, revalidation, locale switch). Plain-value usage is unchanged.
- bafd700: Fix infinite fetch loop in `useB10cksApi` hooks: default/inline `params` objects created a new identity every render, so the `immediate` effect re-fired continuously. Hook dependencies now use a serialized params key, and the task closure is read through a ref so the latest `params`/`transform` are still used on every execution.
- 3ada87f: Fix unhandled promise rejections from `immediate` async hooks/composables/stores. The internal `execute` rethrows after storing the error, and the immediate path called `void execute()`, so any failed default fetch (e.g. `useContent` with `immediate: true`) produced an unhandled rejection — crashing Node SSR under default settings. The immediate path now swallows the rethrow (the error remains available in state); explicit `execute()`/`refresh()` calls still reject as before.
- Updated dependencies [12f184b]
- Updated dependencies [8f39226]
- Updated dependencies [59ad33d]
  - @b10cks/client@1.6.0
  - @b10cks/richtext@0.5.0

## 0.5.0

### Minor Changes

- Improve two-way binding and visual editing without bloating the framework packages.

  - Consolidate the preview/editing glue into `@b10cks/client`: a shared `attachEditable`/`attachEditableField` DOM core, one-time style injection (`ensurePreviewStyles`), and a framework-agnostic reactive `PreviewStore` (`bindPreviewStore`, `setAtPath`/`getAtPath`). The Vue/React/Svelte packages now wrap this instead of duplicating it.
  - Add `usePreviewContent` (Vue/React, auto-imported in Nuxt) and `createPreviewContent` (Svelte) for whole-tree reactive live updates while editing — including nested and rich text fields.
  - Extend the preview bridge protocol: path-addressed fields (`FieldPath`), granular `CONTENT_PATCH`, and `FIELD_SELECT` so rich text and other complex fields deep-select into the editor instead of inline editing (`mode: 'select'`).
  - Fix selection overshoot under a fixed app header: selection now scrolls with `block: 'nearest'` and honors a `scrollOffset` option / `--b10cks-scroll-offset` CSS variable.
  - Harden the bridge with origin validation (trust-on-first-use plus an optional `allowedOrigins` allowlist) and targeted `postMessage`.

  The Vue `v-editable` directive remains backwards compatible — it still live-updates its block in place, now without poking Vue internals.

### Patch Changes

- Updated dependencies []:
  - @b10cks/client@1.5.0
