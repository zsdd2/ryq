import { describe, expect, it } from 'vitest'
import {
  buildNoteDescription,
  buildNoteDescriptionWithTimers,
  createNoteView,
  formatTimerRemaining,
  getCompactTimerName,
  getSummaryFromHtml,
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

  it('resolves recurring timers to their next visible due date', () => {
    const now = new Date('2026-06-10T08:00:00.000Z').getTime()
    const yesterday = new Date('2026-06-09T07:30:00.000Z').getTime()

    expect(resolveTimerDueAt({ id: 't1', name: 'daily', dueAt: yesterday, status: 'scheduled', repeat: 'daily' }, now)).toBe(
      new Date('2026-06-11T07:30:00.000Z').getTime()
    )
  })
})
