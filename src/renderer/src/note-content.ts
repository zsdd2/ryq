import type { CardRecord } from '@shared/types'

const NOTE_DESCRIPTION_VERSION = 1

interface StoredNoteDescription {
  version: number
  html: string
  pinned: boolean
  timers?: NoteTimer[]
}

export type NoteTimerRepeat = 'none' | 'daily' | 'weekly' | 'monthly'
export type NoteTimerQuickPreset = 'monthly' | 'weekly' | 'five-hour'

export interface NoteTimer {
  id: string
  name: string
  quota?: string
  dueAt: number
  status: 'scheduled' | 'fired'
  repeat?: NoteTimerRepeat
  quickPreset?: NoteTimerQuickPreset
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

export function getCompactTimerName(value: string): string {
  const compact = Array.from(value.trim()).slice(0, 4).join('')
  return compact || '计时'
}

function addMonths(timestamp: number, months: number): number {
  const date = new Date(timestamp)
  date.setMonth(date.getMonth() + months)
  return date.getTime()
}

function isQuickPreset(value: unknown): value is NoteTimerQuickPreset {
  return value === 'monthly' || value === 'weekly' || value === 'five-hour'
}

export function buildQuickTimerPreset(
  quickPreset: NoteTimerQuickPreset,
  now = Date.now()
): Pick<NoteTimer, 'dueAt' | 'repeat' | 'quickPreset'> {
  if (quickPreset === 'monthly') {
    return {
      dueAt: now + 30 * 24 * 60 * 60 * 1000,
      repeat: 'monthly',
      quickPreset
    }
  }

  if (quickPreset === 'weekly') {
    return {
      dueAt: now + 7 * 24 * 60 * 60 * 1000,
      repeat: 'weekly',
      quickPreset
    }
  }

  return {
    dueAt: now + 5 * 60 * 60 * 1000,
    repeat: 'none',
    quickPreset
  }
}

export function refreshQuickTimer(timer: NoteTimer, now = Date.now()): NoteTimer | null {
  if (!timer.quickPreset) {
    return null
  }

  return {
    ...timer,
    ...buildQuickTimerPreset(timer.quickPreset, now),
    status: 'scheduled'
  }
}

export function resolveTimerDueAt(timer: NoteTimer, now = Date.now()): number {
  const repeat = timer.repeat ?? 'none'
  if (repeat === 'none' || timer.dueAt > now) {
    return timer.dueAt
  }

  const step =
    repeat === 'daily'
      ? 24 * 60 * 60 * 1000
      : repeat === 'weekly'
        ? 7 * 24 * 60 * 60 * 1000
        : null

  if (step !== null) {
    const elapsedSteps = Math.floor((now - timer.dueAt) / step) + 1
    return timer.dueAt + elapsedSteps * step
  }

  let nextDueAt = timer.dueAt
  while (nextDueAt <= now) {
    nextDueAt = addMonths(nextDueAt, 1)
  }
  return nextDueAt
}

export function formatTimerRemaining(dueAt: number, now = Date.now()): string {
  const delta = dueAt - now
  const absoluteDelta = Math.abs(delta)
  const prefix = delta < 0 ? '超' : ''
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (absoluteDelta >= day) {
    return `${prefix}${Math.ceil(absoluteDelta / day)}天`
  }

  if (absoluteDelta >= hour) {
    return `${prefix}${Math.ceil(absoluteDelta / hour)}小时`
  }

  return `${prefix}${Math.max(1, Math.ceil(absoluteDelta / minute))}分`
}

export function normalizeTimerQuota(value: string): string | undefined {
  const normalized = value.trim().replace(/%+$/, '').trim()
  return normalized ? `${normalized}%` : undefined
}

export function getTimerQuotaInputValue(value: string | undefined): string {
  const numericValue = value?.match(/\d+(?:\.\d+)?/)?.[0]
  return numericValue ?? ''
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
      quota: typeof timer.quota === 'string' && timer.quota.trim() ? timer.quota.trim() : undefined,
      dueAt: typeof timer.dueAt === 'number' ? timer.dueAt : Date.now(),
      status: timer.status === 'fired' ? 'fired' : 'scheduled',
      repeat:
        timer.repeat === 'daily' || timer.repeat === 'weekly' || timer.repeat === 'monthly'
          ? timer.repeat
          : 'none',
      quickPreset: isQuickPreset(timer.quickPreset) ? timer.quickPreset : undefined
    }))
}
