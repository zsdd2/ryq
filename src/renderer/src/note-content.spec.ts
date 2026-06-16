import { describe, expect, it } from 'vitest'
import {
  buildNoteDescription,
  buildNoteDescriptionWithTimers,
  buildQuickTimerPreset,
  createNoteView,
  formatTimerRemaining,
  getCompactTimerName,
  getSummaryFromHtml,
  getTimerQuotaInputValue,
  acknowledgeFiredTimers,
  markDueTimersFired,
  normalizeTimerQuota,
  refreshQuickTimer,
  resolveTimerDueAt
} from './note-content'

describe('note content helpers', () => {
  it('turns legacy cards into note views with wrapped html content', () => {
    const note = createNoteView({
      id: 'card-1',
      columnId: 'column-1',
      title: 'Legacy note',
      description: '',
      position: 0,
      createdAt: '2026-06-10T00:00:00.000Z',
      updatedAt: '2026-06-10T00:00:00.000Z'
    })

    expect(note.html).toBe('Legacy note')
    expect(note.pinned).toBe(false)
    expect(note.summary).toBe('Legacy note')
  })

  it('stores rich note html and pinned state in the card description', () => {
    const description = buildNoteDescription({
      html: '<p><strong>Important</strong><br>Second line</p>',
      pinned: true
    })
    const note = createNoteView({
      id: 'card-2',
      columnId: 'column-1',
      title: 'Important Second line',
      description,
      position: 1,
      createdAt: '2026-06-10T00:00:00.000Z',
      updatedAt: '2026-06-10T00:00:00.000Z'
    })

    expect(note.html).toContain('<strong>Important</strong>')
    expect(note.pinned).toBe(true)
    expect(note.summary).toBe('Important Second line')
  })

  it('sanitizes stored rich html before rendering note views', () => {
    const description = buildNoteDescription({
      html: '<p onclick="alert(1)">Hello<script>alert(2)</script><img src=x onerror="alert(3)"><a href="javascript:alert(4)">bad</a></p>',
      pinned: false
    })
    const note = createNoteView({
      id: 'card-safe',
      columnId: 'column-1',
      title: 'Unsafe note',
      description,
      position: 1,
      createdAt: '2026-06-10T00:00:00.000Z',
      updatedAt: '2026-06-10T00:00:00.000Z'
    })

    expect(note.html).toBe('<p>Hello<a>bad</a></p>')
    expect(note.html).not.toContain('script')
    expect(note.html).not.toContain('onclick')
    expect(note.html).not.toContain('onerror')
    expect(note.html).not.toContain('javascript:')
  })

  it('preserves supported formatting, table markup, and timer markers while sanitizing attributes', () => {
    const description = buildNoteDescription({
      html: '<table class="note-template-table unknown"><tbody><tr class="account-template-row"><th scope="row" style="color:red">账号</th><td><strong>VIP</strong><span class="note-inline-timer other" data-timer-id="timer-1" onclick="alert(1)">计时</span></td></tr></tbody></table>',
      pinned: false
    })
    const note = createNoteView({
      id: 'card-table',
      columnId: 'column-1',
      title: 'Table note',
      description,
      position: 1,
      createdAt: '2026-06-10T00:00:00.000Z',
      updatedAt: '2026-06-10T00:00:00.000Z'
    })

    expect(note.html).toContain('<table class="note-template-table">')
    expect(note.html).toContain('<tr class="account-template-row">')
    expect(note.html).toContain('<th scope="row">账号</th>')
    expect(note.html).toContain('<strong>VIP</strong>')
    expect(note.html).toContain('<span class="note-inline-timer" data-timer-id="timer-1">计时</span>')
    expect(note.html).not.toContain('style=')
    expect(note.html).not.toContain('onclick=')
    expect(note.html).not.toContain('unknown')
  })

  it('extracts a plain summary from rich html', () => {
    expect(getSummaryFromHtml('<h1>Title</h1><p>First<br>Second</p>')).toBe('Title First Second')
  })

  it('stores multiple note timers with the rich note content', () => {
    const description = buildNoteDescriptionWithTimers({
      html: '<p>Call customer</p>',
      pinned: false,
      timers: [
        {
          id: 'timer-1',
          name: 'First reminder',
          quota: '20次',
          dueAt: 1780000000000,
          status: 'scheduled'
        },
        {
          id: 'timer-2',
          name: 'Follow up',
          dueAt: 1780003600000,
          status: 'fired'
        }
      ]
    })
    const note = createNoteView({
      id: 'card-3',
      columnId: 'column-1',
      title: 'Call customer',
      description,
      position: 2,
      createdAt: '2026-06-10T00:00:00.000Z',
      updatedAt: '2026-06-10T00:00:00.000Z'
    })

    expect(note.timers).toHaveLength(2)
    expect(note.timers[0]).toMatchObject({
      id: 'timer-1',
      name: 'First reminder',
      quota: '20次',
      status: 'scheduled'
    })
  })

  it('formats note timers as one compact value and unit', () => {
    const now = new Date('2026-06-10T08:00:00.000Z').getTime()

    expect(formatTimerRemaining(now + 3 * 24 * 60 * 60 * 1000, now)).toBe('3天')
    expect(formatTimerRemaining(now + 5 * 60 * 60 * 1000, now)).toBe('5小时')
    expect(formatTimerRemaining(now + 35 * 60 * 1000, now)).toBe('35分')
    expect(formatTimerRemaining(now - 2 * 60 * 60 * 1000, now)).toBe('超2小时')
  })

  it('uses only the first four visible characters for timer card labels', () => {
    expect(getCompactTimerName('浏览器账号会员')).toBe('浏览器账')
    expect(getCompactTimerName('API')).toBe('API')
  })

  it('stores timer quota as a percentage while keeping the input numeric', () => {
    expect(normalizeTimerQuota('30')).toBe('30%')
    expect(normalizeTimerQuota('30%')).toBe('30%')
    expect(normalizeTimerQuota('')).toBeUndefined()
    expect(getTimerQuotaInputValue('30%')).toBe('30')
    expect(getTimerQuotaInputValue('20次')).toBe('20')
  })

  it('resolves recurring timers to their next visible due date', () => {
    const now = new Date('2026-06-10T08:00:00.000Z').getTime()
    const yesterday = new Date('2026-06-09T07:30:00.000Z').getTime()

    expect(resolveTimerDueAt({ id: 't1', name: 'daily', dueAt: yesterday, status: 'scheduled', repeat: 'daily' }, now)).toBe(
      new Date('2026-06-11T07:30:00.000Z').getTime()
    )
  })

  it('builds quick timer presets from the current time', () => {
    const now = new Date('2026-06-10T08:00:00.000Z').getTime()

    expect(buildQuickTimerPreset('monthly', now)).toMatchObject({
      dueAt: now + 30 * 24 * 60 * 60 * 1000,
      repeat: 'monthly',
      quickPreset: 'monthly'
    })
    expect(buildQuickTimerPreset('weekly', now)).toMatchObject({
      dueAt: now + 7 * 24 * 60 * 60 * 1000,
      repeat: 'weekly',
      quickPreset: 'weekly'
    })
    expect(buildQuickTimerPreset('five-hour', now)).toMatchObject({
      dueAt: now + 5 * 60 * 60 * 1000,
      repeat: 'none',
      quickPreset: 'five-hour'
    })
  })

  it('refreshes quick timers from the current time', () => {
    const now = new Date('2026-06-10T18:00:00.000Z').getTime()
    const timer = {
      id: 'timer-quick',
      name: 'quota',
      dueAt: new Date('2026-06-10T10:00:00.000Z').getTime(),
      status: 'scheduled' as const,
      repeat: 'none' as const,
      quickPreset: 'five-hour' as const
    }

    expect(refreshQuickTimer(timer, now)?.dueAt).toBe(new Date('2026-06-10T23:00:00.000Z').getTime())
  })

  it('marks due scheduled timers as fired before user acknowledgement', () => {
    const now = new Date('2026-06-10T08:00:00.000Z').getTime()
    const dueAt = new Date('2026-06-10T07:59:00.000Z').getTime()
    const futureAt = new Date('2026-06-10T09:00:00.000Z').getTime()

    const result = markDueTimersFired(
      [
        { id: 'due', name: 'due timer', dueAt, status: 'scheduled' },
        { id: 'future', name: 'future timer', dueAt: futureAt, status: 'scheduled' }
      ],
      now
    )

    expect(result.dueTimers.map((timer) => timer.id)).toEqual(['due'])
    expect(result.timers).toMatchObject([
      { id: 'due', status: 'fired' },
      { id: 'future', status: 'scheduled' }
    ])
  })

  it('acknowledges fired timers by rolling repeating timers and completing one-shot timers', () => {
    const now = new Date('2026-06-10T08:00:00.000Z').getTime()

    expect(
      acknowledgeFiredTimers(
        [
          {
            id: 'monthly',
            name: 'monthly timer',
            dueAt: new Date('2026-06-09T08:00:00.000Z').getTime(),
            status: 'fired',
            repeat: 'monthly',
            quickPreset: 'monthly'
          },
          {
            id: 'single',
            name: 'single timer',
            dueAt: new Date('2026-06-09T08:00:00.000Z').getTime(),
            status: 'fired'
          }
        ],
        ['monthly', 'single'],
        now
      )
    ).toMatchObject([
      {
        id: 'monthly',
        status: 'scheduled',
        dueAt: now + 30 * 24 * 60 * 60 * 1000
      },
      { id: 'single', status: 'done' }
    ])
  })
})
