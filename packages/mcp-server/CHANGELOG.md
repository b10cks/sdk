# @b10cks/mcp-server

## 0.14.0

### Minor Changes

- Add local block schema as source of truth: `b10cks schema pull|diff|push` sync a `b10cks/schema/*.block.json` directory against a space (three-way diff via `b10cks/schema.lock.json`, upsert keyed by external_id, `--prune`, `--dry-run`, `--force`), backed by the new `blocks.sync()` bulk endpoint in the management client and a TypeScript port of the CMS schema normalization pipeline. `b10cks generate types` now generates from the local schema directory when the space ID is omitted.

### Patch Changes

- Updated dependencies []:
  - @b10cks/mgmt-client@1.4.0

## 0.13.0

### Minor Changes

- Bring the management client and MCP server up to date with the current management API.

  **mgmt-client**

  - Add DAM resources: `assetCollections`, `assetShares`, `assetPackages`, and public `shares` (including binary image-preview support and share-access-token auth).
  - Add asset versions and `replaceFile`, user notifications, space usage/history/invoices, onboarding, contents & icons import/export, `authorization`, space blueprints catalogue, and public invite lookup.
  - Fix endpoints that no longer existed on the server: `ai.translate`, `ai.generateMetaTags`, and `dataSources.translateMissingDimensions` now target their `/stream` routes.
  - Type space and content settings: new `SpaceSettings` and `ContentSettings` interfaces (with `site_locales`, `content_sorting`, `onboarding_dismissed_at`, `sitemap`, `cache_ttl`, `cache_tags`, `child_sort_by`/`child_sort_direction`, …) replace the untyped `settings` records.
  - Correct the `Content` response type to match `ContentResource` (it previously declared `data`/`metadata`/`space_id`, which the API never returned); add the `badge`, `plan`, `user_count`, and `content_updated_at` fields to `Space`.
  - Remove `spaces.listSpaceRoles` (it called a route that returned 404; use `teams.listSpaceRoles`) and the space/content presence methods (realtime collaboration, not a management concern).

  **mcp-server**

  - Add operations covering the new client surface plus previously unmapped methods (teams, users, notifications, usage, DAM, public shares, authorization, blueprints).

  **cli**

  - Remove the broken `spaces roles list` command (roles are team-scoped).
  - Fix `spaces`/`teams` member list commands so `--page`/`--per-page` are actually sent.

### Patch Changes

- Updated dependencies []:
  - @b10cks/mgmt-client@1.3.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @b10cks/mgmt-client@1.2.0

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
