import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import Database from 'better-sqlite3'
import type {
  BoardDraft,
  BoardRecord,
  BoardSummary,
  CardDraft,
  ColumnDraft,
  NoteSearchResult,
  SyncCheckpoint,
  SyncNotice,
  SyncOperation,
  SyncWorkspaceSnapshot,
  SyncVersion,
  WorkspaceRecord
} from '../shared/types'

const DEFAULT_COLUMNS = ['To Do', 'Doing', 'Done']
const ACTIVE_BOARD_KEY = 'active_board_id'
const DEVICE_ID_KEY = 'sync_device_id'
const LAMPORT_CLOCK_KEY = 'sync_lamport_clock'
const LAUNCH_ON_STARTUP_KEY = 'launch_on_startup'
const FLOATING_WINDOW_STATE_KEY = 'floating_window_state'
const ORDER_GAP = 1024
const MIN_ORDER_GAP = 0.000001

type EntityKind = 'board' | 'column' | 'card'
type SyncField = 'title' | 'description' | 'boardId' | 'columnId' | 'orderKey' | 'deletedAt'

interface EntityFieldState {
  version: SyncVersion
}

interface EntitySyncState {
  fields?: Partial<Record<SyncField, EntityFieldState>>
}

type OperationEmitter = (operation: SyncOperation) => void

export interface WorkspaceBootstrapState {
  boardCount: number
  columnCount: number
  cardCount: number
  hasAppliedOperations: boolean
  isPristineSeedWorkspace: boolean
}

export type RemoteOperationOutcome = 'applied' | 'noop' | 'deferred' | 'invalid'

export interface RemoteOperationApplyResult {
  outcome: RemoteOperationOutcome
  notices: SyncNotice[]
}

export interface FloatingWindowState {
  mode: 'launcher' | 'panel'
  x: number | null
  y: number | null
}

let db: Database.Database | null = null
let operationEmitter: OperationEmitter | null = null

function now(): string {
  return new Date().toISOString()
}

function createNotice(level: SyncNotice['level'], message: string): SyncNotice {
  return {
    id: createId(),
    level,
    message,
    createdAtUtc: now()
  }
}

function createId(): string {
  return randomUUID()
}

function createApplyResult(outcome: RemoteOperationOutcome, notices: SyncNotice[] = []): RemoteOperationApplyResult {
  return { outcome, notices }
}

function createInvalidOperationResult(operation: SyncOperation, reason: string): RemoteOperationApplyResult {
  return createApplyResult('invalid', [
    createNotice('warning', `Skipped invalid remote ${operation.kind} ${operation.operationId.slice(0, 8)} because ${reason}.`)
  ])
}

function createDeferredOperationResult(operation: SyncOperation, reason: string): RemoteOperationApplyResult {
  return createApplyResult('deferred', [
    createNotice('warning', `Deferred remote ${operation.kind} ${operation.operationId.slice(0, 8)} because ${reason}.`)
  ])
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized')
  }

  return db
}

function parseSyncState(value: string | null | undefined): EntitySyncState {
  if (!value) {
    return {}
  }

  try {
    return JSON.parse(value) as EntitySyncState
  } catch {
    return {}
  }
}

function serializeSyncState(state: EntitySyncState): string {
  return JSON.stringify(state)
}

function compareVersions(left: SyncVersion | null | undefined, right: SyncVersion | null | undefined): number {
  if (!left && !right) {
    return 0
  }

  if (!left) {
    return -1
  }

  if (!right) {
    return 1
  }

  if (left.clock !== right.clock) {
    return left.clock - right.clock
  }

  if (left.createdAtUtc !== right.createdAtUtc) {
    return left.createdAtUtc.localeCompare(right.createdAtUtc)
  }

  if (left.deviceId !== right.deviceId) {
    return left.deviceId.localeCompare(right.deviceId)
  }

  return left.operationId.localeCompare(right.operationId)
}

function setFieldVersion(syncState: EntitySyncState, field: SyncField, version: SyncVersion): EntitySyncState {
  const nextState = parseSyncState(serializeSyncState(syncState))
  nextState.fields = nextState.fields ?? {}
  nextState.fields[field] = { version }
  return nextState
}

function getFieldVersion(syncState: EntitySyncState, field: SyncField): SyncVersion | null {
  return syncState.fields?.[field]?.version ?? null
}

function hasColumn(tableName: string, columnName: string): boolean {
  const columns = getDb().prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>
  return columns.some((column) => column.name === columnName)
}

function getStateValue(key: string): string | null {
  const row = getDb()
    .prepare('SELECT value FROM app_state WHERE key = ?')
    .get(key) as { value: string } | undefined

  return row?.value ?? null
}

function setStateValue(key: string, value: string): void {
  getDb()
    .prepare(
      `
        INSERT INTO app_state (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `
    )
    .run(key, value)
}

function getBooleanStateValue(key: string, defaultValue = false): boolean {
  const value = getStateValue(key)
  if (value === null) {
    return defaultValue
  }

  return value === 'true'
}

function getCurrentLamportClock(): number {
  const value = getStateValue(LAMPORT_CLOCK_KEY)
  return value ? Number(value) : 0
}

function setCurrentLamportClock(clock: number): void {
  setStateValue(LAMPORT_CLOCK_KEY, String(clock))
}

function bumpLamportClock(baseClock = 0): number {
  const nextClock = Math.max(getCurrentLamportClock(), baseClock) + 1
  setCurrentLamportClock(nextClock)
  return nextClock
}

function observeRemoteClock(clock: number): void {
  const currentClock = getCurrentLamportClock()
  if (clock > currentClock) {
    setCurrentLamportClock(clock)
  }
}

function getOrCreateDeviceId(): string {
  const existing = getStateValue(DEVICE_ID_KEY)
  if (existing) {
    return existing
  }

  const deviceId = createId()
  setStateValue(DEVICE_ID_KEY, deviceId)
  return deviceId
}

function recordAppliedOperation(operation: SyncOperation): void {
  getDb()
    .prepare(
      `
        INSERT INTO applied_operations (operation_id, device_id, clock, created_at_utc)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(operation_id) DO NOTHING
      `
    )
    .run(operation.operationId, operation.deviceId, operation.clock, operation.createdAtUtc)

  observeRemoteClock(operation.clock)
}

function hasAppliedOperation(operationId: string): boolean {
  const row = getDb()
    .prepare('SELECT 1 FROM applied_operations WHERE operation_id = ?')
    .get(operationId) as { 1: number } | undefined

  return Boolean(row)
}

function getAppliedOperationIds(): string[] {
  return (
    getDb()
      .prepare('SELECT operation_id FROM applied_operations ORDER BY clock ASC, created_at_utc ASC, operation_id ASC')
      .all() as Array<{ operation_id: string }>
  ).map((row) => row.operation_id)
}

function getAppliedOperationCount(): number {
  const row = getDb().prepare('SELECT COUNT(*) AS count FROM applied_operations').get() as { count: number }
  return row.count
}

function validateWorkspaceSnapshot(workspace: SyncWorkspaceSnapshot): string | null {
  const liveBoards = new Set(workspace.boards.filter((board) => !board.deletedAt).map((board) => board.id))
  const liveColumns = workspace.columns.filter((column) => !column.deletedAt)
  const liveCards = workspace.cards.filter((card) => !card.deletedAt)
  const liveColumnIds = new Set(liveColumns.map((column) => column.id))

  if ((liveColumns.length > 0 || liveCards.length > 0) && liveBoards.size === 0) {
    return 'Workspace snapshot is invalid because it contains active columns or cards without any active board.'
  }

  for (const column of liveColumns) {
    if (!liveBoards.has(column.boardId)) {
      return `Workspace snapshot is invalid because column ${column.id} points to missing board ${column.boardId}.`
    }
  }

  for (const card of liveCards) {
    if (!liveColumnIds.has(card.columnId)) {
      return `Workspace snapshot is invalid because card ${card.id} points to missing column ${card.columnId}.`
    }
  }

  if (workspace.activeBoardId && liveBoards.size > 0 && !liveBoards.has(workspace.activeBoardId)) {
    return `Workspace snapshot is invalid because activeBoardId ${workspace.activeBoardId} does not exist among active boards.`
  }

  return null
}

