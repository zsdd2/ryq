import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  closeDatabase,
  getFloatingWindowState,
  initializeDatabase,
  setFloatingWindowState
} from './database'

const tempDirs: string[] = []

function createUserDataDir(): string {
  const path = mkdtempSync(join(tmpdir(), 'floatnote-window-state-'))
  tempDirs.push(path)
  return path
}

afterEach(() => {
  closeDatabase()
  for (const path of tempDirs.splice(0)) {
    rmSync(path, { recursive: true, force: true })
  }
})

describe('floating window state persistence', () => {
  it('saves and restores floating panel mode and launcher position', () => {
    const userDataPath = createUserDataDir()
    initializeDatabase(userDataPath)

    setFloatingWindowState({
      mode: 'panel',
      x: 48,
      y: 96
    })

    expect(getFloatingWindowState()).toEqual({
      mode: 'panel',
      x: 48,
      y: 96
    })
  })

  it('falls back to launcher mode when no state was saved', () => {
    const userDataPath = createUserDataDir()
    initializeDatabase(userDataPath)

    expect(getFloatingWindowState()).toEqual({
      mode: 'launcher',
      x: null,
      y: null
    })
  })
})
