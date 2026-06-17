import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const mainSource = readFileSync(new URL('./index.ts', import.meta.url), 'utf8')

describe('tray-only desktop behavior', () => {
  it('creates a tray entry that can show, hide, and quit the app', () => {
    expect(mainSource).toContain("import { app, BrowserWindow, ipcMain, Menu, Tray } from 'electron'")
    expect(mainSource).toContain('let tray: Tray | null = null')
    expect(mainSource).toContain('function createTray(): void')
    expect(mainSource).toContain("label: '显示/隐藏'")
    expect(mainSource).toContain("label: '退出'")
  })

  it('hides the window on close instead of quitting from the titlebar close button', () => {
    expect(mainSource).toContain('let isQuitting = false')
    expect(mainSource).toContain("event.preventDefault()")
    expect(mainSource).toContain('window.hide()')
    expect(mainSource).toContain('isQuitting = true')
  })
})
