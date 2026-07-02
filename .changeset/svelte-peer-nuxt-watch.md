---
"@b10cks/svelte": patch
"@b10cks/nuxt": patch
---

- `@b10cks/svelte`: drop `^4.2.0` from the `svelte` peer range. `B10cksRichText` uses Svelte 5 runes (`$props`/`$derived`), so it never compiled on Svelte 4 — the range now honestly reflects `^5.0.0`.
- `@b10cks/nuxt`: register the language `watch` in `useB10cksConfig` inside the captured effect scope instead of after the `await`, so it is disposed on unmount instead of leaking an orphaned watcher across navigations.
