---
"@b10cks/react": patch
---

Fix infinite fetch loop in `useB10cksApi` hooks: default/inline `params` objects created a new identity every render, so the `immediate` effect re-fired continuously. Hook dependencies now use a serialized params key, and the task closure is read through a ref so the latest `params`/`transform` are still used on every execution.
