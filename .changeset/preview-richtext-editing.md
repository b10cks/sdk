---
'@b10cks/richtext': major
'@b10cks/client': major
'@b10cks/vue': major
'@b10cks/react': major
'@b10cks/svelte': major
'@b10cks/next': major
'@b10cks/nuxt': major
---

**Breaking:** `@b10cks/richtext` now depends on Tiptap (`@tiptap/core`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-table`), and `@b10cks/client` on `@b10cks/richtext`, so installing any of these packages installs Tiptap. No bundle includes it unless the in-place editor loads. In-place editing needs an editor on bridge protocol 3; the preview now applies its own edits to its content store, and editors on protocol 3 no longer echo them back.

Edit rich text in place in the visual editor. `B10cksRichText` in Vue, React, and Svelte takes an `editable` prop with the block id and field path, e.g. `{ id: block.id, path: ['body'] }`. A click turns the rendered text into an editor with the CMS editor's schema and the field's formatting options; edits stream to the CMS form live, changes made there merge in without moving the cursor, and Escape returns to block selection. For custom renderers, `attachRichTextField` from `@b10cks/client` does the same for any element.

The editor lives in a new entry, `@b10cks/richtext/editor`, built on Tiptap. It is only ever loaded with a dynamic `import()` after a hover or click in preview mode, so production bundles, SSR, and the preview before editing still use the lightweight renderer. `@b10cks/richtext` now depends on `@tiptap/core`, `@tiptap/pm`, `@tiptap/starter-kit`, and `@tiptap/extension-table` for that entry, and `@b10cks/client` on `@b10cks/richtext`.

The bridge protocol is now version 3: the editor answers FIELD_SELECT of a rich text field with FIELD_CONFIG when the user may edit it. Older editors and read-only users keep the select-only behavior. `previewBridge.patchLocal` applies an edit made in the preview to the preview's own content store.

In React, `B10cksRichText` stays hook-free without `editable`, so it still renders in Server Components.
