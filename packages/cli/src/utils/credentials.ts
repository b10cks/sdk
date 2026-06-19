import netrc from 'netrc'
import fs from 'node:fs'
import os from 'node:os'
import path from 'path'

export interface Credentials {
  password?: string
  login?: string
}

const getFile = () => {
  const home = process.env[/^win/.test(process.platform) ? 'USERPROFILE' : 'HOME']
  return path.join(home!, '.netrc')
}

const getNrcFile = (): Record<string, any> => {
  let obj: Record<string, any> = {}

  try {
    obj = netrc(getFile()) as Record<string, any>
  } catch (_e) {
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

const set = (content: Credentials | null, host: string = 'b10cks.com'): Credentials | null => {
  const file = getFile()
  let obj: Record<string, any> = {}

  try {
    obj = netrc(file) as Record<string, any>
  } catch (_e) {
    obj = {}
  }

  if (content === null) {
    delete obj[host]
    fs.writeFileSync(file, netrc.format(obj) + os.EOL)
    return null
  } else {
    obj[host] = content
    fs.writeFileSync(file, netrc.format(obj) + os.EOL)
    return get()
  }
}

export default {
  set,
  get,
  clear: () => set(null),
}
