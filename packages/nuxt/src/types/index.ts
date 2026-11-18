export interface ModuleOptions {
  accessToken: string
  componentsDir: string
  apiUrl: string
  /**
   * Offset applied when a selected block is scrolled into view, so selection
   * clears a fixed app header. A number is pixels; strings are used verbatim.
   * Can also be set in CSS via `--b10cks-scroll-offset`.
   */
  scrollOffset?: number | string
  /** Editor origins allowed to drive the preview bridge. */
  allowedOrigins?: string[]
  /** Timeout per API request attempt in milliseconds, including reading the body. Default none. */
  timeoutMs?: number
  /** Retries for network errors, timeouts, 429 and 5xx on GET requests. Default 0. */
  retries?: number
  /** Pages fetched at once by `allPages` requests. Default 6. */
  maxConcurrency?: number
  /**
   * Answer requests whose path has a b10cks redirect, in a server middleware.
   * The list is fetched on the server, kept per instance for `maxAge` seconds
   * (default 60) and never serialised into a page. On by default.
   */
  redirects?: boolean | { maxAge?: number }
}

/** Public runtime config injected by the module under `runtimeConfig.public.b10cks`. */
export interface B10cksPublicRuntimeConfig {
  accessToken: string
  apiUrl: string
  scrollOffset?: number | string
  allowedOrigins?: string[]
  timeoutMs?: number
  retries?: number
  maxConcurrency?: number
  /** Whether the server middleware answers b10cks redirects. */
  redirects: boolean
  /** Seconds the server keeps the redirect list before it fetches it again. */
  redirectsMaxAge: number
}

declare module '@nuxt/schema' {
  interface PublicRuntimeConfig {
    b10cks: B10cksPublicRuntimeConfig
  }
}

export {
  B10cksRichText,
  isRichTextEmpty,
  renderRichText,
  type B10cksRichTextProps,
  type RichTextDocument,
  type RichTextRenderOptions,
} from '@b10cks/vue/rich-text'
