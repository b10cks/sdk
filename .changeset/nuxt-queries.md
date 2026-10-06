---
'@b10cks/nuxt': minor
---

Queries wait for the revision sync, so the first page load reads the latest published content. Slugs, names and params accept refs and getters, with async-data keys that follow them, and Nuxt's abort signal cancels the request. New module options `timeoutMs`, `retries` and `maxConcurrency` configure the app and server clients; `$fetch` no longer retries on its own.
