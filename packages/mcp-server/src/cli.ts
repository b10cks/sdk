import { loadConfigFromEnv } from './config'
import { runStdioServer } from './server'

declare const process: {
  exit(code?: number): never
}

const main = async (): Promise<void> => {
  await runStdioServer(loadConfigFromEnv())
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
