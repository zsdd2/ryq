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
})
