import { apiPath } from '../http-client'
import type { HttpClient } from '../http-client'
import type {
  AssetDownloadUrl,
  AssetPackagePending,
  PublicShare,
  PublicShareAssetsResponse,
  RequestOptions,
  ShareAccessToken,
} from '../types'

/**
 * Public, unauthenticated access to a shared set of assets.
 *
 * A share is addressed by its space id and token. When a share is password
 * protected, call {@link SharesResource.unlock} first and pass the returned
 * `access_token` to every other method — without it the API answers 403 and
 * `get()` returns only the share's name.
 */
export class SharesResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * The share access token replaces the management token on these routes, so it
   * has to override the `Authorization` header rather than sit alongside it.
   */
  private authHeaders(
    accessToken?: string,
    options?: RequestOptions
  ): Record<string, string> | undefined {
    if (!accessToken) return options?.headers
    return { ...options?.headers, Authorization: `Bearer ${accessToken}` }
  }

  /**
   * Reads a share. For a protected share without a valid `accessToken` this
   * resolves to a {@link LockedShare} carrying only the name — it does not throw.
   */
  async get(
    spaceId: string,
    token: string,
    accessToken?: string,
    options?: RequestOptions
  ): Promise<{ data: PublicShare }> {
    return this.client.get<{ data: PublicShare }>(
      apiPath`/mgmt/v1/shares/${spaceId}/${token}`,
      undefined,
      this.authHeaders(accessToken, options)
    )
  }

  /** Exchanges the share password for a short-lived access token. */
  async unlock(
    spaceId: string,
    token: string,
    password: string,
    options?: RequestOptions
  ): Promise<ShareAccessToken> {
    return this.client.post<ShareAccessToken>(
      apiPath`/mgmt/v1/shares/${spaceId}/${token}/unlock`,
      { password },
      options?.headers
    )
  }

  /** Lists the assets in a share. `perPage` is clamped server-side to 1–100. */
  async listAssets(
    spaceId: string,
    token: string,
    params?: { page?: number; per_page?: number },
    accessToken?: string,
    options?: RequestOptions
  ): Promise<PublicShareAssetsResponse> {
    return this.client.get<PublicShareAssetsResponse>(
      apiPath`/mgmt/v1/shares/${spaceId}/${token}/assets`,
      params,
      this.authHeaders(accessToken, options)
    )
  }

  /**
   * Resolves a download URL for the share's zip archive. While the archive is
   * still building, returns {@link AssetPackagePending} instead — poll until a
   * `url` comes back.
   */
  async download(
    spaceId: string,
    token: string,
    accessToken?: string,
    options?: RequestOptions
  ): Promise<AssetDownloadUrl | AssetPackagePending> {
    return this.client.get<AssetDownloadUrl | AssetPackagePending>(
      apiPath`/mgmt/v1/shares/${spaceId}/${token}/download`,
      undefined,
      this.authHeaders(accessToken, options)
    )
  }

  /** Resolves a download URL for one asset. Requires `allow_individual_downloads`. */
  async downloadAsset(
    spaceId: string,
    token: string,
    assetId: string,
    accessToken?: string,
    options?: RequestOptions
  ): Promise<AssetDownloadUrl> {
    return this.client.get<AssetDownloadUrl>(
      apiPath`/mgmt/v1/shares/${spaceId}/${token}/assets/${assetId}/download`,
      undefined,
      this.authHeaders(accessToken, options)
    )
  }

  /**
   * Fetches a bounded image preview (max 1280px wide) as raw bytes. Image
   * assets only — anything else answers 404.
   */
  async previewAsset(
    spaceId: string,
    token: string,
    assetId: string,
    accessToken?: string,
    options?: RequestOptions
  ): Promise<Blob> {
    return this.client.getBlob(
      apiPath`/mgmt/v1/shares/${spaceId}/${token}/assets/${assetId}/preview`,
      undefined,
      this.authHeaders(accessToken, options)
    )
  }
}
