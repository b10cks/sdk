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

/**
 * Checks if a value is a File object (browser) or Buffer (Node.js)
 */
function isFile(value: unknown): boolean {
  if (typeof File !== 'undefined' && value instanceof File) {
    return true
  }
  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    return true
  }
  // Check for Node.js Buffer
  if (value && typeof value === 'object') {
    const isBuffer = (globalThis as any).Buffer?.isBuffer?.(value) ?? false
    return isBuffer
  }
  return false
}

/**
 * Converts a Buffer to a Blob/File for FormData
 */
function bufferToBlob(buffer: any, filename?: string, mimeType?: string): Blob {
  // In Node.js environment with native Blob support (Node 18+)
  if (typeof Blob !== 'undefined') {
    const blob = new Blob([buffer], { type: mimeType || 'application/octet-stream' })

    // If File constructor is available, use it to preserve filename
    if (typeof File !== 'undefined' && filename) {
      return new File([blob], filename, { type: mimeType || 'application/octet-stream' })
    }

    return blob
  }

  // Fallback: return the buffer as-is
  return buffer
}

/**
 * Checks if the payload contains file data that needs multipart/form-data encoding
 */
function hasFileData(data: unknown): boolean {
  if (!data || typeof data !== 'object') {
    return false
  }

  for (const value of Object.values(data)) {
    if (isFile(value)) {
      return true
    }
    if (Array.isArray(value) && value.some((item) => isFile(item))) {
      return true
    }
  }

  return false
}

/**
 * Converts a payload to FormData for multipart/form-data requests
 */
function toFormData(data: Record<string, unknown>): FormData {
  const formData = new FormData()

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) {
      continue
    }

    if (Array.isArray(value)) {
      // Handle arrays
      value.forEach((item, index) => {
        if (isFile(item)) {
          const filename =
            (data[`${key}_filename`] as string) || (data.filename as string) || 'file'
          const mimeType = (data[`${key}_mime_type`] as string) || (data.mime_type as string)
          const blob = bufferToBlob(item, filename, mimeType)
          formData.append(`${key}[${index}]`, blob, filename)
        } else if (typeof item === 'object') {
          formData.append(`${key}[${index}]`, JSON.stringify(item))
        } else {
          formData.append(`${key}[${index}]`, String(item))
        }
      })
    } else if (isFile(value)) {
      // Handle File/Blob/Buffer
      // Check if there's a filename field in the data
      const filename = (data.filename as string) || (data.name as string) || 'file'
      const mimeType = (data.mime_type as string) || (data.type as string)

      // Convert Buffer to Blob with filename if needed
      if ((globalThis as any).Buffer?.isBuffer?.(value)) {
        const blob = bufferToBlob(value, filename, mimeType)
        formData.append(key, blob, filename)
      } else if (value instanceof File) {
        // File already has a name
        formData.append(key, value)
      } else if (value instanceof Blob) {
        // Blob needs a filename for Laravel
        formData.append(key, value, filename)
      } else {
        formData.append(key, value as Blob)
      }
    } else if (
      key !== 'filename' &&
      key !== 'name' &&
      key !== 'mime_type' &&
      key !== 'type' &&
      typeof value === 'object'
    ) {
      // Handle nested objects - Laravel expects JSON or dot notation
      // Skip metadata fields that are used for file info
      formData.append(key, JSON.stringify(value))
    } else if (key !== 'filename' && key !== 'name' && key !== 'mime_type' && key !== 'type') {
      // Handle primitives (skip the metadata fields)
      formData.append(key, String(value))
    }
  }

  return formData
}

export class HttpClient {
  private readonly baseUrl: string
  private readonly token: string
  private readonly timeout: number
  private readonly defaultHeaders: Record<string, string>

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.token = config.token
    this.timeout = config.timeout ?? 30000
    this.defaultHeaders = config.headers ?? {}
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, unknown>,
    customHeaders?: Record<string, string>
  ): Promise<T> {
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
      ...this.defaultHeaders,
      accept: 'application/json',
      Authorization: `Bearer ${this.token}`,
      ...customHeaders,
    }

    let requestBody: BodyInit | undefined

    // Determine if we need to use FormData for file uploads
    const useFormData = body && typeof body === 'object' && hasFileData(body)

    if (useFormData) {
      // Convert to FormData for file uploads
      requestBody = toFormData(body as Record<string, unknown>)
      // Don't set Content-Type - let the browser/runtime set it with the boundary
    } else if (body !== undefined) {
      // Use JSON for regular data
      headers['Content-Type'] = 'application/json'
      requestBody = JSON.stringify(body)
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url.toString(), {
        method,
        headers,
        body: requestBody,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        let error: {
          message?: string
          error?: string
          code?: number
          errors?: Record<string, string[]>
        }

        if (contentType?.includes('application/json')) {
          error = await response.json().catch(() => ({
            message: response.statusText,
            error: 'Unknown error',
            code: response.status,
          }))
        } else {
          const text = await response.text().catch(() => response.statusText)
          error = {
            message: text || response.statusText,
            error: 'Unknown error',
            code: response.status,
          }
        }

        throw new ManagementApiError(error.message || 'Request failed', response.status, error)
      }

      if (response.status === 204) {
        return undefined as T
      }

      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        return (await response.json()) as T
      }

      // Handle non-JSON responses
      return (await response.text()) as unknown as T
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof ManagementApiError) {
        throw error
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ManagementApiError('Request timeout', 0, error)
      }
      throw new ManagementApiError(
        error instanceof Error ? error.message : 'Request failed',
        0,
        error
      )
    }
  }

  async get<T>(
    path: string,
    params?: Record<string, unknown>,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>('GET', path, undefined, params, headers)
  }

  async post<T>(path: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('POST', path, data, undefined, headers)
  }

  async put<T>(path: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('PUT', path, data, undefined, headers)
  }

  async patch<T>(path: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('PATCH', path, data, undefined, headers)
  }

  async delete<T>(path: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('DELETE', path, undefined, undefined, headers)
  }
}
