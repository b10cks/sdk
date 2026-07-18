import { apiPath } from '../http-client'
import type { HttpClient } from '../http-client'
import type {
  CreatePersonalAccessTokenParams,
  GetNotificationsParams,
  Invite,
  Notification,
  PaginatedResponse,
  PersonalAccessToken,
  RequestOptions,
  SocialLink,
  UpdateAvatarParams,
  UpdatePasswordParams,
  UpdateUserParams,
  User,
} from '../types'

export class UsersResource {
  constructor(private readonly client: HttpClient) {}

  async getMe(options?: RequestOptions): Promise<{ data: User }> {
    return this.client.get<{ data: User }>('/mgmt/v1/users/me', undefined, options?.headers)
  }

  async updateMe(params: UpdateUserParams, options?: RequestOptions): Promise<{ data: User }> {
    return this.client.patch<{ data: User }>('/mgmt/v1/users/me', params, options?.headers)
  }

  async updateSettings(payload: Record<string, unknown>, options?: RequestOptions): Promise<void> {
    return this.client.post<void>('/mgmt/v1/users/me/settings', payload, options?.headers)
  }

  async updateAvatar(params: UpdateAvatarParams, options?: RequestOptions): Promise<void> {
    return this.client.post<void>('/mgmt/v1/users/me/avatar', params, options?.headers)
  }

  async updatePassword(params: UpdatePasswordParams, options?: RequestOptions): Promise<void> {
    return this.client.post<void>('/mgmt/v1/users/me/password', params, options?.headers)
  }

  // ─── Social Links ──────────────────────────────────────────────────────────

  async listSocialLinks(options?: RequestOptions): Promise<{ data: SocialLink[] }> {
    return this.client.get<{ data: SocialLink[] }>(
      '/mgmt/v1/users/me/social-links',
      undefined,
      options?.headers
    )
  }

  async deleteSocialLink(provider: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      apiPath`/mgmt/v1/users/me/social-links/${provider}`,
      options?.headers
    )
  }

  // ─── Personal Access Tokens ────────────────────────────────────────────────

  async listTokens(
    options?: RequestOptions
  ): Promise<PaginatedResponse<PersonalAccessToken>> {
    return this.client.get<PaginatedResponse<PersonalAccessToken>>(
      '/mgmt/v1/users/me/tokens',
      undefined,
      options?.headers
    )
  }

  async createToken(
    payload: CreatePersonalAccessTokenParams,
    options?: RequestOptions
  ): Promise<{ data: PersonalAccessToken & { token: string } }> {
    return this.client.post<{ data: PersonalAccessToken & { token: string } }>(
      '/mgmt/v1/users/me/tokens',
      payload,
      options?.headers
    )
  }

  async deleteToken(tokenId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(apiPath`/mgmt/v1/users/me/tokens/${tokenId}`, options?.headers)
  }

  // ─── Invites ───────────────────────────────────────────────────────────────

  async listInvites(options?: RequestOptions): Promise<PaginatedResponse<Invite>> {
    return this.client.get<PaginatedResponse<Invite>>(
      '/mgmt/v1/users/me/invites',
      undefined,
      options?.headers
    )
  }

  async getInvite(inviteId: string, options?: RequestOptions): Promise<{ data: Invite }> {
    return this.client.get<{ data: Invite }>(
      apiPath`/mgmt/v1/users/me/invites/${inviteId}`,
      undefined,
      options?.headers
    )
  }

  async acceptInvite(inviteId: string, options?: RequestOptions): Promise<unknown> {
    return this.client.post<unknown>(
      apiPath`/mgmt/v1/users/me/invites/${inviteId}/accept`,
      undefined,
      options?.headers
    )
  }

  // ─── Notifications ─────────────────────────────────────────────────────────

  async listNotifications(
    params?: GetNotificationsParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<Notification>> {
    return this.client.get<PaginatedResponse<Notification>>(
      '/mgmt/v1/users/me/notifications',
      params,
      options?.headers
    )
  }

  async getUnreadNotificationCount(options?: RequestOptions): Promise<{ count: number }> {
    return this.client.get<{ count: number }>(
      '/mgmt/v1/users/me/notifications/unread-count',
      undefined,
      options?.headers
    )
  }

  async markNotificationAsRead(
    notificationId: string,
    options?: RequestOptions
  ): Promise<{ data: Notification }> {
    return this.client.patch<{ data: Notification }>(
      apiPath`/mgmt/v1/users/me/notifications/${notificationId}/read`,
      undefined,
      options?.headers
    )
  }

  async markNotificationAsUnread(
    notificationId: string,
    options?: RequestOptions
  ): Promise<{ data: Notification }> {
    return this.client.patch<{ data: Notification }>(
      apiPath`/mgmt/v1/users/me/notifications/${notificationId}/unread`,
      undefined,
      options?.headers
    )
  }

  async markAllNotificationsAsRead(options?: RequestOptions): Promise<void> {
    return this.client.post<void>(
      '/mgmt/v1/users/me/notifications/read',
      undefined,
      options?.headers
    )
  }

  async deleteNotification(notificationId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      apiPath`/mgmt/v1/users/me/notifications/${notificationId}`,
      options?.headers
    )
  }

  /** Deletes every notification that has already been read. */
  async deleteReadNotifications(options?: RequestOptions): Promise<void> {
    return this.client.delete<void>('/mgmt/v1/users/me/notifications/read', options?.headers)
  }

  /** Deletes every notification, read or not. */
  async deleteAllNotifications(options?: RequestOptions): Promise<void> {
    return this.client.delete<void>('/mgmt/v1/users/me/notifications', options?.headers)
  }
}
