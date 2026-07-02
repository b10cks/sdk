---
"@b10cks/cli": patch
---

Read `B10CKS_API_DOMAIN` at runtime instead of baking it in at build time, so self-hosted/staging instances can be targeted via the env var as documented. Also fix the mangled settings URL printed by `b10cks login` (`https:/.b10cks.com` → `https://b10cks.com`) by deriving the account URL with proper URL parsing.
