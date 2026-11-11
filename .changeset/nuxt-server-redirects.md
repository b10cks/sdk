---
'@b10cks/nuxt': minor
---

Add the `redirects` module option. It answers requests whose path has a b10cks redirect in a server middleware. The full list is fetched on the server, kept per instance for `maxAge` seconds (default 60) and never serialised into a page. `resolveB10cksRedirect` is auto-imported in the server bundle for a middleware with its own rules. This replaces the route middleware around `useRedirects`, which put the whole list into every page's payload.
