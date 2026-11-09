---
'@b10cks/client': minor
'@b10cks/vue': minor
'@b10cks/nuxt': minor
'@b10cks/react': minor
'@b10cks/svelte': minor
---

Add `getReferencedContents(ids, params)` and a `useReferencedContents` composable or hook in every framework package. They fetch the entries a reference field points at in any language: they filter by `canonical_id`, fetch every page, keep the order of `ids`, drop missing entries and read a preview version id as `draft`. Add `canonicalId(entry, defaultLanguage?)` to match entries against references, and the optional `canonical_id` field on `IBContent`.
