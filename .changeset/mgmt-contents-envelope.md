---
'@b10cks/mgmt-client': patch
---

Unwrap the `{ data }` envelope on single-content endpoints

`contents.get`, `create`, `update`, `move`, `publish`, `unpublish` and `schedule` declared a bare `Content` but resolved to `{ data: Content }`, so callers had to branch on the shape themselves. They now unwrap, making the declared type true. An already-bare response is passed through untouched.
