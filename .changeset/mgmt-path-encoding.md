---
"@b10cks/mgmt-client": patch
---

URL-encode all interpolated path parameters (space ids, content ids, etc.) via a new `apiPath` tagged template. Previously, ids containing `/`, `?`, or `#` could redirect a request to a different endpoint (path traversal), which also allowed MCP callers to escape the operation whitelist.
