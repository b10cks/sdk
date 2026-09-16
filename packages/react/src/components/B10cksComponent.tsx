import { previewBridge, type IBContentBlock } from '@b10cks/client'
import { type ComponentType, type HTMLAttributes, useEffect } from 'react'

import { B10cksFallback } from './B10cksFallback'

type BlockWithType = IBContentBlock<string> & Record<string, unknown>
type BlockComponent<TBlock extends BlockWithType> = ComponentType<
  { block: TBlock } & Record<string, unknown>
>

export interface B10cksComponentProps<
  TBlock extends BlockWithType = BlockWithType,
> extends HTMLAttributes<HTMLDivElement> {
  block: TBlock
  components: Record<string, BlockComponent<TBlock>>
  fallback?: BlockComponent<TBlock>
  /**
   * Render `id={block.id}` on the wrapper so internal links with an `anchor` can jump to the
   * block. Default true. An `id` prop wins.
   */
  anchor?: boolean
}

export function B10cksComponent<TBlock extends BlockWithType = BlockWithType>({
  block,
  components,
  fallback: FallbackComponent,
  anchor = true,
  ...htmlAttributes
}: B10cksComponentProps<TBlock>) {
  const blockType = block.block || ''
  const componentName = toPascalCase(blockType)
  const blockComponent =
    components[blockType] || components[componentName] || components[componentName.toLowerCase()]
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
      <Renderer block={block} />
    </div>
  )
}

function toPascalCase(name: string): string {
  return name
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}
