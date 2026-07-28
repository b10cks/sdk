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
  | `sitemaps/${string}`
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

/**
 * WCAG contrast stats derived from an asset's dominant color, so consumers
 * can pick accessible overlay/text colors for content rendered on top of
 * the image without recomputing contrast client-side.
 */
export interface B10cksAssetA11y {
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
export interface B10cksAssetThumbnail {
  path: string
  /** Storage-prefixed path, present when delivered via the API. */
  full_path?: string
  /** Frame position in seconds. */
  position: number
  /** Frame position as `mm:ss` / `hh:mm:ss`. */
  position_formatted: string
  /** Dominant color of this frame as `#rrggbb`. */
  dominant_color?: string
}

/** EXIF subset extracted from JPEG/TIFF uploads. */
export interface B10cksAssetExif {
  make?: string | null
  model?: string | null
  exposure?: string | number | null
  aperture?: string | number | null
  iso?: string | number | null
  dateTaken?: string | null
  orientation?: number | null
}

/** ID3-style tags extracted from audio uploads. */
export interface B10cksAssetMediaTags {
  title?: string | null
  artist?: string | null
  album?: string | null
  year?: string | null
  genre?: string | null
}

/**
 * Metadata extracted from an asset at upload time. Which fields are present
 * depends on the file type (image, video, audio, document); content delivery
 * additionally whitelists to `width`, `height`, `duration`, `thumbnails`,
 * `dominant_color` and `a11y`. Custom metadata supplied at upload is carried
 * through via the index signature.
 */
export interface B10cksAssetMetadata {
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
  a11y?: B10cksAssetA11y
  exif?: B10cksAssetExif
  /** Duration in seconds (video/audio). */
  duration?: number
  fps?: number
  bitrate?: number
  codec?: string
  thumbnails?: B10cksAssetThumbnail[]
  channels?: number
  sample_rate?: number
  tags?: B10cksAssetMediaTags
  [key: string]: unknown
}

/** An asset field value as delivered inside content payloads. */
export interface B10cksAssetValue {
  type: 'asset'
  id: string
  url?: string
  full_path?: string
  filename?: string
  extension?: string
  mime_type?: string
  size?: number
  metadata?: B10cksAssetMetadata
  data?: Record<string, unknown> & { focus?: { x: number; y: number } }
  [key: string]: unknown
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
