export interface ClientConfig {
  baseUrl: string
  token: string
  timeout?: number
  headers?: Record<string, string>
}

export interface RequestOptions {
  headers?: Record<string, string>
  /**
   * Escape hatch for query-string parameters on the handful of non-paginated
   * endpoints that accept them. Every paginated `list*` method takes a
   * dedicated `params` argument instead — pass pagination and filters there.
   */
  query?: Record<string, unknown>
}

export interface PaginationParams {
  page?: number
  per_page?: number
  [key: string]: unknown
}

export interface PaginatedResponse<T> {
  data: T[]
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
  meta: {
    current_page: number
    from: number | null
    last_page: number
    per_page: number
    to: number | null
    total: number
  }
}

export interface ApiError {
  message: string
  error: string
  code: number
}

export interface ValidationError {
  message: string
  errors: Record<string, string[]>
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface User {
  id: string
  firstname: string | null
  lastname: string | null
  email: string
  avatar: string | null
  email_verified_at: string | null
  login_count: number
  last_Login_at: string | null
  language_iso: string | null
  settings: Record<string, unknown>
}

export interface SimpleUser {
  id: string
  name: string
  avatar: string | null
  initials: string
  email: string
  created_at: string | null
}

export interface UpdateUserParams {
  firstname?: string | null
  lastname?: string | null
}

export interface UpdateAvatarParams {
  avatar: string
}

export interface UpdatePasswordParams {
  old_password: string
  password: string
}

export interface SocialLink {
  provider: string
  url: string | null
}

export interface PersonalAccessToken {
  id: string
  name: string
  created_at: string | null
  expires_at: string | null
}

export interface CreatePersonalAccessTokenParams {
  name: string
  expires_at?: string | null
}

// ─── Teams ───────────────────────────────────────────────────────────────────

export interface Team {
  id: string
  name: string
  slug: string
  icon: string | null
  color: string | null
  description: string | null
  type: string
  parent_id: string | null
  settings: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface CreateTeamParams {
  name: string
  icon?: string | null
  color?: string | null
  description?: string | null
  parent_id?: string | null
  settings?: Record<string, unknown> | null
}

export interface UpdateTeamParams {
  name?: string
  icon?: string | null
  color?: string | null
  description?: string | null
  type?: 'personal' | 'organization' | 'team' | 'project' | null
  parent_id?: string | null
  settings?: Record<string, unknown> | null
}

export interface TeamHierarchy {
  id: string
  name: string
  type: string
  children: TeamHierarchy[]
}

export interface TeamMember {
  id: string
  user: {
    id: string
    firstname: string | null
    lastname: string | null
    name: string
    email: string
    avatar: string | null
    initials: string
  }
  firstname: string | null
  lastname: string | null
  name: string
  email: string
  avatar: string | null
  initials: string
  role: string | null
  membership_origin: string
  can_assign_team_role: boolean
  can_remove: boolean
  space_memberships: unknown[]
  is_active: boolean
  last_login_at: string | null
  joined_at: string | null
  created_at: string | null
}

export interface TeamSamlProvider {
  id: string
  team_id: string
  enabled: boolean
  idp_entity_id: string | null
  sso_url: string | null
  slo_url: string | null
  idp_x509_cert: string | null
  sp_x509_cert: string | null
  has_sp_private_key: boolean
  name_id_format: string | null
  attribute_mapping: Record<string, string> | null
  role_attribute: string | null
  role_mapping: Record<string, string> | null
  default_role: string | null
  allow_jit: boolean
  strict: boolean
  sign_authn_requests: boolean
  sign_logout_requests: boolean
  want_assertions_signed: boolean
  want_messages_signed: boolean
  want_assertions_encrypted: boolean
  digest_algorithm: string | null
  signature_algorithm: string | null
  last_login_at: string | null
  created_at: string | null
  updated_at: string | null
  links: {
    login_url: string
    acs_url: string
    sls_url: string
    metadata_url: string
    sp_entity_id: string
  }
}

export interface UpsertTeamSamlProviderParams {
  enabled?: boolean
  idp_entity_id?: string | null
  sso_url?: string | null
  slo_url?: string | null
  idp_x509_cert?: string | null
  sp_x509_cert?: string | null
  sp_private_key?: string | null
  name_id_format?: string | null
  attribute_mapping?: Record<string, string> | null
  role_attribute?: string | null
  role_mapping?: Record<string, string> | null
  default_role?: string | null
  allow_jit?: boolean
  strict?: boolean
  sign_authn_requests?: boolean
  sign_logout_requests?: boolean
  want_assertions_signed?: boolean
  want_messages_signed?: boolean
  want_assertions_encrypted?: boolean
  digest_algorithm?: string | null
  signature_algorithm?: string | null
}

// ─── Spaces ──────────────────────────────────────────────────────────────────

export interface SpaceLanguage {
  code: string
  name: string
  fallback_language?: string | null
  hidden?: boolean | null
}

/**
 * Maps a URL path segment to a CMS language, decoupling site URLs from content
 * languages (e.g. `de` served under `at-de`, `ch-de`). When empty, the space's
 * `slug_strategy` applies.
 */
export interface SpaceSiteLocale {
  segment: string
  language: string
  name?: string | null
}

export interface SpaceAssetField {
  key: string
  label: string
  required: boolean
}

export interface SpaceEnvironment {
  key: string
  label: string
}

export interface SpaceSitemapType {
  block: string
  path: string
}

/**
 * A named sitemap served under `/api/v1/sitemaps/{slug}` with its own
 * block-to-meta-path mappings, e.g. one sitemap for pages and one for news.
 */
export interface SpaceNamedSitemap {
  slug: string
  types: SpaceSitemapType[]
}

export interface SpaceSettingsAi {
  enabled?: boolean | null
  model?: string | null
  favourites?: string[]
}

/**
 * The full settings object returned on a space. Mirrors the CMS `SpaceSettings`
 * model defaults — responses always carry every key; on write, any subset is
 * accepted and merged.
 */
export interface SpaceSettings {
  region: string
  default_block: string | null
  default_language: string
  i18n_mode: 'overlay' | 'independent'
  languages: SpaceLanguage[]
  site_locales: SpaceSiteLocale[]
  asset_fields: SpaceAssetField[]
  environments: SpaceEnvironment[]
  default_environment: string | null
  visual_editor: boolean
  search_driver: string
  slug_strategy: 'prepend_translations' | 'always_prepend' | 'never'
  filter_hidden_blocks: boolean
  content_sorting: boolean
  /** ISO timestamp of when the onboarding guide was dismissed; null while shown. */
  onboarding_dismissed_at: string | null
  ai: SpaceSettingsAi
  sitemap: { types: SpaceSitemapType[] }
  sitemaps: SpaceNamedSitemap[]
  [key: string]: unknown
}

/** The plan summary embedded in a space, derived from the current subscription. */
export interface SpacePlanSummary {
  id: string | null
  name: string
  status: string
}

export interface Space {
  id: string
  state: 'active' | 'archived' | 'draft'
  name: string
  slug: string
  icon: string | null
  color: string | null
  badge: string | null
  description: string | null
  settings: SpaceSettings
  team_id: string | null
  plan: SpacePlanSummary | null
  /** Present only when the `users` relation was counted. */
  user_count?: number
  content_updated_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface CreateSpaceParams {
  name: string
  slug: string
  icon?: string | null
  team_id?: string | null
  color?: string | null
  description?: string | null
  settings?: Partial<SpaceSettings> | null
}

export interface UpdateSpaceParams {
  name?: string
  slug?: string
  icon?: string | null
  color?: string | null
  description?: string | null
  settings?: Partial<SpaceSettings> | null
  state?: 'active' | 'archived' | 'draft'
}

export interface UpdateSpaceIconParams {
  icon: string
}

export interface SpaceMember {
  id: string
  user: {
    id: string
    firstname: string | null
    lastname: string | null
    name: string
    email: string
    avatar: string | null
    initials: string
  }
  firstname: string | null
  lastname: string | null
  name: string
  email: string
  avatar: string | null
  initials: string
  role: string | null
  can_assign_space_role: boolean
  can_remove: boolean
  is_active: boolean
  last_login_at: string | null
  joined_at: string | null
  created_at: string | null
}

export interface SpaceAiSettings {
  ai: {
    enabled: boolean
    model: string | null
    favourites: string[]
  }
}

export interface UpdateSpaceAiSettingsParams {
  model?: string | null
  favourites?: string[]
  enabled?: boolean
}

export interface SpaceAiConfig {
  id: string
  name: string
  driver: string
  model: string
  system_prompt: string | null
  temperature: number
  max_tokens: number
  is_default: boolean
  created_at: string | null
  updated_at: string | null
}

export interface CreateSpaceAiConfigParams {
  name: string
  driver: string
  model: string
  system_prompt?: string | null
  temperature?: number
  max_tokens?: number
  is_default?: boolean
}

export interface UpdateSpaceAiConfigParams extends Partial<CreateSpaceAiConfigParams> {}

export interface SpaceBlueprint {
  id: string
  name: string
  icon: string | null
  color: string | null
  description: string | null
  settings: Record<string, unknown>
  data: Record<string, unknown>
  team_id: string
  created_by: SimpleUser | null
  created_at: string | null
  updated_at: string | null
}

export interface CreateSpaceBlueprintParams {
  name: string
  icon?: string | null
  color?: string | null
  description?: string | null
  settings?: Record<string, unknown>
  data?: Record<string, unknown>
}

export interface UpdateSpaceBlueprintParams extends Partial<CreateSpaceBlueprintParams> {}

export interface Role {
  id: string
  scope: string
  key: string
  name: string
  description: string | null
  level: number
  is_system: boolean
  team_id: string | null
  abilities: string[]
  is_read_only: boolean
  created_at: string | null
  updated_at: string | null
}

export interface CreateRoleParams {
  key: string
  name: string
  description?: string | null
  level?: number
  abilities?: string[]
}

export interface UpdateRoleParams extends Partial<CreateRoleParams> {}

// ─── Invites ─────────────────────────────────────────────────────────────────

export interface Invite {
  id: string
  space_id: string | null
  team_id: string | null
  invitee_id: string | null
  invited_by: string | null
  email: string
  role: string | null
  message: string | null
  status: 'pending' | 'accepted' | 'expired'
  inviter: SimpleUser | null
  invitee: SimpleUser | null
  expires_at: string | null
  accepted_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface CreateInviteParams {
  email: string
  role?: string | null
  message?: string | null
}

// ─── Subscriptions & Plans ───────────────────────────────────────────────────

export interface Plan {
  id: string
  name: string
  description: string | null
  features: string[]
  price: number | null
  period: string | null
  quotas: Record<string, unknown>
  is_free: boolean
  sort_order: number
  contact_url: string | null
}

export interface Subscription {
  id: string
  space_id: string
  plan_id: string
  plan: Plan | null
  name: string
  status: string
  is_active: boolean
  is_free: boolean
  variant_id: string | null
  product_id: string | null
  quantity: number
  quotas: Record<string, unknown>
  billing_portal_url: string | null
  renews_at: string | null
  ends_at: string | null
  trial_ends_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface CheckoutSubscriptionParams {
  plan_id: string
}

// ─── Backups ─────────────────────────────────────────────────────────────────

export interface Backup {
  id: string
  space_id: string
  state: string
  progress: number | null
  name: string
  description: string | null
  recipients: string[]
  has_password: boolean
  s3_path: string | null
  file_size: number | null
  checksum: string | null
  expires_at: string | null
  started_at: string | null
  completed_at: string | null
  failed_at: string | null
  error_message: string | null
  created_at: string | null
  updated_at: string | null
  created_by: { id: string; display_name: string; email: string } | null
}

export interface CreateBackupParams {
  name?: string
  description?: string | null
  recipients?: string[]
  password?: string | null
}

export interface UpdateBackupParams {
  name?: string
  description?: string | null
}

// ─── Migrations ──────────────────────────────────────────────────────────────

export interface Migration {
  id: string
  source_space_id: string
  target_space_id: string
  state: string
  progress: number | null
  scope: Record<string, unknown> | null
  conflict_strategy: string | null
  stats: Record<string, unknown> | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  failed_at: string | null
  created_at: string | null
  source_space: { id: string; name: string; slug: string } | null
  target_space: { id: string; name: string; slug: string } | null
  created_by: { id: string; display_name: string; email: string } | null
}

export interface CreateMigrationParams {
  source_space_id: string
  scope?: Record<string, unknown>
  conflict_strategy?: string
}

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string
  created_at: string | null
  referenced_type: string
  referenced_id: string | null
  name: string
  operation: string
  key: string
  owner_type: string | null
  owner_id: string | null
  owner_name: string | null
  owner: SimpleUser | null
  item: {
    exists: boolean
    route_name: string | null
    route_params: Record<string, unknown>
    route_query: Record<string, unknown> | null
  }
}

export interface GetAuditLogsParams extends PaginationParams {
  search?: string
  referenced_type?: string
  operation?: string
  owner_id?: string
  created_after?: string
  created_before?: string
}

// ─── Blocks ──────────────────────────────────────────────────────────────────

export interface Block {
  id: string
  external_id?: string | null
  name: string
  slug: string
  type: string
  description: string | null
  icon: string | null
  color: string | null
  preview_template?: string | null
  preview_file?: string | null
  schema: Record<string, unknown>
  editor?: unknown[] | null
  tags?: string[] | null
  settings: Record<string, unknown> | null
  templates_count?: number
  folder?: BlockFolder | null
  folder_id: string | null
  space_id: string
  created_at: string
  updated_at: string
}

export interface GetBlocksParams extends PaginationParams {
  search?: string
  external_id?: string
  folder_id?: string
  tag_id?: string
  include_archived?: boolean
  include_in_navigation?: boolean
  created_after?: string
  updated_after?: string
  type?: string | string[]
  sort?: 'created_at' | 'updated_at' | 'name' | '-created_at' | '-updated_at' | '-name'
  [key: string]: unknown
}

export interface BlockTag {
  id: string
  external_id?: string | null
  name: string
  slug: string
  color: string | null
  space_id: string
  created_at: string
  updated_at: string
}

export interface BlockFolder {
  id: string
  external_id?: string | null
  name: string
  parent_id: string | null
  space_id: string
  created_at: string
  updated_at: string
}

export interface BlockTemplate {
  id: string
  name: string
  icon: string | null
  color: string | null
  description: string | null
  content: Record<string, unknown> | null
  preview_file: string | null
  created_by: SimpleUser | null
  created_at: string | null
  updated_at: string | null
}

export interface CreateBlockTemplateParams {
  name: string
  icon?: string | null
  color?: string | null
  description?: string | null
  content?: Record<string, unknown>
  preview_file?: string | null
}

export interface UpdateBlockTemplateParams extends Partial<CreateBlockTemplateParams> {}

export interface BlockVersion {
  id: string
  block_id: string
  parent_id: string | null
  data: Record<string, unknown>
  commit_message: string | null
  created_by: SimpleUser | null
  created_at: string | null
}

export interface UpdateBlockVersionParams {
  commit_message?: string | null
}

/** A full block definition as synced from a local schema file. */
export interface SyncBlockDefinition {
  external_id: string
  name: string
  slug: string
  type: string
  icon?: string | null
  color?: string | null
  description?: string | null
  preview_template?: string | null
  preview_file?: string | null
  schema?: Record<string, unknown> | null
  editor?: unknown[] | null
  tags?: string[] | null
  folder_id?: string | null
}

export interface SyncBlocksParams {
  blocks: SyncBlockDefinition[]
  /** Soft-delete blocks that exist in the space but not in the payload. */
  prune?: boolean
  /** Compute the plan without applying any changes. */
  dry_run?: boolean
  commit_message?: string | null
}

export type BlockSyncAction = 'created' | 'updated' | 'unchanged' | 'deleted'

export interface BlockSyncResultEntry {
  action: BlockSyncAction
  /** null for blocks that would be created in a dry run */
  id: string | null
  external_id: string | null
  slug: string
  changed: string[]
}

export interface BlockSyncResult {
  dry_run: boolean
  results: BlockSyncResultEntry[]
  summary: Record<BlockSyncAction, number>
}

export interface BlockSyncResponse {
  data: BlockSyncResult
}

// ─── Contents ────────────────────────────────────────────────────────────────

/**
 * How the direct children of a content entry are ordered. Besides the fixed
 * values, `content.{field}` orders by a first-level key of the child content
 * payload (e.g. `content.publishDate`).
 */
export type ContentChildSortBy =
  | 'inherit'
  | 'manual'
  | 'name'
  | 'published_at'
  | 'created_at'
  | 'updated_at'
  | `content.${string}`

/**
 * Per-content settings. Mirrors the CMS `ContentSettings` model defaults —
 * responses carry every key; on write, any subset is accepted.
 */
export interface ContentSettings {
  disablePreview: boolean
  i18n_mode_override: 'inherit' | 'overlay' | 'independent'
  restrict_child_blocks: boolean
  child_block_whitelist: string[]
  child_tag_whitelist: string[]
  default_child_block: string | null
  child_sort_by: ContentChildSortBy
  child_sort_direction: 'asc' | 'desc'
  /** Delivery cache TTL in seconds (0–31536000); null uses the space default. */
  cache_ttl: number | null
  /** Cache tags delivered with the entry, for tag-based invalidation (max 32). */
  cache_tags: string[]
  [key: string]: unknown
}

/** The block summary embedded in a content entry. */
export interface ContentBlockRef {
  id: string
  name: string
  icon: string | null
  slug: string
}

/** The parent summary embedded in a content entry. */
export interface ContentParentRef {
  id: string
  name: string
  slug: string
}

export interface Content {
  id: string
  external_id: string | null
  block_id: string
  block: ContentBlockRef | null
  /** The block's field schema; null when the block has no schema. */
  block_schema: Record<string, unknown> | null
  /** The block's editor layout; `[]` when none. */
  block_editor: Record<string, unknown> | unknown[]
  parent_id: string | null
  position: number
  parent: ContentParentRef | null
  name: string
  /** Present only when the `children` relation was counted. */
  children_count?: number
  slug: string
  full_slug: string
  language_iso: string
  i18n_parent_id: string | null
  i18n_canonical_id: string
  effective_i18n_mode: 'overlay' | 'independent'
  language_versions: unknown[]
  /** The resolved, asset-injected content payload. */
  content: Record<string, unknown>
  /** The raw current-version content payload, before i18n resolution. */
  raw_content: Record<string, unknown>
  settings: ContentSettings
  current_version_id: string | null
  current_version: ContentVersionListItem | null
  published_version_id: string | null
  published_version: ContentVersionListItem | null
  published_at: string | null
  first_published_at: string | null
  created_at: string | null
  updated_at: string | null
  /** Present only when the respective i18n relation is loaded. */
  i18n_parent?: ContentTranslation
  i18n_translations?: ContentTranslation[]
  i18n_siblings?: ContentTranslation[]
}

/** A sibling/parent language version, as returned by the i18n relations. */
export interface ContentTranslation {
  id: string
  name: string
  slug: string
  language_iso: string
  [key: string]: unknown
}

export interface ContentTranslationMutationParams {
  id?: string
  external_id?: string | null
  name?: string
  slug?: string
  block_id?: string
  parent_id?: string | null
  i18n_parent_id?: string | null
  language_iso?: string
  content?: Record<string, unknown>
  settings?: Partial<ContentSettings> | null
  force?: boolean
  message?: string
  published_at?: string | null
}

export interface CreateContentParams {
  external_id?: string | null
  name: string
  slug: string
  block_id: string
  parent_id?: string | null
  i18n_parent_id?: string | null
  language_iso?: string
  content?: Record<string, unknown>
  settings?: Partial<ContentSettings> | null
  force?: boolean
  translations?: ContentTranslationMutationParams[]
}

export interface UpdateContentParams extends Partial<Omit<CreateContentParams, 'translations'>> {
  message?: string
  translations?: ContentTranslationMutationParams[]
}

export interface PublishContentParams extends UpdateContentParams {
  published_at?: string | null
}

export interface ScheduleContentParams {
  scheduled_at: string
}

export interface MoveContentParams {
  parent_id?: string | null
  position?: number | null
}

export interface GetContentsParams extends PaginationParams {
  created_after?: string
  updated_after?: string
  published_after?: string
  search?: string
  block_id?: string | string[]
  external_id?: string
  published?: boolean
  [key: string]: unknown
}

export interface ContentVersionListItem {
  id: string
  external_id: string | null
  message: string | null
  parent_id: string | null
  release_id: string | null
  release: SimpleRelease | null
  author: SimpleUser | null
  publisher: SimpleUser | null
  published_at: string | null
  scheduled_at: string | null
  created_at: string | null
}

export interface ContentVersion extends ContentVersionListItem {
  diff: unknown
}

export interface SimpleRelease {
  id: string
  name: string
  description: string | null
}

export type ContentTreeOperation =
  | { type: 'create'; temp_id?: string; parent_id?: string | null; block_id: string; name?: string; [key: string]: unknown }
  | { type: 'move'; ids: string[]; parent_id?: string | null; after_id?: string | null }
  | { type: 'delete'; ids: string[] }
  | { type: 'duplicate'; ids: string[]; parent_id?: string | null; after_id?: string | null }
  | { type: 'update_block'; id: string; block_id: string }

export interface ContentTreeOperationsParams {
  operations: ContentTreeOperation[]
}

export interface ContentTreeOperationsResult {
  data: {
    created: Array<{ temp_id: string; id: string }>
    warnings: unknown[]
  }
}

// ─── Comments ────────────────────────────────────────────────────────────────

export interface Comment {
  id: string
  external_id: string | null
  content_id: string
  content_version_id: string | null
  parent_id: string | null
  body: string
  is_resolved: boolean
  item_id: string | null
  field: string | null
  position: Record<string, unknown> | null
  author: SimpleUser | null
  replies: Comment[]
  reactions: Record<string, SimpleUser[]>
  mentions: SimpleUser[]
  replies_count: number | null
  resolved_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface CreateCommentParams {
  body: string
  parent_id?: string | null
  item_id?: string | null
  field?: string | null
  position?: Record<string, unknown> | null
  content_version_id?: string | null
  mention_ids?: string[]
}

export interface UpdateCommentParams {
  body?: string
  mention_ids?: string[]
}

export interface CommentReaction {
  id: string
  comment_id: string
  emoji: string
  author: SimpleUser | null
  created_at: string | null
}

export interface CreateCommentReactionParams {
  emoji: string
}

// ─── Releases ────────────────────────────────────────────────────────────────

export interface Release {
  id: string
  external_id: string | null
  name: string
  description: string | null
  settings: Record<string, unknown>
  owner_id: string | null
  publish_at: string | null
  committed_at: string | null
  published_at: string | null
  versions_count: number | null
  versions?: ContentVersionListItem[]
  created_at: string | null
  updated_at: string | null
}

export interface CreateReleaseParams {
  name: string
  description?: string | null
  settings?: Record<string, unknown>
  publish_at?: string | null
}

export interface UpdateReleaseParams extends Partial<CreateReleaseParams> {}

export interface AssignReleaseVersionParams {
  version_id: string
}

export interface RemoveReleaseVersionParams {
  version_id: string
}

// ─── Redirects ───────────────────────────────────────────────────────────────

export interface Redirect {
  id: string
  source: string
  destination: string
  type: 'permanent' | 'temporary'
  space_id: string
  hits: number
  last_hit_at: string | null
  created_at: string
  updated_at: string
}

export interface GetRedirectsParams extends PaginationParams {
  search?: string
  source?: string
  destination?: string
  type?: 'permanent' | 'temporary'
  sort?: 'created_at' | 'updated_at' | 'hits' | '-created_at' | '-updated_at' | '-hits'
  [key: string]: unknown
}

// ─── Icons ───────────────────────────────────────────────────────────────────

export interface Icon {
  id: string
  external_id: string | null
  key: string
  name: string
  description: string | null
  body: string
  width: number
  height: number
  tags: string[]
  created_at: string
  updated_at: string
}

export interface CreateIconParams {
  key: string
  name: string
  body: string
  description?: string | null
  external_id?: string | null
  tags?: string[]
  width?: number
  height?: number
}

export interface UpdateIconParams {
  key?: string
  name?: string
  body?: string
  description?: string | null
  external_id?: string | null
  tags?: string[]
  width?: number
  height?: number
}

export interface GetIconsParams extends PaginationParams {
  q?: string
  key?: string
  tags?: string | string[]
  external_id?: string
  created_at?: string
  updated_at?: string
  sort?: string
  [key: string]: unknown
}

// ─── Assets ──────────────────────────────────────────────────────────────────

/**
 * WCAG contrast stats derived from the asset's dominant color, so consumers
 * can pick accessible overlay/text colors without recomputing contrast.
 */
export interface AssetA11y {
  /** `'dark'` = treat the image as a dark surface (use light overlays/text). */
  scheme: 'dark' | 'light'
  /** WCAG relative luminance of the dominant color (0–1). */
  luminance: number
  /** Contrast ratio of white text against the dominant color (1–21). */
  contrast_white: number
  /** Contrast ratio of black text against the dominant color (1–21). */
  contrast_black: number
}

/** A generated video preview frame. */
export interface AssetThumbnail {
  path: string
  /** Storage-prefixed path, present in API responses. */
  full_path?: string
  /** Frame position in seconds. */
  position: number
  /** Frame position as `mm:ss` / `hh:mm:ss`. */
  position_formatted: string
  /** Dominant color of this frame as `#rrggbb`. */
  dominant_color?: string
}

/** EXIF subset extracted from JPEG/TIFF uploads. */
export interface AssetExif {
  make?: string | null
  model?: string | null
  exposure?: string | number | null
  aperture?: string | number | null
  iso?: string | number | null
  dateTaken?: string | null
  orientation?: number | null
}

/** ID3-style tags extracted from audio uploads. */
export interface AssetMediaTags {
  title?: string | null
  artist?: string | null
  album?: string | null
  year?: string | null
  genre?: string | null
}

/**
 * Metadata extracted from an asset at upload time. Which fields are present
 * depends on the file type (image, video, audio, document). Custom metadata
 * supplied at upload is carried through via the index signature.
 */
export interface AssetMetadata {
  type?: 'image' | 'video' | 'audio' | 'document' | 'file'
  /** Format refinement, e.g. `'svg'`, `'pdf'` or the source mime type. */
  subtype?: string
  original_filename?: string
  width?: number
  height?: number
  /** `width / height`, rounded to 4 decimals. */
  aspectRatio?: number
  /** Dominant color as `#rrggbb` — usable as a loading placeholder. */
  dominant_color?: string
  /** Up to 5 representative colors, most dominant first (`palette[0] === dominant_color`). */
  palette?: string[]
  /** True for multi-frame GIF/WebP images. */
  animated?: boolean
  a11y?: AssetA11y
  exif?: AssetExif
  /** Duration in seconds (video/audio). */
  duration?: number
  fps?: number
  bitrate?: number
  codec?: string
  thumbnails?: AssetThumbnail[]
  channels?: number
  sample_rate?: number
  tags?: AssetMediaTags
  [key: string]: unknown
}

export interface Asset {
  id: string
  external_id?: string | null
  name: string
  filename: string
  mime_type: string
  size: number
  url: string
  folder_id: string | null
  space_id: string
  metadata: AssetMetadata | null
  tags: string[]
  created_at: string
  updated_at: string
}

export interface GetAssetsParams extends PaginationParams {
  q?: string
  filename?: string
  external_id?: string
  size?: number | string
  folder?: string | null
  extension?: string | string[]
  mime_type?: string | string[]
  tags?: string | string[]
  created_at?: string
  updated_at?: string
  sort?: string
  [key: string]: unknown
}

export interface AssetFolder {
  id: string
  external_id?: string | null
  name: string
  parent_id: string | null
  space_id: string
  created_at: string
  updated_at: string
}

export interface AssetTag {
  id: string
  external_id?: string | null
  name: string
  icon: string | null
  color: string | null
  assets_count?: number
  space_id: string
  created_at: string
  updated_at: string
}

export interface UpsertAssetTagParams {
  name: string
  external_id?: string | null
  icon?: string | null
  color?: string | null
}

export interface GetAssetTagsParams extends PaginationParams {
  q?: string
  name?: string
  icon?: string
  color?: string
  external_id?: string
  assets_count?: number
  created_at?: string
  updated_at?: string
  sort?: string
  [key: string]: unknown
}

export interface LinkedAssetContent {
  id: string
  name: string
  slug: string
  space_id: string
  block_id: string
  [key: string]: unknown
}

/** A point-in-time snapshot of an asset's file, created whenever the file is replaced. */
export interface AssetVersion {
  id: string
  external_id: string | null
  asset_id: string
  version_number: number
  filename: string
  extension: string
  mime_type: string
  size: number
  checksum: string | null
  full_path: string
  metadata: AssetMetadata | null
  /** Only present when the `createdBy` relation is loaded. */
  created_by?: { id: string; name: string }
  created_at: string | null
}

export interface ReplaceAssetFileParams {
  /** File contents. A `Buffer`/`Blob`/`File` switches the request to multipart. */
  file: unknown
  [key: string]: unknown
}

// ─── Asset Collections ───────────────────────────────────────────────────────

/**
 * `manual` collections hold an explicit, ordered list of assets; `smart`
 * collections resolve their members from `rules` and cannot be edited by hand.
 */
export type AssetCollectionType = 'manual' | 'smart'

export interface AssetCollection {
  id: string
  external_id: string | null
  name: string
  description: string | null
  icon: string | null
  color: string | null
  type: AssetCollectionType
  /** Membership rules for `smart` collections; always `null` when `manual`. */
  rules: Record<string, unknown> | unknown[] | null
  settings: Record<string, unknown> | unknown[] | null
  cover_asset_id: string | null
  /** Only present when the `coverAsset` relation is loaded (the `get` endpoint). */
  cover_asset?: Asset
  /** `null` for smart collections in list responses, where it is not computed. */
  assets_count: number | null
  created_by_id: string | null
  created_at: string | null
  updated_at: string | null
}

export interface UpsertAssetCollectionParams {
  name?: string
  external_id?: string | null
  description?: string | null
  icon?: string | null
  color?: string | null
  type?: AssetCollectionType
  /** Required when `type` is `smart`; ignored (forced to `null`) when `manual`. */
  rules?: Record<string, unknown> | unknown[] | null
  settings?: Record<string, unknown> | unknown[] | null
  cover_asset_id?: string | null
}

export interface GetAssetCollectionsParams extends PaginationParams {
  q?: string
  name?: string
  external_id?: string
  type?: AssetCollectionType
  /** Range filter, `start...end` (either side optional). */
  created_at?: string
  updated_at?: string
  sort?: string
  [key: string]: unknown
}

// ─── Asset Shares & Packages ─────────────────────────────────────────────────

/** Where a share or package draws its assets from. */
export type AssetSourceType = 'collection' | 'selection' | 'folder'

export type AssetPackageState = 'pending' | 'building' | 'completed' | 'failed'

/** Build status of the zip archive backing a share. */
export interface AssetSharePackage {
  id: string
  state: AssetPackageState
  progress: number
  file_size: number | null
  asset_count: number
  is_stale: boolean
  expires_at: string | null
}

export interface AssetShare {
  id: string
  /** Raw share token; combine with the space id to build the public share URL. */
  token: string
  name: string
  description: string | null
  source_type: AssetSourceType
  collection_id: string | null
  folder_id: string | null
  asset_ids: string[] | null
  package_id: string | null
  /** Only present when the `package` relation is loaded. */
  package?: AssetSharePackage | null
  has_password: boolean
  expires_at: string | null
  download_limit: number | null
  download_count: number
  view_count: number
  allow_individual_downloads: boolean
  settings: Record<string, unknown> | unknown[] | null
  is_revoked: boolean
  is_expired: boolean
  last_accessed_at: string | null
  revoked_at: string | null
  created_at: string | null
  updated_at: string | null
  /** Only present when the `creator` relation is loaded. */
  created_by?: { id: string; display_name: string; email: string } | null
}

export interface CreateAssetShareParams {
  name: string
  source_type: AssetSourceType
  description?: string | null
  /** Required when `source_type` is `collection`. */
  collection_id?: string | null
  /** Required when `source_type` is `folder`. */
  folder_id?: string | null
  /** Required when `source_type` is `selection`; 1–1000 ids. */
  asset_ids?: string[] | null
  /** Stored hashed and never returned; 4–255 characters. */
  password?: string | null
  expires_at?: string | null
  download_limit?: number | null
  allow_individual_downloads?: boolean
  settings?: Record<string, unknown> | unknown[] | null
}

/**
 * Every field is optional. Omitting `password` keeps the current one; passing
 * `null` or `''` removes it. Changing the source resets the built package.
 */
export interface UpdateAssetShareParams extends Partial<CreateAssetShareParams> {}

export interface GetAssetSharesParams extends PaginationParams {
  source_type?: AssetSourceType
  collection_id?: string
  folder_id?: string
  [key: string]: unknown
}

export interface AssetPackage {
  id: string
  name: string | null
  source_type: AssetSourceType
  collection_id: string | null
  folder_id: string | null
  asset_ids: string[] | null
  state: AssetPackageState
  progress: number
  error: string | null
  file_size: number | null
  checksum: string | null
  asset_count: number
  is_stale: boolean
  expires_at: string | null
  created_at: string | null
  updated_at: string | null
  /** Only present when the `creator` relation is loaded. */
  created_by?: { id: string; display_name: string; email: string }
}

export interface CreateAssetPackageParams {
  source_type: AssetSourceType
  name?: string | null
  /** Required when `source_type` is `collection`. */
  collection_id?: string | null
  /** Required when `source_type` is `folder`. */
  folder_id?: string | null
  /** Required when `source_type` is `selection`; 1–1000 ids. */
  asset_ids?: string[] | null
}

/** A short-lived, presigned URL pointing at the actual file bytes. */
export interface AssetDownloadUrl {
  url: string
  expires_at: string | null
}

/** Returned while a package archive is still being built. */
export interface AssetPackagePending {
  state: AssetPackageState
  progress: number
}

// ─── Public Shares ───────────────────────────────────────────────────────────

/** The reduced payload returned for a password-protected share before unlock. */
export interface LockedShare {
  name: string
  protected: true
  unlocked: false
}

export interface UnlockedShare {
  name: string
  description: string | null
  settings: Record<string, unknown> | unknown[] | null
  /** `null` when the count could not be computed. */
  asset_count: number | null
  allow_individual_downloads: boolean
  download_limit: number | null
  download_count: number
  expires_at: string | null
  package_state: AssetPackageState | null
  package_progress: number | null
  protected: boolean
  unlocked: true
}

/** A share is either locked (name only) or unlocked (full detail). */
export type PublicShare = LockedShare | UnlockedShare

/** The deliberately reduced asset shape exposed on public shares. */
export interface PublicShareAsset {
  id: string
  filename: string
  extension: string
  mime_type: string
  size: number
  metadata: Pick<AssetMetadata, 'type' | 'width' | 'height' | 'dominant_color' | 'thumbnails'>
  /** `null` for non-image assets. Carries the access token when protected. */
  preview_url: string | null
}

export interface PublicShareAssetsResponse {
  data: PublicShareAsset[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

/** Short-lived HMAC token proving a password-protected share was unlocked. */
export interface ShareAccessToken {
  access_token: string
  expires_at: string
}

// ─── Tokens ──────────────────────────────────────────────────────────────────

export interface SpaceToken {
  id: string
  name: string
  token: string
  abilities: string[]
  execution_count: number
  last_used_at: string | null
  expires_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface CreateSpaceTokenParams {
  name: string
  expires_at?: string | null
  execution_limit?: number | null
}

// ─── Data Sources ─────────────────────────────────────────────────────────────

export interface DataSource {
  id: string
  external_id?: string | null
  name: string
  slug: string
  type: string
  space_id: string
  schema: Record<string, unknown>
  settings: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface DataEntry {
  id: string
  external_id?: string | null
  data_source_id: string
  data: Record<string, unknown>
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

// ─── Automations ─────────────────────────────────────────────────────────────

export interface AutomationAction {
  id: string
  space_id: string
  name: string
  description: string | null
  type: string
  config: Record<string, unknown>
  is_active: boolean
  has_secrets: boolean
  secret_keys: string[]
  automations_count: number | null
  last_executed_at: string | null
  last_execution_status: string | null
  last_execution_error: string | null
  created_at: string | null
  updated_at: string | null
}

export interface CreateAutomationActionParams {
  name: string
  description?: string | null
  type: string
  config?: Record<string, unknown>
  secrets?: Record<string, string>
  is_active?: boolean
}

export interface UpdateAutomationActionParams extends Partial<CreateAutomationActionParams> {}

export interface Automation {
  id: string
  space_id: string
  action_id: string
  name: string
  description: string | null
  trigger_type: string | null
  trigger: Record<string, unknown> | null
  action: AutomationAction | null
  is_active: boolean
  execution_count: number
  execution_limit: number | null
  remaining_executions: number | null
  last_triggered_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface CreateAutomationParams {
  action_id: string
  name: string
  description?: string | null
  trigger_type?: string | null
  trigger?: Record<string, unknown> | null
  is_active?: boolean
  execution_limit?: number | null
}

export interface UpdateAutomationParams extends Partial<CreateAutomationParams> {}

export interface AutomationExecution {
  id: string
  automation_id: string
  automation: Automation | null
  status: string
  context: Record<string, unknown> | null
  result: Record<string, unknown> | null
  error: string | null
  duration: number | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface GetAutomationExecutionsParams extends PaginationParams {
  automation_id?: string
  status?: string
  created_after?: string
  [key: string]: unknown
}

export interface AutomationStatsParams {
  from?: string
  to?: string
  interval?: string
  [key: string]: unknown
}

// ─── AI ──────────────────────────────────────────────────────────────────────

export interface AiModel {
  id: string
  name: string
  model: string
  tags: string[]
  token_multiplier: number | null
  is_free: boolean
  is_active: boolean
  description: string | null
  provider: string
  created_at: string | null
  updated_at: string | null
}

export interface AvailableModelsParams {
  provider?: string
  capability?: string
  min_context_window?: number
  max_context_window?: number
  supports_streaming?: boolean
  model_type?:
    | 'text'
    | 'image'
    | 'audio'
    | 'video'
    | 'multimodal'
    | 'embedding'
    | 'code'
    | 'chat'
    | 'completion'
    | 'translation'
    | 'summarization'
    | 'other'
  [key: string]: unknown
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export interface ProviderNote {
  id: string
  title: string
  icon: string | null
  url: string | null
  color: string | null
  content: string | null
  is_pinned: boolean
  created_at: string | null
  updated_at: string | null
}

export interface CreateProviderNoteParams {
  title: string
  icon?: string | null
  url?: string | null
  color?: string | null
  content?: string | null
  is_pinned?: boolean
}

export interface UpdateProviderNoteParams extends Partial<CreateProviderNoteParams> {}

// ─── Import & Export ─────────────────────────────────────────────────────────

export type ImportExportFormat = 'csv' | 'excel' | 'json' | 'xliff' | 'yaml'

/** Imported entries land as drafts unless `publish` is requested. */
export type ContentImportMode = 'draft' | 'publish'

/** `addition` merges into the existing set; `replacement` prunes what is absent. */
export type IconImportMode = 'addition' | 'replacement'

export interface ExportContentDataParams extends Partial<GetContentsParams> {
  as: ImportExportFormat
}

export interface ImportContentDataParams {
  /** File contents. A `Buffer`/`Blob`/`File` switches the request to multipart. */
  file: unknown
  /** Defaults to `draft`. `publish` additionally requires publish rights. */
  import_mode?: ContentImportMode
  create_missing?: boolean
  [key: string]: unknown
}

export interface ImportIconDataParams {
  /** An Iconify icon-set JSON file; max 5000 icons. */
  file: unknown
  /** Defaults to `addition`. */
  import_mode?: IconImportMode
  [key: string]: unknown
}

export interface ImportResultChange {
  field: string
  old: unknown
  new: unknown
}

/** The outcome of an import, reported per entry plus a summary. */
export interface ImportResult {
  successes: { id: string; key?: string; [key: string]: unknown }[]
  changes: { id: string; key?: string; changes: ImportResultChange[] }[]
  ignored_fields: string[]
  errors: { id?: string; message: string }[]
  /** Only populated by `replacement`-mode imports. */
  deleted: { id: string; key?: string }[]
  summary: {
    total_success: number
    total_changes: number
    total_errors: number
    total_deleted: number
  }
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface Notification {
  id: string
  /** Fully-qualified class name of the notification that produced this entry. */
  type: string
  /** Payload defined by the notification itself; shape varies by `type`. */
  data: Record<string, unknown>
  read_at: string | null
  created_at: string | null
}

export interface GetNotificationsParams extends PaginationParams {
  unread_only?: boolean
  type?: string
  [key: string]: unknown
}

// ─── Usage & Billing ─────────────────────────────────────────────────────────

/** One metered dimension of a space's plan quota. */
export interface UsageMetric {
  key: string
  unit: 'bytes' | 'count' | 'usd'
  used: number
  /** `null` when the plan places no limit on this metric. */
  limit: number | null
  unlimited: boolean
  percentage: number
  /** `false` when the figure could not be metered, in which case `used` is 0. */
  available: boolean
}

export interface SpaceUsage {
  storage: UsageMetric
  traffic: UsageMetric
  downloads: UsageMetric
  requests: UsageMetric
  ai: UsageMetric
  period: {
    start: string
    end: string
    resets_at: string
  }
}

/** Rolled-up usage for a closed billing period. */
export interface SubscriptionPeriodUsage {
  used: number | null
  limit: number | null
  percentage: number | null
}

export interface SubscriptionPeriod {
  id: string
  plan_id: string | null
  plan_name: string | null
  status: string
  price: number
  billing_period: string
  quotas: Record<string, unknown>
  started_at: string | null
  renews_at: string | null
  ended_at: string | null
  close_reason: string | null
  is_open: boolean
  /**
   * `used` is `null` for an open period whose rollup has not run yet — read
   * live figures from `spaces.getUsage()` instead.
   */
  usage: {
    storage: SubscriptionPeriodUsage
    traffic: SubscriptionPeriodUsage
    requests: SubscriptionPeriodUsage
    ai: SubscriptionPeriodUsage
  }
}

export type UsageTimeseriesMetric = 'traffic' | 'requests'

export interface UsageTimeseries {
  metric: UsageTimeseriesMetric
  start: string | null
  end: string
  /** Day-buckets: bytes for `traffic`, request count for `requests`. */
  points: { date: string; value: number }[]
}

export interface Invoice {
  id: string
  total: number
  total_formatted: string
  currency: string
  status: string
  status_formatted: string
  refunded: boolean
  card_brand: string | null
  card_last_four: string | null
  billing_reason: string
  invoice_url: string
  created_at: string
}

export interface UpdateSpaceOnboardingParams {
  dismissed: boolean
}

// ─── Authorization ───────────────────────────────────────────────────────────

/**
 * The caller's effective permissions. Passing `team_id` or `space_id` narrows
 * the answer to that context and leaves `teams`/`spaces` empty.
 */
export interface Authorization {
  user_id: string
  is_root: boolean
  teams: { id: string; name: string }[]
  spaces: { id: string; name: string; team_id: string }[]
  /** Only populated when `team_id` was supplied. */
  team: {
    id: string
    role_keys: string[]
    abilities: string[]
  } | null
  /** Only populated when `space_id` was supplied. */
  space: {
    id: string
    team_role_keys: string[]
    space_role_key: string | null
    abilities: string[]
    plan: unknown | null
  } | null
  /** Assignable role catalogue for the resolved context. */
  roles: {
    team: Role[]
    space: Role[]
  }
}

export interface GetAuthorizationParams {
  team_id?: string
  space_id?: string
  [key: string]: unknown
}

// ─── Space Blueprints ────────────────────────────────────────────────────────

/** The trimmed blueprint shape returned by the available-blueprints catalogue. */
export interface SpaceBlueprintListItem {
  id: string
  name: string
  icon: string | null
  color: string | null
  description: string | null
  team_id: string | null
  team?: Team
  created_by?: SimpleUser
  created_at: string | null
  updated_at: string | null
}

export interface GetSpaceBlueprintsParams extends PaginationParams {
  name?: string
  team_id?: string
  created_by_id?: string
  /** Range filter, `start...end` (either side optional). */
  created_at?: string
  updated_at?: string
  sort?: string
  [key: string]: unknown
}

/**
 * The public view of an invite, safe to read before signing in. The invitee's
 * address is exposed only as `email_hash` (sha256 of the email).
 */
export interface PublicInvite {
  id: string
  space?: { name: string; slug: string; icon: string | null }
  team?: { name: string }
  inviter?: SimpleUser
  email_hash: string
  role: string
  message: string | null
  expires_at: string | null
  status: 'pending' | 'accepted' | 'expired'
}
