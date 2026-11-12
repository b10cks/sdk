---
'@b10cks/client': minor
---

Type the fields the delivery API already returns on content entries: `canonical_id`, `external_id`, `position` and `cache` (`IBContentCache`). Add optional `resolved_language_iso` and `is_fallback`, which tell which language an entry was actually served in, for single-language entries whose canonical version is not in the default language.
