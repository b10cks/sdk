import type { ServerConfig } from './server'

declare const process: {
  env: Record<string, string | undefined>
}

export const loadConfigFromEnv = (): ServerConfig => {
  const baseUrl = process.env.B10CKS_MGMT_BASE_URL
  const token = process.env.B10CKS_MGMT_TOKEN
  const timeout = process.env.B10CKS_MGMT_TIMEOUT

  if (!baseUrl) {
    throw new Error('Missing B10CKS_MGMT_BASE_URL')
  }

  if (!token) {
    throw new Error('Missing B10CKS_MGMT_TOKEN')
  }

  return {
    baseUrl,
    token,
    timeout: timeout ? Number(timeout) : undefined,
  }
}
