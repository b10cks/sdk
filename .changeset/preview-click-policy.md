---
'@b10cks/client': minor
'@b10cks/vue': minor
---

A click into an inline text field now selects its block like any other click, and keeps the caret. Blocks marked `interactive` (`attachEditable(el, { interactive: true })`, `v-editable.interactive` in Vue) select on click and let the click reach the page, so accordions, tabs and carousels work in the editor. Links and submit buttons inside still don't navigate.
