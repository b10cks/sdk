<script setup lang="ts">
import type { B10cksAssetValue } from '@b10cks/client'
import type { ImageOptions } from '@nuxt/image'
import { computed } from 'vue'

import { NuxtImg } from '#components'
import { useHead, useImage } from '#imports'

const props = withDefaults(
  defineProps<{
    asset: B10cksAssetValue
    /** Overrides the asset's own alt text. */
    alt?: string
    /** Defaults to the asset's width. */
    width?: number | string
    /** Defaults to the asset's height. */
    height?: number | string
    sizes?: string
    densities?: string
    /**
     * `eager` marks the image the page opens with, usually its largest paint. It is
     * then fetched at high priority and preloaded from the top of the head.
     */
    loading?: 'lazy' | 'eager'
    modifiers?: Record<string, unknown>
    format?: string
    quality?: number | string
    background?: string
    fit?: string
    preset?: string
    provider?: ImageOptions['provider']
  }>(),
  { loading: 'lazy' }
)

const src = computed(() => props.asset.full_path ?? props.asset.url)
const width = computed(() => props.width ?? props.asset.metadata?.width)
const height = computed(() => props.height ?? props.asset.metadata?.height)
const altText = computed(() => {
  const assetAlt = props.asset.data?.alt
  return props.alt ?? (typeof assetAlt === 'string' ? assetAlt : '')
})

// The link has to name the same candidates as the `<img>`, or the browser downloads the image
// twice. NuxtImg's own `preload` cannot be used: it sorts the link behind inlined styles.
if (import.meta.server && props.loading === 'eager' && src.value) {
  const image = useImage()
  const options = { provider: props.provider, preset: props.preset }
  const modifiers = {
    ...props.modifiers,
    width: width.value,
    height: height.value,
    format: props.format,
    quality: props.quality || image.options.quality,
    background: props.background,
    fit: props.fit,
  }
  const candidates = image.getSizes(src.value, {
    ...options,
    sizes: props.sizes,
    densities: props.densities,
    modifiers,
  })

  useHead({
    link: [
      {
        rel: 'preload',
        as: 'image',
        href: props.sizes ? candidates.src : image(src.value, modifiers, options),
        imagesrcset: candidates.srcset,
        imagesizes: candidates.sizes,
        fetchpriority: 'high',
        // Ahead of inlined styles, behind preconnects.
        tagPriority: 25,
      },
    ],
  })
}
</script>

<template>
  <NuxtImg
    :src="src"
    :alt="altText"
    :width="width"
    :height="height"
    :sizes="sizes"
    :densities="densities"
    :loading="loading"
    :fetchpriority="loading === 'eager' ? 'high' : undefined"
    :modifiers="modifiers"
    :format="format"
    :quality="quality"
    :background="background"
    :fit="fit"
    :preset="preset"
    :provider="provider"
  />
</template>