export function validateCheckpointSnapshot(checkpoint: SyncCheckpoint): string | null {
  return validateWorkspaceSnapshot(checkpoint.workspace)
}

export function validateOperationShape(operation: SyncOperation): string | null {
  if (!isNonEmptyString(operation.operationId)) {
    return 'operationId is missing'
  }
  if (!isNonEmptyString(operation.deviceId)) {
    return 'deviceId is missing'
  }
  if (!isNonEmptyString(operation.createdAtUtc)) {
    return 'createdAtUtc is missing'
  }
  if (!isFiniteNumber(operation.clock)) {
    return 'clock is invalid'
  }
  if (!isFiniteNumber(operation.baseClock)) {
    return 'baseClock is invalid'
  }

  switch (operation.kind) {
    case 'board.create':
      if (!isNonEmptyString(operation.boardId)) {
        return 'boardId is missing'
      }
      if (!isNonEmptyString(operation.payload.title)) {
        return 'payload.title is missing'
      }
      if (!isFiniteNumber(operation.payload.orderKey)) {
        return 'payload.orderKey is invalid'
      }
      return null
    case 'board.update':
      if (!isNonEmptyString(operation.boardId)) {
        return 'boardId is missing'
      }
      if (!isNonEmptyString(operation.payload.title)) {
        return 'payload.title is missing'
      }
      return null
    case 'board.delete':
      return isNonEmptyString(operation.boardId) ? null : 'boardId is missing'
    case 'column.create':
      if (!isNonEmptyString(operation.columnId)) {
        return 'columnId is missing'
      }
      if (!isNonEmptyString(operation.boardId ?? operation.payload.boardId)) {
        return 'boardId is missing'
      }
      if (!isNonEmptyString(operation.payload.title)) {
        return 'payload.title is missing'
      }
      if (!isFiniteNumber(operation.payload.orderKey)) {
        return 'payload.orderKey is invalid'
      }
      return null
    case 'column.update':
      if (!isNonEmptyString(operation.columnId)) {
        return 'columnId is missing'
      }
      return isNonEmptyString(operation.payload.title) ? null : 'payload.title is missing'
    case 'column.delete':
      return isNonEmptyString(operation.columnId) ? null : 'columnId is missing'
    case 'column.move':
      if (!isNonEmptyString(operation.columnId)) {
        return 'columnId is missing'
      }
      if (!isNonEmptyString(operation.boardId ?? operation.payload.boardId)) {
        return 'boardId is missing'
      }
      return isFiniteNumber(operation.payload.orderKey) ? null : 'payload.orderKey is invalid'
    case 'card.create':
      if (!isNonEmptyString(operation.cardId)) {
        return 'cardId is missing'
      }
      if (!isNonEmptyString(operation.columnId ?? operation.payload.columnId)) {
        return 'columnId is missing'
      }
      if (!isNonEmptyString(operation.payload.title)) {
        return 'payload.title is missing'
      }
      if (typeof operation.payload.description !== 'string') {
        return 'payload.description is invalid'
      }
      if (!isNonEmptyString(operation.payload.createdAt)) {
        return 'payload.createdAt is missing'
      }
      if (!isNonEmptyString(operation.payload.updatedAt)) {
        return 'payload.updatedAt is missing'
      }
      return isFiniteNumber(operation.payload.orderKey) ? null : 'payload.orderKey is invalid'
    case 'card.update':
      if (!isNonEmptyString(operation.cardId)) {
        return 'cardId is missing'
      }
      if (typeof operation.payload.title !== 'string' && typeof operation.payload.description !== 'string') {
        return 'payload must contain title or description'
      }
      return null
    case 'card.delete':
      return isNonEmptyString(operation.cardId) ? null : 'cardId is missing'
    case 'card.move':
      if (!isNonEmptyString(operation.cardId)) {
        return 'cardId is missing'
      }
      if (!isNonEmptyString(operation.columnId ?? operation.payload.columnId)) {
        return 'columnId is missing'
      }
      return isFiniteNumber(operation.payload.orderKey) ? null : 'payload.orderKey is invalid'
    default:
      return 'operation kind is unsupported'
  }
}

function sortRowsByOrder<T extends { id: string; order_key: number }>(rows: T[]): T[] {
  return rows.sort((left, right) => {
    if (left.order_key !== right.order_key) {
      return left.order_key - right.order_key
    }

    return left.id.localeCompare(right.id)
  })
}

function normalizeBoardPositions(): void {
  const rows = sortRowsByOrder(
    getDb()
      .prepare('SELECT id, order_key FROM boards WHERE deleted_at IS NULL')
      .all() as Array<{ id: string; order_key: number }>
  )
  const update = getDb().prepare('UPDATE boards SET position = ?, order_key = ? WHERE id = ?')
  rows.forEach((row, index) => {
    update.run(index, (index + 1) * ORDER_GAP, row.id)
  })
}

function normalizeColumnPositions(boardId: string): void {
  const rows = sortRowsByOrder(
    getDb()
      .prepare('SELECT id, order_key FROM columns WHERE board_id = ? AND deleted_at IS NULL')
      .all(boardId) as Array<{ id: string; order_key: number }>
  )
  const update = getDb().prepare('UPDATE columns SET position = ?, order_key = ? WHERE id = ?')
  rows.forEach((row, index) => {
    update.run(index, (index + 1) * ORDER_GAP, row.id)
  })
}

function normalizeCardPositions(columnId: string): void {
  const rows = sortRowsByOrder(
    getDb()
      .prepare('SELECT id, order_key FROM cards WHERE column_id = ? AND deleted_at IS NULL')
      .all(columnId) as Array<{ id: string; order_key: number }>
  )
  const update = getDb().prepare('UPDATE cards SET position = ?, order_key = ? WHERE id = ?')
  rows.forEach((row, index) => {
    update.run(index, (index + 1) * ORDER_GAP, row.id)
  })
}

function computeOrderKey(before: number | null, after: number | null): number {
  if (before === null && after === null) {
    return ORDER_GAP
  }

  if (before === null) {
    return after! - ORDER_GAP
  }

  if (after === null) {
    return before + ORDER_GAP
  }

  return before + (after - before) / 2
}

function ensureOrderKeyGap(
  kind: EntityKind,
  parentId: string | null,
  before: number | null,
  after: number | null
): number {
  if (before !== null && after !== null && Math.abs(after - before) < MIN_ORDER_GAP) {
    if (kind === 'board') {
      normalizeBoardPositions()
    } else if (kind === 'column') {
      normalizeColumnPositions(parentId!)
    } else {
      normalizeCardPositions(parentId!)
    }
  }

  return computeOrderKey(before, after)
}

function getBoardRows(): Array<{ id: string; title: string; order_key: number }> {
  return sortRowsByOrder(
    getDb()
      .prepare('SELECT id, title, order_key FROM boards WHERE deleted_at IS NULL')
      .all() as Array<{ id: string; title: string; order_key: number }>
  )
}

function getFallbackBoardId(): string {
  const boards = getBoardRows()
  if (boards.length === 0) {
    throw new Error('No boards available')
  }

  return boards[0].id
}

function resolveActiveBoardId(): string {
  const preferred = getStateValue(ACTIVE_BOARD_KEY)
  if (preferred) {
    const exists = getDb()
      .prepare('SELECT 1 FROM boards WHERE id = ? AND deleted_at IS NULL')
      .get(preferred) as { 1: number } | undefined
    if (exists) {
      return preferred
    }
  }

  const fallback = getFallbackBoardId()
  setStateValue(ACTIVE_BOARD_KEY, fallback)
  return fallback
}

