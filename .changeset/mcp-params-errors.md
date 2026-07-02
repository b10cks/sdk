---
"@b10cks/mcp-server": minor
"@b10cks/mgmt-client": minor
---

Fix MCP list-operation params handling and error leakage:

- `RequestOptions` now carries an optional `query` field, and all list endpoints that previously accepted no query parameters forward it, so MCP `*.list` operations can finally paginate and filter.
- MCP list handlers route untrusted `params` through `query` instead of passing the raw object into the `RequestOptions` slot, closing a request-header injection vector (a `params.headers` key could previously override `Authorization`). `params`/`payload` are also sanitized of `__proto__`/`prototype`/`constructor` keys.
- MCP error responses now surface only whitelisted fields (`message`, `error`, `errors`) instead of the entire raw API response body.
