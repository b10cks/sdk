---
"@b10cks/cli": patch
---

Safer `~/.netrc` handling: refuse to rewrite the file when an existing one cannot be parsed (previously this silently wiped all other hosts' credentials), write it with `0600` permissions so the stored token is not world-readable, and fall back to `os.homedir()` when `HOME`/`USERPROFILE` is unset. `b10cks login` now also distinguishes invalid-token errors from network/server failures.
