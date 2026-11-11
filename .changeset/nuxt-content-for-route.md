---
'@b10cks/nuxt': minor
---

Add `forRoute` to `useContent`. For the entry of the current route, a slug that has a redirect navigates to its target with the redirect's status code, and a missing slug shows the 404 error page. Without the option a redirected slug now sets `error` to a `ContentRedirectError` and leaves `data` undefined. It used to put the redirect body into `data`.
