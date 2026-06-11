export type NoteOrderItem = {
  id: string
  pinned: boolean
  position: number
}

export type DropPlacement = 'before' | 'after'

export function getNoteDropIndex(
  notes: NoteOrderItem[],
  draggedId: string,
  targetId: string,
  placement: DropPlacement
): number | null {
  const draggedNote = notes.find((note) => note.id === draggedId)
  const targetNote = notes.find((note) => note.id === targetId)
  if (!draggedNote || !targetNote || draggedNote.id === targetNote.id) {
    return null
  }

  if (draggedNote.pinned !== targetNote.pinned) {
    return null
  }

  const databaseOrder = [...notes]
    .sort((left, right) => left.position - right.position)
    .filter((note) => note.id !== draggedId)
  const targetIndex = databaseOrder.findIndex((note) => note.id === targetId)
  if (targetIndex < 0) {
    return null
  }

  return targetIndex + (placement === 'after' ? 1 : 0)
}
