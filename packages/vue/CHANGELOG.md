# @b10cks/vue

## 3.1.0

### Minor Changes

- [#30](https://github.com/b10cks/sdk/pull/30) [`76d9636`](https://github.com/b10cks/sdk/commit/76d963689bbc188f57f051ab3a8294164d1151ee) Thanks [@badmike](https://github.com/badmike)! - A click into an inline text field now selects its block like any other click, and keeps the caret. Blocks marked `interactive` (`attachEditable(el, { interactive: true })`, `v-editable.interactive` in Vue) select on click and let the click reach the page, so accordions, tabs and carousels work in the editor. Links and submit buttons inside still don't navigate.

- [#30](https://github.com/b10cks/sdk/pull/30) [`5720658`](https://github.com/b10cks/sdk/commit/572065879e001c1df8dacf7bea5bc605fff7d89c) Thanks [@badmike](https://github.com/badmike)! - Rich text fields edited in place use the latest render options: `RichTextFieldHandle` gains `setRender`, which `B10cksRichText` calls in Vue, React and Svelte. Vue's `B10cksRichText` takes `nodes` and `marks` props, and Svelte's now forwards them.

- [#30](https://github.com/b10cks/sdk/pull/30) [`ddfce76`](https://github.com/b10cks/sdk/commit/ddfce764b98e3150a88ad6dc45aee64a521ea732) Thanks [@badmike](https://github.com/badmike)! - Data composables accept refs and getters for slugs, names and params. Once a query ran, a change fetches it again and aborts the request it replaces, and unmounting aborts a request in flight.

### Patch Changes

- [#30](https://github.com/b10cks/sdk/pull/30) [`c0d85e7`](https://github.com/b10cks/sdk/commit/c0d85e7c773078a08d48095a25902727c2db1195) Thanks [@badmike](https://github.com/badmike)! - `v-editable-field` follows its element to a new path, so edits after a keyed list reorder update the right item.
- Updated dependencies [[`9188600`](https://github.com/b10cks/sdk/commit/91886008f5f5627f847b3efe7a57acff04aadeb8), [`02c2a5e`](https://github.com/b10cks/sdk/commit/02c2a5e16694a040cc33b4b65ac026bfc0b6b840), [`76d9636`](https://github.com/b10cks/sdk/commit/76d963689bbc188f57f051ab3a8294164d1151ee), [`bdf15db`](https://github.com/b10cks/sdk/commit/bdf15db2066c09497326cf24296f32de70978224), [`5720658`](https://github.com/b10cks/sdk/commit/572065879e001c1df8dacf7bea5bc605fff7d89c), [`abda30c`](https://github.com/b10cks/sdk/commit/abda30c4b9207dc48d71c73adacf1a03ecf6c32d)]:
  - @b10cks/client@2.1.0
  - @b10cks/richtext@1.1.0

## 3.0.0

### Major Changes

- [#23](https://github.com/b10cks/sdk/pull/23) [`bc84cef`](https://github.com/b10cks/sdk/commit/bc84cef47c9bae996ddd296414458bc302a73782) Thanks [@badmike](https://github.com/badmike)! - **Breaking:** `@b10cks/richtext` now depends on Tiptap (`@tiptap/core`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-table`), and `@b10cks/client` on `@b10cks/richtext`, so installing any of these packages installs Tiptap. No bundle includes it unless the in-place editor loads. In-place editing needs an editor on bridge protocol 3; the preview now applies its own edits to its content store, and editors on protocol 3 no longer echo them back.
  
  Edit rich text in place in the visual editor. `B10cksRichText` in Vue, React, and Svelte takes an `editable` prop with the block id and field path, e.g. `{ id: block.id, path: ['body'] }`. A click turns the rendered text into an editor with the CMS editor's schema and the field's formatting options; edits stream to the CMS form live, changes made there merge in without moving the cursor, and Escape returns to block selection. For custom renderers, `attachRichTextField` from `@b10cks/client` does the same for any element.
  
  The editor lives in a new entry, `@b10cks/richtext/editor`, built on Tiptap. It is only ever loaded with a dynamic `import()` after a hover or click in preview mode, so production bundles, SSR, and the preview before editing still use the lightweight renderer. `@b10cks/richtext` now depends on `@tiptap/core`, `@tiptap/pm`, `@tiptap/starter-kit`, and `@tiptap/extension-table` for that entry, and `@b10cks/client` on `@b10cks/richtext`.
  
  The bridge protocol is now version 3: the editor answers FIELD_SELECT of a rich text field with FIELD_CONFIG when the user may edit it. Older editors and read-only users keep the select-only behavior. `previewBridge.patchLocal` applies an edit made in the preview to the preview's own content store.
  
  In React, `B10cksRichText` stays hook-free without `editable`, so it still renders in Server Components.

### Patch Changes

- Updated dependencies [[`bc84cef`](https://github.com/b10cks/sdk/commit/bc84cef47c9bae996ddd296414458bc302a73782)]:
  - @b10cks/richtext@1.0.0
  - @b10cks/client@2.0.0

## 2.9.0

### Minor Changes

- [#22](https://github.com/b10cks/sdk/pull/22) [`8a48979`](https://github.com/b10cks/sdk/commit/8a48979204d0d2816edb4d9f07138ec7a1cb35b9) Thanks [@badmike](https://github.com/badmike)! - `B10cksComponent` in Vue, React, and Svelte catches errors per block: a broken block shows a placeholder in the visual editor and renders nothing in production, instead of taking down the page. `@b10cks/svelte` now needs Svelte 5.3 or later.

- [#22](https://github.com/b10cks/sdk/pull/22) [`b8b43e3`](https://github.com/b10cks/sdk/commit/b8b43e3a9774edac86f2b79f4151b6cd1992d894) Thanks [@badmike](https://github.com/badmike)! - Improve visual editing in the preview: only the innermost editable is highlighted, selection and hover show a label with the block type or field name, and clicks on editables no longer trigger links, buttons, or router handlers inside them. `attachEditable`, `attachEditableField`, and `useEditable` take an optional `label`.
  
  The selection label now carries a breadcrumb of the surrounding blocks and quick actions for blocks: move up and down, add before and after, duplicate, delete, and a handle to drag the block before or after another one. With a block selected, Escape selects its parent and the arrow keys its siblings. Alt/Option-click reaches the page, to open tabs, accordions, or carousels while editing.

- [#22](https://github.com/b10cks/sdk/pull/22) [`8a48979`](https://github.com/b10cks/sdk/commit/8a48979204d0d2816edb4d9f07138ec7a1cb35b9) Thanks [@badmike](https://github.com/badmike)! - `b10cks generate types` also emits `B10cksBlockMap` and the `B10cksBlock` union. `B10cksComponents<B10cksBlock>` from `@b10cks/react` and `@b10cks/svelte` types a components map so each component gets its own block's props. Vue's `B10cksComponent` accepts generated block types for `block`.

### Patch Changes

- Updated dependencies [[`db643f7`](https://github.com/b10cks/sdk/commit/db643f7fa3f25057741c611f9604af6e586ba220), [`b8b43e3`](https://github.com/b10cks/sdk/commit/b8b43e3a9774edac86f2b79f4151b6cd1992d894), [`b8b43e3`](https://github.com/b10cks/sdk/commit/b8b43e3a9774edac86f2b79f4151b6cd1992d894)]:
  - @b10cks/client@1.12.0

## 2.8.0

### Minor Changes

- Link to blocks on a page

  Internal links can carry an `anchor`: the id of a block on the target page.

  - `resolveB10cksLink` appends `params` as a query string and `anchor` as a fragment, `/about?ref=nav#01kh…`. `url` links get their `params` too. The anchor is URI-encoded and skipped when the href already has a `#`. `B10cksLink` `params` is now typed `Record<string, string> | string`, matching what the CMS stores.
  - New `blockAnchorAttrs(block)` returns `{ id: block.id }`, or `{}` without an id. Exported from client, vue, react, svelte and next, and auto-imported by nuxt along with `resolveB10cksLink`.
  - Rich text `internalLink` marks append the anchor to the `url` or the `internalLinkHandler` result, unless it already contains `#`. Unresolved links stay `href="#"`.
  - `v-editable` renders `id="<block.id>"` on its element, in production and during SSR. An `id` on the element wins; opt out with `v-editable.noanchor`.
  - React `B10cksComponent` renders `id={block.id}` on its wrapper. An `id` prop wins; opt out with `anchor={false}`.

  Block ids are ULIDs and can start with a digit, so look them up with `getElementById` or escape them with `CSS.escape` for `querySelector`.

### Patch Changes

- Updated dependencies []:
  - @b10cks/client@1.11.0
  - @b10cks/richtext@0.8.0

## 2.7.0

### Minor Changes

- [#9](https://github.com/b10cks/sdk/pull/9) [`161b103`](https://github.com/b10cks/sdk/commit/161b1031f11a4329b2a903ec3ee9d3c1f0c78efb) Thanks [@badmike](https://github.com/badmike)! - Fix live preview losing the page on a scoped edit, and duplicate-instance injection failures

  - `PreviewStore` now merges `CONTENT_UPDATE` by block `id` (`applyContentUpdate` / `mergeContentUpdate`) instead of replacing the root. The editor sends updates scoped to the edited block, which previously collapsed the whole preview to that block. Unknown ids are ignored.
  - Vue injection keys use `Symbol.for(...)`, so a duplicated `@b10cks/vue` copy (Vite dep pre-bundling) can no longer break `useB10cksApi()` during hydration.
  - `@b10cks/nuxt` registers `@b10cks/vue`, `@b10cks/client` and `@b10cks/richtext` in `vite.resolve.dedupe` and `optimizeDeps.exclude`, and transpiles them by bare specifier (the previous `resolver.resolve('@b10cks/vue')` produced a nonexistent path).
  - New `toRootBlock(entry)` helper (`@b10cks/client`, re-exported from `@b10cks/vue`, auto-imported in Nuxt) returns `{ ...entry.content, id, block }` so the root block is selectable with `v-editable` and root-level editor updates match it. READMEs updated.
  - `getConfig()` now includes the config entry's `id` in its result, so `v-editable="config"` works for config-driven regions. Potentially breaking only for a config schema with its own `id` field, which the entry id now shadows.

- [#13](https://github.com/b10cks/sdk/pull/13) [`0a032af`](https://github.com/b10cks/sdk/commit/0a032afd66cec876271ff53b706e5c7912f2e14d) Thanks [@badmike](https://github.com/badmike)! - Close SDK gaps found auditing three production Nuxt sites

  - `@b10cks/client`: `rv` is now part of `IBBaseQueryParams`, so pinning a request to a revision (or passing `Date.now()` from a server route to sidestep a stale delivery cache) no longer needs an `as object` cast.
  - `@b10cks/client`: `getDataEntries` takes a typed `IBDataEntryParams` with `dimension`, the locale-style variant selector for data sources.
  - `@b10cks/client`: `GetConfigOptions.language` is deprecated in favour of `language_iso`, matching every other content param. Both still work.
  - `@b10cks/nuxt`: `useB10cksConfig` watches `language_iso` as well as `language`, so a config passed `language_iso` refetches on a locale change instead of going stale.
  - `@b10cks/nuxt`: new `useB10cksServerApi()`, auto-imported in the server bundle. Nitro routes and middleware get the full `B10cksDataApi` — `getRedirects`, `getSitemap`, `getNamedSitemap` with pagination and caching — instead of hand-rolling paginated fetches and TTL caches.
  - `@b10cks/nuxt`: new `useB10cksVersion()` composable, normalizing `?b10cks_vid` to a version string defaulting to `published`.
  - `@b10cks/richtext`: new `isRichTextEmpty(document)`, re-exported from `@b10cks/vue/rich-text` and `@b10cks/nuxt`. Reports whether a document renders anything, so a field an editor cleared (an empty paragraph) can skip its wrapper markup.
  - `@b10cks/client`: `renderSitemapXml` and `filterSitemapEntries` take a `localePrefix` strategy (`auto` | `always` | `never` | `except-default`). It defaults to `auto`, which prefixes only when the entries span more than one language. A mono-lingual space previously emitted `/en/about` for a page served at `/about`, making every sitemap URL a 404 or a redirect.
  - Docs: the client README documents the response-envelope normalization every collection method already does, and points at `filter` for `id` / `canonical_id` / `parent_id` queries. The Nuxt README surfaces `usePreviewContent` from the top of the usage section.

### Patch Changes

- Updated dependencies [[`161b103`](https://github.com/b10cks/sdk/commit/161b1031f11a4329b2a903ec3ee9d3c1f0c78efb), [`0a032af`](https://github.com/b10cks/sdk/commit/0a032afd66cec876271ff53b706e5c7912f2e14d)]:
  - @b10cks/client@1.10.0
  - @b10cks/richtext@0.7.0

## 2.6.0

### Minor Changes

- Support the dedicated breadcrumb endpoint (`/breadcrumbs/{slug}`)

  The CMS now serves the ancestor trail of an entry in one request, resolved per level through its own i18n family — an untranslated ancestor falls back and is flagged rather than dropped, while unpublished ancestors are omitted entirely.

  - `@b10cks/client`: new `getBreadcrumb(slug, params)` and `getBreadcrumbResponse(slug, params)`, the `breadcrumbs/{slug}` endpoint, the `IBBreadcrumbLevel`/`IBBreadcrumbMeta`/`IBBreadcrumbResponse`/`IBBreadcrumbParams` types, and a `breadcrumbJsonLd` helper that renders a trail as a schema.org `BreadcrumbList`.
  - `@b10cks/vue`, `@b10cks/react`, `@b10cks/svelte`, `@b10cks/nuxt`: new `useBreadcrumb(slug, params, options)`.

### Patch Changes

- Updated dependencies []:
  - @b10cks/client@1.9.0

## 2.5.0

### Minor Changes

- Support named per-type sitemaps (`/sitemaps/{name}`)

  - `@b10cks/client`: new `getNamedSitemap(name, params, options)` and `sitemaps/{name}` endpoint; `filterSitemapEntries` now also drops `robots: none`, matching the API's exclusion.
  - `@b10cks/vue`, `@b10cks/react`, `@b10cks/svelte`, `@b10cks/nuxt`: new `useNamedSitemap(name, params, options)`.
  - `@b10cks/mgmt-client`: `SpaceSettings.sitemaps` and the `SpaceNamedSitemap` type.
  - `@b10cks/mcp-server`: `spaces.update` now documents its payload fields, including both sitemap settings shapes.

### Patch Changes

- Updated dependencies []:
  - @b10cks/client@1.8.0

## 2.4.5

### Patch Changes

- Framework SDK review fixes: latest-wins guard for overlapping async requests in the Vue/React/Svelte state helpers, no fire-and-forget immediate fetches during Vue SSR, preview bridge adopts a late `allowedOrigins` init (and drops an uncovered trust-on-first-use origin), shared module-scope async component cache in the Vue `B10cksComponent`, and the Nuxt module now merges `runtimeConfig.public.b10cks` instead of overwriting it.

- Updated dependencies []:
  - @b10cks/client@1.7.2

## 2.4.4

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

## 2.4.3

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

## 2.4.2

### Patch Changes

- Updated dependencies []:
  - @b10cks/richtext@0.6.0

## 2.4.1

### Patch Changes

- 12f184b: Fix broken CJS entry points: the CommonJS bundle was emitted as `index.js` inside `"type": "module"` packages, so `require()` resolved it as ESM and returned an empty module. CJS bundles are now emitted as `.cjs` and `main`/`exports.require` updated accordingly. The `svelte` export condition now points at the ESM bundle.
- 955ac1f: `usePreviewContent`/`createPreviewContent` now react to a changing `initial` content tree instead of capturing it once. In React the preview store resets when `initial` changes identity; Vue's `usePreviewContent` accepts a ref/getter and resets on change; Svelte's `createPreviewContent` accepts a readable store whose updates reset the store. This fixes stale content rendering when a persistent layout survives navigation (route change, revalidation, locale switch). Plain-value usage is unchanged.
- 59ad33d: Sanitize URL schemes in rich text link `href` and image `src` attributes to prevent stored XSS via `javascript:` (and similar) URLs in CMS content. Schemes are validated against a configurable `allowedSchemes` allowlist (default: `http`, `https`, `mailto`, `tel`; relative URLs always pass). To restore the old behavior for trusted content, pass `allowedSchemes: [...DEFAULT_ALLOWED_SCHEMES, 'javascript']`. The Vue and Svelte `B10cksRichText` components forward the new option (Vue also gains the previously missing `placeholderHandler` prop).
- 3ada87f: Fix unhandled promise rejections from `immediate` async hooks/composables/stores. The internal `execute` rethrows after storing the error, and the immediate path called `void execute()`, so any failed default fetch (e.g. `useContent` with `immediate: true`) produced an unhandled rejection — crashing Node SSR under default settings. The immediate path now swallows the rethrow (the error remains available in state); explicit `execute()`/`refresh()` calls still reject as before.
- 0580418: Memoize async block components by name in `B10cksComponent`. Previously each recompute of the resolved component (e.g. a live-preview `CONTENT_UPDATE` on every keystroke) produced a brand-new `defineAsyncComponent`, remounting the entire block subtree — causing flicker, lost focus, and repeated child `onMounted`/refetches.
- Updated dependencies [12f184b]
- Updated dependencies [8f39226]
- Updated dependencies [59ad33d]
  - @b10cks/client@1.6.0
  - @b10cks/richtext@0.5.0

## 2.4.0

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
