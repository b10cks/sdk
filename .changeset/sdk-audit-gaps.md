---
'@b10cks/client': minor
'@b10cks/vue': minor
'@b10cks/nuxt': minor
'@b10cks/richtext': minor
---

Close SDK gaps found auditing three production Nuxt sites

- `@b10cks/client`: `rv` is now part of `IBBaseQueryParams`, so pinning a request to a revision (or passing `Date.now()` from a server route to sidestep a stale delivery cache) no longer needs an `as object` cast.
- `@b10cks/client`: `getDataEntries` takes a typed `IBDataEntryParams` with `dimension`, the locale-style variant selector for data sources.
- `@b10cks/client`: `GetConfigOptions.language` is deprecated in favour of `language_iso`, matching every other content param. Both still work.
- `@b10cks/nuxt`: `useB10cksConfig` watches `language_iso` as well as `language`, so a config passed `language_iso` refetches on a locale change instead of going stale.
- `@b10cks/nuxt`: new `useB10cksServerApi()`, auto-imported in the server bundle. Nitro routes and middleware get the full `B10cksDataApi` — `getRedirects`, `getSitemap`, `getNamedSitemap` with pagination and caching — instead of hand-rolling paginated fetches and TTL caches.
- `@b10cks/nuxt`: new `useB10cksVersion()` composable, normalizing `?b10cks_vid` to a version string defaulting to `published`.
- `@b10cks/richtext`: new `isRichTextEmpty(document)`, re-exported from `@b10cks/vue/rich-text` and `@b10cks/nuxt`. Reports whether a document renders anything, so a field an editor cleared (an empty paragraph) can skip its wrapper markup.
- `@b10cks/client`: `renderSitemapXml` and `filterSitemapEntries` take a `localePrefix` strategy (`auto` | `always` | `never` | `except-default`). It defaults to `auto`, which prefixes only when the entries span more than one language. A mono-lingual space previously emitted `/en/about` for a page served at `/about`, making every sitemap URL a 404 or a redirect.
- Docs: the client README documents the response-envelope normalization every collection method already does, and points at `filter` for `id` / `canonical_id` / `parent_id` queries. The Nuxt README surfaces `usePreviewContent` from the top of the usage section.
