export interface ClientConfig {
  baseUrl: string
  token: string
  timeout?: number
  headers?: Record<string, string>
}

export interface RequestOptions {
  headers?: Record<string, string>
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

export interface Space {
  id: string
  name: string
  slug: string
  icon: string | null
  color: string | null
  description: string | null
  team_id: string | null
  state: 'active' | 'archived' | 'draft'
  settings: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface CreateSpaceParams {
  name: string
  slug: string
  icon?: string | null
  team_id?: string | null
  color?: string | null
  description?: string | null
  settings?: Record<string, unknown> | null
}

export interface UpdateSpaceParams {
  name?: string
  slug?: string
  icon?: string | null
  color?: string | null
  description?: string | null
  settings?: Record<string, unknown> | null
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
  schema: Record<string, unknown>
  settings: Record<string, unknown> | null
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

// ─── Contents ────────────────────────────────────────────────────────────────

export interface Content {
  id: string
  external_id?: string | null
  name: string
  slug: string
  block_id: string
  space_id: string
  data: Record<string, unknown>
  metadata: Record<string, unknown> | null
  published_at: string | null
  created_at: string
  updated_at: string
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
  settings?: Record<string, unknown> | null
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
  settings?: Record<string, unknown> | null
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
  metadata: Record<string, unknown> | null
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
