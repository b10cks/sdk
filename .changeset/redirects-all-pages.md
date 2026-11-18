---
'@b10cks/client': minor
'@b10cks/vue': minor
'@b10cks/nuxt': minor
'@b10cks/react': minor
'@b10cks/svelte': minor
---

`getRedirects` and `useRedirects` fetch every page by default. They returned only the first page unless `allPages: true` was passed, so redirect maps were silently incomplete. Pass `allPages: false` to get a single page.
