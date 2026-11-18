import type { B10cksAssetValue } from '@b10cks/client'
import Image, { type ImageProps } from 'next/image'

export interface B10cksImgProps extends Omit<
  ImageProps,
  'src' | 'alt' | 'width' | 'height' | 'loading' | 'priority' | 'preload'
> {
  asset: B10cksAssetValue
  /** Overrides the asset's own alt text. */
  alt?: string
  /** Defaults to the asset's width. */
  width?: number
  /** Defaults to the asset's height. */
  height?: number
  /**
   * `eager` marks the image the page opens with, usually its largest paint. It is
   * then fetched at high priority and preloaded with its `srcset` and `sizes`.
   */
  loading?: 'lazy' | 'eager'
}

/** A b10cks asset through `next/image`. Works in Server and Client Components. */
export function B10cksImg({
  asset,
  alt,
  width,
  height,
  loading = 'lazy',
  ...props
}: B10cksImgProps) {
  const src = asset.url ?? asset.full_path
  if (!src) return null

  const assetAlt = asset.data?.alt
  const size = props.fill
    ? {}
    : { width: width ?? asset.metadata?.width, height: height ?? asset.metadata?.height }

  return (
    <Image
      {...props}
      {...size}
      {...(loading === 'eager' ? { priority: true, fetchPriority: 'high' as const } : { loading })}
      src={src}
      alt={alt ?? (typeof assetAlt === 'string' ? assetAlt : '')}
    />
  )
}
