import Database from 'better-sqlite3'
import { existsSync, mkdirSync, renameSync, rmSync, statSync } from 'node:fs'
import { dirname, join, normalize, resolve } from 'node:path'

export const CANONICAL_USER_DATA_DIR_NAME = 'renyiqian'
export const CURRENT_DATABASE_FILENAME = 'renyiqian.db'

interface LegacyDatabaseCandidate {
  directoryName: string
  databaseFilename: string
}

interface DatabaseSummary {
  path: string
  boardCount: number
  cardCount: number
  updatedAtMs: number
}

export interface UserDataMigrationResult {
  migrated: boolean
  sourcePath: string | null
  targetPath: string
  reason: string
}

const LEGACY_DATABASE_CANDIDATES: LegacyDatabaseCandidate[] = [
  {
    directoryName: '\u4efb\u610f\u7b7e',
    databaseFilename: CURRENT_DATABASE_FILENAME
  },
  {
    directoryName: 'Stickban',
    databaseFilename: 'stickban.db'
  },
  {
    directoryName: 'FloatNote',
    databaseFilename: CURRENT_DATABASE_FILENAME
  },
  {
    directoryName: 'floatnote',
    databaseFilename: CURRENT_DATABASE_FILENAME
  }
]

export function getCanonicalUserDataPath(appDataPath: string): string {
  return join(appDataPath, CANONICAL_USER_DATA_DIR_NAME)
}

export function getCurrentDatabasePath(userDataPath: string): string {
  return join(userDataPath, 'data', CURRENT_DATABASE_FILENAME)
}

function normalizePathForCompare(path: string): string {
  return normalize(resolve(path)).toLowerCase()
}

function getActiveRowCount(database: Database.Database, tableName: 'boards' | 'cards'): number {
  try {
    const row = database
      .prepare(`SELECT COUNT(*) AS count FROM ${tableName} WHERE deleted_at IS NULL`)
      .get() as { count: number }
    return row.count
  } catch {
    const row = database.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get() as { count: number }
    return row.count
  }
}

function summarizeDatabase(databasePath: string): DatabaseSummary | null {
  if (!existsSync(databasePath)) {
    return null
  }

  let database: Database.Database | null = null
  try {
    database = new Database(databasePath, {
      fileMustExist: true,
      readonly: true
    })

    return {
      path: databasePath,
      boardCount: getActiveRowCount(database, 'boards'),
      cardCount: getActiveRowCount(database, 'cards'),
      updatedAtMs: statSync(databasePath).mtimeMs
    }
  } catch {
    return null
  } finally {
    database?.close()
  }
}

function isPristineDatabase(summary: DatabaseSummary | null): boolean {
  return summary === null || (summary.cardCount === 0 && summary.boardCount <= 1)
}

function getMigrationScore(summary: DatabaseSummary): number {
  return summary.cardCount * 100 + summary.boardCount
}

function findBestLegacyDatabase(appDataPath: string, targetDatabasePath: string): DatabaseSummary | null {
  const targetPath = normalizePathForCompare(targetDatabasePath)
  const candidates = LEGACY_DATABASE_CANDIDATES.map((candidate) =>
    join(appDataPath, candidate.directoryName, 'data', candidate.databaseFilename)
  )
    .filter((candidatePath) => normalizePathForCompare(candidatePath) !== targetPath)
    .map(summarizeDatabase)
    .filter((summary): summary is DatabaseSummary => summary !== null)
    .filter((summary) => getMigrationScore(summary) > 1)
    .sort((left, right) => {
      const scoreDelta = getMigrationScore(right) - getMigrationScore(left)
      return scoreDelta !== 0 ? scoreDelta : right.updatedAtMs - left.updatedAtMs
    })

  return candidates[0] ?? null
}

function moveExistingDatabaseAside(databasePath: string): void {
  if (!existsSync(databasePath)) {
    return
  }

  const backupPath = `${databasePath}.pre-migration-${Date.now()}.bak`
  renameSync(databasePath, backupPath)
  rmSync(`${databasePath}-wal`, { force: true })
  rmSync(`${databasePath}-shm`, { force: true })
}

export async function migrateLegacyUserData(options: {
  appDataPath: string
  targetUserDataPath: string
}): Promise<UserDataMigrationResult> {
  const targetPath = getCurrentDatabasePath(options.targetUserDataPath)
  const targetSummary = summarizeDatabase(targetPath)
  const sourceSummary = findBestLegacyDatabase(options.appDataPath, targetPath)

  if (!sourceSummary) {
    return {
      migrated: false,
      sourcePath: null,
      targetPath,
      reason: 'no-legacy-database'
    }
  }

  if (!isPristineDatabase(targetSummary)) {
    return {
      migrated: false,
      sourcePath: sourceSummary.path,
      targetPath,
      reason: 'target-has-user-data'
    }
  }

  mkdirSync(dirname(targetPath), { recursive: true })
  moveExistingDatabaseAside(targetPath)

  const sourceDatabase = new Database(sourceSummary.path, {
    fileMustExist: true,
    readonly: true
  })
  try {
    await sourceDatabase.backup(targetPath)
  } finally {
    sourceDatabase.close()
  }

  return {
    migrated: true,
    sourcePath: sourceSummary.path,
    targetPath,
    reason: 'migrated-legacy-database'
  }
}
