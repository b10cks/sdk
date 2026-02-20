export interface NextConfigLike {
  transpilePackages?: string[]
  [key: string]: unknown
}

const REQUIRED_PACKAGES = ['@b10cks/next', '@b10cks/react', '@b10cks/client']

export function withB10cks<TConfig extends NextConfigLike>(nextConfig: TConfig): TConfig {
  const transpilePackages = new Set([...(nextConfig.transpilePackages || []), ...REQUIRED_PACKAGES])

  return {
    ...nextConfig,
    transpilePackages: [...transpilePackages],
  }
}
