---
'@b10cks/client': minor
---

`timeoutMs` now covers reading the response body. Every request method takes a `signal` that cancels the request, its retries and the remaining pages. Retries only cover network errors, timeouts, 429 and 5xx on GET requests, and wait for `Retry-After` up to 10 seconds. Errors from fetch clients like Nuxt's `$fetch` become `ApiError`, and no error message contains the request URL or token. Slugs and ids are encoded per path segment, and `.` or `..` segments are rejected.
