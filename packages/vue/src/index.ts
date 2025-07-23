import type { Plugin } from 'vue'
import type { B10cksVuePluginOptions } from './types'

import { EditableDirective } from './directives/v-editable'
import { EditableContentDirective } from './directives/v-editable-content'
import B10cksComponent from './components/B10cksComponent.vue'

export { previewBridge } from './preview-bridge'

export const B10cksVue: Plugin = {
  install(app, pluginOptions: B10cksVuePluginOptions) {
    app.provide('b10cksVueOptions', pluginOptions)

    app.directive('editable', EditableDirective)
    app.directive('editable-field', EditableContentDirective)
    app.component('B10cksComponent', B10cksComponent)
  }
}