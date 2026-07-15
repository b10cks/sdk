import fs from 'node:fs'
import path from 'node:path'

export interface EnvResult {
  /** Vars appended to the file. */
  written: string[]
  /** Vars already defined, left untouched rather than clobbered. */
  present: string[]
}

/**
 * Files in the dotenv cascade that could already supply the token. `.env.local`
 * matters most: it is what Vite and Next docs recommend, and it overrides
 * `.env` at runtime — so writing a fresh token to `.env` would be a no-op.
 */
const ENV_FILES = ['.env', '.env.local', '.env.development', '.env.development.local']

/** True when any dotenv file already assigns `key`. */
export function envDefines(dir: string, key: string): boolean {
  const pattern = new RegExp(`^\\s*${key}\\s*=`, 'm')
  return ENV_FILES.some((name) => {
    const file = path.join(dir, name)
    return fs.existsSync(file) && pattern.test(fs.readFileSync(file, 'utf8'))
  })
}

/** Appends missing vars to `.env`, never overwriting an existing assignment. */
export function upsertEnv(dir: string, vars: Record<string, string>, dryRun: boolean): EnvResult {
  const file = path.join(dir, '.env')
  const source = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
  const result: EnvResult = { written: [], present: [] }
  let output = source

  for (const [key, value] of Object.entries(vars)) {
    if (new RegExp(`^\\s*${key}\\s*=`, 'm').test(source)) {
      result.present.push(key)
      continue
    }
    if (output.length && !output.endsWith('\n')) output += '\n'
    output += `${key}=${value}\n`
    result.written.push(key)
  }

  // The file holds an access token — keep it owner-only on creation.
  if (result.written.length && !dryRun) fs.writeFileSync(file, output, { mode: 0o600 })
  return result
}

/** Ensures `.env` is gitignored. Returns true when a rule was added. */
export function ensureGitignored(dir: string, dryRun: boolean): boolean {
  const file = path.join(dir, '.gitignore')
  const source = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''

  const covered = source.split('\n').some((line) => {
    const rule = line.trim()
    return rule === '.env' || rule.startsWith('.env*') || rule === '*.env'
  })
  if (covered) return false

  const output = source.length && !source.endsWith('\n') ? `${source}\n.env\n` : `${source}.env\n`
  if (!dryRun) fs.writeFileSync(file, output)
  return true
}
