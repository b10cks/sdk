---
"@b10cks/client": minor
---

Delivery client resilience and caching fixes:

- Throw a typed `ApiError` (with `status`, `endpoint`, and best-effort parsed `body`) for non-2xx responses instead of a bare `Error`, so consumers can branch on status without string-matching the message.
- Add optional `timeoutMs`, `retries` (exponential backoff for transient network/429/5xx failures on GET), and `maxConcurrency` client options.
- `getAll` now fetches pages with a bounded concurrency (default 6) instead of firing every page at once.
- Key `getRedirects` cache on the request params (and revision) so a filtered lookup no longer poisons unfiltered callers.
- Bound `getConfig` cache with an LRU cap, dedupe concurrent misses (no stampede), and include the revision in the cache key so a published config change is not masked by a stale entry.
- Guard against `rv: null`/`undefined` clobbering a valid stored revision, and against a malformed `between` filter throwing.
