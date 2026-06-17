import type { CardRecord } from '@shared/types'

const NOTE_DESCRIPTION_VERSION = 1
const ALLOWED_HTML_TAGS = new Set([
  'a',
  'b',
  'br',
  'div',
  'em',
  'i',
  'li',
  'ol',
  'p',
  'span',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul'
])
const VOID_HTML_TAGS = new Set(['br'])
const REMOVED_HTML_TAGS = [
  'base',
  'button',
  'embed',
  'form',
  'iframe',
  'input',
  'link',
  'math',
  'meta',
  'object',
  'option',
  'script',
  'select',
  'style',
  'svg',
  'textarea'
]
const ALLOWED_CLASS_NAMES = new Set([
  'account-template-row',
  'account-template-table',
  'note-inline-timer',
  'note-template-table'
])

interface StoredNoteDescription {
  version: number
  html: string
  pinned: boolean
  timers?: NoteTimer[]
}

export type NoteTimerRepeat = 'none' | 'daily' | 'weekly' | 'monthly'
export type NoteTimerQuickPreset = 'monthly' | 'weekly' | 'five-hour'
export type NoteTimerStatus = 'scheduled' | 'fired' | 'done'
export type TimerSortDirection = 'asc' | 'desc'

export interface NoteTimer {
  id: string
  name: string
  quota?: string
  quotaResetValue?: string
  dueAt: number
  status: NoteTimerStatus
  repeat?: NoteTimerRepeat
  quickPreset?: NoteTimerQuickPreset
  isCore?: boolean
  isSort?: boolean
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

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#96;')
}

function isSafeHref(value: string): boolean {
  const normalized = value.trim().replace(/[\u0000-\u001F\u007F\s]+/g, '').toLowerCase()
  return (
    normalized.startsWith('https://') ||
    normalized.startsWith('http://') ||
    normalized.startsWith('mailto:') ||
    normalized.startsWith('#') ||
    normalized.startsWith('/')
  )
}

function sanitizeClassAttribute(value: string): string | null {
  const classes = value
    .split(/\s+/)
    .map((className) => className.trim())
    .filter((className) => ALLOWED_CLASS_NAMES.has(className))

  return classes.length > 0 ? classes.join(' ') : null
}

