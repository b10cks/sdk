import type { Component } from 'svelte'

type Block = { id?: string; block?: string }

/**
 * Components keyed by block slug for `B10cksComponent`. With a union of
 * generated block types, each component gets its own block's type:
 *
 * ```ts
 * const components: B10cksComponents<B10cksBlock> = { hero_section: Hero }
 * ```
 */
export type B10cksComponents<TBlock extends Block = Block & Record<string, unknown>> = {
  [K in NonNullable<TBlock['block']>]?: Component<{ block: Extract<TBlock, { block?: K }> }>
}
