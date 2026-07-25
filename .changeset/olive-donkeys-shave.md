---
'@b10cks/mgmt-client': major
---

Give every paginated `list*` method a dedicated `params` argument.

Previously 25 of the 43 paginated methods took only `(…ids, options?: RequestOptions)`,
so pagination and filters had to be smuggled through `options.query` — and callers
that passed them positionally had them silently discarded. The signatures are now
uniform:

```ts
// before — inconsistent, per resource
client.teams.list({ query: { page: 2 } })
client.blocks.list(spaceId, { page: 2 })

// after — the same everywhere
client.teams.list({ page: 2 })
client.blocks.list(spaceId, { page: 2 })
```

**Breaking:** if you passed a `RequestOptions` object positionally to one of the
affected methods, move it to the third argument (second for `teams.list`,
`spaces.list`, `users.listTokens` and `users.listInvites`):

```ts
client.teams.listMembers(teamId, { headers })          // before
client.teams.listMembers(teamId, undefined, { headers }) // after
```

`RequestOptions.query` remains as an escape hatch for the few non-paginated
endpoints that accept filters.

Also in this release:

- Export `AssetMetadata` and its nested `AssetA11y`, `AssetExif`,
  `AssetThumbnail` and `AssetMediaTags` types. They are reachable from the
  public `Asset` type but were not exported, so consumers could not name them.
- Fix `automations.replayExecution` sending `options.query` as the request
  **body** instead of leaving the body empty.
- Fix `teams.listSpaceRoles` discarding its query string entirely.
