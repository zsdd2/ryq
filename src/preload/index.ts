import { contextBridge, ipcRenderer } from 'electron'
import type {
  BoardDraft,
  CardDraft,
  CardMovePayload,
  ColumnDraft,
  ColumnMovePayload,
  StickbanApi
} from '../shared/types'

const api: StickbanApi = {
  getWorkspace: () => ipcRenderer.invoke('workspace:get'),
  searchNotes: (query: string) => ipcRenderer.invoke('workspace:searchNotes', query),
  createBoard: (draft: BoardDraft) => ipcRenderer.invoke('board:create', draft),
  updateBoard: (boardId: string, draft: BoardDraft) => ipcRenderer.invoke('board:update', boardId, draft),
  deleteBoard: (boardId: string) => ipcRenderer.invoke('board:delete', boardId),
  setActiveBoard: (boardId: string) => ipcRenderer.invoke('board:setActive', boardId),
  createColumn: (boardId: string, draft: ColumnDraft) => ipcRenderer.invoke('column:create', boardId, draft),
  updateColumn: (columnId: string, draft: ColumnDraft) =>
    ipcRenderer.invoke('column:update', columnId, draft),
  deleteColumn: (columnId: string) => ipcRenderer.invoke('column:delete', columnId),
  moveColumn: (payload: ColumnMovePayload) => ipcRenderer.invoke('column:move', payload),
  createCard: (columnId: string, draft: CardDraft) => ipcRenderer.invoke('card:create', columnId, draft),
  updateCard: (cardId: string, draft: CardDraft) => ipcRenderer.invoke('card:update', cardId, draft),
  deleteCard: (cardId: string) => ipcRenderer.invoke('card:delete', cardId),
  moveCard: (payload: CardMovePayload) => ipcRenderer.invoke('card:move', payload),
  getWindowState: () => ipcRenderer.invoke('window:getState'),
  setAlwaysOnTop: (value: boolean) => ipcRenderer.invoke('window:setAlwaysOnTop', value),
  setFloatingPanelOpen: (value: boolean) => ipcRenderer.invoke('window:setFloatingPanelOpen', value),
  moveFloatingWindowBy: (delta: { deltaX: number; deltaY: number }) =>
    ipcRenderer.invoke('window:moveFloatingWindowBy', delta),
  setLaunchOnStartup: (value: boolean) => ipcRenderer.invoke('window:setLaunchOnStartup', value),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('window:toggleMaximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  getSyncStatus: () => ipcRenderer.invoke('sync:getStatus'),
  chooseSyncFolder: () => ipcRenderer.invoke('sync:chooseFolder'),
  clearSyncFolder: () => ipcRenderer.invoke('sync:clearFolder'),
  syncNow: () => ipcRenderer.invoke('sync:runNow'),
  adoptRemoteWorkspace: () => ipcRenderer.invoke('sync:adoptRemoteWorkspace'),
  getSyncFolderInfo: () => ipcRenderer.invoke('sync:getFolderInfo'),
  getSyncNotices: () => ipcRenderer.invoke('sync:getNotices'),
  getUpdateStatus: () => ipcRenderer.invoke('update:getStatus'),
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  quitAndInstallUpdate: () => ipcRenderer.invoke('update:quitAndInstall')
}

contextBridge.exposeInMainWorld('stickban', api)
