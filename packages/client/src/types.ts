import type { FetchClient } from './index.ts'

export interface IBResponse<T> {
  data: T
  rv?: string | number
}

export interface IBCollectionResponse<T> {
  data: T[]
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

export interface IBContent<
  Content = IBContentBlock<string> & { [index: string]: unknown },
> {
  id: string
  slug: string
  name: string
  content: Content
  type: string
  parent_id: string | null
  full_slug: string
  language_iso: string
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface IBContentBlock<T extends string> {
  id?: string;
  block?: T;
  _editable?: string;
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
  updated_at: string
}

export interface IBContentQueryParams extends IBBaseQueryParams {
  slug?: string
  full_slug?: string
  language_iso?: string
  type?: string
  parent_id?: string
}

export interface B10cksApiClientOptions {
  baseUrl: string
  token: string
  version?: 'draft' | 'published'
  fetchClient: FetchClient
}