function getOrderedColumns(boardId: string): Array<{
  id: string
  board_id: string
  title: string
  order_key: number
}> {
  return sortRowsByOrder(
    getDb()
      .prepare('SELECT id, board_id, title, order_key FROM columns WHERE board_id = ? AND deleted_at IS NULL')
      .all(boardId) as Array<{ id: string; board_id: string; title: string; order_key: number }>
  )
}

function getOrderedCards(columnId: string): Array<{
  id: string
  column_id: string
  title: string
  description: string
  created_at: string
  updated_at: string
  order_key: number
}> {
  return sortRowsByOrder(
    getDb()
      .prepare(
        `
          SELECT id, column_id, title, description, created_at, updated_at, order_key
          FROM cards
          WHERE column_id = ? AND deleted_at IS NULL
        `
      )
      .all(columnId) as Array<{
      id: string
      column_id: string
      title: string
      description: string
      created_at: string
      updated_at: string
      order_key: number
    }>
  )
}

function buildDefaultColumnsPayload(): Array<{ id: string; title: string; orderKey: number }> {
  return DEFAULT_COLUMNS.map((title, index) => ({
    id: createId(),
    title,
    orderKey: (index + 1) * ORDER_GAP
  }))
}

function createDefaultColumns(boardId: string, defaults = buildDefaultColumnsPayload()): void {
  const insertColumn = getDb().prepare(
    `
      INSERT INTO columns (id, board_id, title, position, order_key, deleted_at, sync_state)
      VALUES (?, ?, ?, ?, ?, NULL, ?)
    `
  )

  defaults.forEach((column, index) => {
    insertColumn.run(column.id, boardId, column.title, index, column.orderKey, serializeSyncState({}))
  })
}

function initializeSchema(): void {
  const database = getDb()

  database.exec(`
    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      order_key REAL NOT NULL DEFAULT 0,
      deleted_at TEXT,
      sync_state TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS columns (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL,
      title TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      order_key REAL NOT NULL DEFAULT 0,
      deleted_at TEXT,
      sync_state TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY(board_id) REFERENCES boards(id)
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      column_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      position INTEGER NOT NULL DEFAULT 0,
      order_key REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      sync_state TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY(column_id) REFERENCES columns(id)
    );

    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS applied_operations (
      operation_id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      clock INTEGER NOT NULL,
      created_at_utc TEXT NOT NULL
    );
  `)

  if (!hasColumn('boards', 'position')) {
    database.exec('ALTER TABLE boards ADD COLUMN position INTEGER NOT NULL DEFAULT 0')
  }
  if (!hasColumn('boards', 'order_key')) {
    database.exec('ALTER TABLE boards ADD COLUMN order_key REAL NOT NULL DEFAULT 0')
    database.exec('UPDATE boards SET order_key = (position + 1) * 1024 WHERE order_key = 0')
  }
  if (!hasColumn('boards', 'deleted_at')) {
    database.exec('ALTER TABLE boards ADD COLUMN deleted_at TEXT')
  }
  if (!hasColumn('boards', 'sync_state')) {
    database.exec(`ALTER TABLE boards ADD COLUMN sync_state TEXT NOT NULL DEFAULT '{}'`)
  }
  if (!hasColumn('columns', 'position')) {
    database.exec('ALTER TABLE columns ADD COLUMN position INTEGER NOT NULL DEFAULT 0')
  }
  if (!hasColumn('columns', 'order_key')) {
    database.exec('ALTER TABLE columns ADD COLUMN order_key REAL NOT NULL DEFAULT 0')
    database.exec('UPDATE columns SET order_key = (position + 1) * 1024 WHERE order_key = 0')
  }
  if (!hasColumn('columns', 'deleted_at')) {
    database.exec('ALTER TABLE columns ADD COLUMN deleted_at TEXT')
  }
  if (!hasColumn('columns', 'sync_state')) {
    database.exec(`ALTER TABLE columns ADD COLUMN sync_state TEXT NOT NULL DEFAULT '{}'`)
  }
  if (!hasColumn('cards', 'order_key')) {
    database.exec('ALTER TABLE cards ADD COLUMN order_key REAL NOT NULL DEFAULT 0')
    database.exec('UPDATE cards SET order_key = (position + 1) * 1024 WHERE order_key = 0')
  }
  if (!hasColumn('cards', 'deleted_at')) {
    database.exec('ALTER TABLE cards ADD COLUMN deleted_at TEXT')
  }
  if (!hasColumn('cards', 'sync_state')) {
    database.exec(`ALTER TABLE cards ADD COLUMN sync_state TEXT NOT NULL DEFAULT '{}'`)
  }
}

function seedDatabase(): void {
  const database = getDb()
  const boardCount = database
    .prepare('SELECT COUNT(*) AS count FROM boards WHERE deleted_at IS NULL')
    .get() as { count: number }

  if (boardCount.count === 0) {
    const boardId = createId()
    const seed = database.transaction(() => {
      database
        .prepare(
          `
            INSERT INTO boards (id, title, position, order_key, deleted_at, sync_state)
            VALUES (?, ?, ?, ?, NULL, ?)
          `
        )
        .run(boardId, '默认分组', 0, ORDER_GAP, serializeSyncState({}))
      createDefaultColumns(boardId)
      setStateValue(ACTIVE_BOARD_KEY, boardId)
    })

    seed()
    return
  }

  const migrate = database.transaction(() => {
    normalizeBoardPositions()
    const boards = getBoardRows()
    boards.forEach((board) => {
      const columnCount = database
        .prepare('SELECT COUNT(*) AS count FROM columns WHERE board_id = ? AND deleted_at IS NULL')
        .get(board.id) as { count: number }

      if (columnCount.count === 0) {
        createDefaultColumns(board.id)
      } else {
        normalizeColumnPositions(board.id)
        getOrderedColumns(board.id).forEach((column) => normalizeCardPositions(column.id))
      }
    })

    if (!getStateValue(ACTIVE_BOARD_KEY) && boards[0]) {
      setStateValue(ACTIVE_BOARD_KEY, boards[0].id)
    }
  })

  migrate()
}

function buildOperation(
  kind: SyncOperation['kind'],
  ids: Pick<SyncOperation, 'boardId' | 'columnId' | 'cardId'>,
  payload: Record<string, unknown>
): SyncOperation {
  const baseClock = getCurrentLamportClock()
  const operation: SyncOperation = {
    operationId: createId(),
    deviceId: getOrCreateDeviceId(),
    createdAtUtc: now(),
    clock: bumpLamportClock(baseClock),
    baseClock,
    kind,
    ...ids,
    payload
  }

  recordAppliedOperation(operation)
  return operation
}

function versionFromOperation(operation: SyncOperation): SyncVersion {
  return {
    clock: operation.clock,
    createdAtUtc: operation.createdAtUtc,
    operationId: operation.operationId,
    deviceId: operation.deviceId
  }
}

function emitOperation(operation: SyncOperation): void {
  if (!operationEmitter) {
    return
  }

  queueMicrotask(() => operationEmitter?.(operation))
}

function persistLocalMutation(operation: SyncOperation): WorkspaceRecord {
  emitOperation(operation)
  return getWorkspace()
}

function getBoardById(boardId: string): BoardRecord {
  const board = getDb()
    .prepare('SELECT id, title FROM boards WHERE id = ? AND deleted_at IS NULL')
    .get(boardId) as { id: string; title: string } | undefined

  if (!board) {
    throw new Error('Board not found')
  }

  const columns = getOrderedColumns(boardId)
  return {
    id: board.id,
    title: board.title,
    position: 0,
    columns: columns.map((column, columnIndex) => ({
      id: column.id,
      boardId: column.board_id,
      title: column.title,
      position: columnIndex,
      cards: getOrderedCards(column.id).map((card, cardIndex) => ({
        id: card.id,
        columnId: card.column_id,
        title: card.title,
        description: card.description,
        position: cardIndex,
        createdAt: card.created_at,
        updatedAt: card.updated_at
      }))
    }))
  }
}

