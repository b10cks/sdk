import { attachRichTextField, type EditableRichTextField } from '@b10cks/client'
import type { RichTextDocument, RichTextHtmlOptions, RichTextRenderer } from '@b10cks/richtext'
import { createRichTextHtmlRenderer, renderRichText } from '@b10cks/richtext'
import { type HTMLAttributes, type ReactElement, useEffect, useRef, useState } from 'react'

export type { EditableRichTextField } from '@b10cks/client'
export type { RichTextDocument, RichTextHtmlOptions } from '@b10cks/richtext'

export interface B10cksRichTextProps extends HTMLAttributes<HTMLDivElement> {
  document: RichTextDocument | null | undefined
  html?: string | null
  options?: RichTextHtmlOptions
  /**
   * The field this document comes from, e.g. `{ id: block.id, path: ['body'] }`,
   * so editors can edit it in place in the live preview. Needs a client
   * component. Has no effect outside preview mode.
   */
  editable?: EditableRichTextField
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

/** Hook-free without `editable`, so it renders in React Server Components. */
export function B10cksRichText({
  document,
  html,
  options,
  editable,
  ...htmlAttributes
}: B10cksRichTextProps): ReactElement {
  const resolvedHtml = html ?? renderRichTextHtml(document, options)

  if (editable) {
    return (
      <EditableRichText
        {...htmlAttributes}
        document={document}
        html={resolvedHtml}
        options={options}
        field={editable}
      />
    )
  }

  return (
    <div
      {...htmlAttributes}
      dangerouslySetInnerHTML={{ __html: resolvedHtml }}
    />
  )
}

interface EditableRichTextProps extends HTMLAttributes<HTMLDivElement> {
  document: RichTextDocument | null | undefined
  html: string
  options?: RichTextHtmlOptions
  field: EditableRichTextField
}

function EditableRichText({
  document,
  html,
  options,
  field,
  ...htmlAttributes
}: EditableRichTextProps) {
  const ref = useRef<HTMLDivElement>(null)
  const handle = useRef<ReturnType<typeof attachRichTextField> | null>(null)
  const latest = useRef({ document, html, options })
  // While editing, the editor owns the element; React keeps the HTML it had.
  const [frozenHtml, setFrozenHtml] = useState<string | null>(null)

  useEffect(() => {
    latest.current = { document, html, options }
    handle.current?.update(document)
  }, [document, html, options])

  const { id, path, label } = field
  const pathKey = path.join('\u0000')
  useEffect(() => {
    if (!ref.current) return
    const attached = attachRichTextField(ref.current, {
      id,
      path,
      label,
      document: latest.current.document,
      render: latest.current.options,
      onEditingChange: (editing) => setFrozenHtml(editing ? latest.current.html : null),
    })
    handle.current = attached
    return () => {
      attached.destroy()
      handle.current = null
    }
    // Re-attach only when the addressed field changes, not for a new `path` array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, pathKey, label])

  return (
    <div
      {...htmlAttributes}
      ref={ref}
      dangerouslySetInnerHTML={{ __html: frozenHtml ?? html }}
    />
  )
}

export default B10cksRichText
