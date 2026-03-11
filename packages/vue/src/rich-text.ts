import {
  renderRichText as renderBaseRichText,
  type RichTextDocument,
  type RichTextExtensionOptions,
} from '@b10cks/richtext'
import { computed, defineComponent, h, type PropType } from 'vue'

export type RichTextRenderOptions = RichTextExtensionOptions
export type { RichTextDocument }

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
    extensions: {
      type: Array as PropType<RichTextRenderOptions['extensions']>,
      required: false,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    const html = computed(
      () =>
        props.html ??
        renderRichText(props.document, {
          extensions: props.extensions,
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

export default B10cksRichText
