import { spawn } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
const smokeRoot = join(root, '.smoke', 'electron-reminders')
const appDataPath = join(smokeRoot, 'appdata')
const localAppDataPath = join(smokeRoot, 'localappdata')
const electronCachePath = join(root, '.electron-cache')
const electronBin =
  process.platform === 'win32'
    ? join(root, 'node_modules', 'electron', 'dist', 'electron.exe')
    : join(root, 'node_modules', '.bin', 'electron')
const appEntry = join(root, 'out', 'main', 'index.js')

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      server.close(() => {
        if (address && typeof address === 'object') {
          resolve(address.port)
          return
        }
        reject(new Error('Unable to allocate a local debugging port'))
      })
    })
  })
}

async function waitForJson(port, getChildExit, getOutput, timeoutMs = 15000) {
  const startedAt = Date.now()
  let lastError = null
  while (Date.now() - startedAt < timeoutMs) {
    const childExit = getChildExit()
    if (childExit) {
      throw new Error(`Electron exited before DevTools became available: ${JSON.stringify(childExit)}\n${getOutput()}`)
    }
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json`)
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      lastError = error
    }
    await wait(250)
  }
  throw new Error(`Timed out waiting for Electron DevTools endpoint${lastError ? `: ${lastError.message}` : ''}`)
}

async function connectToRenderer(port, getChildExit, getOutput) {
  const targets = await waitForJson(port, getChildExit, getOutput)
  const pageTarget = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl)
  if (!pageTarget) {
    throw new Error(`No renderer page target found. Targets: ${JSON.stringify(targets)}`)
  }

  const socket = new WebSocket(pageTarget.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })

  let nextId = 1
  const pending = new Map()
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data))
    if (!message.id) {
      return
    }
    const request = pending.get(message.id)
    if (!request) {
      return
    }
    pending.delete(message.id)
    if (message.error) {
      request.reject(new Error(message.error.message ?? JSON.stringify(message.error)))
      return
    }
    request.resolve(message.result)
  })

  function send(method, params = {}) {
    const id = nextId++
    socket.send(JSON.stringify({ id, method, params }))
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject })
    })
  }

  async function evaluate(expression, { awaitPromise = true } = {}) {
    const result = await send('Runtime.evaluate', {
      expression,
      awaitPromise,
      returnByValue: true
    })
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text ?? JSON.stringify(result.exceptionDetails))
    }
    return result.result?.value
  }

  async function waitForExpression(expression, timeoutMs = 15000) {
    const startedAt = Date.now()
    while (Date.now() - startedAt < timeoutMs) {
      const value = await evaluate(`Boolean(${expression})`)
      if (value) {
        return
      }
      await wait(250)
    }
    throw new Error(`Timed out waiting for expression: ${expression}`)
  }

  async function click(selector) {
    await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)})
      if (!element) {
        throw new Error('Missing selector: ${selector}')
      }
      element.click()
    })()`)
  }

  return {
    close: () => socket.close(),
    evaluate,
    waitForExpression,
    click
  }
}

