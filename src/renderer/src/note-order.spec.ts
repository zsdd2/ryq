import { describe, expect, it } from 'vitest'
import { getNoteDropIndex } from './note-order'

describe('note ordering helpers', () => {
  const notes = [
    { id: 'pinned-a', pinned: true, position: 1 },
    { id: 'note-a', pinned: false, position: 0 },
    { id: 'note-b', pinned: false, position: 2 },
    { id: 'note-c', pinned: false, position: 3 }
  ]

  it('moves a lower regular note above an upper regular note', () => {
    expect(getNoteDropIndex(notes, 'note-c', 'note-a', 'before')).toBe(0)
  })

  it('moves an upper regular note below a lower regular note', () => {
    expect(getNoteDropIndex(notes, 'note-a', 'note-c', 'after')).toBe(3)
  })

  it('keeps pinned and regular sections separate', () => {
    expect(getNoteDropIndex(notes, 'note-a', 'pinned-a', 'before')).toBeNull()
  })
})
