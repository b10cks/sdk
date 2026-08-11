---
'@b10cks/client': minor
'@b10cks/vue': minor
'@b10cks/nuxt': minor
---

Fix live preview losing the page on a scoped edit, and duplicate-instance injection failures

- `PreviewStore` now merges `CONTENT_UPDATE` by block `id` (`applyContentUpdate` / `mergeContentUpdate`) instead of replacing the root. The editor sends updates scoped to the edited block, which previously collapsed the whole preview to that block. Unknown ids are ignored.
- Vue injection keys use `Symbol.for(...)`, so a duplicated `@b10cks/vue` copy (Vite dep pre-bundling) can no longer break `useB10cksApi()` during hydration.
- `@b10cks/nuxt` registers `@b10cks/vue`, `@b10cks/client` and `@b10cks/richtext` in `vite.resolve.dedupe` and `optimizeDeps.exclude`, and transpiles them by bare specifier (the previous `resolver.resolve('@b10cks/vue')` produced a nonexistent path).
- New `toRootBlock(entry)` helper (`@b10cks/client`, re-exported from `@b10cks/vue`, auto-imported in Nuxt) returns `{ ...entry.content, id, block }` so the root block is selectable with `v-editable` and root-level editor updates match it. READMEs updated.
- `getConfig()` now includes the config entry's `id` in its result, so `v-editable="config"` works for config-driven regions. Potentially breaking only for a config schema with its own `id` field, which the entry id now shadows.
