# @b10cks/client

## 1.8.0

### Minor Changes

- Support named per-type sitemaps (`/sitemaps/{name}`)

  - `@b10cks/client`: new `getNamedSitemap(name, params, options)` and `sitemaps/{name}` endpoint; `filterSitemapEntries` now also drops `robots: none`, matching the API's exclusion.
  - `@b10cks/vue`, `@b10cks/react`, `@b10cks/svelte`, `@b10cks/nuxt`: new `useNamedSitemap(name, params, options)`.
  - `@b10cks/mgmt-client`: `SpaceSettings.sitemaps` and the `SpaceNamedSitemap` type.
  - `@b10cks/mcp-server`: `spaces.update` now documents its payload fields, including both sitemap settings shapes.

## 1.7.2

### Patch Changes

- Framework SDK review fixes: latest-wins guard for overlapping async requests in the Vue/React/Svelte state helpers, no fire-and-forget immediate fetches during Vue SSR, preview bridge adopts a late `allowedOrigins` init (and drops an uncovered trust-on-first-use origin), shared module-scope async component cache in the Vue `B10cksComponent`, and the Nuxt module now merges `runtimeConfig.public.b10cks` instead of overwriting it.

## 1.7.1

### Patch Changes

- 4040149: Normalise package metadata across the workspace.

  - Add the missing `LICENSE` file to `cli`, `mcp-server`, `next`, `react`,
    `richtext` and `svelte`. `mcp-server` listed `LICENSE` in its `files` array
    but shipped without one.
  - Add `keywords`, `homepage` and `bugs` to every package; previously only
    `mcp-server` had them, so the rest were undiscoverable on npm.
  - Use the structured `author` object everywhere instead of a free-text string.
  - Declare `publishConfig.access` and `engines` consistently. `cli` now requires
    Node `>=20` (was `>=18`, which is past end-of-life) to match the others.

## 1.7.0

### Minor Changes

- Type asset metadata across clients and generated types

  - `@b10cks/client`: new exported content-model types `B10cksAssetMetadata`, `B10cksAssetValue`, `B10cksAssetA11y`, `B10cksAssetThumbnail`, `B10cksAssetExif` and `B10cksAssetMediaTags` describing the asset `metadata` shape delivered in content payloads, including the new `dominant_color`, `palette`, `animated` and `a11y` (WCAG scheme/luminance/contrast) fields.
  - `@b10cks/mgmt-client`: `Asset.metadata` is now typed as `AssetMetadata | null` (with `AssetA11y`, `AssetThumbnail`, `AssetExif`, `AssetMediaTags` companions) instead of `Record<string, unknown> | null`.
  - `@b10cks/cli`: `b10cks generate types` now emits the full `B10cksAssetMetadata` shape (image, video, audio and document fields plus color/a11y data) instead of the previous minimal inline `metadata` object; `width`/`height` are now correctly optional for non-image assets.

## 1.6.0

### Minor Changes

- 8f39226: Delivery client resilience and caching fixes:

  - Throw a typed `ApiError` (with `status`, `endpoint`, and best-effort parsed `body`) for non-2xx responses instead of a bare `Error`, so consumers can branch on status without string-matching the message.
  - Add optional `timeoutMs`, `retries` (exponential backoff for transient network/429/5xx failures on GET), and `maxConcurrency` client options.
  - `getAll` now fetches pages with a bounded concurrency (default 6) instead of firing every page at once.
  - Key `getRedirects` cache on the request params (and revision) so a filtered lookup no longer poisons unfiltered callers.
  - Bound `getConfig` cache with an LRU cap, dedupe concurrent misses (no stampede), and include the revision in the cache key so a published config change is not masked by a stale entry.
  - Guard against `rv: null`/`undefined` clobbering a valid stored revision, and against a malformed `between` filter throwing.

### Patch Changes

- 12f184b: Fix broken CJS entry points: the CommonJS bundle was emitted as `index.js` inside `"type": "module"` packages, so `require()` resolved it as ESM and returned an empty module. CJS bundles are now emitted as `.cjs` and `main`/`exports.require` updated accordingly. The `svelte` export condition now points at the ESM bundle.

## 1.5.0

### Minor Changes

- Improve two-way binding and visual editing without bloating the framework packages.

  - Consolidate the preview/editing glue into `@b10cks/client`: a shared `attachEditable`/`attachEditableField` DOM core, one-time style injection (`ensurePreviewStyles`), and a framework-agnostic reactive `PreviewStore` (`bindPreviewStore`, `setAtPath`/`getAtPath`). The Vue/React/Svelte packages now wrap this instead of duplicating it.
  - Add `usePreviewContent` (Vue/React, auto-imported in Nuxt) and `createPreviewContent` (Svelte) for whole-tree reactive live updates while editing — including nested and rich text fields.
  - Extend the preview bridge protocol: path-addressed fields (`FieldPath`), granular `CONTENT_PATCH`, and `FIELD_SELECT` so rich text and other complex fields deep-select into the editor instead of inline editing (`mode: 'select'`).
  - Fix selection overshoot under a fixed app header: selection now scrolls with `block: 'nearest'` and honors a `scrollOffset` option / `--b10cks-scroll-offset` CSS variable.
  - Harden the bridge with origin validation (trust-on-first-use plus an optional `allowedOrigins` allowlist) and targeted `postMessage`.

  The Vue `v-editable` directive remains backwards compatible — it still live-updates its block in place, now without poking Vue internals.
