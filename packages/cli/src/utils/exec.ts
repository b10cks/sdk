import { spawn } from 'node:child_process'

// Windows resolves `npm`/`pnpm` shims only through a shell.
const USE_SHELL = process.platform === 'win32'

/**
 * With `shell: true` Node joins argv on spaces without quoting, so anything
 * containing whitespace or a cmd.exe metacharacter has to be quoted by hand —
 * otherwise `init "My App"` scaffolds into `My`.
 */
function quote(arg: string): string {
  if (!USE_SHELL || !/[\s&|<>^"]/.test(arg)) return arg
  return `"${arg.replace(/"/g, '\\"')}"`
}

/** Runs a command with inherited stdio so scaffolders stay interactive. */
export function run(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args.map(quote), { cwd, stdio: 'inherit', shell: USE_SHELL })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) return resolve()
      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
    })
  })
}