function launchElectron(port) {
  mkdirSync(appDataPath, { recursive: true })
  mkdirSync(localAppDataPath, { recursive: true })
  mkdirSync(electronCachePath, { recursive: true })

  const args = [
    `--remote-debugging-address=127.0.0.1`,
    `--remote-debugging-port=${port}`,
    '--enable-logging',
    '--no-sandbox',
    appEntry
  ]

  return spawn(electronBin, args, {
    cwd: root,
    env: {
      ...process.env,
      APPDATA: appDataPath,
      LOCALAPPDATA: localAppDataPath,
      RENYIQIAN_APP_DATA_PATH: appDataPath,
      RENYIQIAN_USER_DATA_PATH: join(appDataPath, 'renyiqian-smoke'),
      ELECTRON_CACHE: electronCachePath,
      ELECTRON_DISABLE_SECURITY_WARNINGS: 'true'
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    windowsHide: true
  })
}

async function main() {
  rmSync(smokeRoot, { recursive: true, force: true })
  const port = await getFreePort()
  const child = launchElectron(port)
  const output = []
  let childExit = null
  child.stdout.on('data', (chunk) => output.push(String(chunk)))
  child.stderr.on('data', (chunk) => output.push(String(chunk)))
  child.on('exit', (code, signal) => {
    childExit = { code, signal }
  })

  let cdp = null
  try {
    cdp = await connectToRenderer(port, () => childExit, () => output.join(''))
    await cdp.waitForExpression('window.stickban && document.readyState === "complete"')
    await cdp.waitForExpression('document.querySelector(".launcher-widget")')
    await cdp.evaluate(`(() => {
      const launcher = document.querySelector('.launcher-widget')
      launcher.focus()
      launcher.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })()`)
    await cdp.waitForExpression('document.querySelector(".floatnote-shell")')

    await cdp.evaluate(`(async () => {
      const workspace = await window.stickban.getWorkspace()
      const firstColumn = workspace.activeBoard.columns[0]
      await window.stickban.createCard(firstColumn.id, {
        title: 'Smoke reminder note',
        description: JSON.stringify({
          version: 1,
          html: '<p>Smoke reminder note</p>',
          pinned: false,
          timers: [{
            id: 'smoke-timer',
            name: 'Smoke reminder',
            dueAt: Date.now() - 60000,
            status: 'scheduled',
            repeat: 'none'
          }]
        })
      })
      window.location.reload()
    })()`)

    await cdp.waitForExpression('window.stickban && document.querySelector(".floatnote-shell")')
    await cdp.waitForExpression('document.querySelector(".note-card.timer-alert")')
    await cdp.waitForExpression('document.querySelector(".reminder-history-button.active")')

    await cdp.click('.reminder-history-button')
    await cdp.waitForExpression('document.querySelector(".reminder-history-panel .reminder-current")')
    await cdp.click('.reminder-current-actions button')
    await cdp.waitForExpression('!document.querySelector(".reminder-current")')
    await cdp.click('.reminder-history-button')
    await cdp.waitForExpression('document.querySelector(".reminder-history-item")')

    const historyAfterSnooze = await cdp.evaluate(`JSON.parse(localStorage.getItem('renyiqian.reminderHistory') || '[]')`)
    if (!Array.isArray(historyAfterSnooze) || historyAfterSnooze.length !== 1) {
      throw new Error(`Expected one reminder history entry after snooze, got ${JSON.stringify(historyAfterSnooze)}`)
    }
    if (historyAfterSnooze[0].action !== 'snoozed') {
      throw new Error(`Expected snoozed history action, got ${historyAfterSnooze[0].action}`)
    }

    await cdp.click('.reminder-history-header button')
    await cdp.waitForExpression('!document.querySelector(".reminder-history-item")')
    const historyAfterClear = await cdp.evaluate(`JSON.parse(localStorage.getItem('renyiqian.reminderHistory') || '[]')`)
    if (historyAfterClear.length !== 0) {
      throw new Error(`Expected cleared reminder history, got ${JSON.stringify(historyAfterClear)}`)
    }

    console.log(JSON.stringify({
      ok: true,
      port,
      checks: [
        'renderer attached through CDP',
        'panel opened',
        'due timer rendered an alert note card',
        'top-right reminder panel opened',
        'snooze action wrote history',
        'clear history removed entries'
      ]
    }, null, 2))
  } finally {
    cdp?.close()
    if (!child.killed) {
      child.kill()
    }
    await wait(500)
    if (child.exitCode === null && !child.killed) {
      child.kill('SIGKILL')
    }
    if (process.env.SMOKE_KEEP_ARTIFACTS !== '1') {
      rmSync(smokeRoot, { recursive: true, force: true })
    }
    if (child.exitCode && child.exitCode !== 0) {
      console.error(output.join(''))
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
