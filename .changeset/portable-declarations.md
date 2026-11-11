---
'@b10cks/vue': patch
'@b10cks/react': patch
'@b10cks/svelte': patch
'@b10cks/next': patch
---

Emit declarations that import from `@b10cks/client`, `@b10cks/react` and `@b10cks/richtext` instead of relative paths into the monorepo. In an installed package those paths did not exist, so types like `B10cksDataApi` and `ApiClient` resolved to `any`.
