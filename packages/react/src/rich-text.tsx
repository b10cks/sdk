import type {
  RichTextDocument,
  RichTextHtmlOptions,
  RichTextRenderer,
} from '@b10cks/richtext'
import { createRichTextHtmlRenderer, renderRichText } from '@b10cks/richtext'
import type { HTMLAttributes, ReactElement } from 'react'

export type { RichTextDocument, RichTextHtmlOptions } from '@b10cks/richtext'

export interface B10cksRichTextProps extends HTMLAttributes<HTMLDivElement> {
  document: RichTextDocument | null | undefined
  html?: string | null
  options?: RichTextHtmlOptions
}

export type B10cksRichTextRenderer = RichTextRenderer

export function createB10cksRichTextRenderer(
  options: RichTextHtmlOptions = {}
): B10cksRichTextRenderer {
  return createRichTextHtmlRenderer(options)
}

export function renderRichTextHtml(
  document: RichTextDocument | null | undefined,
  options: RichTextHtmlOptions = {}
): string {
  return renderRichText(document, options)
}

export function B10cksRichText({
  document,
  html,
  options,
  ...htmlAttributes
}: B10cksRichTextProps): ReactElement {
  const resolvedHtml = html ?? renderRichTextHtml(document, options)

  return <div {...htmlAttributes} dangerouslySetInnerHTML={{ __html: resolvedHtml }} />
}

export default B10cksRichText
