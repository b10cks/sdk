---
'@b10cks/nuxt': major
---

Add `forRoute` to `useContent`. For the entry of the current route, a slug that has a redirect navigates to its target with the redirect's status code, and a missing slug shows the 404 error page. With `redirects` on, a missing slug during client-side navigation first loads the path from the server, which answers redirects of paths without an entry.

**Breaking:** without the option a redirected slug now sets `error` to a `ContentRedirectError` and leaves `data` undefined. It used to put the redirect body into `data`. Code that reads `data.value.redirect` no longer redirects and must use `forRoute: true`.
