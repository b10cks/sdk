---
'@b10cks/client': minor
'@b10cks/vue': minor
'@b10cks/react': patch
'@b10cks/svelte': patch
---

Rich text fields edited in place use the latest render options: `RichTextFieldHandle` gains `setRender`, which `B10cksRichText` calls in Vue, React and Svelte. Vue's `B10cksRichText` takes `nodes` and `marks` props, and Svelte's now forwards them.
