import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SyncFolderConfig, SyncOperation, SyncStatus, WorkspaceRecord } from '../shared/types'
import {
  applyRemoteOperation,
  closeDatabase,
  createBoard,
  createCard,
  exportCheckpoint,
  getWorkspace,
  initializeDatabase,
  isOperationApplied,
  registerOperationEmitter,
  updateCard
} from './database'
import { SyncManager } from './sync'

vi.mock('electron', () => ({
  dialog: {
    showOpenDialog: vi.fn()
  }
}))

const trackedTempDirs: string[] = []
const trackedManagers: SyncManager[] = []
let operationSequence = 0

function createTempDir(prefix: string): string {
  const path = mkdtempSync(join(tmpdir(), prefix))
  trackedTempDirs.push(path)
  return path
}

function createSyncFolder(): SyncFolderConfig {
  const folderPath = createTempDir('stickban-sync-folder-')
  const syncRootPath = join(folderPath, 'stickban-sync')
  const operationsPath = join(syncRootPath, 'operations')
  const checkpointsPath = join(syncRootPath, 'checkpoints')
  mkdirSync(operationsPath, { recursive: true })
  mkdirSync(checkpointsPath, { recursive: true })
  return {
    folderPath,
    syncRootPath,
    operationsPath,
    checkpointsPath,
    providerHint: 'Synced folder'
  }
}

function createManager(userDataPath: string): SyncManager {
  const manager = new SyncManager(userDataPath)
  trackedManagers.push(manager)
  manager.initialize()
  return manager
}

function attachFolder(manager: SyncManager, folderPath: string): void {
  ;(manager as any).applyFolderPath(folderPath, { hasCompletedSync: false })
}

function listJsonFiles(path: string): string[] {
  if (!existsSync(path)) {
    return []
  }

  return readdirSync(path)
    .filter((entry) => entry.endsWith('.json'))
    .sort()
}

function buildOperation(
  kind: SyncOperation['kind'],
  ids: Pick<SyncOperation, 'boardId' | 'columnId' | 'cardId'>,
  payload: Record<string, unknown>,
  overrides: Partial<SyncOperation> = {}
): SyncOperation {
  const clock = overrides.clock ?? ++operationSequence
  return {
    operationId: overrides.operationId ?? randomUUID(),
    deviceId: overrides.deviceId ?? 'remote-device',
    createdAtUtc:
      overrides.createdAtUtc ?? new Date(Date.UTC(2026, 2, 25, 18, 0, Math.min(clock, 59))).toISOString(),
    clock,
    baseClock: overrides.baseClock ?? Math.max(0, clock - 1),
    kind,
    ...ids,
    payload
  }
}

function buildSyncStatus(overrides: Partial<SyncStatus> = {}): SyncStatus {
  return {
    configured: true,
    syncing: false,
    hasCompletedSync: true,
    folderPath: 'C:/sync',
    syncRootPath: 'C:/sync/stickban-sync',
    providerHint: 'OneDrive',
    deviceId: 'device-1',
    pendingLocalOperations: 0,
    lastSyncedAtUtc: '2026-03-25T18:00:00.000Z',
    lastImportedAtUtc: '2026-03-25T18:00:00.000Z',
    lastExportedAtUtc: '2026-03-25T18:00:00.000Z',
    lastCheckpointAtUtc: '2026-03-25T18:00:00.000Z',
    lastError: null,
    bootstrapConflict: null,
    notices: [],
    ...overrides
  }
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}

async function seedRemoteHistory(syncFolder: SyncFolderConfig): Promise<{ remoteWorkspace: WorkspaceRecord }> {
  const sourceUserData = createTempDir('stickban-source-user-data-')
  const emittedOperations: SyncOperation[] = []

  initializeDatabase(sourceUserData)
  registerOperationEmitter((operation) => {
    emittedOperations.push(JSON.parse(JSON.stringify(operation)) as SyncOperation)
  })

  let workspace = createBoard({ title: 'Remote Board' })
  const firstColumnId = workspace.activeBoard.columns[0].id
  workspace = createCard(firstColumnId, { title: 'Checkpoint card', description: 'Remote description' })
  await flushMicrotasks()

  const cardId = workspace.activeBoard.columns[0].cards[0].id
  const checkpoint = exportCheckpoint()
  workspace = updateCard(cardId, { title: 'Updated remotely', description: 'Remote description' })
  await flushMicrotasks()

  writeFileSync(join(syncFolder.checkpointsPath, `${checkpoint.checkpointId}.json`), JSON.stringify(checkpoint, null, 2))
  const trailingOperation = emittedOperations.at(-1)
  if (!trailingOperation) {
    throw new Error('Failed to capture a trailing remote operation for the test fixture.')
  }

  writeFileSync(
    join(syncFolder.operationsPath, `${trailingOperation.operationId}.json`),
    JSON.stringify(trailingOperation, null, 2)
  )

  return { remoteWorkspace: workspace }
}

