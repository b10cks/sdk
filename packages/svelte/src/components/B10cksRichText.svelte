<script lang="ts">
  import type {
    ComponentProps as SvelteComponentProps,
    HTMLAttributes,
  } from 'svelte/elements'
  import {
    renderRichText,
    type RichTextDocument,
    type RichTextRenderOptions,
  } from '@b10cks/richtext'

  type HtmlTag = keyof SvelteHTMLElements

  type ElementAttributes<TTag extends HtmlTag> = Omit<
    SvelteComponentProps<TTag>,
    'children' | 'tag' | 'document'
  >

  export interface B10cksRichTextProps<TTag extends HtmlTag = 'div'>
    extends RichTextRenderOptions {
    document?: RichTextDocument | null
    html?: string | null
    tag?: TTag
  }

  let {
    document = null,
    html = null,
    tag = 'div' as HtmlTag,
    extensions,
    ...restProps
  }: B10cksRichTextProps & HTMLAttributes<HTMLElement> = $props()

  const resolvedHtml = $derived(
    html ?? renderRichText(document, { extensions })
  )
</script>

<svelte:element this={tag} {...restProps}>
  {@html resolvedHtml}
</svelte:element>
