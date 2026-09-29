---
'@b10cks/client': minor
'@b10cks/vue': minor
'@b10cks/react': minor
'@b10cks/svelte': minor
---

Improve visual editing in the preview: only the innermost editable is highlighted, selection and hover show a label with the block type or field name, and clicks on editables no longer trigger links, buttons, or router handlers inside them. `attachEditable`, `attachEditableField`, and `useEditable` take an optional `label`.

The selection label now carries a breadcrumb of the surrounding blocks and quick actions for blocks: move up and down, add before and after, duplicate, delete, and a handle to drag the block before or after another one. With a block selected, Escape selects its parent and the arrow keys its siblings. Alt/Option-click reaches the page, to open tabs, accordions, or carousels while editing.
