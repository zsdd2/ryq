import { autoUpdater, type ProgressInfo, type UpdateInfo } from 'electron-updater'
import type { UpdateInfoSummary, UpdateStatus } from '../shared/types'

function toUpdateInfoSummary(info: UpdateInfo): UpdateInfoSummary {
  return {
    version: info.version,
    releaseName: typeof info.releaseName === 'string' ? info.releaseName : null,
    releaseDateUtc: typeof info.releaseDate === 'string' ? info.releaseDate : null
  }
}

function createUpdateError(message: string): { message: string; atUtc: string } {
  return {
    message,
    atUtc: new Date().toISOString()
  }
}

export class UpdateManager {
  private readonly supported: boolean
  private status: UpdateStatus

  constructor(currentVersion: string, supported: boolean) {
    this.supported = supported
    this.status = {
      supported,
      phase: supported ? 'idle' : 'disabled',
      currentVersion,
      availableUpdate: null,
      downloadedUpdate: null,
      downloadProgressPercent: null,
      lastCheckedAtUtc: null,
      lastDownloadedAtUtc: null,
      lastError: null
    }

    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true

    autoUpdater.on('checking-for-update', () => {
      this.status = {
        ...this.status,
        phase: 'checking',
        lastError: null
      }
    })

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      this.status = {
        ...this.status,
        phase: 'available',
        availableUpdate: toUpdateInfoSummary(info),
        downloadedUpdate: null,
        downloadProgressPercent: null,
        lastCheckedAtUtc: new Date().toISOString(),
        lastError: null
      }
    })

    autoUpdater.on('update-not-available', () => {
      this.status = {
        ...this.status,
        phase: 'up-to-date',
        availableUpdate: null,
        downloadedUpdate: null,
        downloadProgressPercent: null,
        lastCheckedAtUtc: new Date().toISOString(),
        lastError: null
      }
    })

    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      this.status = {
        ...this.status,
        phase: 'downloading',
        downloadProgressPercent: Number.isFinite(progress.percent) ? Math.round(progress.percent) : null,
        lastError: null
      }
    })

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      this.status = {
        ...this.status,
        phase: 'downloaded',
        downloadedUpdate: toUpdateInfoSummary(info),
        downloadProgressPercent: 100,
        lastDownloadedAtUtc: new Date().toISOString(),
        lastError: null
      }
    })

    autoUpdater.on('error', (error: Error) => {
      this.status = {
        ...this.status,
        phase: 'error',
        lastError: createUpdateError(error.message)
      }
    })
  }

  getStatus(): UpdateStatus {
    return { ...this.status }
  }

  async checkForUpdates(): Promise<UpdateStatus> {
    if (!this.supported) {
      return this.getStatus()
    }

    try {
      this.status = {
        ...this.status,
        phase: 'checking',
        lastError: null
      }
      await autoUpdater.checkForUpdates()
    } catch (error) {
      this.status = {
        ...this.status,
        phase: 'error',
        lastError: createUpdateError(error instanceof Error ? error.message : '检查更新失败')
      }
    }

    return this.getStatus()
  }

  async downloadUpdate(): Promise<UpdateStatus> {
    if (!this.supported || !this.status.availableUpdate) {
      return this.getStatus()
    }

    try {
      this.status = {
        ...this.status,
        phase: 'downloading',
        downloadProgressPercent: 0,
        lastError: null
      }
      await autoUpdater.downloadUpdate()
    } catch (error) {
      this.status = {
        ...this.status,
        phase: 'error',
        lastError: createUpdateError(error instanceof Error ? error.message : '下载更新失败')
      }
    }

    return this.getStatus()
  }

  quitAndInstall(): void {
    if (this.supported && this.status.phase === 'downloaded') {
      autoUpdater.quitAndInstall(false, true)
    }
  }
}
