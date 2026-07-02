# @b10cks/mcp-server

## 0.12.0

### Minor Changes

- b20fd24: Fix MCP list-operation params handling and error leakage:

  - `RequestOptions` now carries an optional `query` field, and all list endpoints that previously accepted no query parameters forward it, so MCP `*.list` operations can finally paginate and filter.
  - MCP list handlers route untrusted `params` through `query` instead of passing the raw object into the `RequestOptions` slot, closing a request-header injection vector (a `params.headers` key could previously override `Authorization`). `params`/`payload` are also sanitized of `__proto__`/`prototype`/`constructor` keys.
  - MCP error responses now surface only whitelisted fields (`message`, `error`, `errors`) instead of the entire raw API response body.

### Patch Changes

- 12f184b: Fix broken CJS entry points: the CommonJS bundle was emitted as `index.js` inside `"type": "module"` packages, so `require()` resolved it as ESM and returned an empty module. CJS bundles are now emitted as `.cjs` and `main`/`exports.require` updated accordingly. The `svelte` export condition now points at the ESM bundle.
- Updated dependencies [12f184b]
- Updated dependencies [b20fd24]
- Updated dependencies [e28024e]
- Updated dependencies [2253eea]
  - @b10cks/mgmt-client@1.1.0
