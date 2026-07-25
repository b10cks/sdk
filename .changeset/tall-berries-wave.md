---
'@b10cks/mgmt-client': patch
'@b10cks/mcp-server': patch
'@b10cks/richtext': patch
'@b10cks/client': patch
'@b10cks/svelte': patch
'@b10cks/react': patch
'@b10cks/nuxt': patch
'@b10cks/next': patch
'@b10cks/vue': patch
'@b10cks/cli': patch
---

Normalise package metadata across the workspace.

- Add the missing `LICENSE` file to `cli`, `mcp-server`, `next`, `react`,
  `richtext` and `svelte`. `mcp-server` listed `LICENSE` in its `files` array
  but shipped without one.
- Add `keywords`, `homepage` and `bugs` to every package; previously only
  `mcp-server` had them, so the rest were undiscoverable on npm.
- Use the structured `author` object everywhere instead of a free-text string.
- Declare `publishConfig.access` and `engines` consistently. `cli` now requires
  Node `>=20` (was `>=18`, which is past end-of-life) to match the others.