function getBoardSummaries(): BoardSummary[] {
  const database = getDb()
  return getBoardRows().map((board, index) => {
    const columnRows = getOrderedColumns(board.id)
    const cardCount = columnRows.reduce((total, column) => {
      const row = database
        .prepare('SELECT COUNT(*) AS count FROM cards WHERE column_id = ? AND deleted_at IS NULL')
        .get(column.id) as { count: number }
      return total + row.count
    }, 0)

    return {
      id: board.id,
      title: board.title,
      position: index,
      columnCount: columnRows.length,
      cardCount
    }
  })
}

function ensureBoardExists(boardId: string): void {
  const row = getDb()
    .prepare('SELECT 1 FROM boards WHERE id = ? AND deleted_at IS NULL')
    .get(boardId) as { 1: number } | undefined

  if (!row) {
    throw new Error('Board not found')
  }
}

function ensureColumnExists(columnId: string): { boardId: string } {
  const row = getDb()
    .prepare('SELECT board_id FROM columns WHERE id = ? AND deleted_at IS NULL')
    .get(columnId) as { board_id: string } | undefined

  if (!row) {
    throw new Error('Column not found')
  }

  return { boardId: row.board_id }
}

function getColumnTargetOrderKey(boardId: string, toIndex: number): number {
  const targetRows = getOrderedColumns(boardId)
  const boundedIndex = Math.max(0, Math.min(toIndex, targetRows.length))
  const before = boundedIndex > 0 ? targetRows[boundedIndex - 1].order_key : null
  const after = boundedIndex < targetRows.length ? targetRows[boundedIndex].order_key : null
  return ensureOrderKeyGap('column', boardId, before, after)
}

function getCardTargetOrderKey(columnId: string, toIndex: number, excludeCardId?: string): number {
  const targetRows = getOrderedCards(columnId).filter((card) => card.id !== excludeCardId)
  const boundedIndex = Math.max(0, Math.min(toIndex, targetRows.length))
  const before = boundedIndex > 0 ? targetRows[boundedIndex - 1].order_key : null
  const after = boundedIndex < targetRows.length ? targetRows[boundedIndex].order_key : null
  return ensureOrderKeyGap('card', columnId, before, after)
}

function applyBoardCreate(operation: SyncOperation): RemoteOperationApplyResult {
  const database = getDb()
  const boardId = operation.boardId
  const title = String(operation.payload.title ?? '').trim()
  const orderKey = Number(operation.payload.orderKey ?? ORDER_GAP)
  const defaultColumns = Array.isArray(operation.payload.defaultColumns)
    ? (operation.payload.defaultColumns as Array<{ id: string; title: string; orderKey: number }>)
    : buildDefaultColumnsPayload()
  if (!boardId || !title) {
    return createInvalidOperationResult(operation, 'required board fields are missing')
  }

  const existing = database
    .prepare('SELECT deleted_at, sync_state FROM boards WHERE id = ?')
    .get(boardId) as { deleted_at: string | null; sync_state: string } | undefined
  if (existing) {
    return createApplyResult('noop')
  }

  const syncState = setFieldVersion({}, 'title', versionFromOperation(operation))
  database
    .prepare(
      `
        INSERT INTO boards (id, title, position, order_key, deleted_at, sync_state)
        VALUES (?, ?, 0, ?, NULL, ?)
      `
    )
    .run(boardId, title, orderKey, serializeSyncState(syncState))

  createDefaultColumns(boardId, defaultColumns)
  normalizeBoardPositions()
  return createApplyResult('applied')
}

function applyBoardUpdate(operation: SyncOperation): RemoteOperationApplyResult {
  const boardId = operation.boardId
  const title = String(operation.payload.title ?? '').trim()
  if (!boardId || !title) {
    return createInvalidOperationResult(operation, 'required board fields are missing')
  }

  const row = getDb()
    .prepare('SELECT title, sync_state, deleted_at FROM boards WHERE id = ?')
    .get(boardId) as { title: string; sync_state: string; deleted_at: string | null } | undefined
  if (!row) {
    return createDeferredOperationResult(operation, `board ${boardId} does not exist locally yet`)
  }
  if (row.deleted_at) {
    return createApplyResult('noop')
  }

  const syncState = parseSyncState(row.sync_state)
  const incomingVersion = versionFromOperation(operation)
  if (compareVersions(incomingVersion, getFieldVersion(syncState, 'title')) <= 0) {
    return createApplyResult('noop')
  }

  const nextState = setFieldVersion(syncState, 'title', incomingVersion)
  getDb().prepare('UPDATE boards SET title = ?, sync_state = ? WHERE id = ?').run(title, serializeSyncState(nextState), boardId)
  return createApplyResult('applied')
}

function applyBoardDelete(operation: SyncOperation): RemoteOperationApplyResult {
  const boardId = operation.boardId
  if (!boardId) {
    return createInvalidOperationResult(operation, 'boardId is missing')
  }

  const database = getDb()
  const board = database
    .prepare('SELECT sync_state, deleted_at FROM boards WHERE id = ?')
    .get(boardId) as { sync_state: string; deleted_at: string | null } | undefined
  if (!board) {
    return createDeferredOperationResult(operation, `board ${boardId} does not exist locally yet`)
  }
  if (board.deleted_at) {
    return createApplyResult('noop')
  }

  const remaining = database
    .prepare('SELECT COUNT(*) AS count FROM boards WHERE deleted_at IS NULL')
    .get() as { count: number }
  if (remaining.count <= 1) {
    return createApplyResult('invalid', [
      {
        id: createId(),
        level: 'warning',
        message: 'Skipped a remote board delete because at least one board must remain available.',
        createdAtUtc: now()
      }
    ])
  }

  const deleteVersion = versionFromOperation(operation)
  const markDeleted = (table: 'boards' | 'columns' | 'cards', id: string): void => {
    const row = database
      .prepare(`SELECT sync_state, deleted_at FROM ${table} WHERE id = ?`)
      .get(id) as { sync_state: string; deleted_at: string | null } | undefined
    if (!row || row.deleted_at) {
      return
    }

    const nextState = setFieldVersion(parseSyncState(row.sync_state), 'deletedAt', deleteVersion)
    database
      .prepare(`UPDATE ${table} SET deleted_at = ?, sync_state = ? WHERE id = ?`)
      .run(deleteVersion.createdAtUtc, serializeSyncState(nextState), id)
  }

  markDeleted('boards', boardId)
  const columns = database
    .prepare('SELECT id FROM columns WHERE board_id = ? AND deleted_at IS NULL')
    .all(boardId) as Array<{ id: string }>
  columns.forEach((column) => {
    markDeleted('columns', column.id)
    const cards = database
      .prepare('SELECT id FROM cards WHERE column_id = ? AND deleted_at IS NULL')
      .all(column.id) as Array<{ id: string }>
    cards.forEach((card) => markDeleted('cards', card.id))
  })

  normalizeBoardPositions()
  const activeBoardId = getStateValue(ACTIVE_BOARD_KEY)
  if (activeBoardId === boardId) {
    setStateValue(ACTIVE_BOARD_KEY, getFallbackBoardId())
  }

  return createApplyResult('applied')
}

