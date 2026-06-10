import type { SyncFolderConfig, SyncNotice, SyncStatus, UpdateStatus } from '../shared/types'

export function createLocalOnlySyncStatus(): SyncStatus {
  return {
    configured: false,
    syncing: false,
    hasCompletedSync: true,
    folderPath: null,
    syncRootPath: null,
    providerHint: null,
    deviceId: 'local-only',
    pendingLocalOperations: 0,
    lastSyncedAtUtc: null,
    lastImportedAtUtc: null,
    lastExportedAtUtc: null,
    lastCheckpointAtUtc: null,
    lastError: null,
    bootstrapConflict: null,
    notices: []
  }
}

export function getLocalOnlySyncFolderInfo(): SyncFolderConfig | null {
  return null
}

export function getLocalOnlySyncNotices(): SyncNotice[] {
  return []
}

export function createLocalOnlyUpdateStatus(currentVersion: string): UpdateStatus {
  return {
    supported: false,
    phase: 'disabled',
    currentVersion,
    availableUpdate: null,
    downloadedUpdate: null,
    downloadProgressPercent: null,
    lastCheckedAtUtc: null,
    lastDownloadedAtUtc: null,
    lastError: null
  }
}
