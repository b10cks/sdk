---
'@b10cks/cli': minor
---

Fix `generate types -o` path resolution and discriminate generated blocks

- An explicit `-o` is now resolved against the working directory. Only the default output path is placed under a Nuxt 4 `app/` rootDir, so `-o ./app/b10cks/types` no longer lands in `app/app/…`.
- Each generated block interface carries a literal `block: 'slug'`, narrowing `B10cksItem`'s `block: string`. A heterogeneous body array can be discriminated on `block` without a cast. A schema field named `block` is skipped, since it would redeclare the discriminant.

The literal `block` is a type-level narrowing. Code that assigns a hand-built object with a widened `block: string` to a generated interface (test fixtures, mocks) needs `as const` or an explicit literal after regenerating.