function sanitizeHtmlAttributes(tagName: string, attributes: string): string {
  const sanitized: string[] = []
  const attributePattern = /([a-zA-Z_:][\w:.-]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g
  let match: RegExpExecArray | null

  while ((match = attributePattern.exec(attributes)) !== null) {
    const name = match[1].toLowerCase()
    const value = match[3] ?? match[4] ?? match[5] ?? ''

    if (name.startsWith('on')) {
      continue
    }

    if (name === 'class') {
      const safeClasses = sanitizeClassAttribute(value)
      if (safeClasses) {
        sanitized.push(`class="${escapeAttribute(safeClasses)}"`)
      }
      continue
    }

    if (tagName === 'th' && name === 'scope' && ['row', 'col', 'rowgroup', 'colgroup'].includes(value)) {
      sanitized.push(`scope="${value}"`)
      continue
    }

    if (tagName === 'span' && name === 'data-timer-id') {
      sanitized.push(`data-timer-id="${escapeAttribute(value)}"`)
      continue
    }

    if (tagName === 'a' && name === 'href' && isSafeHref(value)) {
      sanitized.push(`href="${escapeAttribute(value.trim())}"`)
    }
  }

  return sanitized.length > 0 ? ` ${sanitized.join(' ')}` : ''
}

export function sanitizeNoteHtml(html: string): string {
  const removedTagPattern = REMOVED_HTML_TAGS.join('|')
  const withoutDangerousBlocks = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(new RegExp(`<\\s*(${removedTagPattern})\\b[^>]*>[\\s\\S]*?<\\s*\\/\\s*\\1\\s*>`, 'gi'), '')
    .replace(new RegExp(`<\\s*\\/?\\s*(${removedTagPattern})\\b[^>]*>`, 'gi'), '')

  return withoutDangerousBlocks.replace(
    /<\s*(\/?)\s*([a-zA-Z][\w:-]*)([^>]*)>/g,
    (_match, closingSlash: string, rawTagName: string, rawAttributes: string) => {
      const tagName = rawTagName.toLowerCase()
      if (!ALLOWED_HTML_TAGS.has(tagName)) {
        return ''
      }

      if (closingSlash) {
        return VOID_HTML_TAGS.has(tagName) ? '' : `</${tagName}>`
      }

      if (VOID_HTML_TAGS.has(tagName)) {
        return `<${tagName}>`
      }

      return `<${tagName}${sanitizeHtmlAttributes(tagName, rawAttributes)}>`
    }
  )
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

export function markDueTimersFired(
  timers: NoteTimer[],
  now = Date.now()
): { timers: NoteTimer[]; dueTimers: NoteTimer[] } {
  const dueTimerIds = new Set(
    timers.filter((timer) => timer.status === 'scheduled' && timer.dueAt <= now).map((timer) => timer.id)
  )

  return {
    timers: timers.map((timer) => (dueTimerIds.has(timer.id) ? { ...timer, status: 'fired' } : timer)),
    dueTimers: timers.filter((timer) => dueTimerIds.has(timer.id))
  }
}

export function acknowledgeFiredTimers(timers: NoteTimer[], timerIds: string[], now = Date.now()): NoteTimer[] {
  const acknowledgedTimerIds = new Set(timerIds)

  return timers.map((timer) => {
    if (!acknowledgedTimerIds.has(timer.id)) {
      return timer
    }

    const quickTimer = refreshQuickTimer(timer, now)
    if (quickTimer) {
      return quickTimer
    }

    if ((timer.repeat ?? 'none') !== 'none') {
      return {
        ...timer,
        dueAt: resolveTimerDueAt(timer, now),
        status: 'scheduled'
      }
    }

    return {
      ...timer,
      status: 'done'
    }
  })
}

export function snoozeFiredTimers(
  timers: NoteTimer[],
  timerIds: string[],
  delayMs: number,
  now = Date.now()
): NoteTimer[] {
  const snoozedTimerIds = new Set(timerIds)
  const nextDueAt = now + delayMs

  return timers.map((timer) =>
    snoozedTimerIds.has(timer.id)
      ? {
          ...timer,
          dueAt: nextDueAt,
          status: 'scheduled'
        }
      : timer
  )
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
  const normalized = value.match(/\d+/)?.[0]
  return normalized ? String(Number(normalized)) : undefined
}

export function getTimerQuotaInputValue(value: string | undefined): string {
  const numericValue = value?.match(/\d+(?:\.\d+)?/)?.[0]
  return numericValue ?? ''
}

function getTimerQuotaNumber(timer: NoteTimer): number | null {
  const value = getTimerQuotaInputValue(timer.quota)
  if (!value) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function getCoreTimer(note: NoteView): NoteTimer | null {
  return note.timers.find((timer) => timer.isCore && timer.status !== 'done') ?? null
}

function getSortTimer(note: NoteView): NoteTimer | null {
  return (
    note.timers.find((timer) => timer.isSort && timer.status !== 'done') ??
    getCoreTimer(note) ??
    note.timers.find((timer) => timer.status !== 'done') ??
    null
  )
}

function isWaitingNote(note: NoteView, now: number): boolean {
  const coreTimer = getCoreTimer(note)
  if (!coreTimer || getTimerQuotaNumber(coreTimer) !== 0) {
    return false
  }

  return coreTimer.dueAt > now
}

function compareNotesBySelectedTimer(left: NoteView, right: NoteView, now: number, direction: TimerSortDirection): number {
  if (left.pinned !== right.pinned) {
    return left.pinned ? -1 : 1
  }

  const leftTimer = getSortTimer(left)
  const rightTimer = getSortTimer(right)

  if (leftTimer && !rightTimer) {
    return direction === 'asc' ? -1 : 1
  }

  if (!leftTimer && rightTimer) {
    return direction === 'asc' ? 1 : -1
  }

  if (leftTimer && rightTimer) {
    const leftDueAt = resolveTimerDueAt(leftTimer, now)
    const rightDueAt = resolveTimerDueAt(rightTimer, now)
    if (leftDueAt !== rightDueAt) {
      return direction === 'asc' ? leftDueAt - rightDueAt : rightDueAt - leftDueAt
    }
  }

  return left.position - right.position
}

export function getTimerWorkspaceSections(
  notes: NoteView[],
  now = Date.now(),
  direction: TimerSortDirection = 'asc'
): { workspaceNotes: NoteView[]; waitingNotes: NoteView[] } {
  const workspaceNotes: NoteView[] = []
  const waitingNotes: NoteView[] = []

  for (const note of notes) {
    if (isWaitingNote(note, now)) {
      waitingNotes.push(note)
    } else {
      workspaceNotes.push(note)
    }
  }

  return {
    workspaceNotes: [...workspaceNotes].sort((left, right) => compareNotesBySelectedTimer(left, right, now, direction)),
    waitingNotes: [...waitingNotes].sort((left, right) => left.position - right.position)
  }
}

export function refreshDueCoreTimerQuotas(
  timers: NoteTimer[],
  now = Date.now()
): { timers: NoteTimer[]; changed: boolean } {
  let changed = false
  const nextTimers = timers.map((timer) => {
    if (!timer.isCore || getTimerQuotaNumber(timer) !== 0 || timer.dueAt > now) {
      return timer
    }

    const resetValue = normalizeTimerQuota(timer.quotaResetValue ?? '')
    if (!resetValue) {
      return timer
    }

    const refreshedTimer =
      refreshQuickTimer(timer, now) ??
      ((timer.repeat ?? 'none') !== 'none'
        ? {
            ...timer,
            dueAt: resolveTimerDueAt(timer, now),
            status: 'scheduled' as const
          }
        : null)

    if (!refreshedTimer) {
      return timer
    }

    changed = true
    return {
      ...refreshedTimer,
      quota: resetValue,
      quotaResetValue: resetValue
    }
  })

  return {
    timers: nextTimers,
    changed
  }
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
      const html = sanitizeNoteHtml(parsed.html)
      const summary = getSummaryFromHtml(html)
      return {
        ...card,
        html,
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
      quota: typeof timer.quota === 'string' && timer.quota.trim() ? normalizeTimerQuota(timer.quota) : undefined,
      quotaResetValue:
        typeof timer.quotaResetValue === 'string' && timer.quotaResetValue.trim()
          ? normalizeTimerQuota(timer.quotaResetValue)
          : typeof timer.quota === 'string' && timer.quota.trim()
            ? normalizeTimerQuota(timer.quota)
            : undefined,
      dueAt: typeof timer.dueAt === 'number' ? timer.dueAt : Date.now(),
      status: timer.status === 'fired' || timer.status === 'done' ? timer.status : 'scheduled',
      repeat:
        timer.repeat === 'daily' || timer.repeat === 'weekly' || timer.repeat === 'monthly'
          ? timer.repeat
          : 'none',
      quickPreset: isQuickPreset(timer.quickPreset) ? timer.quickPreset : undefined,
      isCore: timer.isCore === true,
      isSort: timer.isSort === true
    }))
}
