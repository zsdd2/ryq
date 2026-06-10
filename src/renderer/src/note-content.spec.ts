import { describe, expect, it } from 'vitest'
import { buildNoteDescription, buildNoteDescriptionWithTimers, createNoteView, getSummaryFromHtml } from './note-content'

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
})
