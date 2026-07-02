export type FetchClient = (
  input: URL | string | RequestInfo,
  init?: RequestInit
) => Promise<unknown>

export type Endpoint =
  | 'blocks'
  | `blocks/${string}`
  | 'contents'
  | `contents/${string}`
  | `datasources/${string}/entries`
  | 'datasources'
  | 'redirects'
  | 'search'
  | 'sitemap'
  | 'spaces/me'

export interface IBResponse<T> {
  data: T
  rv?: string | number
}

export interface IBCollectionResponse<T> {
  data: T[]
  rv?: string | number
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
}

export interface IBMetaLink {
  url: string | null
  label: string | null
  active: boolean
}

export interface IBMeta {
  current_page: number
  from: number
  last_page: number
  links: IBMetaLink[]
  path: string
  per_page: number
  to: number
  total: number
}

export interface IBSeoMeta {
  robots: string | null
  canonical: string | null
}

export interface IBSitemapEntry {
  id: string
  name: string
  full_slug: string
  language_iso: string
  meta: IBSeoMeta
  published_at: string | null
}

export interface IBContentRelation {
  id: string
  name: string
  slug: string
  full_slug: string
  language_iso: string
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface IBContent<Content = IBContentBlock<string> & { [index: string]: unknown }> {
  id: string
  name: string
  slug: string
  block: string
  parent_id: string | null
  full_slug: string
  content: Content
  language_iso: string
  translations: IBContentRelation[]
  published_at: string | null
  first_published_at: string | null
  created_at: string
  updated_at: string
}

export interface IBContentBlock<T extends string> {
  id?: string
  block?: T
}

export interface IBDataEntry {
  id: string
  key: string
  value: string
  updated_at: string
}

export interface IBPaginationParams {
  page?: number
  per_page?: number
}

export interface IBSortParams {
  sort?: string
}

export interface IBBaseQueryParams extends IBPaginationParams, IBSortParams {
  vid?: string
  version?: string
  token: string
}

export interface IBBlock {
  id: string
  name: string
  slug: string
  schema: string
  tags: string[] | null
  created_at: string
  updated_at: string
}

export interface IBDataSource {
  id: string
  name: string
  slug: string
  dimensions: string[] | null
  created_at: string
  updated_at: string
}

export interface IBSpace {
  id: string
  name: string
  rv: string | number
  updated_at: string
}

export interface IBRedirect {
  source: string
  target: string
  status_code: number
}

export interface IBContentQueryParams extends IBBaseQueryParams {
  slug?: string
  full_slug?: string
  language_iso?: string
  type?: string
  parent_id?: string | string[]
}

// ─── Content Model Types ───────────────────────────────────────────────────

export type B10cksLink =
  | {
      type: 'url'
      url: string
      anchor?: string
      target?: '_self' | '_blank' | '_parent' | '_top'
      rel?: string
    }
  | {
      type: 'email'
      email: string
      subject?: string
      body?: string
      cc?: string
      bcc?: string
    }
  | {
      type: 'internal'
      url: string
      title: string
      content: string
      params?: string
      anchor?: string
      target?: '_self' | '_blank' | '_parent' | '_top'
    }
  | {
      type: 'asset'
      id: string
    }

export interface B10cksApiClientOptions {
  baseUrl: string
  token: string
  rv?: string | number
  version?: string | 'draft' | 'published'
  fetchClient?: FetchClient
  getRv?: () => string | number
  setRv?: (value: string | number) => void
  /**
   * Per-request timeout in milliseconds. When exceeded the request is aborted
   * and rejected with an {@link ApiError}. Defaults to no timeout.
   */
  timeoutMs?: number
  /**
   * Number of retry attempts for transient failures (network errors, HTTP 429
   * and 5xx) on idempotent GET requests, using exponential backoff. Defaults
   * to 0 (no retries).
   */
  retries?: number
  /**
   * Maximum number of pages fetched concurrently by `getAll`. Defaults to 6.
   */
  maxConcurrency?: number
}

// ─── Advanced Filter Types ──────────────────────────────────────────────────

export type StringFilter =
  | string
  | { eq: string }
  | { neq: string }
  | { in: string[] }
  | { '!in': string[] }
  | { like: string }
  | { '!like': string }
  | { '^like': string }
  | { 'like$': string }
  | { null: true }
  | { '!null': true }

export type IdFilter =
  | string
  | { eq: string }
  | { neq: string }
  | { in: string[] }
  | { '!in': string[] }
  | { null: true }
  | { '!null': true }

export type DateFilter =
  | string
  | { eq: string }
  | { neq: string }
  | { gte: string }
  | { gt: string }
  | { lte: string }
  | { lt: string }
  | { between: [string, string] }
  | { null: true }
  | { '!null': true }

export interface IBContentFilter {
  language?: string
  language_iso?: string
  content_type?: string
  parent_id?: IdFilter
  id?: IdFilter
  canonical_id?: IdFilter
  canonical_parent_id?: IdFilter
  include_fallback?: boolean
  published_at?: DateFilter
  updated_at?: DateFilter
  created_at?: DateFilter
}

export type ContentSortField = 'published_at' | 'updated_at' | 'created_at' | `content.${string}`
export type ContentSortItem = ContentSortField | `-${ContentSortField}`

export interface IBGetContentsParams extends Omit<IBContentQueryParams, 'token' | 'sort'> {
  filter?: IBContentFilter
  sort?: string | ContentSortItem[]
}

export interface IBBlockFilter {
  name?: string
  slug?: string
  folder_id?: string
  is_nestable?: boolean
  is_root?: boolean
  tags?: string | string[]
  created_at?: DateFilter
  updated_at?: DateFilter
}

export interface IBGetBlocksParams extends Omit<IBBaseQueryParams, 'token'> {
  filter?: IBBlockFilter
}

export interface IBRedirectFilter {
  source?: StringFilter
  target?: StringFilter
  status_code?: string | number
  q?: string
}

export interface IBGetRedirectsParams extends Omit<IBBaseQueryParams, 'token'> {
  filter?: IBRedirectFilter
}

export interface IBSearchResult<Content = IBContentBlock<string> & { [index: string]: unknown }>
  extends IBContent<Content> {
  relevance_score: number
}

export interface IBSearchParams {
  q: string
  limit?: number
  offset?: number
  language?: string
}

export interface IBSearchResponse<Content = IBContentBlock<string> & { [index: string]: unknown }> {
  meta: {
    query: string
    total: number
    limit: number
    offset: number
  }
  data: IBSearchResult<Content>[]
}

export interface IBRedirectLookupResult {
  target: string
  status_code: number
}
