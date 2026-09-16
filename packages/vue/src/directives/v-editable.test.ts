import { afterEach, describe, expect, it, vi } from 'vitest'
// @vitest-environment happy-dom
import {
  type ComponentPublicInstance,
  createApp,
  createSSRApp,
  type Directive,
  type DirectiveArguments,
  defineComponent,
  h,
  nextTick,
  shallowRef,
  withDirectives,
} from 'vue'
import { ssrGetDirectiveProps, ssrRenderAttrs, renderToString } from 'vue/server-renderer'

import { EditableDirective } from './v-editable'

type Block = { id?: string }

const directive = EditableDirective as Directive
const BLOCK_ID = '01kh6h981yh1s5z7s3f80wmrw2'

function editable(block: Block, props: Record<string, unknown> = {}, noanchor = false) {
  const binding: DirectiveArguments[number] = noanchor
    ? [directive, block, undefined, { noanchor: true }]
    : [directive, block]
  return withDirectives(h('section', props, 'block'), [binding])
}

/** Mirrors the code the SSR template compiler emits: the directive cannot see the element's props. */
function compiledSsr(block: Block, ownId?: string) {
  return defineComponent({
    ssrRender(ctx: ComponentPublicInstance, push: (html: string) => void) {
      const attrs = {
        ...(ownId ? { id: ownId } : {}),
        ...ssrGetDirectiveProps(ctx, directive, block),
      }
      push(`<section${ssrRenderAttrs(attrs)}>block</section>`)
    },
  })
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('v-editable anchors', () => {
  describe('SSR', () => {
    it('renders the block id', async () => {
      expect(await renderToString(createSSRApp(() => editable({ id: BLOCK_ID })))).toBe(
        `<section id="${BLOCK_ID}">block</section>`
      )
      expect(await renderToString(createSSRApp(compiledSsr({ id: BLOCK_ID })))).toBe(
        `<section id="${BLOCK_ID}">block</section>`
      )
    })

    it('keeps the developer id', async () => {
      const html = await renderToString(
        createSSRApp(() => editable({ id: BLOCK_ID }, { id: 'own' }))
      )
      expect(html).toBe('<section id="own">block</section>')
    })

    it('skips the id with .noanchor or without a block id', async () => {
      expect(await renderToString(createSSRApp(() => editable({ id: BLOCK_ID }, {}, true)))).toBe(
        '<section>block</section>'
      )
      expect(await renderToString(createSSRApp(() => editable({})))).toBe(
        '<section>block</section>'
      )
    })
  })

  describe('client', () => {
    function mount(render: () => ReturnType<typeof h>) {
      const root = document.createElement('div')
      document.body.append(root)
      createApp(render).mount(root)
      return root
    }

    it('sets the block id', () => {
      const root = mount(() => editable({ id: BLOCK_ID }))
      expect(root.querySelector('section')?.id).toBe(BLOCK_ID)
    })

    it('keeps the developer id', () => {
      const root = mount(() => editable({ id: BLOCK_ID }, { id: 'own' }))
      expect(root.querySelector('section')?.id).toBe('own')
    })

    it('skips the id with .noanchor or without a block id', () => {
      expect(
        mount(() => editable({ id: BLOCK_ID }, {}, true))
          .querySelector('section')
          ?.hasAttribute('id')
      ).toBe(false)
      expect(
        mount(() => editable({}))
          .querySelector('section')
          ?.hasAttribute('id')
      ).toBe(false)
    })

    it('follows block id changes', async () => {
      const block = shallowRef<Block>({ id: BLOCK_ID })
      const section = mount(() => editable(block.value)).querySelector('section')

      block.value = { id: '01kh6h981yh1s5z7s3f80wmrw3' }
      await nextTick()
      expect(section?.id).toBe('01kh6h981yh1s5z7s3f80wmrw3')

      block.value = {}
      await nextTick()
      expect(section?.hasAttribute('id')).toBe(false)
    })

    it('hydrates server output without a mismatch', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})

      async function hydrate(
        server: Parameters<typeof createSSRApp>[0],
        client: () => ReturnType<typeof h>
      ) {
        const root = document.createElement('div')
        document.body.append(root)
        root.innerHTML = await renderToString(createSSRApp(server))
        createSSRApp(client).mount(root)
        return root.querySelector('section')
      }

      const plain = () => editable({ id: BLOCK_ID })
      expect((await hydrate(plain, plain))?.id).toBe(BLOCK_ID)

      // A compiled template renders the block id over the developer id; hydration restores it.
      const own = await hydrate(compiledSsr({ id: BLOCK_ID }, 'own'), () =>
        editable({ id: BLOCK_ID }, { id: 'own' })
      )
      expect(own?.id).toBe('own')

      expect([...warn.mock.calls, ...error.mock.calls].flat().join(' ')).not.toContain('mismatch')
    })
  })
})
