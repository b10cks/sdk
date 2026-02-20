import type { IBContentBlock } from '@b10cks/client'
import type { ReactNode } from 'react'

type BlockWithType = IBContentBlock<string> & Record<string, unknown>

export interface B10cksFallbackProps {
  block: BlockWithType
  message?: ReactNode
}

export function B10cksFallback({ block, message }: B10cksFallbackProps) {
  return <div>{message ?? `Component for block type "${block.block || 'unknown'}" not found.`}</div>
}
