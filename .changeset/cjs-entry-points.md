---
"@b10cks/client": patch
"@b10cks/mgmt-client": patch
"@b10cks/richtext": patch
"@b10cks/react": patch
"@b10cks/vue": patch
"@b10cks/svelte": patch
"@b10cks/next": patch
"@b10cks/mcp-server": patch
---

Fix broken CJS entry points: the CommonJS bundle was emitted as `index.js` inside `"type": "module"` packages, so `require()` resolved it as ESM and returned an empty module. CJS bundles are now emitted as `.cjs` and `main`/`exports.require` updated accordingly. The `svelte` export condition now points at the ESM bundle.
