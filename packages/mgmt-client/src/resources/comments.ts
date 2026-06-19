import type { HttpClient } from '../http-client'
import type {
  Comment,
  CommentReaction,
  CreateCommentParams,
  CreateCommentReactionParams,
  PaginatedResponse,
  RequestOptions,
  UpdateCommentParams,
} from '../types'

export class CommentsResource {
  constructor(private readonly client: HttpClient) {}

  async list(
    spaceId: string,
    contentId: string,
    options?: RequestOptions
  ): Promise<PaginatedResponse<Comment>> {
    return this.client.get<PaginatedResponse<Comment>>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/comments`,
      undefined,
      options?.headers
    )
  }

  async create(
    spaceId: string,
    contentId: string,
    payload: CreateCommentParams,
    options?: RequestOptions
  ): Promise<{ data: Comment }> {
    return this.client.post<{ data: Comment }>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/comments`,
      payload,
      options?.headers
    )
  }

  async get(
    spaceId: string,
    contentId: string,
    commentId: string,
    options?: RequestOptions
  ): Promise<{ data: Comment }> {
    return this.client.get<{ data: Comment }>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/comments/${commentId}`,
      undefined,
      options?.headers
    )
  }

  async update(
    spaceId: string,
    contentId: string,
    commentId: string,
    payload: UpdateCommentParams,
    options?: RequestOptions
  ): Promise<{ data: Comment }> {
    return this.client.patch<{ data: Comment }>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/comments/${commentId}`,
      payload,
      options?.headers
    )
  }

  async delete(
    spaceId: string,
    contentId: string,
    commentId: string,
    options?: RequestOptions
  ): Promise<void> {
    return this.client.delete<void>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/comments/${commentId}`,
      options?.headers
    )
  }

  async resolve(
    spaceId: string,
    contentId: string,
    commentId: string,
    options?: RequestOptions
  ): Promise<{ data: Comment }> {
    return this.client.post<{ data: Comment }>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/comments/${commentId}/resolve`,
      undefined,
      options?.headers
    )
  }

  async unresolve(
    spaceId: string,
    contentId: string,
    commentId: string,
    options?: RequestOptions
  ): Promise<{ data: Comment }> {
    return this.client.delete<{ data: Comment }>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/comments/${commentId}/resolve`,
      options?.headers
    )
  }

  // ─── Reactions ─────────────────────────────────────────────────────────────

  async listReactions(
    spaceId: string,
    contentId: string,
    commentId: string,
    options?: RequestOptions
  ): Promise<{ data: CommentReaction[] }> {
    return this.client.get<{ data: CommentReaction[] }>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/comments/${commentId}/reactions`,
      undefined,
      options?.headers
    )
  }

  async addReaction(
    spaceId: string,
    contentId: string,
    commentId: string,
    payload: CreateCommentReactionParams,
    options?: RequestOptions
  ): Promise<{ data: CommentReaction }> {
    return this.client.post<{ data: CommentReaction }>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/comments/${commentId}/reactions`,
      payload,
      options?.headers
    )
  }

  async removeReaction(
    spaceId: string,
    contentId: string,
    commentId: string,
    options?: RequestOptions
  ): Promise<void> {
    return this.client.delete<void>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/comments/${commentId}/reactions`,
      options?.headers
    )
  }
}
