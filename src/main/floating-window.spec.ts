import { describe, expect, it } from 'vitest'
import { createFloatingWindowOptions, getCollapsedLauncherPosition, getMovedWindowPosition } from './floating-window'

describe('createFloatingWindowOptions', () => {
  it('creates a compact always-on-top floating launcher window', () => {
    const options = createFloatingWindowOptions({
      platform: 'win32',
      preloadPath: 'preload.js'
    })

    expect(options.width).toBe(88)
    expect(options.height).toBe(88)
    expect(options.minWidth).toBeLessThanOrEqual(320)
    expect(options.minHeight).toBeLessThanOrEqual(360)
    expect(options.frame).toBe(false)
    expect(options.transparent).toBe(true)
    expect(options.alwaysOnTop).toBe(true)
    expect(options.maximizable).toBe(false)
    expect(options.resizable).toBe(false)
    expect(options.title).toBe('任意签')
    expect(options.webPreferences?.preload).toBe('preload.js')
    expect(options.webPreferences?.contextIsolation).toBe(true)
    expect(options.webPreferences?.nodeIntegration).toBe(false)
  })

  it('allows the floating panel to be resized larger without becoming a full app window', () => {
    const options = createFloatingWindowOptions({
      platform: 'win32',
      preloadPath: 'preload.js',
      mode: 'panel'
    })

    expect(options.width).toBe(680)
    expect(options.height).toBe(520)
    expect(options.resizable).toBe(true)
    expect(options.maxWidth).toBe(960)
    expect(options.maxHeight).toBe(760)
    expect(options.maximizable).toBe(false)
  })

  it('computes a moved launcher position from pointer deltas', () => {
    expect(getMovedWindowPosition([120, 80], { deltaX: 18.4, deltaY: -9.6 })).toEqual([138, 70])
  })

  it('collapses the panel back to a centered launcher position', () => {
    expect(getCollapsedLauncherPosition({ x: 100, y: 80, width: 680, height: 520 })).toEqual([396, 296])
  })
})
