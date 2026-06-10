import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { closeDatabase, createCard, getWorkspace, initializeDatabase } from './database'
import { getCanonicalUserDataPath, migrateLegacyUserData } from './user-data'

const tempDirs: string[] = []

function createTempAppDataDir(): string {
  const path = mkdtempSync(join(tmpdir(), 'renyiqian-app-data-'))
  tempDirs.push(path)
  return path
}

function addNoteToUserData(userDataPath: string, title: string): void {
  initializeDatabase(userDataPath)
  const workspace = getWorkspace()
  createCard(workspace.activeBoard.columns[0].id, {
    title,
    description: title
  })
  closeDatabase()
}

afterEach(() => {
  closeDatabase()
  for (const path of tempDirs.splice(0)) {
    rmSync(path, { recursive: true, force: true })
  }
})

describe('legacy user data migration', () => {
  it('copies notes from the previous Chinese product-name directory into the canonical directory', async () => {
    const appDataPath = createTempAppDataDir()
    const legacyUserDataPath = join(appDataPath, '\u4efb\u610f\u7b7e')
    const targetUserDataPath = getCanonicalUserDataPath(appDataPath)
    addNoteToUserData(legacyUserDataPath, 'legacy note')

    const result = await migrateLegacyUserData({
      appDataPath,
      targetUserDataPath
    })

    expect(result.migrated).toBe(true)

    initializeDatabase(targetUserDataPath)
    const workspace = getWorkspace()
    const titles = workspace.activeBoard.columns.flatMap((column) => column.cards.map((card) => card.title))
    expect(titles).toContain('legacy note')
  })

  it('does not overwrite a canonical database that already has user notes', async () => {
    const appDataPath = createTempAppDataDir()
    const legacyUserDataPath = join(appDataPath, '\u4efb\u610f\u7b7e')
    const targetUserDataPath = getCanonicalUserDataPath(appDataPath)
    addNoteToUserData(legacyUserDataPath, 'legacy note')
    addNoteToUserData(targetUserDataPath, 'current note')

    const result = await migrateLegacyUserData({
      appDataPath,
      targetUserDataPath
    })

    expect(result.migrated).toBe(false)
    expect(result.reason).toBe('target-has-user-data')

    initializeDatabase(targetUserDataPath)
    const workspace = getWorkspace()
    const titles = workspace.activeBoard.columns.flatMap((column) => column.cards.map((card) => card.title))
    expect(titles).toContain('current note')
    expect(titles).not.toContain('legacy note')
  })
})
