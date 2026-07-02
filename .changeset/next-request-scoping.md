---
"@b10cks/next": minor
---

Prevent SSR request-state bleed in the Next server helper. `createB10cksNextApi` is now documented as request-scoped (its client holds the content revision and per-instance caches, so a module-level singleton would leak a preview/draft revision to other visitors). A new `defineB10cksNextApi(optionsFactory)` wraps creation in React's `cache()`, giving each App Router request its own client while safely being exported at module scope. Request-scoped `getRv`/`setRv` remain available via the options.
