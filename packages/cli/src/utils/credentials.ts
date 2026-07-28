import fs from 'node:fs'
import os from 'node:os'
import path from 'path'

import netrc from 'netrc'

export interface Credentials {
  password?: string
  login?: string
}

const getFile = () => {
  const home =
    process.env[process.platform.startsWith('win') ? 'USERPROFILE' : 'HOME'] || os.homedir()
  return path.join(home, '.netrc')
}

const getNrcFile = (): Record<string, any> => {
  let obj: Record<string, any> = {}

  try {
    obj = netrc(getFile()) as Record<string, any>
  } catch {
    obj = {}
  }

  return obj
}

const get = (host: string = 'b10cks.com'): Credentials | null => {
  const obj = getNrcFile()

  if (process.env.B10CKS_LOGIN && process.env.B10CKS_TOKEN) {
    return {
      login: process.env.B10CKS_LOGIN,
      password: process.env.B10CKS_TOKEN,
    }
  }

  if (Object.hasOwn(obj, host)) {
    return obj[host] as Credentials
  }

  return null
}

const write = (file: string, obj: Record<string, any>) => {
  // The netrc file holds plaintext credentials — keep it owner-only readable.
  // `mode` only applies on creation, so chmod existing files too.
  fs.writeFileSync(file, netrc.format(obj) + os.EOL, { mode: 0o600 })
  fs.chmodSync(file, 0o600)
}

const set = (content: Credentials | null, host: string = 'b10cks.com'): Credentials | null => {
  const file = getFile()
  let obj: Record<string, any> = {}

  const exists = fs.existsSync(file)
  if (exists) {
    try {
      obj = netrc(file) as Record<string, any>
    } catch (error) {
      // Rewriting from an empty object would wipe every other host's
      // credentials stored in the file — refuse instead.
      throw new Error(
        `Cannot update ${file}: the file exists but could not be parsed. ` +
          `Fix or remove it manually, then retry. (${error instanceof Error ? error.message : String(error)})`
      )
    }
  }

  if (content === null) {
    delete obj[host]
  } else {
    obj[host] = content
  }
  write(file, obj)

  return content === null ? null : get()
}

export default {
  set,
  get,
  clear: () => set(null),
}
