import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import { execFileSync } from 'node:child_process'
import { basename, join } from 'node:path'
import {
  createBoard,
  createCard,
  createColumn,
  deleteBoard,
  deleteCard,
  deleteColumn,
  getFloatingWindowState,
  getLaunchOnStartupPreference,
  getWorkspace,
  initializeDatabase,
  moveColumn,
  moveCard,
  searchNotes,
  setActiveBoard,
  setFloatingWindowState,
  setLaunchOnStartupPreference,
  updateBoard,
  updateCard,
  updateColumn
} from './database'
import type { BoardDraft, CardDraft, CardMovePayload, ColumnDraft, ColumnMovePayload } from '../shared/types'
import {
  FLOATING_LAUNCHER_BOUNDS,
  createFloatingWindowOptions,
  getCollapsedLauncherPosition,
  getFloatingWindowBounds,
  getMovedWindowPosition,
  type FloatingWindowMode
} from './floating-window'
import { UpdateManager } from './update'
import {
  createLocalOnlySyncStatus,
  getLocalOnlySyncFolderInfo,
  getLocalOnlySyncNotices
} from './local-only-services'
import { CANONICAL_USER_DATA_DIR_NAME, getCanonicalUserDataPath, migrateLegacyUserData } from './user-data'

let mainWindow: BrowserWindow | null = null
let updateManager: UpdateManager | null = null
let updateCheckInterval: NodeJS.Timeout | null = null
let backgroundServicesInitialized = false
let floatingWindowMode: FloatingWindowMode = 'launcher'
const WINDOWS_APP_USER_MODEL_ID = 'com.renyiqian.desktop'
const WINDOWS_RUN_KEY_USER = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
const WINDOWS_RUN_KEY_MACHINE = 'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
const WINDOWS_STARTUP_APPROVED_KEY_USER = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run'
const WINDOWS_STARTUP_APPROVED_KEY_MACHINE =
  'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run'

app.setName(CANONICAL_USER_DATA_DIR_NAME)

if (process.platform === 'win32') {
  app.setPath('userData', getCanonicalUserDataPath(app.getPath('appData')))
}

const hasSingleInstanceLock = app.requestSingleInstanceLock()

if (process.platform === 'win32') {
  app.setAppUserModelId(WINDOWS_APP_USER_MODEL_ID)
}

if (!hasSingleInstanceLock) {
  app.quit()
}

function isLaunchOnStartupSupported(): boolean {
  return process.platform === 'win32' && app.isPackaged
}

function getLaunchOnStartupState(): { configured: boolean; enabled: boolean } {
  if (!isLaunchOnStartupSupported()) {
    const fallback = getLaunchOnStartupPreference()
    return {
      configured: fallback,
      enabled: fallback
    }
  }

  const settings = app.getLoginItemSettings({
    path: process.execPath
  })

  return {
    configured: settings.openAtLogin,
    enabled: settings.executableWillLaunchAtLogin
  }
}