function applyColumnCreate(operation: SyncOperation): RemoteOperationApplyResult {
  const columnId = operation.columnId
  const boardId = operation.boardId ?? String(operation.payload.boardId ?? '')
  const title = String(operation.payload.title ?? '').trim()
  const orderKey = Number(operation.payload.orderKey ?? ORDER_GAP)
  if (!columnId || !boardId || !title) {
    return createInvalidOperationResult(operation, 'required column fields are missing')
  }

  const board = getDb()
    .prepare('SELECT deleted_at FROM boards WHERE id = ?')
    .get(boardId) as { deleted_at: string | null } | undefined
  if (!board) {
    return createDeferredOperationResult(operation, `board ${boardId} does not exist locally yet`)
  }
  if (board.deleted_at) {
    return createApplyResult('noop')
  }

  const existing = getDb()
    .prepare('SELECT id FROM columns WHERE id = ?')
    .get(columnId) as { id: string } | undefined
  if (existing) {
    return createApplyResult('noop')
  }

  const syncState = setFieldVersion({}, 'title', versionFromOperation(operation))
  getDb()
    .prepare(
      `
        INSERT INTO columns (id, board_id, title, position, order_key, deleted_at, sync_state)
        VALUES (?, ?, ?, 0, ?, NULL, ?)
      `
    )
    .run(columnId, boardId, title, orderKey, serializeSyncState(syncState))
  normalizeColumnPositions(boardId)
  return createApplyResult('applied')
}

function applyColumnUpdate(operation: SyncOperation): RemoteOperationApplyResult {
  const columnId = operation.columnId
  const title = String(operation.payload.title ?? '').trim()
  if (!columnId || !title) {
    return createInvalidOperationResult(operation, 'required column fields are missing')
  }

  const row = getDb()
    .prepare('SELECT sync_state, deleted_at FROM columns WHERE id = ?')
    .get(columnId) as { sync_state: string; deleted_at: string | null } | undefined
  if (!row) {
    return createDeferredOperationResult(operation, `column ${columnId} does not exist locally yet`)
  }
  if (row.deleted_at) {
    return createApplyResult('noop')
  }

  const version = versionFromOperation(operation)
  const syncState = parseSyncState(row.sync_state)
  if (compareVersions(version, getFieldVersion(syncState, 'title')) <= 0) {
    return createApplyResult('noop')
  }

  const nextState = setFieldVersion(syncState, 'title', version)
  getDb().prepare('UPDATE columns SET title = ?, sync_state = ? WHERE id = ?').run(title, serializeSyncState(nextState), columnId)
  return createApplyResult('applied')
}

function applyColumnDelete(operation: SyncOperation): RemoteOperationApplyResult {
  const columnId = operation.columnId
  if (!columnId) {
    return createInvalidOperationResult(operation, 'columnId is missing')
  }

  const database = getDb()
  const column = database
    .prepare('SELECT board_id, sync_state, deleted_at FROM columns WHERE id = ?')
    .get(columnId) as { board_id: string; sync_state: string; deleted_at: string | null } | undefined
  if (!column) {
    return createDeferredOperationResult(operation, `column ${columnId} does not exist locally yet`)
  }
  if (column.deleted_at) {
    return createApplyResult('noop')
  }

  const deleteVersion = versionFromOperation(operation)
  const columnState = setFieldVersion(parseSyncState(column.sync_state), 'deletedAt', deleteVersion)
  database
    .prepare('UPDATE columns SET deleted_at = ?, sync_state = ? WHERE id = ?')
    .run(deleteVersion.createdAtUtc, serializeSyncState(columnState), columnId)

  const cards = database
    .prepare('SELECT id, sync_state FROM cards WHERE column_id = ? AND deleted_at IS NULL')
    .all(columnId) as Array<{ id: string; sync_state: string }>
  cards.forEach((card) => {
    const cardState = setFieldVersion(parseSyncState(card.sync_state), 'deletedAt', deleteVersion)
    database
      .prepare('UPDATE cards SET deleted_at = ?, sync_state = ? WHERE id = ?')
      .run(deleteVersion.createdAtUtc, serializeSyncState(cardState), card.id)
  })

  normalizeColumnPositions(column.board_id)
  return createApplyResult('applied')
}

function applyColumnMove(operation: SyncOperation): RemoteOperationApplyResult {
  const columnId = operation.columnId
  const boardId = operation.boardId ?? String(operation.payload.boardId ?? '')
  const orderKey = Number(operation.payload.orderKey ?? ORDER_GAP)
  if (!columnId || !boardId) {
    return createInvalidOperationResult(operation, 'required column move fields are missing')
  }

  const targetBoard = getDb()
    .prepare('SELECT deleted_at FROM boards WHERE id = ?')
    .get(boardId) as { deleted_at: string | null } | undefined
  if (!targetBoard) {
    return createDeferredOperationResult(operation, `target board ${boardId} does not exist locally yet`)
  }
  if (targetBoard.deleted_at) {
    return createApplyResult('noop')
  }

  const row = getDb()
    .prepare('SELECT sync_state, deleted_at, board_id FROM columns WHERE id = ?')
    .get(columnId) as { sync_state: string; deleted_at: string | null; board_id: string } | undefined
  if (!row) {
    return createDeferredOperationResult(operation, `column ${columnId} does not exist locally yet`)
  }
  if (row.deleted_at) {
    return createApplyResult('noop')
  }

  const version = versionFromOperation(operation)
  const syncState = parseSyncState(row.sync_state)
  const nextState = parseSyncState(row.sync_state)
  let changed = false

  if (compareVersions(version, getFieldVersion(syncState, 'boardId')) > 0) {
    nextState.fields = nextState.fields ?? {}
    nextState.fields.boardId = { version }
    changed = true
  }

  if (compareVersions(version, getFieldVersion(syncState, 'orderKey')) > 0) {
    nextState.fields = nextState.fields ?? {}
    nextState.fields.orderKey = { version }
    changed = true
  }

  if (!changed) {
    return createApplyResult('noop')
  }

  getDb()
    .prepare('UPDATE columns SET board_id = ?, order_key = ?, sync_state = ? WHERE id = ?')
    .run(boardId, orderKey, serializeSyncState(nextState), columnId)
  normalizeColumnPositions(row.board_id)
  normalizeColumnPositions(boardId)
  return createApplyResult('applied')
}

function applyCardCreate(operation: SyncOperation): RemoteOperationApplyResult {
  const cardId = operation.cardId
  const columnId = operation.columnId ?? String(operation.payload.columnId ?? '')
  const title = String(operation.payload.title ?? '').trim()
  const description = String(operation.payload.description ?? '')
  const createdAt = String(operation.payload.createdAt ?? operation.createdAtUtc)
  const updatedAt = String(operation.payload.updatedAt ?? operation.createdAtUtc)
  const orderKey = Number(operation.payload.orderKey ?? ORDER_GAP)
  if (!cardId || !columnId || !title) {
    return createInvalidOperationResult(operation, 'required card fields are missing')
  }

  const column = getDb()
    .prepare('SELECT deleted_at FROM columns WHERE id = ?')
    .get(columnId) as { deleted_at: string | null } | undefined
  if (!column) {
    return createDeferredOperationResult(operation, `column ${columnId} does not exist locally yet`)
  }
  if (column.deleted_at) {
    return createApplyResult('noop')
  }

  const existing = getDb()
    .prepare('SELECT id FROM cards WHERE id = ?')
    .get(cardId) as { id: string } | undefined
  if (existing) {
    return createApplyResult('noop')
  }

  const version = versionFromOperation(operation)
  let syncState = setFieldVersion({}, 'title', version)
  syncState = setFieldVersion(syncState, 'description', version)
  getDb()
    .prepare(
      `
        INSERT INTO cards (id, column_id, title, description, position, order_key, created_at, updated_at, deleted_at, sync_state)
        VALUES (?, ?, ?, ?, 0, ?, ?, ?, NULL, ?)
      `
    )
    .run(cardId, columnId, title, description, orderKey, createdAt, updatedAt, serializeSyncState(syncState))
  normalizeCardPositions(columnId)
  return createApplyResult('applied')
}

