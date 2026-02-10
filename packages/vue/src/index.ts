import type { Plugin } from 'vue'

import type { B10cksVuePluginOptions } from './types'

import B10cksComponent from './components/B10cksComponent.vue'
import { EditableDirective } from './directives/v-editable'
import { EditableContentDirective } from './directives/v-editable-content'

export { previewBridge } from './preview-bridge'
export { B10cksComponentResolverKey, type BlockComponentResolver } from './types'

export const B10cksVue: Plugin = {
  install(app, pluginOptions: B10cksVuePluginOptions) {
    app.provide('b10cksVueOptions', pluginOptions)

    app.directive('editable', EditableDirective)
    app.directive('editable-field', EditableContentDirective)
    app.component('B10cksComponent', B10cksComponent)
  },
}