afterEach(() => {
  trackedManagers.splice(0).forEach((manager) => manager.dispose())
  closeDatabase()
  vi.restoreAllMocks()
  vi.resetModules()
  operationSequence = 0
  delete (globalThis as { window?: unknown }).window
  trackedTempDirs.splice(0).forEach((path) => rmSync(path, { recursive: true, force: true }))
})

describe('sync hardening regressions', () => {
  it('retries a deferred column.create when the board arrives later', () => {
    const userDataPath = createTempDir('stickban-user-data-')
    initializeDatabase(userDataPath)

    const boardId = randomUUID()
    const columnId = randomUUID()
    const deferredColumnCreate = buildOperation(
      'column.create',
      { boardId, columnId, cardId: undefined },
      { title: 'Remote Column', orderKey: 1024 }
    )
    const boardCreate = buildOperation('board.create', { boardId, columnId: undefined, cardId: undefined }, {
      title: 'Remote Board',
      orderKey: 1024
    })

    const deferredResult = applyRemoteOperation(deferredColumnCreate)
    expect(deferredResult.outcome).toBe('deferred')
    expect(isOperationApplied(deferredColumnCreate.operationId)).toBe(false)

    expect(applyRemoteOperation(boardCreate).outcome).toBe('applied')
    expect(applyRemoteOperation(deferredColumnCreate).outcome).toBe('applied')
    expect(isOperationApplied(deferredColumnCreate.operationId)).toBe(true)

    const workspace = getWorkspace()
    expect(workspace.boards.some((board) => board.title === 'Remote Board')).toBe(true)
    expect(
      workspace.boards.some((board) => board.columnCount >= 4)
    ).toBe(true)
  })

  it('retries a deferred card.create when the target column appears later', () => {
    const userDataPath = createTempDir('stickban-user-data-')
    initializeDatabase(userDataPath)

    const boardId = getWorkspace().activeBoard.id
    const columnId = randomUUID()
    const cardId = randomUUID()
    const cardCreate = buildOperation(
      'card.create',
      { boardId: undefined, columnId, cardId },
      {
        title: 'Remote Card',
        description: 'Deferred until the column exists',
        createdAt: '2026-03-25T18:00:00.000Z',
        updatedAt: '2026-03-25T18:00:00.000Z',
        orderKey: 1024
      }
    )
    const columnCreate = buildOperation(
      'column.create',
      { boardId, columnId, cardId: undefined },
      { title: 'Later Column', orderKey: 4096 }
    )

    expect(applyRemoteOperation(cardCreate).outcome).toBe('deferred')
    expect(isOperationApplied(cardCreate.operationId)).toBe(false)

    expect(applyRemoteOperation(columnCreate).outcome).toBe('applied')
    expect(applyRemoteOperation(cardCreate).outcome).toBe('applied')
    expect(isOperationApplied(cardCreate.operationId)).toBe(true)

    const targetColumn = getWorkspace().activeBoard.columns.find((column) => column.id === columnId)
    expect(targetColumn?.cards.map((card) => card.title)).toContain('Remote Card')
  })

  it('retries a deferred card.move when the destination column appears later', () => {
    const userDataPath = createTempDir('stickban-user-data-')
    initializeDatabase(userDataPath)

    let workspace = getWorkspace()
    const boardId = workspace.activeBoard.id
    const sourceColumnId = workspace.activeBoard.columns[0].id
    workspace = createCard(sourceColumnId, { title: 'Movable card', description: '' })
    const cardId = workspace.activeBoard.columns[0].cards[0].id
    const targetColumnId = randomUUID()

    const cardMove = buildOperation(
      'card.move',
      { boardId: undefined, columnId: targetColumnId, cardId },
      { columnId: targetColumnId, orderKey: 1024 }
    )
    const columnCreate = buildOperation(
      'column.create',
      { boardId, columnId: targetColumnId, cardId: undefined },
      { title: 'Destination', orderKey: 4096 }
    )

    expect(applyRemoteOperation(cardMove).outcome).toBe('deferred')
    expect(isOperationApplied(cardMove.operationId)).toBe(false)

    expect(applyRemoteOperation(columnCreate).outcome).toBe('applied')
    expect(applyRemoteOperation(cardMove).outcome).toBe('applied')
    expect(isOperationApplied(cardMove.operationId)).toBe(true)

    const destination = getWorkspace().activeBoard.columns.find((column) => column.id === targetColumnId)
    expect(destination?.cards.map((card) => card.id)).toContain(cardId)
  })

  it('imports a valid remote bootstrap plan from checkpoint plus later operations before any local export', async () => {
    const remoteFolder = createSyncFolder()
    const { remoteWorkspace } = await seedRemoteHistory(remoteFolder)

    const userDataPath = createTempDir('stickban-target-user-data-')
    initializeDatabase(userDataPath)
    const manager = createManager(userDataPath)
    attachFolder(manager, remoteFolder.folderPath)

    const status = await manager.syncNow()
    const workspace = getWorkspace()

    expect(status.lastError).toBeNull()
    expect(status.bootstrapConflict).toBeNull()
    expect(status.hasCompletedSync).toBe(true)
    expect(status.lastImportedAtUtc).not.toBeNull()
    expect(workspace.activeBoard.title).toBe(remoteWorkspace.activeBoard.title)
    expect(workspace.activeBoard.columns[0].cards[0].title).toBe('Updated remotely')
    expect(listJsonFiles(remoteFolder.checkpointsPath)).toHaveLength(1)
    expect(listJsonFiles(remoteFolder.operationsPath)).toHaveLength(1)
  })

  it('ignores unreadable remote files and exports an initial checkpoint instead of treating them as valid history', async () => {
    const userDataPath = createTempDir('stickban-user-data-')
    initializeDatabase(userDataPath)
    createBoard({ title: 'Local Board' })

    const remoteFolder = createSyncFolder()
    writeFileSync(join(remoteFolder.operationsPath, 'broken.json'), '{"invalid"')

    const manager = createManager(userDataPath)
    attachFolder(manager, remoteFolder.folderPath)

    const status = await manager.syncNow()
    const workspace = getWorkspace()

    expect(status.lastError).toBeNull()
    expect(status.bootstrapConflict).toBeNull()
    expect(status.hasCompletedSync).toBe(true)
    expect(workspace.activeBoard.title).toBe('Local Board')
    expect(listJsonFiles(remoteFolder.checkpointsPath)).toHaveLength(1)
    expect(status.notices.some((notice) => notice.message.includes('Ignored unreadable remote operation file broken.json.'))).toBe(
      true
    )
  })

  it('creates a local recovery backup before adopting a remote workspace over non-pristine local data', async () => {
    const remoteFolder = createSyncFolder()
    await seedRemoteHistory(remoteFolder)

    const userDataPath = createTempDir('stickban-user-data-')
    initializeDatabase(userDataPath)
    createBoard({ title: 'Local Board' })

    const manager = createManager(userDataPath)
    attachFolder(manager, remoteFolder.folderPath)

    const conflictStatus = await manager.syncNow()
    expect(conflictStatus.bootstrapConflict).not.toBeNull()
    expect(getWorkspace().activeBoard.title).toBe('Local Board')

    const adoptedStatus = await manager.adoptRemoteWorkspace()
    expect(adoptedStatus.lastError).toBeNull()
    expect(adoptedStatus.hasCompletedSync).toBe(true)
    expect(getWorkspace().activeBoard.title).toBe('Remote Board')

    const recoveryRoot = join(userDataPath, 'sync', 'recovery')
    const recoveryEntries = readdirSync(recoveryRoot)
    expect(recoveryEntries.length).toBeGreaterThan(0)

    const latestRecoveryDir = join(recoveryRoot, recoveryEntries[0])
    expect(existsSync(join(latestRecoveryDir, 'stickban.db'))).toBe(true)
    const metadata = JSON.parse(readFileSync(join(latestRecoveryDir, 'metadata.json'), 'utf8')) as { reason: string }
    expect(metadata.reason).toBe('adopt-remote-workspace')
  })

  it('preserves local data when remote adoption can no longer validate the pending remote workspace', async () => {
    const remoteFolder = createSyncFolder()
    await seedRemoteHistory(remoteFolder)

    const userDataPath = createTempDir('stickban-user-data-')
    initializeDatabase(userDataPath)
    createBoard({ title: 'Local Board' })

    const manager = createManager(userDataPath)
    attachFolder(manager, remoteFolder.folderPath)

    const conflictStatus = await manager.syncNow()
    expect(conflictStatus.bootstrapConflict).not.toBeNull()

    rmSync(remoteFolder.checkpointsPath, { recursive: true, force: true })
    rmSync(remoteFolder.operationsPath, { recursive: true, force: true })
    mkdirSync(remoteFolder.checkpointsPath, { recursive: true })
    mkdirSync(remoteFolder.operationsPath, { recursive: true })

    const adoptStatus = await manager.adoptRemoteWorkspace()
    expect(adoptStatus.lastError).toContain('could not validate the remote workspace')
    expect(getWorkspace().activeBoard.title).toBe('Local Board')
  })

  it('flushes pending local operations into the synced folder during shutdown handling', async () => {
    const userDataPath = createTempDir('stickban-user-data-')
    initializeDatabase(userDataPath)

    const remoteFolder = createSyncFolder()
    const manager = createManager(userDataPath)
    attachFolder(manager, remoteFolder.folderPath)

    await manager.syncNow()

    const firstColumnId = getWorkspace().activeBoard.columns[0].id
    createCard(firstColumnId, { title: 'Pending sync card', description: '' })
    await flushMicrotasks()

    expect(manager.getStatus().pendingLocalOperations).toBe(1)

    manager.flushPendingLocalOperationsToRemote()
    const status = manager.getStatus()

    expect(status.pendingLocalOperations).toBe(0)
    expect(status.lastExportedAtUtc).not.toBeNull()
    expect(status.hasCompletedSync).toBe(true)
    expect(listJsonFiles(remoteFolder.operationsPath)).toHaveLength(1)
  })

})
