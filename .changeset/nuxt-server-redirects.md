---
'@b10cks/nuxt': major
---

Answer b10cks redirects on the server by default. A server middleware fetches the full list, keeps it per instance for `maxAge` seconds (default 60) and never serialises it into a page. An expired list keeps answering while one refresh runs in the background. Matching ignores a trailing slash and URL encoding, and the request's query is added to the target. `resolveB10cksRedirect` is auto-imported in the server bundle for a middleware with its own rules.

**Breaking:** the middleware is on after upgrading. Delete a hand-written redirect resolver or route middleware around `useRedirects`, or set `redirects: false` to keep yours.
