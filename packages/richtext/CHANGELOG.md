# @b10cks/richtext

## 0.5.0

### Minor Changes

- 59ad33d: Sanitize URL schemes in rich text link `href` and image `src` attributes to prevent stored XSS via `javascript:` (and similar) URLs in CMS content. Schemes are validated against a configurable `allowedSchemes` allowlist (default: `http`, `https`, `mailto`, `tel`; relative URLs always pass). To restore the old behavior for trusted content, pass `allowedSchemes: [...DEFAULT_ALLOWED_SCHEMES, 'javascript']`. The Vue and Svelte `B10cksRichText` components forward the new option (Vue also gains the previously missing `placeholderHandler` prop).

### Patch Changes

- 12f184b: Fix broken CJS entry points: the CommonJS bundle was emitted as `index.js` inside `"type": "module"` packages, so `require()` resolved it as ESM and returned an empty module. CJS bundles are now emitted as `.cjs` and `main`/`exports.require` updated accordingly. The `svelte` export condition now points at the ESM bundle.
