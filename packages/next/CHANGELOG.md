# @b10cks/next

## 0.4.1

### Patch Changes

- Updated dependencies []:
  - @b10cks/richtext@0.6.0
  - @b10cks/react@0.5.2

## 0.4.0

### Minor Changes

- 6e0a1d4: Prevent SSR request-state bleed in the Next server helper. `createB10cksNextApi` is now documented as request-scoped (its client holds the content revision and per-instance caches, so a module-level singleton would leak a preview/draft revision to other visitors). A new `defineB10cksNextApi(optionsFactory)` wraps creation in React's `cache()`, giving each App Router request its own client while safely being exported at module scope. Request-scoped `getRv`/`setRv` remain available via the options.

### Patch Changes

- 12f184b: Fix broken CJS entry points: the CommonJS bundle was emitted as `index.js` inside `"type": "module"` packages, so `require()` resolved it as ESM and returned an empty module. CJS bundles are now emitted as `.cjs` and `main`/`exports.require` updated accordingly. The `svelte` export condition now points at the ESM bundle.
- Updated dependencies [12f184b]
- Updated dependencies [8f39226]
- Updated dependencies [955ac1f]
- Updated dependencies [bafd700]
- Updated dependencies [59ad33d]
- Updated dependencies [3ada87f]
  - @b10cks/client@1.6.0
  - @b10cks/richtext@0.5.0
  - @b10cks/react@0.5.1

## 0.3.5

### Patch Changes

- Document live preview & visual editing for Next.js: `B10cksNextProvider` forwards the new `scrollOffset`/`allowedOrigins` options, and `@b10cks/next/client` re-exports the `useEditable`/`useEditableField`/`usePreviewContent` hooks from `@b10cks/react`.

- Updated dependencies []:
  - @b10cks/client@1.5.0
  - @b10cks/react@0.5.0