function applyCardUpdate(operation: SyncOperation): RemoteOperationApplyResult {
  const cardId = operation.cardId
  if (!cardId) {
    return createInvalidOperationResult(operation, 'cardId is missing')
  }

  const row = getDb()
    .prepare('SELECT title, description, sync_state, deleted_at FROM cards WHERE id = ?')
    .get(cardId) as { title: string; description: string; sync_state: string; deleted_at: string | null } | undefined
  if (!row) {
    return createDeferredOperationResult(operation, `card ${cardId} does not exist locally yet`)
  }
  if (row.deleted_at) {
    return createApplyResult('noop')
  }

  const version = versionFromOperation(operation)
  let changed = false
  let nextTitle = row.title
  let nextDescription = row.description
  let nextState = parseSyncState(row.sync_state)

  if (typeof operation.payload.title === 'string' && compareVersions(version, getFieldVersion(nextState, 'title')) > 0) {
    nextTitle = operation.payload.title
    nextState = setFieldVersion(nextState, 'title', version)
    changed = true
  }

  if (
    typeof operation.payload.description === 'string' &&
    compareVersions(version, getFieldVersion(nextState, 'description')) > 0
  ) {
    nextDescription = operation.payload.description
    nextState = setFieldVersion(nextState, 'description', version)
    changed = true
  }

  if (!changed) {
    return createApplyResult('noop')
  }

  getDb()
    .prepare('UPDATE cards SET title = ?, description = ?, updated_at = ?, sync_state = ? WHERE id = ?')
    .run(nextTitle, nextDescription, version.createdAtUtc, serializeSyncState(nextState), cardId)
  return createApplyResult('applied')
}

function applyCardDelete(operation: SyncOperation): RemoteOperationApplyResult {
  const cardId = operation.cardId
  if (!cardId) {
    return createInvalidOperationResult(operation, 'cardId is missing')
  }

  const row = getDb()
    .prepare('SELECT column_id, sync_state, deleted_at FROM cards WHERE id = ?')
    .get(cardId) as { column_id: string; sync_state: string; deleted_at: string | null } | undefined
  if (!row) {
    return createDeferredOperationResult(operation, `card ${cardId} does not exist locally yet`)
  }
  if (row.deleted_at) {
    return createApplyResult('noop')
  }

  const deleteVersion = versionFromOperation(operation)
  const nextState = setFieldVersion(parseSyncState(row.sync_state), 'deletedAt', deleteVersion)
  getDb()
    .prepare('UPDATE cards SET deleted_at = ?, updated_at = ?, sync_state = ? WHERE id = ?')
    .run(deleteVersion.createdAtUtc, deleteVersion.createdAtUtc, serializeSyncState(nextState), cardId)
  normalizeCardPositions(row.column_id)
  return createApplyResult('applied')
}

function applyCardMove(operation: SyncOperation): RemoteOperationApplyResult {
  const cardId = operation.cardId
  const columnId = operation.columnId ?? String(operation.payload.columnId ?? '')
  const orderKey = Number(operation.payload.orderKey ?? ORDER_GAP)
  if (!cardId || !columnId) {
    return createInvalidOperationResult(operation, 'required card move fields are missing')
  }

  const targetColumn = getDb()
    .prepare('SELECT deleted_at FROM columns WHERE id = ?')
    .get(columnId) as { deleted_at: string | null } | undefined
  if (!targetColumn) {
    return createDeferredOperationResult(operation, `target column ${columnId} does not exist locally yet`)
  }
  if (targetColumn.deleted_at) {
    return createApplyResult('noop')
  }

  const row = getDb()
    .prepare('SELECT column_id, sync_state, deleted_at FROM cards WHERE id = ?')
    .get(cardId) as { column_id: string; sync_state: string; deleted_at: string | null } | undefined
  if (!row) {
    return createDeferredOperationResult(operation, `card ${cardId} does not exist locally yet`)
  }
  if (row.deleted_at) {
    return createApplyResult('noop')
  }

  const version = versionFromOperation(operation)
  const syncState = parseSyncState(row.sync_state)
  const nextState = parseSyncState(row.sync_state)
  let changed = false

  if (compareVersions(version, getFieldVersion(syncState, 'columnId')) > 0) {
    nextState.fields = nextState.fields ?? {}
    nextState.fields.columnId = { version }
    changed = true
  }

  if (compareVersions(version, getFieldVersion(syncState, 'orderKey')) > 0) {
    nextState.fields = nextState.fields ?? {}
    nextState.fields.orderKey = { version }
    changed = true
  }

  if (!changed) {
    return createApplyResult('noop')
  }

  getDb()
    .prepare('UPDATE cards SET column_id = ?, order_key = ?, updated_at = ?, sync_state = ? WHERE id = ?')
    .run(columnId, orderKey, version.createdAtUtc, serializeSyncState(nextState), cardId)
  normalizeCardPositions(row.column_id)
  normalizeCardPositions(columnId)
  return createApplyResult('applied')
}

export function initializeDatabase(userDataPath: string): void {
  if (db) {
    db.close()
    db = null
  }

  const databasePath = join(userDataPath, 'data', 'renyiqian.db')
  mkdirSync(dirname(databasePath), { recursive: true })

  db = new Database(databasePath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = OFF')

  initializeSchema()
  seedDatabase()
  getOrCreateDeviceId()
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }

  operationEmitter = null
}

export function getLaunchOnStartupPreference(): boolean {
  return getBooleanStateValue(LAUNCH_ON_STARTUP_KEY, false)
}

export function setLaunchOnStartupPreference(value: boolean): void {
  setStateValue(LAUNCH_ON_STARTUP_KEY, value ? 'true' : 'false')
}

export function getFloatingWindowState(): FloatingWindowState {
  const value = getStateValue(FLOATING_WINDOW_STATE_KEY)
  if (!value) {
    return {
      mode: 'launcher',
      x: null,
      y: null
    }
  }

  try {
    const parsed = JSON.parse(value) as Partial<FloatingWindowState>
    return {
      mode: parsed.mode === 'panel' ? 'panel' : 'launcher',
      x: isFiniteNumber(parsed.x) ? parsed.x : null,
      y: isFiniteNumber(parsed.y) ? parsed.y : null
    }
  } catch {
    return {
      mode: 'launcher',
      x: null,
      y: null
    }
  }
}

export function setFloatingWindowState(state: FloatingWindowState): void {
  setStateValue(
    FLOATING_WINDOW_STATE_KEY,
    JSON.stringify({
      mode: state.mode,
      x: isFiniteNumber(state.x) ? state.x : null,
      y: isFiniteNumber(state.y) ? state.y : null
    })
  )
}

export async function backupDatabase(destinationFile: string): Promise<void> {
  await getDb().backup(destinationFile)
}

export function withScratchDatabase<T>(fn: () => T): T {
  const previousDb = db
  const scratch = new Database(':memory:')
  scratch.pragma('foreign_keys = OFF')
  db = scratch

  try {
    initializeSchema()
    getOrCreateDeviceId()
    return fn()
  } finally {
    scratch.close()
    db = previousDb
  }
}

export function registerOperationEmitter(emitter: OperationEmitter): void {
  operationEmitter = emitter
}

export function getWorkspace(): WorkspaceRecord {
  const activeBoardId = resolveActiveBoardId()
  return {
    boards: getBoardSummaries(),
    activeBoardId,
    activeBoard: getBoardById(activeBoardId)
  }
}

export function searchNotes(query: string): NoteSearchResult[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return []
  }

  return getAllNotes()
    .filter((row) => `${row.title}\n${row.description}\n${row.boardTitle}\n${row.columnTitle}`.toLowerCase().includes(normalizedQuery))
    .slice(0, 50)
    .map((row, index) => ({
      ...row,
      position: index
    }))
}

