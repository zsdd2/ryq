import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const mainSource = readFileSync(new URL('./index.ts', import.meta.url), 'utf8')

describe('main process app paths', () => {
  it('supports explicit app data and user data overrides for isolated smoke runs', () => {
    expect(mainSource).toContain('RENYIQIAN_APP_DATA_PATH')
    expect(mainSource).toContain('RENYIQIAN_USER_DATA_PATH')
    expect(mainSource).toContain("app.setPath('appData'")
    expect(mainSource).toContain("app.setPath('userData'")
  })
})