function normalizeWindowsPath(value: string): string {
  return value.replace(/\//g, '\\').toLowerCase()
}

function getRunRegistryPath(scope: 'user' | 'machine'): string {
  return scope === 'machine' ? WINDOWS_RUN_KEY_MACHINE : WINDOWS_RUN_KEY_USER
}

function getStartupApprovedRegistryPath(scope: 'user' | 'machine'): string {
  return scope === 'machine' ? WINDOWS_STARTUP_APPROVED_KEY_MACHINE : WINDOWS_STARTUP_APPROVED_KEY_USER
}

function toLaunchItemScope(scope: string): 'user' | 'machine' {
  return scope === 'machine' ? 'machine' : 'user'
}

function deleteRegistryValue(keyPath: string, valueName: string): void {
  try {
    execFileSync('reg.exe', ['delete', keyPath, '/v', valueName, '/f'], {
      stdio: 'ignore',
      windowsHide: true
    })
  } catch {
    // Ignore missing keys and values. Cleanup is best-effort.
  }
}

function isRenyiqianLaunchItem(itemPath: string): boolean {
  const normalizedItemPath = normalizeWindowsPath(itemPath)
  const normalizedCurrentPath = normalizeWindowsPath(process.execPath)
  const executableName = basename(normalizedCurrentPath)
  return normalizedItemPath === normalizedCurrentPath || basename(normalizedItemPath) === executableName
}

function cleanupDuplicateLaunchOnStartupEntries(): void {
  if (!isLaunchOnStartupSupported()) {
    return
  }

  const settings = app.getLoginItemSettings({
    path: process.execPath
  })
  const renyiqianItems = settings.launchItems.filter((item) => isRenyiqianLaunchItem(item.path))

  if (renyiqianItems.length <= 1) {
    return
  }

  for (const item of renyiqianItems) {
    const scope = toLaunchItemScope(item.scope)
    deleteRegistryValue(getRunRegistryPath(scope), item.name)
    deleteRegistryValue(getStartupApprovedRegistryPath(scope), item.name)
  }

  applyLaunchOnStartupPreference(getLaunchOnStartupPreference())
}

function applyLaunchOnStartupPreference(enabled: boolean): void {
  if (!isLaunchOnStartupSupported()) {
    return
  }

  app.setLoginItemSettings({
    openAtLogin: enabled,
    enabled,
    path: process.execPath
  })
}

function getWindowState() {
  const startupState = getLaunchOnStartupState()

  return {
    alwaysOnTop: mainWindow?.isAlwaysOnTop() ?? false,
    floatingPanelOpen: floatingWindowMode === 'panel',
    launchOnStartup: startupState.enabled,
    launchOnStartupConfigured: startupState.configured,
    launchOnStartupSupported: isLaunchOnStartupSupported(),
    isMaximized: mainWindow?.isMaximized() ?? false,
    platform: process.platform,
    appVersion: app.getVersion()
  }
}

function initializeBackgroundServices(): void {
  if (backgroundServicesInitialized) {
    return
  }

  backgroundServicesInitialized = true
  void updateManager?.checkForUpdates()
  if (updateManager?.getStatus().supported && updateCheckInterval === null) {
    updateCheckInterval = setInterval(
      () => {
        void updateManager?.checkForUpdates()
      },
      4 * 60 * 60 * 1000
    )
  }
}

function presentMainWindow(): void {
  if (!mainWindow) {
    if (!app.isReady()) {
      return
    }

    mainWindow = createMainWindow()
    mainWindow.once('ready-to-show', () => {
      setImmediate(() => {
        initializeBackgroundServices()
      })
    })
    return
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }

  if (!mainWindow.isVisible()) {
    mainWindow.show()
  }

  mainWindow.focus()
}

function createMainWindow(): BrowserWindow {
  const floatingState = getFloatingWindowState()
  floatingWindowMode = floatingState.mode
  const bounds = getFloatingWindowBounds(floatingState.mode)
  const window = new BrowserWindow(
    {
      ...createFloatingWindowOptions({
      platform: process.platform,
        preloadPath: join(__dirname, '../preload/index.js'),
        mode: floatingState.mode
      }),
      width: bounds.width,
      height: bounds.height,
      ...(floatingState.x !== null && floatingState.y !== null
        ? {
            x: floatingState.x,
            y: floatingState.y
          }
        : {})
    }
  )

  if (process.platform === 'win32' || process.platform === 'linux') {
    window.removeMenu()
  }

  applyFloatingWindowShape(window, floatingState.mode)

  window.once('ready-to-show', () => {
    window.setMenuBarVisibility(false)
    window.show()
  })

  window.on('move', () => {
    const [x, y] = window.getPosition()
    setFloatingWindowState({
      ...getFloatingWindowState(),
      x,
      y
    })
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}

function applyFloatingWindowShape(window: BrowserWindow, mode: FloatingWindowMode): void {
  if (typeof window.setShape !== 'function') {
    return
  }

  if (mode === 'launcher') {
    window.setShape([
      {
        x: 0,
        y: 0,
        width: FLOATING_LAUNCHER_BOUNDS.width,
        height: FLOATING_LAUNCHER_BOUNDS.height
      }
    ])
    return
  }

  window.setShape([])
}

function setFloatingWindowMode(mode: FloatingWindowMode): void {
  if (!mainWindow) {
    return
  }

  const bounds = getFloatingWindowBounds(mode)
  const currentBounds = mainWindow.getBounds()
  const [x, y] =
    mode === 'launcher'
      ? getCollapsedLauncherPosition(currentBounds)
      : [currentBounds.x, currentBounds.y]
  floatingWindowMode = mode
  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }
  mainWindow.setResizable(mode === 'panel')
  mainWindow.setAlwaysOnTop(true)
  mainWindow.setBounds({
    x,
    y,
    width: bounds.width,
    height: bounds.height
  })
  applyFloatingWindowShape(mainWindow, mode)
  if (!mainWindow.isVisible()) {
    mainWindow.show()
  }
  mainWindow.moveTop()
  setFloatingWindowState({
    mode,
    x,
    y
  })
}

function registerIpc(): void {
  ipcMain.handle('workspace:get', () => getWorkspace())
  ipcMain.handle('workspace:searchNotes', (_event, query: string) => searchNotes(query))
  ipcMain.handle('board:create', (_event, draft: BoardDraft) => createBoard(draft))
  ipcMain.handle('board:update', (_event, boardId: string, draft: BoardDraft) => updateBoard(boardId, draft))
  ipcMain.handle('board:delete', (_event, boardId: string) => deleteBoard(boardId))
  ipcMain.handle('board:setActive', (_event, boardId: string) => setActiveBoard(boardId))
  ipcMain.handle('column:create', (_event, boardId: string, draft: ColumnDraft) => createColumn(boardId, draft))
  ipcMain.handle('column:update', (_event, columnId: string, draft: ColumnDraft) =>
    updateColumn(columnId, draft)
  )
  ipcMain.handle('column:delete', (_event, columnId: string) => deleteColumn(columnId))
  ipcMain.handle('column:move', (_event, payload: ColumnMovePayload) =>
    moveColumn(payload.columnId, payload.toBoardId, payload.toIndex)
  )
  ipcMain.handle('card:create', (_event, columnId: string, draft: CardDraft) => createCard(columnId, draft))
  ipcMain.handle('card:update', (_event, cardId: string, draft: CardDraft) => updateCard(cardId, draft))
  ipcMain.handle('card:delete', (_event, cardId: string) => deleteCard(cardId))
  ipcMain.handle('card:move', (_event, payload: CardMovePayload) =>
    moveCard(payload.cardId, payload.toColumnId, payload.toIndex)
  )
  ipcMain.handle('window:getState', () => getWindowState())
  ipcMain.handle('window:setAlwaysOnTop', (_event, value: boolean) => {
    mainWindow?.setAlwaysOnTop(value)
    return getWindowState()
  })
  ipcMain.handle('window:setFloatingPanelOpen', (_event, value: boolean) => {
    setFloatingWindowMode(value ? 'panel' : 'launcher')
    return getWindowState()
  })
  ipcMain.handle('window:moveFloatingWindowBy', (_event, delta: { deltaX: number; deltaY: number }) => {
    if (!mainWindow) {
      return
    }

    const [currentX, currentY] = mainWindow.getPosition()
    const [nextX, nextY] = getMovedWindowPosition([currentX, currentY], delta)
    mainWindow.setPosition(nextX, nextY)
    setFloatingWindowState({
      ...getFloatingWindowState(),
      x: nextX,
      y: nextY
    })
  })
  ipcMain.handle('window:setLaunchOnStartup', (_event, value: boolean) => {
    if (!isLaunchOnStartupSupported()) {
      return getWindowState()
    }

    setLaunchOnStartupPreference(value)
    applyLaunchOnStartupPreference(value)
    return getWindowState()
  })
  ipcMain.handle('window:minimize', () => {
    setFloatingWindowMode('launcher')
    return getWindowState()
  })
  ipcMain.handle('window:toggleMaximize', () => {
    if (!mainWindow) {
      const startupState = getLaunchOnStartupState()

      return {
        alwaysOnTop: false,
        floatingPanelOpen: floatingWindowMode === 'panel',
        launchOnStartup: startupState.enabled,
        launchOnStartupConfigured: startupState.configured,
        launchOnStartupSupported: isLaunchOnStartupSupported(),
        isMaximized: false,
        platform: process.platform,
        appVersion: app.getVersion()
      }
    }

    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }

    return getWindowState()
  })
  ipcMain.handle('window:close', () => {
    mainWindow?.close()
  })
  ipcMain.handle('sync:getStatus', () => createLocalOnlySyncStatus())
  ipcMain.handle('sync:chooseFolder', () => createLocalOnlySyncStatus())
  ipcMain.handle('sync:clearFolder', () => createLocalOnlySyncStatus())
  ipcMain.handle('sync:runNow', () => createLocalOnlySyncStatus())
  ipcMain.handle('sync:adoptRemoteWorkspace', () => createLocalOnlySyncStatus())
  ipcMain.handle('sync:getFolderInfo', () => getLocalOnlySyncFolderInfo())
  ipcMain.handle('sync:getNotices', () => getLocalOnlySyncNotices())
  ipcMain.handle('update:getStatus', () => updateManager?.getStatus())
  ipcMain.handle('update:check', () => updateManager?.checkForUpdates())
  ipcMain.handle('update:download', () => updateManager?.downloadUpdate())
  ipcMain.handle('update:quitAndInstall', () => {
    updateManager?.quitAndInstall()
  })
}

if (hasSingleInstanceLock) {
  app.on('second-instance', () => {
    presentMainWindow()
  })

  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null)
    const userDataPath = app.getPath('userData')
    await migrateLegacyUserData({
      appDataPath: app.getPath('appData'),
      targetUserDataPath: userDataPath
    })
    initializeDatabase(userDataPath)
    updateManager = new UpdateManager(app.getVersion(), app.isPackaged)
    cleanupDuplicateLaunchOnStartupEntries()
    applyLaunchOnStartupPreference(getLaunchOnStartupPreference())
    registerIpc()
    presentMainWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        presentMainWindow()
      } else {
        presentMainWindow()
      }
    })
  })
}

app.on('before-quit', () => {
  backgroundServicesInitialized = false
  if (updateCheckInterval !== null) {
    clearInterval(updateCheckInterval)
    updateCheckInterval = null
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
