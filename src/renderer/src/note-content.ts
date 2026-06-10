import type { CardRecord } from '@shared/types'

const NOTE_DESCRIPTION_VERSION = 1

interface StoredNoteDescription {
  version: number
  html: string
  pinned: boolean
}

export interface NoteView extends CardRecord {
  html: string
  pinned: boolean
  summary: string
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
  return JSON.stringify({
    version: NOTE_DESCRIPTION_VERSION,
    html,
    pinned
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
        summary: summary || card.title
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
    summary: summary || card.title
  }
}
