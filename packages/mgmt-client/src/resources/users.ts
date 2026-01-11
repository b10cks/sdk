import type { HttpClient } from '../http-client'
import type { UpdateAvatarParams, UpdatePasswordParams, UpdateUserParams, User } from '../types'

export class UsersResource {
  constructor(private readonly client: HttpClient) {}

  async getMe(): Promise<User> {
    return this.client.get<User>('/mgmt/v1/users/me')
  }

  async updateMe(params: UpdateUserParams): Promise<User> {
    return this.client.patch<User>('/mgmt/v1/users/me', params)
  }

  async updateSettings(): Promise<void> {
    return this.client.post<void>('/mgmt/v1/users/me/settings')
  }

  async updateAvatar(params: UpdateAvatarParams): Promise<void> {
    return this.client.post<void>('/mgmt/v1/users/me/avatar', params)
  }

  async updatePassword(params: UpdatePasswordParams): Promise<void> {
    return this.client.post<void>('/mgmt/v1/users/me/password', params)
  }
}
