import type { ServerConfig } from './server'

import fs from 'node:fs'
import path from 'node:path'

declare const process: {
  env: Record<string, string | undefined>
  argv: string[]
  platform: string
}

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

const getNetrcToken = (host = 'b10cks.com'): string | undefined => {
  try {
    const home = process.env[process.platform.startsWith('win') ? 'USERPROFILE' : 'HOME']
    const file = path.join(home!, '.netrc')
    const content = fs.readFileSync(file, 'utf8')
    let current: string | null = null
    let password: string | undefined

    for (const line of content.split(/\r?\n/)) {
      const tokens = line.trim().split(/\s+/)
      for (let i = 0; i < tokens.length; i += 2) {
        const key = tokens[i]
        const val = tokens[i + 1]
        if (key === 'machine') current = val ?? null
        else if (current === host && key === 'password') password = val
      }
    }

    return password
  } catch {
    return undefined
  }
}

export const loadConfig = (): ServerConfig => {
  const args = parseArgs(process.argv)

  const baseUrl =
    args['base-url'] ?? args['baseUrl'] ?? process.env.B10CKS_MGMT_BASE_URL ?? 'https://api.b10cks.com'
  const token =
    args['token'] ?? process.env.B10CKS_MGMT_TOKEN ?? process.env.B10CKS_TOKEN ?? getNetrcToken()
  const timeoutStr =
    args['timeout'] ?? process.env.B10CKS_MGMT_TIMEOUT

  if (!token) {
    throw new Error(
      'Missing Management API token. Log in via `b10cks auth login`, set B10CKS_MGMT_TOKEN, or pass --token <token>.'
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
