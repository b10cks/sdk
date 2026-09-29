import { previewBridge, type IBContentBlock } from '@b10cks/client'
import { Component, type CSSProperties, type ReactNode } from 'react'

import { useEditable } from '../preview'

type Block = IBContentBlock<string>

interface BlockErrorBoundaryProps {
  block: Block
  children: ReactNode
}

interface BlockErrorBoundaryState {
  block: Block
  failed: boolean
  error: unknown
}

/**
 * Keeps one broken block from taking down the page. In preview mode the block
 * is replaced by a selectable placeholder naming it, so editors can fix or
 * delete it; otherwise it renders nothing. React itself logs caught errors.
 */
export class BlockErrorBoundary extends Component<
  BlockErrorBoundaryProps,
  BlockErrorBoundaryState
> {
  override state: BlockErrorBoundaryState = { block: this.props.block, failed: false, error: null }

  static getDerivedStateFromError(error: unknown): Partial<BlockErrorBoundaryState> {
    return { failed: true, error }
  }

  /** A new block object, e.g. after an edit in the editor, gets another try. */
  static getDerivedStateFromProps(
    props: BlockErrorBoundaryProps,
    state: BlockErrorBoundaryState
  ): Partial<BlockErrorBoundaryState> | null {
    return props.block === state.block ? null : { block: props.block, failed: false, error: null }
  }

  override render() {
    if (!this.state.failed) return this.props.children
    return previewBridge.isInPreviewMode() ? (
      <BlockError
        block={this.props.block}
        error={this.state.error}
      />
    ) : null
  }
}

const ERROR_STYLE: CSSProperties = {
  padding: '8px 12px',
  border: '1px dashed #dc2626',
  borderRadius: 4,
  color: '#b91c1c',
  background: '#fef2f2',
  font: '13px/1.4 system-ui, sans-serif',
}

function BlockError({ block, error }: { block: Block; error: unknown }) {
  const ref = useEditable<HTMLDivElement>(block.id, block.block)
  return (
    <div
      ref={ref}
      data-b10cks-error=""
      style={ERROR_STYLE}
    >
      Block "{block.block || 'unknown'}" failed to render:{' '}
      {error instanceof Error ? error.message : String(error)}
    </div>
  )
}
