import {
  renderRichText as renderBaseRichText,
  renderRichTextAsText as renderBaseRichTextAsText,
  createRichTextTextRenderer,
  type RichTextDocument,
  type RichTextHtmlOptions,
  type RichTextInternalLinkAttrs,
  type RichTextInternalLinkHandler,
  type RichTextPlaceholderHandler,
  type RichTextTextOptions,
  type RichTextTextRenderer,
} from '@b10cks/richtext'
import { computed, defineComponent, h, type PropType } from 'vue'

export type RichTextRenderOptions = RichTextHtmlOptions
export type { RichTextDocument, RichTextInternalLinkAttrs, RichTextInternalLinkHandler, RichTextTextOptions, RichTextTextRenderer }
export { createRichTextTextRenderer }

export interface B10cksRichTextProps extends RichTextRenderOptions {
  document: RichTextDocument | null | undefined
  tag?: keyof HTMLElementTagNameMap | string
  class?: string
  html?: string | null
}

export function renderRichText(
  document: RichTextDocument | null | undefined,
  options: RichTextRenderOptions = {}
): string {
  return renderBaseRichText(document as RichTextDocument | null | undefined, options)
}

export function renderRichTextAsText(
  document: RichTextDocument | null | undefined,
  options: RichTextTextOptions = {}
): string {
  return renderBaseRichTextAsText(document, options)
}

export const B10cksRichText = defineComponent({
  name: 'B10cksRichText',
  props: {
    document: {
      type: Object as PropType<RichTextDocument | null | undefined>,
      required: false,
      default: null,
    },
    tag: {
      type: String,
      required: false,
      default: 'div',
    },
    class: {
      type: String,
      required: false,
      default: undefined,
    },
    html: {
      type: String,
      required: false,
      default: null,
    },
    /** @deprecated No-op. The custom renderer does not use TipTap extensions. */
    extensions: {
      type: Array as PropType<unknown[]>,
      required: false,
      default: undefined,
    },
    internalLinkHandler: {
      type: Function as PropType<RichTextInternalLinkHandler>,
      required: false,
      default: undefined,
    },
    placeholderHandler: {
      type: Function as PropType<RichTextPlaceholderHandler>,
      required: false,
      default: undefined,
    },
    allowedSchemes: {
      type: Array as PropType<string[]>,
      required: false,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    const html = computed(
      () =>
        props.html ??
        renderRichText(props.document, {
          internalLinkHandler: props.internalLinkHandler,
          placeholderHandler: props.placeholderHandler,
          allowedSchemes: props.allowedSchemes,
        })
    )

    return () =>
      h(props.tag, {
        ...attrs,
        class: props.class ?? attrs.class,
        innerHTML: html.value,
      })
  },
})

