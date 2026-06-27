<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
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
  }

  let {
    document = null,
    html = null,
    tag = 'div',
    extensions,
    internalLinkHandler,
    placeholderHandler,
    ...restProps
  }: B10cksRichTextProps & HTMLAttributes<HTMLElement> = $props()

  const resolvedHtml = $derived(
    html ?? renderRichText(document, { extensions, internalLinkHandler, placeholderHandler })
  )
</script>

<svelte:element this={tag} {...restProps}>
  {@html resolvedHtml}
</svelte:element>
