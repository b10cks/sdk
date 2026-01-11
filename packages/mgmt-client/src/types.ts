export interface ClientConfig {
  baseUrl: string
  token: string
  timeout?: number
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

export interface User {
  id: string
  email: string
  firstname: string | null
  lastname: string | null
  avatar: string | null
  created_at: string
  updated_at: string
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
  name: string
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
  name: string
  slug: string
  icon?: string | null
  color?: string | null
  description?: string | null
  settings?: Record<string, unknown> | null
  state?: 'active' | 'archived' | 'draft'
}

export interface UpdateSpaceIconParams {
  icon: string
}

export interface Block {
  id: string
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
  name: string
  slug: string
  color: string | null
  space_id: string
  created_at: string
  updated_at: string
}

export interface BlockFolder {
  id: string
  name: string
  parent_id: string | null
  space_id: string
  created_at: string
  updated_at: string
}

export interface Content {
  id: string
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

export interface GetContentsParams extends PaginationParams {
  created_after?: string
  updated_after?: string
  published_after?: string
  search?: string
  block_id?: string | string[]
  published?: boolean
  [key: string]: unknown
}

export interface ContentVersion {
  id: string
  content_id: string
  version: number
  data: Record<string, unknown>
  metadata: Record<string, unknown> | null
  created_by: string
  created_at: string
}

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

export interface Asset {
  id: string
  name: string
  filename: string
  mime_type: string
  size: number
  url: string
  folder_id: string | null
  space_id: string
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface AssetFolder {
  id: string
  name: string
  parent_id: string | null
  space_id: string
  created_at: string
  updated_at: string
}

export interface AssetTag {
  id: string
  name: string
  slug: string
  color: string | null
  space_id: string
  created_at: string
  updated_at: string
}

export interface SpaceToken {
  id: string
  name: string
  token: string
  space_id: string
  expires_at: string | null
  execution_limit: number | null
  executions: number
  last_used_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateSpaceTokenParams {
  name: string
  expires_at?: string | null
  execution_limit?: number | null
}

export interface DataSource {
  id: string
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
  data_source_id: string
  data: Record<string, unknown>
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
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