export function getAllNotes(): NoteSearchResult[] {
  const rows = getDb()
    .prepare(
      `
        SELECT
          cards.id,
          cards.column_id AS columnId,
          cards.title,
          cards.description,
          cards.created_at AS createdAt,
          cards.updated_at AS updatedAt,
          boards.id AS boardId,
          boards.title AS boardTitle,
          columns.title AS columnTitle
        FROM cards
        INNER JOIN columns ON columns.id = cards.column_id
        INNER JOIN boards ON boards.id = columns.board_id
        WHERE cards.deleted_at IS NULL
          AND columns.deleted_at IS NULL
          AND boards.deleted_at IS NULL
        ORDER BY cards.updated_at DESC, cards.order_key ASC, cards.id ASC
      `
    )
    .all() as Array<Omit<NoteSearchResult, 'position'>>

  return rows.map((row, index) => ({
    ...row,
    position: index
  }))
}

export function getDeviceId(): string {
  return getOrCreateDeviceId()
}

export function getLocalClock(): number {
  return getCurrentLamportClock()
}

export function getAppliedOperationsCount(): number {
  return getAppliedOperationCount()
}

export function getAppliedOperationsIds(): string[] {
  return getAppliedOperationIds()
}

export function isOperationApplied(operationId: string): boolean {
  return hasAppliedOperation(operationId)
}

export function getWorkspaceBootstrapState(): WorkspaceBootstrapState {
  const database = getDb()
  const boards = database
    .prepare('SELECT id, title FROM boards WHERE deleted_at IS NULL ORDER BY order_key ASC, id ASC')
    .all() as Array<{ id: string; title: string }>
  const columns = database
    .prepare('SELECT board_id, title FROM columns WHERE deleted_at IS NULL ORDER BY order_key ASC, id ASC')
    .all() as Array<{ board_id: string; title: string }>
  const cardCountRow = database
    .prepare('SELECT COUNT(*) AS count FROM cards WHERE deleted_at IS NULL')
    .get() as { count: number }
  const hasAppliedOperations = getAppliedOperationCount() > 0

  const isPristineSeedWorkspace =
    boards.length === 1 &&
    boards[0].title === '默认分组' &&
    columns.length === DEFAULT_COLUMNS.length &&
    columns.every((column) => column.board_id === boards[0].id) &&
    DEFAULT_COLUMNS.every((title) => columns.some((column) => column.title === title)) &&
    cardCountRow.count === 0

  return {
    boardCount: boards.length,
    columnCount: columns.length,
    cardCount: cardCountRow.count,
    hasAppliedOperations,
    isPristineSeedWorkspace
  }
}

export function clearWorkspaceForRemoteBootstrap(): void {
  const database = getDb()
  const clear = database.transaction(() => {
    database.prepare('DELETE FROM cards').run()
    database.prepare('DELETE FROM columns').run()
    database.prepare('DELETE FROM boards').run()
    database.prepare('DELETE FROM applied_operations').run()
    setStateValue(ACTIVE_BOARD_KEY, '')
    setStateValue(LAMPORT_CLOCK_KEY, '0')
  })

  clear()
}

export function createBoard(draft: BoardDraft): WorkspaceRecord {
  const trimmedTitle = draft.title.trim()
  if (!trimmedTitle) {
    throw new Error('Board title is required')
  }

  const orderKey = (() => {
    const boards = getBoardRows()
    return boards.length > 0 ? boards[boards.length - 1].order_key + ORDER_GAP : ORDER_GAP
  })()
  const boardId = createId()
  const defaultColumns = buildDefaultColumnsPayload()
  const operation = buildOperation('board.create', { boardId }, { title: trimmedTitle, orderKey, defaultColumns })

  const create = getDb().transaction(() => {
    getDb()
      .prepare(
        `
          INSERT INTO boards (id, title, position, order_key, deleted_at, sync_state)
          VALUES (?, ?, 0, ?, NULL, ?)
        `
      )
      .run(boardId, trimmedTitle, orderKey, serializeSyncState(setFieldVersion({}, 'title', versionFromOperation(operation))))
    createDefaultColumns(boardId, defaultColumns)
    normalizeBoardPositions()
    setStateValue(ACTIVE_BOARD_KEY, boardId)
  })
  create()

  return persistLocalMutation(operation)
}

export function updateBoard(boardId: string, draft: BoardDraft): WorkspaceRecord {
  const trimmedTitle = draft.title.trim()
  if (!trimmedTitle) {
    throw new Error('Board title is required')
  }

  ensureBoardExists(boardId)
  const operation = buildOperation('board.update', { boardId }, { title: trimmedTitle })
  applyBoardUpdate(operation)
  return persistLocalMutation(operation)
}

export function deleteBoard(boardId: string): WorkspaceRecord {
  const boards = getBoardRows()
  if (boards.length <= 1) {
    throw new Error('At least one board must remain')
  }

  if (!boards.some((board) => board.id === boardId)) {
    throw new Error('Board not found')
  }

  const operation = buildOperation('board.delete', { boardId }, {})
  const result = applyBoardDelete(operation)
  if (result.notices.length > 0) {
    throw new Error(result.notices[0].message)
  }
  return persistLocalMutation(operation)
}

export function setActiveBoard(boardId: string): WorkspaceRecord {
  ensureBoardExists(boardId)
  setStateValue(ACTIVE_BOARD_KEY, boardId)
  return getWorkspace()
}

export function createColumn(boardId: string, draft: ColumnDraft): WorkspaceRecord {
  const trimmedTitle = draft.title.trim()
  if (!trimmedTitle) {
    throw new Error('Column title is required')
  }

  ensureBoardExists(boardId)
  const orderKey = getColumnTargetOrderKey(boardId, getOrderedColumns(boardId).length)
  const columnId = createId()
  const operation = buildOperation('column.create', { boardId, columnId }, { title: trimmedTitle, orderKey })
  applyColumnCreate(operation)
  return persistLocalMutation(operation)
}

export function updateColumn(columnId: string, draft: ColumnDraft): WorkspaceRecord {
  const trimmedTitle = draft.title.trim()
  if (!trimmedTitle) {
    throw new Error('Column title is required')
  }

  ensureColumnExists(columnId)
  const operation = buildOperation('column.update', { columnId }, { title: trimmedTitle })
  applyColumnUpdate(operation)
  return persistLocalMutation(operation)
}

export function deleteColumn(columnId: string): WorkspaceRecord {
  ensureColumnExists(columnId)
  const operation = buildOperation('column.delete', { columnId }, {})
  applyColumnDelete(operation)
  return persistLocalMutation(operation)
}

export function moveColumn(columnId: string, toBoardId: string, toIndex: number): WorkspaceRecord {
  const column = ensureColumnExists(columnId)
  ensureBoardExists(toBoardId)
  const orderKey = getColumnTargetOrderKey(toBoardId, toIndex)
  const operation = buildOperation('column.move', { boardId: toBoardId, columnId }, { boardId: toBoardId, orderKey })
  applyColumnMove(operation)
  if (column.boardId !== toBoardId) {
    normalizeColumnPositions(column.boardId)
  }
  return persistLocalMutation(operation)
}

export function createCard(columnId: string, draft: CardDraft): WorkspaceRecord {
  const trimmedTitle = draft.title.trim()
  if (!trimmedTitle) {
    throw new Error('Card title is required')
  }

  ensureColumnExists(columnId)
  const timestamp = now()
  const orderKey = getCardTargetOrderKey(columnId, getOrderedCards(columnId).length)
  const cardId = createId()
  const operation = buildOperation('card.create', { columnId, cardId }, {
    title: trimmedTitle,
    description: draft.description.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,
    orderKey
  })
  applyCardCreate(operation)
  return persistLocalMutation(operation)
}

