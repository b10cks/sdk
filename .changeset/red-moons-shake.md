---
'@b10cks/mcp-server': patch
---

Pass list params through the dedicated `params` argument now that
`@b10cks/mgmt-client` exposes one on every paginated method, instead of wrapping
them in `RequestOptions.query`. Untrusted params are still sanitised and still
reach the API only as query-string values, never as request headers.
