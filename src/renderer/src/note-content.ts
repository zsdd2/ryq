import type { CardRecord } from '@shared/types'

const NOTE_DESCRIPTION_VERSION = 1

interface StoredNoteDescription {
  version: number
  html: string
  pinned: boolean
  timers?: NoteTimer[]
}

export interface NoteTimer {
  id: string
  name: string
  dueAt: number
  status: 'scheduled' | 'fired'
}

export interface NoteView extends CardRecord {
  html: string
  pinned: boolean
  summary: string
  timers: NoteTimer[]
}

function isStoredNoteDescription(value: unknown): value is StoredNoteDescription {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<StoredNoteDescription>
  return typeof candidate.html === 'string' && typeof candidate.pinned === 'boolean'
}

export function getSummaryFromHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function buildNoteDescription({ html, pinned }: { html: string; pinned: boolean }): string {
  return buildNoteDescriptionWithTimers({ html, pinned, timers: [] })
}

export function buildNoteDescriptionWithTimers({
  html,
  pinned,
  timers
}: {
  html: string
  pinned: boolean
  timers: NoteTimer[]
}): string {
  return JSON.stringify({
    version: NOTE_DESCRIPTION_VERSION,
    html,
    pinned,
    timers
  } satisfies StoredNoteDescription)
}

export function createNoteView(card: CardRecord): NoteView {
  try {
    const parsed = JSON.parse(card.description) as unknown
    if (isStoredNoteDescription(parsed)) {
      const summary = getSummaryFromHtml(parsed.html)
      return {
        ...card,
        html: parsed.html,
        pinned: parsed.pinned,
        summary: summary || card.title,
        timers: normalizeTimers(parsed.timers)
      }
    }
  } catch {
    // Legacy cards use plain description text, so fall through.
  }

  const html = card.description.trim() ? escapeHtml(card.description).replace(/\r?\n/g, '<br>') : escapeHtml(card.title)
  const summary = getSummaryFromHtml(html)
  return {
    ...card,
    html,
    pinned: false,
    summary: summary || card.title,
    timers: []
  }
}

function normalizeTimers(value: unknown): NoteTimer[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((timer): timer is Partial<NoteTimer> => Boolean(timer) && typeof timer === 'object')
    .map((timer) => ({
      id: typeof timer.id === 'string' ? timer.id : crypto.randomUUID(),
      name: typeof timer.name === 'string' && timer.name.trim() ? timer.name.trim() : '计时器',
      dueAt: typeof timer.dueAt === 'number' ? timer.dueAt : Date.now(),
      status: timer.status === 'fired' ? 'fired' : 'scheduled'
    }))
}
