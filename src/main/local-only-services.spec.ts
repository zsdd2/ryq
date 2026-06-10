import { describe, expect, it } from 'vitest'
import { createLocalOnlySyncStatus, createLocalOnlyUpdateStatus } from './local-only-services'

describe('local-only service status', () => {
  it('reports sync as disabled without any remote folder state', () => {
    const status = createLocalOnlySyncStatus()

    expect(status.configured).toBe(false)
    expect(status.syncing).toBe(false)
    expect(status.folderPath).toBeNull()
    expect(status.syncRootPath).toBeNull()
    expect(status.pendingLocalOperations).toBe(0)
    expect(status.lastError).toBeNull()
    expect(status.notices).toEqual([])
  })

  it('reports updater as unsupported and disabled', () => {
    const status = createLocalOnlyUpdateStatus('0.2.0')

    expect(status.supported).toBe(false)
    expect(status.phase).toBe('disabled')
    expect(status.currentVersion).toBe('0.2.0')
    expect(status.availableUpdate).toBeNull()
    expect(status.downloadedUpdate).toBeNull()
    expect(status.downloadProgressPercent).toBeNull()
    expect(status.lastError).toBeNull()
  })
})
