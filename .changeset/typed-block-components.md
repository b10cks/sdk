---
'@b10cks/cli': minor
'@b10cks/vue': minor
'@b10cks/react': minor
'@b10cks/svelte': minor
---

`b10cks generate types` also emits `B10cksBlockMap` and the `B10cksBlock` union. `B10cksComponents<B10cksBlock>` from `@b10cks/react` and `@b10cks/svelte` types a components map so each component gets its own block's props. Vue's `B10cksComponent` accepts generated block types for `block`.
