# @b10cks/nuxt

## 3.5.0

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
  - @b10cks/vue@2.7.0
  - @b10cks/richtext@0.7.0

## 3.4.1

### Patch Changes

- [#3](https://github.com/b10cks/sdk/pull/3) [`cea9c1e`](https://github.com/b10cks/sdk/commit/cea9c1ef37db17c6eb82d3e2ec1de95b9305d053) Thanks [@badmike](https://github.com/badmike)! - Update dependencies (`@modelcontextprotocol/sdk`, `@nuxt/kit`, bundled `chalk`)

## 3.4.0

### Minor Changes

- Support the dedicated breadcrumb endpoint (`/breadcrumbs/{slug}`)

  The CMS now serves the ancestor trail of an entry in one request, resolved per level through its own i18n family — an untranslated ancestor falls back and is flagged rather than dropped, while unpublished ancestors are omitted entirely.

  - `@b10cks/client`: new `getBreadcrumb(slug, params)` and `getBreadcrumbResponse(slug, params)`, the `breadcrumbs/{slug}` endpoint, the `IBBreadcrumbLevel`/`IBBreadcrumbMeta`/`IBBreadcrumbResponse`/`IBBreadcrumbParams` types, and a `breadcrumbJsonLd` helper that renders a trail as a schema.org `BreadcrumbList`.
  - `@b10cks/vue`, `@b10cks/react`, `@b10cks/svelte`, `@b10cks/nuxt`: new `useBreadcrumb(slug, params, options)`.

### Patch Changes

- Updated dependencies []:
  - @b10cks/client@1.9.0
  - @b10cks/vue@2.6.0

## 3.3.0

### Minor Changes

- Support named per-type sitemaps (`/sitemaps/{name}`)

  - `@b10cks/client`: new `getNamedSitemap(name, params, options)` and `sitemaps/{name}` endpoint; `filterSitemapEntries` now also drops `robots: none`, matching the API's exclusion.
  - `@b10cks/vue`, `@b10cks/react`, `@b10cks/svelte`, `@b10cks/nuxt`: new `useNamedSitemap(name, params, options)`.
  - `@b10cks/mgmt-client`: `SpaceSettings.sitemaps` and the `SpaceNamedSitemap` type.
  - `@b10cks/mcp-server`: `spaces.update` now documents its payload fields, including both sitemap settings shapes.

### Patch Changes

- Updated dependencies []:
  - @b10cks/client@1.8.0
  - @b10cks/vue@2.5.0

## 3.2.5

### Patch Changes

- Framework SDK review fixes: latest-wins guard for overlapping async requests in the Vue/React/Svelte state helpers, no fire-and-forget immediate fetches during Vue SSR, preview bridge adopts a late `allowedOrigins` init (and drops an uncovered trust-on-first-use origin), shared module-scope async component cache in the Vue `B10cksComponent`, and the Nuxt module now merges `runtimeConfig.public.b10cks` instead of overwriting it.

- Updated dependencies []:
  - @b10cks/client@1.7.2
  - @b10cks/vue@2.4.5

## 3.2.4

### Patch Changes

- 356f1a6: Bump the `@nuxt/kit` runtime dependency to `^4.5.0`.
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
  - @b10cks/vue@2.4.4

## 3.2.3

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

- Updated dependencies []:
  - @b10cks/vue@2.4.3

## 3.2.2

### Patch Changes

- Updated dependencies []:
  - @b10cks/richtext@0.6.0
  - @b10cks/vue@2.4.2

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
