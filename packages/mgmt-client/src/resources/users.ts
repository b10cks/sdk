import type { HttpClient } from '../http-client'
import type {
  RequestOptions,
  UpdateAvatarParams,
  UpdatePasswordParams,
  UpdateUserParams,
  User,
} from '../types'

export class UsersResource {
  constructor(private readonly client: HttpClient) {}

  async getMe(options?: RequestOptions): Promise<User> {
    return this.client.get<User>('/mgmt/v1/users/me', undefined, options?.headers)
  }

  async updateMe(params: UpdateUserParams, options?: RequestOptions): Promise<User> {
    return this.client.patch<User>('/mgmt/v1/users/me', params, options?.headers)
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
}
