import type { ClientConfig } from './types'

export class ManagementApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 0,
    public readonly response?: unknown
  ) {
    super(message)
    this.name = 'ManagementApiError'
  }
}

export class HttpClient {
  private readonly baseUrl: string
  private readonly token: string
  private readonly timeout: number

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.token = config.token
    this.timeout = config.timeout ?? 30000
  }

  private async request<T>(method: string, path: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
    const url = new URL(path, this.baseUrl)

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            for (const item of value) {
              url.searchParams.append(`${key}[]`, String(item))
            }
          } else {
            url.searchParams.append(key, String(value))
          }
        }
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: response.statusText,
          error: 'Unknown error',
          code: response.status,
        }))
        throw new ManagementApiError(error.message || 'Request failed', response.status, error)
      }

      if (response.status === 204) {
        return undefined as T
      }

      return (await response.json()) as T
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof ManagementApiError) {
        throw error
      }
      throw new ManagementApiError(error instanceof Error ? error.message : 'Request failed', 0, error)
    }
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>('GET', path, undefined, params)
  }

  async post<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>('POST', path, data)
  }

  async put<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>('PUT', path, data)
  }

  async patch<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, data)
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path)
  }
}
