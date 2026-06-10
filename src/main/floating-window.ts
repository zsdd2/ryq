import type { BrowserWindowConstructorOptions } from 'electron'

export type FloatingWindowMode = 'launcher' | 'panel'

export interface FloatingWindowOptionsInput {
  platform: NodeJS.Platform
  preloadPath: string
  mode?: FloatingWindowMode
}

export const FLOATING_LAUNCHER_BOUNDS = {
  width: 88,
  height: 88
} as const

export const FLOATING_PANEL_BOUNDS = {
  width: 680,
  height: 520
} as const

export const FLOATING_PANEL_MAX_BOUNDS = {
  width: 960,
  height: 760
} as const

export function getFloatingWindowBounds(mode: FloatingWindowMode): { width: number; height: number } {
  return mode === 'panel' ? FLOATING_PANEL_BOUNDS : FLOATING_LAUNCHER_BOUNDS
}

export function getMovedWindowPosition(
  currentPosition: readonly [number, number],
  delta: { deltaX: number; deltaY: number }
): [number, number] {
  return [
    Math.round(currentPosition[0] + delta.deltaX),
    Math.round(currentPosition[1] + delta.deltaY)
  ]
}

export function getCollapsedLauncherPosition(currentBounds: {
  x: number
  y: number
  width: number
  height: number
}): [number, number] {
  return [
    Math.round(currentBounds.x + (currentBounds.width - FLOATING_LAUNCHER_BOUNDS.width) / 2),
    Math.round(currentBounds.y + (currentBounds.height - FLOATING_LAUNCHER_BOUNDS.height) / 2)
  ]
}

export function createFloatingWindowOptions({
  preloadPath,
  mode = 'launcher'
}: FloatingWindowOptionsInput): BrowserWindowConstructorOptions {
  return {
    ...getFloatingWindowBounds(mode),
    minWidth: FLOATING_LAUNCHER_BOUNDS.width,
    minHeight: FLOATING_LAUNCHER_BOUNDS.height,
    maxWidth: FLOATING_PANEL_MAX_BOUNDS.width,
    maxHeight: FLOATING_PANEL_MAX_BOUNDS.height,
    show: false,
    title: '任意签',
    backgroundColor: '#00000000',
    frame: false,
    transparent: true,
    hasShadow: true,
    alwaysOnTop: true,
    resizable: mode === 'panel',
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  }
}
