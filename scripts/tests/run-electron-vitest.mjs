import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
const localAppData = join(root, '.localappdata')
const electronCache = join(root, '.electron-cache')

mkdirSync(localAppData, { recursive: true })
mkdirSync(electronCache, { recursive: true })

const electronBin = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'electron.CMD' : 'electron')
const electronArgs = ['--no-sandbox', '--run-as-node', './scripts/tests/run-vitest.mjs', ...process.argv.slice(2)]
const command = process.platform === 'win32' ? 'cmd.exe' : electronBin
const args = process.platform === 'win32' ? ['/d', '/s', '/c', electronBin, ...electronArgs] : electronArgs

const child = spawn(
  command,
  args,
  {
    cwd: root,
    env: {
      ...process.env,
      LOCALAPPDATA: localAppData,
      ELECTRON_CACHE: electronCache
    },
    stdio: 'inherit',
    shell: false
  }
)

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})
