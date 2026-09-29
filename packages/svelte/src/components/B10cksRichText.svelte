<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { untrack } from 'svelte'
  import {
    attachRichTextField,
    type EditableRichTextField,
    type RichTextFieldHandle,
  } from '@b10cks/client'
  import {
    renderRichText,
    type RichTextDocument,
    type RichTextExtensionOptions,
    type RichTextHtmlOptions,
  } from '@b10cks/richtext'

  export interface B10cksRichTextProps extends RichTextHtmlOptions, RichTextExtensionOptions {
    document?: RichTextDocument | null
    html?: string | null
    tag?: string
    /**
     * The field this document comes from, e.g. `{ id: block.id, path: ['body'] }`,
     * so editors can edit it in place in the live preview. Has no effect outside
     * preview mode.
     */
    editable?: EditableRichTextField
  }

  let {
    document = null,
    html = null,
    tag = 'div',
    extensions,
    internalLinkHandler,
    placeholderHandler,
    allowedSchemes,
    editable,
    ...restProps
  }: B10cksRichTextProps & HTMLAttributes<HTMLElement> = $props()

  const renderOptions = $derived({ internalLinkHandler, placeholderHandler, allowedSchemes })
  const resolvedHtml = $derived(html ?? renderRichText(document, { extensions, ...renderOptions }))

  let el: HTMLElement | undefined = $state()
  // While editing, the editor owns the element; Svelte keeps the HTML it had.
  let frozenHtml: string | null = $state(null)
  // The editor replaces the element's children, including Svelte's own markers,
  // so once it's done the element is rendered afresh.
  let generation = $state(0)
  let handle: RichTextFieldHandle | null = null

  // Re-attach only when the addressed field changes, not for a new `path` array.
  const fieldKey = $derived(editable && JSON.stringify([editable.id, editable.path, editable.label]))

  $effect(() => {
    const target = el
    if (!target || !fieldKey) return
    return untrack(() => {
      if (!editable) return
      const attached = attachRichTextField(target, {
        ...editable,
        document,
        render: renderOptions,
        onEditingChange: (editing) => {
          frozenHtml = editing ? resolvedHtml : null
          if (!editing) generation++
        },
      })
      handle = attached
      return () => {
        attached.destroy()
        handle = null
      }
    })
  })

  $effect(() => {
    handle?.update(document)
  })
</script>

{#key generation}
  <svelte:element this={tag} bind:this={el} {...restProps}>
    {@html frozenHtml ?? resolvedHtml}
  </svelte:element>
{/key}
