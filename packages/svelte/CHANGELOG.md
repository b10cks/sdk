# @b10cks/svelte

## 0.6.0

### Minor Changes

- Support named per-type sitemaps (`/sitemaps/{name}`)

  - `@b10cks/client`: new `getNamedSitemap(name, params, options)` and `sitemaps/{name}` endpoint; `filterSitemapEntries` now also drops `robots: none`, matching the API's exclusion.
  - `@b10cks/vue`, `@b10cks/react`, `@b10cks/svelte`, `@b10cks/nuxt`: new `useNamedSitemap(name, params, options)`.
  - `@b10cks/mgmt-client`: `SpaceSettings.sitemaps` and the `SpaceNamedSitemap` type.
  - `@b10cks/mcp-server`: `spaces.update` now documents its payload fields, including both sitemap settings shapes.

### Patch Changes

- Updated dependencies []:
  - @b10cks/client@1.8.0

## 0.5.5

### Patch Changes

- Framework SDK review fixes: latest-wins guard for overlapping async requests in the Vue/React/Svelte state helpers, no fire-and-forget immediate fetches during Vue SSR, preview bridge adopts a late `allowedOrigins` init (and drops an uncovered trust-on-first-use origin), shared module-scope async component cache in the Vue `B10cksComponent`, and the Nuxt module now merges `runtimeConfig.public.b10cks` instead of overwriting it.

- Updated dependencies []:
  - @b10cks/client@1.7.2

## 0.5.4

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

- Updated dependencies [4040149]
  - @b10cks/richtext@0.6.1
  - @b10cks/client@1.7.1

## 0.5.3

### Patch Changes

- Add `b10cks init` to set up a b10cks integration or scaffold a new project.

  `init` detects the framework in the target directory (Nuxt, Next.js, React, Vue, or Svelte) and wires it up: it installs the required packages, edits the framework config, writes the access token to `.env`, and gitignores it. When the directory is empty — or holds nothing but a `.git`, so `git init` then `b10cks init .` works — it first scaffolds a project, delegating to the framework's own official scaffolder or cloning any [giget](https://github.com/unjs/giget) ref passed via `--template`.

  ```sh
  b10cks init                                            # integrate into this project
  b10cks init my-app --framework nuxt                    # scaffold, then integrate
  b10cks init my-app --template gh:b10cks/nuxt-boilerplate
  b10cks init --dry-run                                  # preview, write nothing
  ```

  The token is minted through the Management API when you are logged in, and prompted for otherwise. It is written to `.env` before dependencies are installed, so a failed install never strands a token that is only shown once. Re-running is safe: an existing assignment anywhere in the dotenv cascade (`.env`, `.env.local`, …) is reused rather than re-minted, and already-wired files are left untouched.

  Configs whose shape is not recognized are reported with a snippet to apply by hand rather than rewritten — including CommonJS `next.config.js`, which gets a `require()`-based snippet instead of an ESM edit.

  Env var names follow each framework's own convention (`NUXT_PUBLIC_B10CKS_ACCESS_TOKEN`, `NEXT_PUBLIC_B10CKS_TOKEN`, `VITE_B10CKS_TOKEN`, `PUBLIC_B10CKS_TOKEN`). The framework READMEs previously showed the access token hardcoded in source; they now document the matching env var instead. The CLI README has also been brought back in line with the actual command surface, which has been namespaced (`b10cks spaces list`) rather than hyphenated (`b10cks spaces-list`) for some time.

## 0.5.2

### Patch Changes

- Updated dependencies []:
  - @b10cks/richtext@0.6.0

## 0.5.1

### Patch Changes

- 12f184b: Fix broken CJS entry points: the CommonJS bundle was emitted as `index.js` inside `"type": "module"` packages, so `require()` resolved it as ESM and returned an empty module. CJS bundles are now emitted as `.cjs` and `main`/`exports.require` updated accordingly. The `svelte` export condition now points at the ESM bundle.
- 955ac1f: `usePreviewContent`/`createPreviewContent` now react to a changing `initial` content tree instead of capturing it once. In React the preview store resets when `initial` changes identity; Vue's `usePreviewContent` accepts a ref/getter and resets on change; Svelte's `createPreviewContent` accepts a readable store whose updates reset the store. This fixes stale content rendering when a persistent layout survives navigation (route change, revalidation, locale switch). Plain-value usage is unchanged.
- 59ad33d: Sanitize URL schemes in rich text link `href` and image `src` attributes to prevent stored XSS via `javascript:` (and similar) URLs in CMS content. Schemes are validated against a configurable `allowedSchemes` allowlist (default: `http`, `https`, `mailto`, `tel`; relative URLs always pass). To restore the old behavior for trusted content, pass `allowedSchemes: [...DEFAULT_ALLOWED_SCHEMES, 'javascript']`. The Vue and Svelte `B10cksRichText` components forward the new option (Vue also gains the previously missing `placeholderHandler` prop).
- 4068e34: - `@b10cks/svelte`: drop `^4.2.0` from the `svelte` peer range. `B10cksRichText` uses Svelte 5 runes (`$props`/`$derived`), so it never compiled on Svelte 4 — the range now honestly reflects `^5.0.0`.
  - `@b10cks/nuxt`: register the language `watch` in `useB10cksConfig` inside the captured effect scope instead of after the `await`, so it is disposed on unmount instead of leaking an orphaned watcher across navigations.
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
