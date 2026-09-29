import type { IBContentBlock } from '@b10cks/client'
import type { ReactNode } from 'react'

export interface B10cksFallbackProps {
  block: IBContentBlock<string>
  message?: ReactNode
}

export function B10cksFallback({ block, message }: B10cksFallbackProps) {
  return <div>{message ?? `Component for block type "${block.block || 'unknown'}" not found.`}</div>
}
