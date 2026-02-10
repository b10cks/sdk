import type { B10cksApiClientOptions } from '@b10cks/client'
import type { Component, InjectionKey } from 'vue'

export interface B10cksVuePluginOptions extends B10cksApiClientOptions {}

export type BlockComponentResolver = (componentName: string) => Promise<Component>

export const B10cksComponentResolverKey: InjectionKey<BlockComponentResolver> = Symbol(
  'b10cks:resolveBlockComponent'
)
