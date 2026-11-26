---
'@b10cks/nuxt': patch
---

Keep the HTTP status of API errors in the Nuxt data composables. Since Nuxt 4.7, `useAsyncData` turns errors it does not trust into a 500 during production SSR, so a CMS 404 reached the app as a 500. Failed requests now surface as Nuxt errors with the API's status, and the original `ApiError` is kept as `cause`.
