# Changelog

## 1.2.0

### Minor Changes

- Type asset metadata across clients and generated types

  - `@b10cks/client`: new exported content-model types `B10cksAssetMetadata`, `B10cksAssetValue`, `B10cksAssetA11y`, `B10cksAssetThumbnail`, `B10cksAssetExif` and `B10cksAssetMediaTags` describing the asset `metadata` shape delivered in content payloads, including the new `dominant_color`, `palette`, `animated` and `a11y` (WCAG scheme/luminance/contrast) fields.
  - `@b10cks/mgmt-client`: `Asset.metadata` is now typed as `AssetMetadata | null` (with `AssetA11y`, `AssetThumbnail`, `AssetExif`, `AssetMediaTags` companions) instead of `Record<string, unknown> | null`.
  - `@b10cks/cli`: `b10cks generate types` now emits the full `B10cksAssetMetadata` shape (image, video, audio and document fields plus color/a11y data) instead of the previous minimal inline `metadata` object; `width`/`height` are now correctly optional for non-image assets.

## 1.1.0

### Minor Changes

- b20fd24: Fix MCP list-operation params handling and error leakage:

  - `RequestOptions` now carries an optional `query` field, and all list endpoints that previously accepted no query parameters forward it, so MCP `*.list` operations can finally paginate and filter.
  - MCP list handlers route untrusted `params` through `query` instead of passing the raw object into the `RequestOptions` slot, closing a request-header injection vector (a `params.headers` key could previously override `Authorization`). `params`/`payload` are also sanitized of `__proto__`/`prototype`/`constructor` keys.
  - MCP error responses now surface only whitelisted fields (`message`, `error`, `errors`) instead of the entire raw API response body.

### Patch Changes

- 12f184b: Fix broken CJS entry points: the CommonJS bundle was emitted as `index.js` inside `"type": "module"` packages, so `require()` resolved it as ESM and returned an empty module. CJS bundles are now emitted as `.cjs` and `main`/`exports.require` updated accordingly. The `svelte` export condition now points at the ESM bundle.
- e28024e: `releases.removeVersion` now actually sends its payload: `HttpClient.delete` gained an optional body argument (previously the payload identifying which version to remove was silently dropped). Also harden the HTTP layer: clamp non-finite/negative `timeout` values to the default (a mis-parsed timeout no longer aborts every request immediately) and skip `__proto__`/`prototype`/`constructor` keys when serializing form data and query parameters.
- 2253eea: URL-encode all interpolated path parameters (space ids, content ids, etc.) via a new `apiPath` tagged template. Previously, ids containing `/`, `?`, or `#` could redirect a request to a different endpoint (path traversal), which also allowed MCP callers to escape the operation whitelist.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-01-10

### Added

- Initial release of the b10cks Management API client
- Full TypeScript support with comprehensive type definitions
- User management endpoints
  - Get current user profile
  - Update user information
  - Update avatar
  - Change password
  - Update user settings
- Team management endpoints
  - List, create, update, and delete teams
  - Get team hierarchy
  - Manage team users (add, update, remove)
- Space management endpoints
  - Create, read, update, and delete spaces
  - Update space icons
  - Archive spaces
  - Get space statistics and AI usage
- Block management endpoints
  - List blocks with filtering and pagination
  - Create, read, update, and delete blocks
  - Block tags management
  - Block folders management
- Content management endpoints
  - List contents with filtering
  - Create, read, update, and delete contents
  - Publish and unpublish contents
  - Version control (get, update, publish versions)
  - Set specific version as current
- Asset management endpoints
  - List, create, read, update, and delete assets
  - Asset folders management
  - Asset tags management
- Redirect management endpoints
  - List redirects with filtering
  - Create, read, update, and delete redirects
  - Reset redirect hit counters
- Token management endpoints
  - Create space tokens with expiration and limits
  - Delete tokens
- Data source management endpoints
  - List, create, read, update, and delete data sources
  - Manage data entries within sources
- AI features
  - Get available AI models with filtering
  - Generate meta tags
  - Translate content
- System endpoints
  - Health check
  - Get system configuration
- Comprehensive error handling with `ManagementApiError`
- Request timeout configuration
- Full pagination support for list endpoints
- Clean, SOLID-based architecture with resource managers
- Complete documentation and examples

### Technical Details

- Built with TypeScript for type safety
- Modular resource-based architecture
- HTTP client with automatic retry and timeout handling
- Bearer token authentication
- Comprehensive type definitions for all API entities
- ESM and CJS support
- Zero runtime dependencies

[0.1.0]: https://github.com/b10cks/sdk/releases/tag/@b10cks/mgmt-client@0.1.0
