import { computed, type ComputedRef } from 'vue'

import { useRoute } from '#app'

/**
 * The content version to read, taken from the `?b10cks_vid` query param the
 * visual editor appends, and defaulting to `published`.
 *
 * Pass it straight into a data composable:
 *
 * ```ts
 * const vid = useB10cksVersion()
 * const { data } = await useContent('home', { vid: vid.value })
 * ```
 */
export function useB10cksVersion(): ComputedRef<string> {
  const route = useRoute()

  return computed(() => {
    const vid = route.query.b10cks_vid
    return (Array.isArray(vid) ? vid[0] : vid) || 'published'
  })
}
