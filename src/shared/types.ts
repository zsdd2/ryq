export interface CardRecord {
  id: string
  columnId: string
  title: string
  description: string
  position: number
  createdAt: string
  updatedAt: string
}

export interface ColumnRecord {
  id: string
  boardId: string
  title: string
  position: number
  cards: CardRecord[]
}

export interface BoardRecord {
  id: string
  title: string
  position: number
  columns: ColumnRecord[]
}

export interface BoardSummary {
  id: string
  title: string
  position: number
  columnCount: number
  cardCount: number
}

export interface WorkspaceRecord {
  boards: BoardSummary[]
  activeBoardId: string
  activeBoard: BoardRecord
}

export interface NoteSearchResult extends CardRecord {
  boardId: string
  boardTitle: string
  columnTitle: string
}

export interface WindowState {
  alwaysOnTop: boolean
  floatingPanelOpen: boolean
  launchOnStartup: boolean
  launchOnStartupConfigured: boolean
  launchOnStartupSupported: boolean
  isMaximized: boolean
  platform: NodeJS.Platform
  appVersion: string
}

export type SyncOperationKind =
  | 'board.create'
  | 'board.update'
  | 'board.delete'
  | 'column.create'
  | 'column.update'
  | 'column.delete'
  | 'column.move'
  | 'card.create'
  | 'card.update'
  | 'card.delete'
  | 'card.move'

export interface SyncVersion {
  clock: number
  createdAtUtc: string
  operationId: string
  deviceId: string
}

export interface SyncOperation {
  operationId: string
  deviceId: string
  createdAtUtc: string
  clock: number
  baseClock: number
  kind: SyncOperationKind
  boardId?: string
  columnId?: string
  cardId?: string
  payload: Record<string, unknown>
}

export interface SyncEntitySnapshot {
  id: string
  title: string
  orderKey: number
  deletedAt: string | null
  syncState: string
}

export interface SyncBoardSnapshot extends SyncEntitySnapshot {}

export interface SyncColumnSnapshot extends SyncEntitySnapshot {
  boardId: string
}

export interface SyncCardSnapshot extends SyncEntitySnapshot {
  columnId: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface SyncWorkspaceSnapshot {
  activeBoardId: string | null
  boards: SyncBoardSnapshot[]
  columns: SyncColumnSnapshot[]
  cards: SyncCardSnapshot[]
  appliedOperationIds: string[]
  maxClock: number
}

export interface SyncCheckpoint {
  checkpointId: string
  deviceId: string
  createdAtUtc: string
  maxClock: number
  workspace: SyncWorkspaceSnapshot
}

export type SyncNoticeLevel = 'info' | 'warning' | 'error'

export interface SyncNotice {
  id: string
  level: SyncNoticeLevel
  message: string
  createdAtUtc: string
}

export interface SyncFolderConfig {
  folderPath: string
  syncRootPath: string
  operationsPath: string
  checkpointsPath: string
  providerHint: string
}

export interface SyncBootstrapConflict {
  folderPath: string
  syncRootPath: string
  providerHint: string
  reason: string
}

export interface SyncStatus {
  configured: boolean
  syncing: boolean
  hasCompletedSync: boolean
  folderPath: string | null
  syncRootPath: string | null
  providerHint: string | null
  deviceId: string
  pendingLocalOperations: number
  lastSyncedAtUtc: string | null
  lastImportedAtUtc: string | null
  lastExportedAtUtc: string | null
  lastCheckpointAtUtc: string | null
  lastError: string | null
  bootstrapConflict: SyncBootstrapConflict | null
  notices: SyncNotice[]
}

export type UpdatePhase =
  | 'disabled'
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'up-to-date'
  | 'error'

export interface UpdateInfoSummary {
  version: string
  releaseName: string | null
  releaseDateUtc: string | null
}

export interface UpdateError {
  message: string
  atUtc: string
}

export interface UpdateStatus {
  supported: boolean
  phase: UpdatePhase
  currentVersion: string
  availableUpdate: UpdateInfoSummary | null
  downloadedUpdate: UpdateInfoSummary | null
  downloadProgressPercent: number | null
  lastCheckedAtUtc: string | null
  lastDownloadedAtUtc: string | null
  lastError: UpdateError | null
 }

export interface CardDraft {
  title: string
  description: string
}

export interface BoardDraft {
  title: string
}

export interface ColumnDraft {
  title: string
}

export interface CardMovePayload {
  cardId: string
  toColumnId: string
  toIndex: number
}

export interface ColumnMovePayload {
  columnId: string
  toBoardId: string
  toIndex: number
}

export interface StickbanApi {
  getWorkspace: () => Promise<WorkspaceRecord>
  getAllNotes: () => Promise<NoteSearchResult[]>
  searchNotes: (query: string) => Promise<NoteSearchResult[]>
  createBoard: (draft: BoardDraft) => Promise<WorkspaceRecord>
  updateBoard: (boardId: string, draft: BoardDraft) => Promise<WorkspaceRecord>
  deleteBoard: (boardId: string) => Promise<WorkspaceRecord>
  setActiveBoard: (boardId: string) => Promise<WorkspaceRecord>
  createColumn: (boardId: string, draft: ColumnDraft) => Promise<WorkspaceRecord>
  updateColumn: (columnId: string, draft: ColumnDraft) => Promise<WorkspaceRecord>
  deleteColumn: (columnId: string) => Promise<WorkspaceRecord>
  moveColumn: (payload: ColumnMovePayload) => Promise<WorkspaceRecord>
  createCard: (columnId: string, draft: CardDraft) => Promise<WorkspaceRecord>
  updateCard: (cardId: string, draft: CardDraft) => Promise<WorkspaceRecord>
  deleteCard: (cardId: string) => Promise<WorkspaceRecord>
  moveCard: (payload: CardMovePayload) => Promise<WorkspaceRecord>
  getWindowState: () => Promise<WindowState>
  setAlwaysOnTop: (value: boolean) => Promise<WindowState>
  setFloatingPanelOpen: (value: boolean) => Promise<WindowState>
  moveFloatingWindowBy: (delta: { deltaX: number; deltaY: number }) => Promise<void>
  setLaunchOnStartup: (value: boolean) => Promise<WindowState>
  minimizeWindow: () => Promise<void>
  toggleMaximizeWindow: () => Promise<WindowState>
  closeWindow: () => Promise<void>
  getSyncStatus: () => Promise<SyncStatus>
  chooseSyncFolder: () => Promise<SyncStatus>
  clearSyncFolder: () => Promise<SyncStatus>
  syncNow: () => Promise<SyncStatus>
  adoptRemoteWorkspace: () => Promise<SyncStatus>
  getSyncFolderInfo: () => Promise<SyncFolderConfig | null>
  getSyncNotices: () => Promise<SyncNotice[]>
  getUpdateStatus: () => Promise<UpdateStatus>
  checkForUpdates: () => Promise<UpdateStatus>
  downloadUpdate: () => Promise<UpdateStatus>
  quitAndInstallUpdate: () => Promise<void>
}