export function updateCard(cardId: string, draft: CardDraft): WorkspaceRecord {
  const trimmedTitle = draft.title.trim()
  if (!trimmedTitle) {
    throw new Error('Card title is required')
  }

  const row = getDb().prepare('SELECT 1 FROM cards WHERE id = ? AND deleted_at IS NULL').get(cardId) as
    | { 1: number }
    | undefined
  if (!row) {
    throw new Error('Card not found')
  }

  const operation = buildOperation('card.update', { cardId }, {
    title: trimmedTitle,
    description: draft.description.trim()
  })
  applyCardUpdate(operation)
  return persistLocalMutation(operation)
}

export function deleteCard(cardId: string): WorkspaceRecord {
  const row = getDb().prepare('SELECT 1 FROM cards WHERE id = ? AND deleted_at IS NULL').get(cardId) as
    | { 1: number }
    | undefined
  if (!row) {
    throw new Error('Card not found')
  }

  const operation = buildOperation('card.delete', { cardId }, {})
  applyCardDelete(operation)
  return persistLocalMutation(operation)
}

export function moveCard(cardId: string, toColumnId: string, toIndex: number): WorkspaceRecord {
  const row = getDb()
    .prepare('SELECT column_id FROM cards WHERE id = ? AND deleted_at IS NULL')
    .get(cardId) as { column_id: string } | undefined
  if (!row) {
    throw new Error('Card not found')
  }

  ensureColumnExists(toColumnId)
  const orderKey = getCardTargetOrderKey(toColumnId, toIndex, cardId)
  const operation = buildOperation('card.move', { cardId, columnId: toColumnId }, { columnId: toColumnId, orderKey })
  applyCardMove(operation)
  if (row.column_id !== toColumnId) {
    normalizeCardPositions(row.column_id)
  }
  return persistLocalMutation(operation)
}

export function applyRemoteOperation(operation: SyncOperation): RemoteOperationApplyResult {
  if (hasAppliedOperation(operation.operationId)) {
    return createApplyResult('noop')
  }

  const validationError = validateOperationShape(operation)
  if (validationError) {
    return createInvalidOperationResult(operation, validationError)
  }

  const apply = getDb().transaction(() => {
    observeRemoteClock(operation.clock)
    let result: RemoteOperationApplyResult
    switch (operation.kind) {
      case 'board.create':
        result = applyBoardCreate(operation)
        break
      case 'board.update':
        result = applyBoardUpdate(operation)
        break
      case 'board.delete':
        result = applyBoardDelete(operation)
        break
      case 'column.create':
        result = applyColumnCreate(operation)
        break
      case 'column.update':
        result = applyColumnUpdate(operation)
        break
      case 'column.delete':
        result = applyColumnDelete(operation)
        break
      case 'column.move':
        result = applyColumnMove(operation)
        break
      case 'card.create':
        result = applyCardCreate(operation)
        break
      case 'card.update':
        result = applyCardUpdate(operation)
        break
      case 'card.delete':
        result = applyCardDelete(operation)
        break
      case 'card.move':
        result = applyCardMove(operation)
        break
      default:
        result = createInvalidOperationResult(operation, 'operation kind is unsupported')
    }

    if (result.outcome === 'applied' || result.outcome === 'noop') {
      recordAppliedOperation(operation)
    }

    return result
  })

  return apply()
}

export function exportCheckpoint(): SyncCheckpoint {
  const database = getDb()
  const checkpointId = createId()
  const createdAtUtc = now()
  const checkpoint: SyncCheckpoint = {
    checkpointId,
    deviceId: getOrCreateDeviceId(),
    createdAtUtc,
    maxClock: getCurrentLamportClock(),
    workspace: {
      activeBoardId: getStateValue(ACTIVE_BOARD_KEY),
      boards: (
        database
          .prepare('SELECT id, title, order_key, deleted_at, sync_state FROM boards')
          .all() as Array<{
          id: string
          title: string
          order_key: number
          deleted_at: string | null
          sync_state: string
        }>
      ).map((board) => ({
        id: board.id,
        title: board.title,
        orderKey: board.order_key,
        deletedAt: board.deleted_at,
        syncState: board.sync_state
      })),
      columns: (
        database
          .prepare('SELECT id, board_id, title, order_key, deleted_at, sync_state FROM columns')
          .all() as Array<{
          id: string
          board_id: string
          title: string
          order_key: number
          deleted_at: string | null
          sync_state: string
        }>
      ).map((column) => ({
        id: column.id,
        boardId: column.board_id,
        title: column.title,
        orderKey: column.order_key,
        deletedAt: column.deleted_at,
        syncState: column.sync_state
      })),
      cards: (
        database
          .prepare(
            `
              SELECT id, column_id, title, description, order_key, created_at, updated_at, deleted_at, sync_state
              FROM cards
            `
          )
          .all() as Array<{
          id: string
          column_id: string
          title: string
          description: string
          order_key: number
          created_at: string
          updated_at: string
          deleted_at: string | null
          sync_state: string
        }>
      ).map((card) => ({
        id: card.id,
        columnId: card.column_id,
        title: card.title,
        description: card.description,
        orderKey: card.order_key,
        createdAt: card.created_at,
        updatedAt: card.updated_at,
        deletedAt: card.deleted_at,
        syncState: card.sync_state
      })),
      appliedOperationIds: getAppliedOperationIds(),
      maxClock: getCurrentLamportClock()
    }
  }

  const validationError = validateWorkspaceSnapshot(checkpoint.workspace)
  if (validationError) {
    throw new Error(validationError)
  }

  return checkpoint
}

export function importCheckpoint(checkpoint: SyncCheckpoint): void {
  const validationError = validateWorkspaceSnapshot(checkpoint.workspace)
  if (validationError) {
    throw new Error(validationError)
  }

  const database = getDb()
  const restore = database.transaction(() => {
    database.prepare('DELETE FROM boards').run()
    database.prepare('DELETE FROM columns').run()
    database.prepare('DELETE FROM cards').run()
    database.prepare('DELETE FROM applied_operations').run()

    const insertBoard = database.prepare(
      `
        INSERT INTO boards (id, title, position, order_key, deleted_at, sync_state)
        VALUES (?, ?, 0, ?, ?, ?)
      `
    )
    checkpoint.workspace.boards.forEach((board) => {
      insertBoard.run(board.id, board.title, board.orderKey, board.deletedAt, board.syncState)
    })

    const insertColumn = database.prepare(
      `
        INSERT INTO columns (id, board_id, title, position, order_key, deleted_at, sync_state)
        VALUES (?, ?, ?, 0, ?, ?, ?)
      `
    )
    checkpoint.workspace.columns.forEach((column) => {
      insertColumn.run(column.id, column.boardId, column.title, column.orderKey, column.deletedAt, column.syncState)
    })

    const insertCard = database.prepare(
      `
        INSERT INTO cards (id, column_id, title, description, position, order_key, created_at, updated_at, deleted_at, sync_state)
        VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?)
      `
    )
    checkpoint.workspace.cards.forEach((card) => {
      insertCard.run(
        card.id,
        card.columnId,
        card.title,
        card.description,
        card.orderKey,
        card.createdAt,
        card.updatedAt,
        card.deletedAt,
        card.syncState
      )
    })

    const insertApplied = database.prepare(
      `
        INSERT INTO applied_operations (operation_id, device_id, clock, created_at_utc)
        VALUES (?, ?, ?, ?)
      `
    )
    checkpoint.workspace.appliedOperationIds.forEach((operationId) => {
      insertApplied.run(operationId, checkpoint.deviceId, checkpoint.maxClock, checkpoint.createdAtUtc)
    })

    normalizeBoardPositions()
    getBoardRows().forEach((board) => {
      normalizeColumnPositions(board.id)
      getOrderedColumns(board.id).forEach((column) => normalizeCardPositions(column.id))
    })

    if (checkpoint.workspace.activeBoardId) {
      setStateValue(ACTIVE_BOARD_KEY, checkpoint.workspace.activeBoardId)
    }

    observeRemoteClock(checkpoint.maxClock)
  })

  restore()
}
