import { previewBridge, type IBContentBlock } from '@b10cks/client'
import { type ComponentType, type HTMLAttributes, useEffect } from 'react'

import { B10cksFallback } from './B10cksFallback'
import { BlockErrorBoundary } from './BlockErrorBoundary'

type BlockWithType = IBContentBlock<string> & Record<string, unknown>
type BlockComponent<TBlock> = ComponentType<{ block: TBlock } & Record<string, unknown>>

/**
 * Components keyed by block slug. With a union of generated block types, each
 * component gets its own block's type:
 *
 * ```ts
 * const components: B10cksComponents<B10cksBlock> = { hero_section: Hero }
 * ```
 */
export type B10cksComponents<TBlock extends IBContentBlock<string> = BlockWithType> = {
  [K in NonNullable<TBlock['block']>]?: BlockComponent<Extract<TBlock, { block?: K }>>
}

export interface B10cksComponentProps<
  TBlock extends IBContentBlock<string> = BlockWithType,
> extends HTMLAttributes<HTMLDivElement> {
  block: TBlock
  /** Looked up by block slug, then its PascalCase and lowercase forms. */
  components: B10cksComponents<TBlock>
  fallback?: BlockComponent<TBlock>
  /**
   * Render `id={block.id}` on the wrapper so internal links with an `anchor` can jump to the
   * block. Default true. An `id` prop wins.
   */
  anchor?: boolean
}

export function B10cksComponent<TBlock extends IBContentBlock<string> = BlockWithType>({
  block,
  components,
  fallback: FallbackComponent,
  anchor = true,
  ...htmlAttributes
}: B10cksComponentProps<TBlock>) {
  const blockType = block.block || ''
  const componentName = toPascalCase(blockType)
  // Typed per slug, so the component found by this block's slug takes this block.
  const lookup = components as Partial<Record<string, BlockComponent<TBlock>>>
  const blockComponent =
    lookup[blockType] || lookup[componentName] || lookup[componentName.toLowerCase()]
  const Renderer = blockComponent || FallbackComponent || B10cksFallback

  useEffect(() => {
    if (previewBridge.isInPreviewMode()) {
      previewBridge.init()
    }
  }, [])

  return (
    <div
      id={anchor && block.id ? block.id : undefined}
      {...htmlAttributes}
    >
      <BlockErrorBoundary block={block}>
        <Renderer block={block} />
      </BlockErrorBoundary>
    </div>
  )
}

function toPascalCase(name: string): string {
  return name
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}
