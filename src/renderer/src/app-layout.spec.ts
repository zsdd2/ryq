import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const appSource = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('./styles.css', import.meta.url), 'utf8')

describe('compact application layout', () => {
  it('places global search above quick note entry', () => {
    expect(appSource.indexOf('className="global-search"')).toBeLessThan(appSource.indexOf("'quick-add expanded'"))
  })

  it('shows the runtime application version beside the product title', () => {
    expect(appSource).toContain('windowState?.appVersion')
    expect(appSource).toContain('title-version')
  })

  it('keeps the timer area close to one quarter of the note card width', () => {
    expect(styles).toContain('minmax(132px, 145px)')
    expect(styles).toContain('grid-template-columns: minmax(32px, 1fr) 30px 38px 14px')
  })

  it('collects reminder history behind a titlebar exclamation button', () => {
    expect(appSource).toContain('REMINDER_HISTORY_STORAGE_KEY')
    expect(appSource).toContain('reminder-history-button')
    expect(appSource).toContain('clearReminderHistory')
    expect(appSource).toContain('reminder-history-panel')
  })

  it('moves active reminders onto alert note cards instead of the old bottom bubble', () => {
    expect(styles).toContain('.note-reminder-chip')
    expect(styles).toContain('position: absolute')
    expect(styles).not.toContain('.reminder-bubble')
    expect(styles).not.toContain('padding-top: 28px')
  })

  it('keeps titlebar icon controls easy to click without enlarging the icon artwork', () => {
    expect(styles).toContain('.icon-button')
    expect(styles).toContain('min-width: 34px')
    expect(styles).toContain('min-height: 34px')
    expect(styles).toContain('padding: 0')
  })

  it('shows timer-based workspace and waiting sections with sort controls', () => {
    expect(appSource).toContain('getTimerWorkspaceSections')
    expect(appSource).toContain('timerSortDirection')
    expect(appSource).toContain('工作区')
    expect(appSource).toContain('等待区')
    expect(appSource).toContain('设为核心')
    expect(appSource).toContain('设为排序')
    expect(appSource).toContain('refreshDueCoreTimerQuotas')
    expect(styles).toContain('.note-section-heading')
    expect(styles).toContain('.timer-role-actions')
  })
})
