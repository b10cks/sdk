---
"@b10cks/mgmt-client": patch
---

`releases.removeVersion` now actually sends its payload: `HttpClient.delete` gained an optional body argument (previously the payload identifying which version to remove was silently dropped). Also harden the HTTP layer: clamp non-finite/negative `timeout` values to the default (a mis-parsed timeout no longer aborts every request immediately) and skip `__proto__`/`prototype`/`constructor` keys when serializing form data and query parameters.
