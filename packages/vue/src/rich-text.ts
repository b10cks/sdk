import {
  attachRichTextField,
  type EditableRichTextField,
  type RichTextFieldHandle,
} from '@b10cks/client'
import {
  renderRichText as renderBaseRichText,
  renderRichTextAsText as renderBaseRichTextAsText,
  createRichTextTextRenderer,
  isRichTextEmpty,
  type RichTextDocument,
  type RichTextHtmlOptions,
  type RichTextInternalLinkAttrs,
  type RichTextInternalLinkHandler,
  type RichTextPlaceholderHandler,
  type RichTextTextOptions,
  type RichTextTextRenderer,
} from '@b10cks/richtext'
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  type PropType,
  ref,
  shallowRef,
  watch,
} from 'vue'

export type RichTextRenderOptions = RichTextHtmlOptions
export type {
  EditableRichTextField,
  RichTextDocument,
  RichTextInternalLinkAttrs,
  RichTextInternalLinkHandler,
  RichTextTextOptions,
  RichTextTextRenderer,
}
export { createRichTextTextRenderer, isRichTextEmpty }

export interface B10cksRichTextProps extends RichTextRenderOptions {
  document: RichTextDocument | null | undefined
  tag?: keyof HTMLElementTagNameMap | string
  class?: string
  html?: string | null
  /**
   * The field this document comes from, e.g. `{ id: block.id, path: ['body'] }`,
   * so editors can edit it in place in the live preview. Has no effect outside
   * preview mode.
   */
  editable?: EditableRichTextField
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
    editable: {
      type: Object as PropType<EditableRichTextField>,
      required: false,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    const renderOptions = computed<RichTextRenderOptions>(() => ({
      internalLinkHandler: props.internalLinkHandler,
      placeholderHandler: props.placeholderHandler,
      allowedSchemes: props.allowedSchemes,
    }))
    const html = computed(() => props.html ?? renderRichText(props.document, renderOptions.value))

    const el = ref<HTMLElement>()
    // While editing, the editor owns the element; Vue keeps the HTML it had.
    const frozenHtml = shallowRef<string | null>(null)
    let handle: RichTextFieldHandle | null = null

    const attach = () => {
      handle?.destroy()
      handle = null
      if (!el.value || !props.editable) return
      handle = attachRichTextField(el.value, {
        ...props.editable,
        document: props.document,
        render: renderOptions.value,
        onEditingChange: (editing) => {
          frozenHtml.value = editing ? html.value : null
        },
      })
    }

    onMounted(attach)
    // Re-attach only when the addressed field changes, not for a new `path` array.
    watch(
      () =>
        props.editable &&
        JSON.stringify([props.editable.id, props.editable.path, props.editable.label]),
      attach
    )
    watch(
      () => props.document,
      (document) => handle?.update(document)
    )
    onBeforeUnmount(() => handle?.destroy())

    return () =>
      h(props.tag, {
        ...attrs,
        ref: el,
        class: props.class ?? attrs.class,
        innerHTML: frozenHtml.value ?? html.value,
      })
  },
})
