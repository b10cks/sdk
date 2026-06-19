import { loadConfig } from './config'
import { runStdioServer } from './server'

declare const process: {
  exit(code?: number): never
}

const main = async (): Promise<void> => {
  let configOrError: ReturnType<typeof loadConfig> | Error
  try {
    configOrError = loadConfig()
  } catch (e) {
    configOrError = e instanceof Error ? e : new Error(String(e))
  }

  await runStdioServer(configOrError)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
