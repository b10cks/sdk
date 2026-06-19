import type { ServerConfig } from './server'

declare const process: {
  env: Record<string, string | undefined>
  argv: string[]
}

/**
 * Parse --key value or --key=value pairs from argv.
 */
const parseArgs = (argv: string[]): Record<string, string> => {
  const result: Record<string, string> = {}
  const args = argv.slice(2)
  let i = 0

  while (i < args.length) {
    const arg = args[i] ?? ''
    i++

    if (!arg.startsWith('--')) continue

    const eqIndex = arg.indexOf('=')

    if (eqIndex !== -1) {
      result[arg.slice(2, eqIndex)] = arg.slice(eqIndex + 1)
    } else {
      const key = arg.slice(2)
      const next = args[i]

      if (next !== undefined && !next.startsWith('--')) {
        result[key] = next
        i++
      }
    }
  }

  return result
}

export const loadConfig = (): ServerConfig => {
  const args = parseArgs(process.argv)

  const baseUrl =
    args['base-url'] ?? args['baseUrl'] ?? process.env.B10CKS_MGMT_BASE_URL
  const token =
    args['token'] ?? process.env.B10CKS_MGMT_TOKEN
  const timeoutStr =
    args['timeout'] ?? process.env.B10CKS_MGMT_TIMEOUT

  if (!baseUrl) {
    throw new Error(
      'Missing Management API base URL. Set B10CKS_MGMT_BASE_URL or pass --base-url <url>.'
    )
  }

  if (!token) {
    throw new Error(
      'Missing Management API token. Set B10CKS_MGMT_TOKEN or pass --token <token>.'
    )
  }

  return {
    baseUrl,
    token,
    timeout: timeoutStr ? Number(timeoutStr) : undefined,
  }
}

/** @deprecated Use loadConfig instead */
export const loadConfigFromEnv = loadConfig
