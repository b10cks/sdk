import type { Plugin } from 'vue'

import { ApiClient, createB10cksDataApi, previewBridge } from '@b10cks/client'

import type { B10cksVuePluginOptions } from './types'

import B10cksComponent from './components/B10cksComponent.vue'
import B10cksFallback from './components/B10cksFallback.vue'
import { EditableDirective } from './directives/v-editable'
import { EditableContentDirective } from './directives/v-editable-content'
import { B10cksClientKey, B10cksDataApiKey } from './types'

export { previewBridge } from '@b10cks/client'
export * from './api'
export {
  B10cksClientKey,
  B10cksComponentResolverKey,
  B10cksDataApiKey,
  type BlockComponentResolver,
} from './types'
export { B10cksFallback }

export const B10cksVue: Plugin = {
  install(app, pluginOptions: B10cksVuePluginOptions = {}) {
    app.provide('b10cksVueOptions', pluginOptions)

    app.directive('editable', EditableDirective)
    app.directive('editable-field', EditableContentDirective)
    app.component('B10cksComponent', B10cksComponent)

    if (previewBridge.isInPreviewMode()) {
      previewBridge.init()
    }

    const client = resolveClient(pluginOptions)
    const dataApi = pluginOptions.dataApi || (client ? createB10cksDataApi(client) : null)

    if (client) {
      app.provide(B10cksClientKey, client)
    }

    if (dataApi) {
      app.provide(B10cksDataApiKey, dataApi)
    }
  },
}

function resolveClient(pluginOptions: B10cksVuePluginOptions): ApiClient | null {
  if (pluginOptions.client) {
    return pluginOptions.client
  }

  const apiClientOptions =
    pluginOptions.apiClientOptions || resolveLegacyApiClientOptions(pluginOptions)
  if (!apiClientOptions) {
    return null
  }

  return new ApiClient(apiClientOptions, pluginOptions.requestUrl)
}

function resolveLegacyApiClientOptions(
  pluginOptions: B10cksVuePluginOptions
): B10cksVuePluginOptions['apiClientOptions'] | null {
  const token = pluginOptions.token || pluginOptions.accessToken
  const baseUrl = pluginOptions.baseUrl || pluginOptions.apiUrl

  if (!token || !baseUrl) {
    return null
  }

  return {
    token,
    baseUrl,
    rv: pluginOptions.rv,
    version: pluginOptions.version,
    fetchClient: pluginOptions.fetchClient,
    getRv: pluginOptions.getRv,
    setRv: pluginOptions.setRv,
  }
}
