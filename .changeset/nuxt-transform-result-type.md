---
'@b10cks/nuxt': minor
---

`transform` can return a different type on every Nuxt composable. The mapped result is the type of `data` and is what gets serialised into the page payload, so a listing block can map entries down to its card fields. `transform` is now passed to `useAsyncData`, which also accepts an async function.
