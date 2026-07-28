---
'@b10cks/client': minor
'@b10cks/mgmt-client': minor
'@b10cks/vue': minor
'@b10cks/react': minor
'@b10cks/svelte': minor
'@b10cks/nuxt': minor
'@b10cks/mcp-server': patch
---

Support named per-type sitemaps (`/sitemaps/{name}`)

- `@b10cks/client`: new `getNamedSitemap(name, params, options)` and `sitemaps/{name}` endpoint; `filterSitemapEntries` now also drops `robots: none`, matching the API's exclusion.
- `@b10cks/vue`, `@b10cks/react`, `@b10cks/svelte`, `@b10cks/nuxt`: new `useNamedSitemap(name, params, options)`.
- `@b10cks/mgmt-client`: `SpaceSettings.sitemaps` and the `SpaceNamedSitemap` type.
- `@b10cks/mcp-server`: `spaces.update` now documents its payload fields, including both sitemap settings shapes.
