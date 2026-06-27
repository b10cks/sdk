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
}

export {
  B10cksRichText,
  renderRichText,
  type B10cksRichTextProps,
  type RichTextDocument,
  type RichTextRenderOptions,
} from '@b10cks/vue/rich-text'
