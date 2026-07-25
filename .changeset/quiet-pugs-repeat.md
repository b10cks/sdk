---
'@b10cks/cli': major
---

Fix a batch of commands that were sending fields the Management API does not
accept, and remove the `any` annotations that hid them from the compiler.

Fixed:

- `--page` / `--per-page` were silently ignored by every list command. They were
  passed into the `RequestOptions` slot, which only reads `query` and `headers`.
- `redirects create` / `redirects update` sent `{ from, to }`; the API field
  names are `source` and `destination`. `redirects list` printed empty values for
  the same reason.
- `contents create` sent `block` (a slug); the API expects `block_id`. `slug` is
  required by the API but was treated as optional.
- `provider notes create` / `update` sent `body`; the field is `content`.
- `users me update` sent `name`; the API accepts `firstname` and `lastname`.
- `data-sources entries update` sent `{ name, value }` at the top level instead
  of nesting them under `data`, unlike `entries create`.
- `assets update` sent `alt` / `title` as top-level fields; they belong in
  `metadata`.
- `releases assign-version` sent a `content_id` the API ignores;
  `releases remove-version` sent `content_id` where `version_id` was required,
  so it could never succeed.
- `automations list` read `enabled` (never present) instead of `is_active`, so
  every automation rendered as `[off]`.
- `spaces audit-logs` read `action` / `user_id`; the fields are `operation` and
  `owner_name` / `owner_id`.
- `releases list` read a `status` field that does not exist; status is now
  derived from `published_at` / `committed_at`.
- `comments reactions list` read `user_id`; reactions carry an `author`.
- `users tokens list` displayed a non-existent `last_used_at`; it now shows
  `expires_at`.
- `users invites list` read `space_name` / `team_name`, which are not returned.

**Breaking** — flags on commands that could not previously succeed:

- `contents create`: `--block <blockSlug>` is now `--block-id <blockId>`, and
  `--slug` is required.
- `users me update`: `--name` is now `--firstname` and `--lastname`.
- `releases assign-version`: `--content-id` removed (it was never sent).
- `releases remove-version`: `--content-id` is now `--version-id`.
