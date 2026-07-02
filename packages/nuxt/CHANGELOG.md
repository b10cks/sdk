# @b10cks/nuxt

## 3.2.1

### Patch Changes

- 76d661e: Publishing hygiene:

  - Exclude embedded source content from published sourcemaps (`sourcemapExcludeSources`) across all packages — keeps line-level maps for debugging without shipping full TypeScript source or bloating the tarball.
  - `@b10cks/nuxt`: move `@nuxt/kit` from `devDependencies` to `dependencies` (the built module imports it at runtime, per Nuxt module convention).
  - `@b10cks/cli`: move the inlined runtime dependencies (chalk, commander, figlet, inquirer, ora, netrc) to `devDependencies` since `inlineDependencies` already bundles them, avoiding a double install. `update-notifier` stays a runtime dependency because its bundle keeps `ky` external.
  - Bump the workspace-resolved `next` to a patched version (≥16.2.6) to clear the high-severity advisories in the lockfile.

- 4068e34: - `@b10cks/svelte`: drop `^4.2.0` from the `svelte` peer range. `B10cksRichText` uses Svelte 5 runes (`$props`/`$derived`), so it never compiled on Svelte 4 — the range now honestly reflects `^5.0.0`.
  - `@b10cks/nuxt`: register the language `watch` in `useB10cksConfig` inside the captured effect scope instead of after the `await`, so it is disposed on unmount instead of leaking an orphaned watcher across navigations.
- Updated dependencies [12f184b]
- Updated dependencies [8f39226]
- Updated dependencies [955ac1f]
- Updated dependencies [59ad33d]
- Updated dependencies [3ada87f]
- Updated dependencies [0580418]
  - @b10cks/client@1.6.0
  - @b10cks/richtext@0.5.0
  - @b10cks/vue@2.4.1

## 3.2.0

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
  - @b10cks/vue@2.4.0
