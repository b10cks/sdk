# @b10cks/richtext

## 1.1.0

### Minor Changes

- [#30](https://github.com/b10cks/sdk/pull/30) [`bdf15db`](https://github.com/b10cks/sdk/commit/bdf15db2066c09497326cf24296f32de70978224) Thanks [@badmike](https://github.com/badmike)! - Add `nodes` and `marks` render options for custom HTML per node or mark type, such as responsive images, heading anchors or embeds. Renderers get the attrs, the rendered children and the built-in output, and return `null` to keep it. Export `escapeHtml`, `isSafeUrl` and `sanitizeUrl` for them. Attributes of the wrong type and malformed nodes from stored content now render safely instead of throwing.

### Patch Changes

- [#30](https://github.com/b10cks/sdk/pull/30) [`abda30c`](https://github.com/b10cks/sdk/commit/abda30c4b9207dc48d71c73adacf1a03ecf6c32d) Thanks [@badmike](https://github.com/badmike)! - Keep the preview editor's toolbar open while the format menu is in use, also in browsers that don't focus a clicked select. Links typed, pasted or autolinked in the editor follow `allowedSchemes`, and the link field shows a message instead of inserting an unsafe URL. Add `setRender` to swap render options while editing.

## 1.0.0

### Major Changes

- [#23](https://github.com/b10cks/sdk/pull/23) [`bc84cef`](https://github.com/b10cks/sdk/commit/bc84cef47c9bae996ddd296414458bc302a73782) Thanks [@badmike](https://github.com/badmike)! - **Breaking:** `@b10cks/richtext` now depends on Tiptap (`@tiptap/core`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-table`), and `@b10cks/client` on `@b10cks/richtext`, so installing any of these packages installs Tiptap. No bundle includes it unless the in-place editor loads. In-place editing needs an editor on bridge protocol 3; the preview now applies its own edits to its content store, and editors on protocol 3 no longer echo them back.
  
  Edit rich text in place in the visual editor. `B10cksRichText` in Vue, React, and Svelte takes an `editable` prop with the block id and field path, e.g. `{ id: block.id, path: ['body'] }`. A click turns the rendered text into an editor with the CMS editor's schema and the field's formatting options; edits stream to the CMS form live, changes made there merge in without moving the cursor, and Escape returns to block selection. For custom renderers, `attachRichTextField` from `@b10cks/client` does the same for any element.
  
  The editor lives in a new entry, `@b10cks/richtext/editor`, built on Tiptap. It is only ever loaded with a dynamic `import()` after a hover or click in preview mode, so production bundles, SSR, and the preview before editing still use the lightweight renderer. `@b10cks/richtext` now depends on `@tiptap/core`, `@tiptap/pm`, `@tiptap/starter-kit`, and `@tiptap/extension-table` for that entry, and `@b10cks/client` on `@b10cks/richtext`.
  
  The bridge protocol is now version 3: the editor answers FIELD_SELECT of a rich text field with FIELD_CONFIG when the user may edit it. Older editors and read-only users keep the select-only behavior. `previewBridge.patchLocal` applies an edit made in the preview to the preview's own content store.
  
  In React, `B10cksRichText` stays hook-free without `editable`, so it still renders in Server Components.

## 0.8.0

### Minor Changes

- Link to blocks on a page

  Internal links can carry an `anchor`: the id of a block on the target page.

  - `resolveB10cksLink` appends `params` as a query string and `anchor` as a fragment, `/about?ref=nav#01kh…`. `url` links get their `params` too. The anchor is URI-encoded and skipped when the href already has a `#`. `B10cksLink` `params` is now typed `Record<string, string> | string`, matching what the CMS stores.
  - New `blockAnchorAttrs(block)` returns `{ id: block.id }`, or `{}` without an id. Exported from client, vue, react, svelte and next, and auto-imported by nuxt along with `resolveB10cksLink`.
  - Rich text `internalLink` marks append the anchor to the `url` or the `internalLinkHandler` result, unless it already contains `#`. Unresolved links stay `href="#"`.
  - `v-editable` renders `id="<block.id>"` on its element, in production and during SSR. An `id` on the element wins; opt out with `v-editable.noanchor`.
  - React `B10cksComponent` renders `id={block.id}` on its wrapper. An `id` prop wins; opt out with `anchor={false}`.

  Block ids are ULIDs and can start with a digit, so look them up with `getElementById` or escape them with `CSS.escape` for `querySelector`.

## 0.7.0

### Minor Changes

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

## 0.6.1

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

## 0.6.0

### Minor Changes

- Render configurable list-style classes in richtext

  `bulletList`, `orderedList` and `listItem` nodes now emit `attrs.className` (or
  `attrs.class`) as a real `class` attribute, so a space can define its own ul/ol
  variants that render framework- and CSS-agnostically. Documents without either
  attribute render unchanged.

## 0.5.0

### Minor Changes

- 59ad33d: Sanitize URL schemes in rich text link `href` and image `src` attributes to prevent stored XSS via `javascript:` (and similar) URLs in CMS content. Schemes are validated against a configurable `allowedSchemes` allowlist (default: `http`, `https`, `mailto`, `tel`; relative URLs always pass). To restore the old behavior for trusted content, pass `allowedSchemes: [...DEFAULT_ALLOWED_SCHEMES, 'javascript']`. The Vue and Svelte `B10cksRichText` components forward the new option (Vue also gains the previously missing `placeholderHandler` prop).

### Patch Changes

- 12f184b: Fix broken CJS entry points: the CommonJS bundle was emitted as `index.js` inside `"type": "module"` packages, so `require()` resolved it as ESM and returned an empty module. CJS bundles are now emitted as `.cjs` and `main`/`exports.require` updated accordingly. The `svelte` export condition now points at the ESM bundle.
