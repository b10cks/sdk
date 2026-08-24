# @b10cks/richtext

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
