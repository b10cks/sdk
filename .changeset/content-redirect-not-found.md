---
'@b10cks/client': minor
---

`getContent` rejects with a `ContentRedirectError` (`target`, `status`) for a slug that has a redirect. Before, clients that do not reject a 301, like Nuxt's `$fetch`, returned the redirect body typed as `IBContent`, which rendered as an empty page. Add `resolveContent`, which returns the entry, the redirect or `not_found` as a typed result.
