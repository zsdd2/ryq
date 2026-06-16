import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import {
  AlertCircle,
  AlarmClock,
  Bold,
  ChevronDown,
  Download,
  Italic,
  List,
  ListOrdered,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Power,
  RefreshCw,
  Trash2,
  Underline,
  X
} from 'lucide-react'
import type { BoardSummary, NoteSearchResult, UpdateStatus, WindowState, WorkspaceRecord } from '@shared/types'
import renyiqianLogoUrl from '../../../logos/renyiqian-logo.png'
import {
  acknowledgeFiredTimers,
  buildNoteDescription,
  buildNoteDescriptionWithTimers,
  buildQuickTimerPreset,
  createNoteView,
  escapeHtml,
  formatTimerRemaining,
  getCompactTimerName,
  getSummaryFromHtml,
  getTimerQuotaInputValue,
  markDueTimersFired,
  normalizeTimerQuota,
  refreshQuickTimer,
  resolveTimerDueAt,
  snoozeFiredTimers,
  type NoteTimerQuickPreset,
  type NoteTimerRepeat,
  type NoteTimer,
  type NoteView
} from './note-content'
import {
  appendTemplateColumn,
  appendTemplateRow,
  buildAccountMembershipTemplateHtml,
  buildTemplateNoteHtml,
  getDefaultNoteTemplates,
  normalizeTemplateColumns,
  normalizeTemplateRows
} from './note-template'
import { getNoteDropIndex, type DropPlacement } from './note-order'

const TEMPLATE_STORAGE_KEY = 'renyiqian.noteTemplateText'
const TEMPLATE_COLUMNS_STORAGE_KEY = 'renyiqian.noteTemplateColumnsText'
const TEMPLATE_SELECTED_STORAGE_KEY = 'renyiqian.selectedTemplateId'
const REMINDER_HISTORY_STORAGE_KEY = 'renyiqian.reminderHistory'
const REMINDER_HISTORY_LIMIT = 50
const DEFAULT_TEMPLATE_TEXT = '客户\n电话\n事项\n备注'
const DEFAULT_TEMPLATE_COLUMNS_TEXT = '内容'
const LAUNCHER_DRAG_HOLD_MS = 220
const DEFAULT_NOTE_TEMPLATES = getDefaultNoteTemplates()
const QUICK_TIMER_PRESETS: Array<{ id: NoteTimerQuickPreset; label: string }> = [
  { id: 'monthly', label: '30天' },
  { id: 'weekly', label: '7天' },
  { id: 'five-hour', label: '5小时' }
]
const REMINDER_SNOOZE_OPTIONS = [
  { label: '10分钟后', delayMs: 10 * 60 * 1000 },
  { label: '1小时后', delayMs: 60 * 60 * 1000 },
  { label: '明天', delayMs: 24 * 60 * 60 * 1000 }
]

interface ReminderNotice {
  noteId: string
  timerIds: string[]
  timerNames: string[]
  noteTitle: string
  boardTitle?: string
  message: string
  firedAt: number
}

interface ReminderHistoryEntry {
  id: string
  noteId: string
  noteTitle: string
  boardTitle?: string
  timerNames: string[]
  message: string
  action: 'confirmed' | 'snoozed'
  actionLabel: string
  triggeredAt: number
  handledAt: number
}

type ReminderNoteView = NoteView & Partial<Pick<NoteSearchResult, 'boardId' | 'boardTitle' | 'columnTitle'>>

function readStoredReminderHistory(): ReminderHistoryEntry[] {
  try {
    const storedHistory = window.localStorage.getItem(REMINDER_HISTORY_STORAGE_KEY)
    const parsed = storedHistory ? (JSON.parse(storedHistory) as unknown) : []
    return Array.isArray(parsed)
      ? parsed
          .filter((entry): entry is ReminderHistoryEntry => Boolean(entry) && typeof entry === 'object')
          .slice(0, REMINDER_HISTORY_LIMIT)
      : []
  } catch {
    return []
  }
}

function App(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [workspace, setWorkspace] = useState<WorkspaceRecord | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftGroupTitle, setDraftGroupTitle] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<NoteSearchResult[]>([])
  const [windowState, setWindowState] = useState<WindowState | null>(null)
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null)
  const [updateNotice, setUpdateNotice] = useState<string | null>(null)
  const [reminderNotice, setReminderNotice] = useState<ReminderNotice | null>(null)
  const [reminderHistory, setReminderHistory] = useState<ReminderHistoryEntry[]>(readStoredReminderHistory)
  const [showReminderHistory, setShowReminderHistory] = useState(false)
  const [selectedNote, setSelectedNote] = useState<NoteView | null>(null)
  const [showQuickAddInput, setShowQuickAddInput] = useState(false)
  const [showTemplatePanel, setShowTemplatePanel] = useState(false)
  const [templateText, setTemplateText] = useState(DEFAULT_TEMPLATE_TEXT)
  const [templateColumnsText, setTemplateColumnsText] = useState(DEFAULT_TEMPLATE_COLUMNS_TEXT)
  const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_NOTE_TEMPLATES[0]?.id ?? 'custom-table')
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [accountTemplateCount, setAccountTemplateCount] = useState(1)
  const [accountTemplateCustomText, setAccountTemplateCustomText] = useState('')
  const [timerName, setTimerName] = useState('')
  const [timerQuota, setTimerQuota] = useState('')
  const [timerDueAt, setTimerDueAt] = useState('')
  const [timerRepeat, setTimerRepeat] = useState<NoteTimerRepeat>('none')
  const [timerQuickPreset, setTimerQuickPreset] = useState<NoteTimerQuickPreset | null>(null)
  const [editingTimerId, setEditingTimerId] = useState<string | null>(null)
  const [editingCardQuota, setEditingCardQuota] = useState<{ noteId: string; timerId: string; value: string } | null>(null)
  const [timerNow, setTimerNow] = useState(() => Date.now())
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const quickAddInputRef = useRef<HTMLInputElement | null>(null)
  const editorRef = useRef<HTMLDivElement | null>(null)
  const editorHtmlRef = useRef('')
  const launcherPressRef = useRef<{
    dragging: boolean
    lastScreenX: number
    lastScreenY: number
    pointerId: number
    timer: ReturnType<typeof setTimeout> | null
  } | null>(null)

  const groups = workspace?.boards ?? []
  const activeGroup = workspace?.activeBoard ?? null
  const firstColumnId = activeGroup?.columns[0]?.id ?? null
  const trimmedSearchQuery = searchQuery.trim()

  const notes = useMemo(() => {
    return (activeGroup?.columns.flatMap((column) => column.cards) ?? [])
      .map(createNoteView)
      .sort((left, right) => {
        const leftHasFiredTimers = left.timers.some((timer) => timer.status === 'fired')
        const rightHasFiredTimers = right.timers.some((timer) => timer.status === 'fired')
        if (leftHasFiredTimers !== rightHasFiredTimers) {
          return leftHasFiredTimers ? -1 : 1
        }
        if (left.pinned !== right.pinned) {
          return left.pinned ? -1 : 1
        }
        return left.position - right.position
      })
  }, [activeGroup])

  const searchNotes = useMemo(() => {
    return searchResults.map((result) => ({
      ...createNoteView(result),
      boardId: result.boardId,
      boardTitle: result.boardTitle,
      columnTitle: result.columnTitle
    }))
  }, [searchResults])

  const visibleNotes = trimmedSearchQuery ? searchNotes : notes
  const selectedTemplate =
    DEFAULT_NOTE_TEMPLATES.find((template) => template.id === selectedTemplateId) ?? DEFAULT_NOTE_TEMPLATES[0]
  const updateProgress = updateStatus?.downloadProgressPercent ?? null
  const canDownloadUpdate = updateStatus?.phase === 'available'
  const canInstallUpdate = updateStatus?.phase === 'downloaded'
  const isDownloadingUpdate = updateStatus?.phase === 'downloading'
  const reminderButtonCount = (reminderNotice ? 1 : 0) + reminderHistory.length

  useEffect(() => {
    if (showQuickAddInput) {
      quickAddInputRef.current?.focus()
    }
  }, [showQuickAddInput])

  function getTemplateRowsText(): string {
    return selectedTemplate?.id === 'custom-table' ? templateText : selectedTemplate?.rows.join('\n') ?? templateText
  }

  function getTemplateColumnsText(): string {
    return selectedTemplate?.id === 'custom-table'
      ? templateColumnsText
      : selectedTemplate?.columns.join('\n') ?? templateColumnsText
  }

  function getVisibleTimerRows(timers: NoteTimer[]): Array<{ id: string; name: string; quota: string; due: string; title: string }> {
    return timers.filter((timer) => timer.status !== 'done').map((timer) => {
      const dueAt = resolveTimerDueAt(timer, timerNow)
      return {
        id: timer.id,
        name: getCompactTimerName(timer.name),
        quota: timer.quota?.trim() ?? '',
        due: formatTimerRemaining(dueAt, timerNow),
        title: `${timer.name}${timer.quota ? ` ${timer.quota}` : ''} ${new Date(dueAt).toLocaleString()}`
      }
    })
  }

  function buildReminderNotice(note: ReminderNoteView, firedTimers: NoteTimer[], firedAt = Date.now()): ReminderNotice {
    const timerNames = firedTimers.map((timer) => timer.name)
    const noteTitle = note.summary || note.title

    return {
      noteId: note.id,
      timerIds: firedTimers.map((timer) => timer.id),
      timerNames,
      noteTitle,
      boardTitle: note.boardTitle,
      message: `便签提醒：${timerNames.join('、')}`,
      firedAt
    }
  }

  function addReminderHistory(notice: ReminderNotice, action: ReminderHistoryEntry['action'], actionLabel: string): void {
    const handledAt = Date.now()
    const entry: ReminderHistoryEntry = {
      id: `${notice.noteId}-${notice.firedAt}-${handledAt}-${action}`,
      noteId: notice.noteId,
      noteTitle: notice.noteTitle,
      boardTitle: notice.boardTitle,
      timerNames: notice.timerNames,
      message: notice.message,
      action,
      actionLabel,
      triggeredAt: notice.firedAt,
      handledAt
    }

    setReminderHistory((currentHistory) => [entry, ...currentHistory].slice(0, REMINDER_HISTORY_LIMIT))
  }

  function clearReminderHistory(): void {
    setReminderHistory([])
    try {
      window.localStorage.removeItem(REMINDER_HISTORY_STORAGE_KEY)
    } catch {
      // Ignore storage failures; the in-memory history is already cleared.
    }
  }

  function getAccountTemplateCustomRows(): string[] {
    return accountTemplateCustomText
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((row) => row.trim())
      .filter(Boolean)
  }

  function formatDatetimeLocal(timestamp: number): string {
    const date = new Date(timestamp)
    const offsetMs = date.getTimezoneOffset() * 60 * 1000
    return new Date(timestamp - offsetMs).toISOString().slice(0, 16)
  }

  async function refreshWorkspace(): Promise<void> {
    const nextWorkspace = await window.stickban.getWorkspace()
    setWorkspace(nextWorkspace)
  }

  async function getAllReminderNotes(): Promise<ReminderNoteView[]> {
    const allNotes = await window.stickban.getAllNotes()
    return allNotes.map((note) => ({
      ...createNoteView(note),
      boardId: note.boardId,
      boardTitle: note.boardTitle,
      columnTitle: note.columnTitle
    }))
  }

  async function setPanelOpen(nextValue: boolean): Promise<void> {
    setIsOpen(nextValue)
    const nextWindowState = await window.stickban.setFloatingPanelOpen(nextValue)
    setWindowState(nextWindowState)
  }

  async function toggleLaunchOnStartup(): Promise<void> {
    if (!windowState?.launchOnStartupSupported) {
      setError('开机启动需要安装后的 Windows 版本使用')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const nextWindowState = await window.stickban.setLaunchOnStartup(!windowState.launchOnStartup)
      setWindowState(nextWindowState)
    } catch (startupError) {
      setError(startupError instanceof Error ? startupError.message : '设置开机启动失败')
    } finally {
      setSaving(false)
    }
  }

  async function checkForUpdates(): Promise<void> {
    setSaving(true)
    setUpdateNotice(null)
    try {
      const nextUpdateStatus = await window.stickban.checkForUpdates()
      setUpdateStatus(nextUpdateStatus)
      if (!nextUpdateStatus.supported) {
        setUpdateNotice('远程升级需要安装后的正式版本使用')
      } else if (nextUpdateStatus.phase === 'up-to-date') {
        setUpdateNotice('当前已经是最新版本')
      } else if (nextUpdateStatus.phase === 'available') {
        setUpdateNotice(`发现新版本 ${nextUpdateStatus.availableUpdate?.version ?? ''}`)
      } else if (nextUpdateStatus.phase === 'downloaded') {
        setUpdateNotice(`新版本 ${nextUpdateStatus.downloadedUpdate?.version ?? ''} 已下载`)
      } else if (nextUpdateStatus.phase === 'error') {
        setUpdateNotice(nextUpdateStatus.lastError?.message ?? '检查更新失败')
      }
    } catch (updateError) {
      setUpdateNotice(updateError instanceof Error ? updateError.message : '检查更新失败')
    } finally {
      setSaving(false)
    }
  }

  async function downloadAvailableUpdate(): Promise<void> {
    if (updateStatus?.phase === 'downloaded') {
      await window.stickban.quitAndInstallUpdate()
      return
    }

    if (updateStatus?.phase !== 'available') {
      return
    }

    setSaving(true)
    setUpdateNotice(`正在下载新版本 ${updateStatus.availableUpdate?.version ?? ''}`)
    let disposed = false
    const progressTimer = window.setInterval(() => {
      void window.stickban.getUpdateStatus().then((nextStatus) => {
        if (!disposed) {
          setUpdateStatus(nextStatus)
        }
      })
    }, 700)
    try {
      const downloadedStatus = await window.stickban.downloadUpdate()
      setUpdateStatus(downloadedStatus)
      if (downloadedStatus.phase === 'downloaded') {
        setUpdateNotice(`新版本 ${downloadedStatus.downloadedUpdate?.version ?? updateStatus.availableUpdate?.version ?? ''} 已下载`)
      } else if (downloadedStatus.phase === 'error') {
        setUpdateNotice(downloadedStatus.lastError?.message ?? '下载更新失败')
      }
    } catch (downloadError) {
      setUpdateNotice(downloadError instanceof Error ? downloadError.message : '下载更新失败')
    } finally {
      disposed = true
      window.clearInterval(progressTimer)
      setSaving(false)
    }
  }

  async function selectGroup(group: BoardSummary): Promise<void> {
    setSaving(true)
    setError(null)
    try {
      const nextWorkspace = await window.stickban.setActiveBoard(group.id)
      setWorkspace(nextWorkspace)
      setSelectedNote(null)
    } catch (selectError) {
      setError(selectError instanceof Error ? selectError.message : '切换分组失败')
    } finally {
      setSaving(false)
    }
  }

  async function createGroup(): Promise<void> {
    const title = draftGroupTitle.trim()
    if (!title) {
      return
    }

    setSaving(true)
    setError(null)
    try {
      const nextWorkspace = await window.stickban.createBoard({ title })
      setWorkspace(nextWorkspace)
      setDraftGroupTitle('')
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : '新增分组失败')
    } finally {
      setSaving(false)
    }
  }

  function toggleGroupSelection(groupId: string): void {
    setSelectedGroupIds((currentIds) =>
      currentIds.includes(groupId) ? currentIds.filter((selectedId) => selectedId !== groupId) : [...currentIds, groupId]
    )
  }

  async function renameGroup(group: BoardSummary): Promise<void> {
    const title = window.prompt('修改分组名称', group.title)?.trim()
    if (!title || title === group.title) {
      return
    }

    setSaving(true)
    setError(null)
    try {
      const nextWorkspace = await window.stickban.updateBoard(group.id, { title })
      setWorkspace(nextWorkspace)
    } catch (renameError) {
      setError(renameError instanceof Error ? renameError.message : '修改分组失败')
    } finally {
      setSaving(false)
    }
  }

  async function removeSelectedGroups(): Promise<void> {
    const selectedGroups = groups.filter((group) => selectedGroupIds.includes(group.id))
    if (selectedGroups.length === 0) {
      return
    }

    if (groups.length - selectedGroups.length < 1) {
      setError('至少保留一个分组')
      return
    }

    const selectedNames = selectedGroups.map((group) => group.title).join('、')
    if (!window.confirm(`删除分组“${selectedNames}”？分组内便签也会删除。`)) {
      return
    }

    setSaving(true)
    setError(null)
    try {
      let nextWorkspace: WorkspaceRecord | null = null
      for (const group of selectedGroups) {
        nextWorkspace = await window.stickban.deleteBoard(group.id)
      }
      if (nextWorkspace) {
        setWorkspace(nextWorkspace)
      }
      setSelectedGroupIds([])
      setSelectedNote(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '删除分组失败')
    } finally {
      setSaving(false)
    }
  }

  async function createQuickNote(): Promise<void> {
    const title = draftTitle.trim()
    if (!title || !firstColumnId) {
      return
    }

    setSaving(true)
    setError(null)
    try {
      const nextWorkspace = await window.stickban.createCard(firstColumnId, {
        title,
        description: buildNoteDescription({
          html: escapeHtml(title),
          pinned: false
        })
      })
      setWorkspace(nextWorkspace)
      setDraftTitle('')
      setShowQuickAddInput(false)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : '新增便签失败')
    } finally {
      setSaving(false)
    }
  }

  async function createTemplateNote(): Promise<void> {
    if (!firstColumnId) {
      return
    }

    const templateRows =
      selectedTemplate?.id === 'account-membership'
        ? ['账号名称']
        : normalizeTemplateRows(getTemplateRowsText())
    if (templateRows.length === 0) {
      setError('请先设置模板表格项目')
      return
    }

    const html =
      selectedTemplate?.id === 'account-membership'
        ? buildAccountMembershipTemplateHtml(accountTemplateCount, getAccountTemplateCustomRows())
        : buildTemplateNoteHtml(getTemplateRowsText(), getTemplateColumnsText())
    const title = selectedTemplate?.name ?? (getSummaryFromHtml(html).slice(0, 80) || '模板便签')

    setSaving(true)
    setError(null)
    try {
      const nextWorkspace = await window.stickban.createCard(firstColumnId, {
        title,
        description: buildNoteDescription({
          html,
          pinned: false
        })
      })
      setWorkspace(nextWorkspace)
      setShowTemplatePanel(false)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : '新增模板便签失败')
    } finally {
      setSaving(false)
    }
  }

  async function saveNote(
    note: NoteView,
    html: string,
    pinned = note.pinned,
    timers: NoteTimer[] = note.timers,
    options: { closeAfterSave?: boolean; keepDialogOpen?: boolean } = { keepDialogOpen: true }
  ): Promise<void> {
    const summary = getSummaryFromHtml(html)
    const title = summary.slice(0, 80) || '未命名便签'

    setSaving(true)
    setError(null)
    try {
      const nextWorkspace = await window.stickban.updateCard(note.id, {
        title,
        description: buildNoteDescriptionWithTimers({
          html,
          pinned,
          timers
        })
      })
      setWorkspace(nextWorkspace)
      const updatedNote = nextWorkspace.activeBoard.columns
        .flatMap((column) => column.cards)
        .map(createNoteView)
        .find((candidate) => candidate.id === note.id)
      if (options.closeAfterSave) {
        setSelectedNote(null)
      } else if (options.keepDialogOpen && selectedNote?.id === note.id) {
        setSelectedNote(updatedNote ?? null)
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存便签失败')
    } finally {
      setSaving(false)
    }
  }

  async function togglePinned(note: NoteView): Promise<void> {
    await saveNote(note, note.html, !note.pinned, note.timers, { keepDialogOpen: false })
  }

  async function addTimer(note: NoteView): Promise<void> {
    const dueAt = new Date(timerDueAt).getTime()
    if (!Number.isFinite(dueAt) || dueAt <= Date.now()) {
      setError('请选择一个未来提醒时间')
      return
    }

    const nextTimer: NoteTimer = {
      id: editingTimerId ?? crypto.randomUUID(),
      name: timerName.trim() || '计时器',
      quota: normalizeTimerQuota(timerQuota),
      dueAt,
      status: 'scheduled',
      repeat: timerRepeat,
      quickPreset: timerQuickPreset ?? undefined
    }

    setTimerName('')
    setTimerQuota('')
    setTimerDueAt('')
    setTimerRepeat('none')
    setTimerQuickPreset(null)
    setEditingTimerId(null)
    const nextTimers = editingTimerId
      ? note.timers.map((timer) => (timer.id === editingTimerId ? nextTimer : timer))
      : [...note.timers, nextTimer]
    const inlineTimerHtml = editingTimerId
      ? ''
      : `<p><span class="note-inline-timer" data-timer-id="${escapeHtml(nextTimer.id)}">⏱ ${escapeHtml(getCompactTimerName(nextTimer.name))}</span></p>`
    await saveNote(note, `${getCurrentEditorHtml()}${inlineTimerHtml}`, note.pinned, nextTimers)
  }

  function startEditingTimer(timer: NoteTimer): void {
    setEditingTimerId(timer.id)
    setTimerName(timer.name)
    setTimerQuota(getTimerQuotaInputValue(timer.quota))
    setTimerDueAt(formatDatetimeLocal(resolveTimerDueAt(timer, timerNow)))
    setTimerRepeat(timer.repeat ?? 'none')
    setTimerQuickPreset(timer.quickPreset ?? null)
  }

  function getPendingTimerEdit(note: NoteView): NoteTimer[] | null {
    if (!editingTimerId) {
      return note.timers
    }

    const dueAt = new Date(timerDueAt).getTime()
    if (!Number.isFinite(dueAt) || dueAt <= Date.now()) {
      setError('请选择一个未来提醒时间')
      return null
    }

    return note.timers.map((timer) =>
      timer.id === editingTimerId
        ? {
            ...timer,
            name: timerName.trim() || '计时器',
            quota: normalizeTimerQuota(timerQuota),
            dueAt,
            status: 'scheduled',
            repeat: timerRepeat,
            quickPreset: timerQuickPreset ?? undefined
          }
        : timer
    )
  }

  function applyQuickTimerPreset(quickPreset: NoteTimerQuickPreset): void {
    const nextPreset = buildQuickTimerPreset(quickPreset, Date.now())
    setTimerDueAt(formatDatetimeLocal(nextPreset.dueAt))
    setTimerRepeat(nextPreset.repeat ?? 'none')
    setTimerQuickPreset(quickPreset)
  }

  async function saveCardTimerQuota(note: NoteView, timerId: string, value: string): Promise<void> {
    const nextTimers = note.timers.map((timer) =>
      timer.id === timerId
        ? {
            ...timer,
            quota: normalizeTimerQuota(value)
          }
        : timer
    )
    setEditingCardQuota(null)
    await saveNote(note, note.html, note.pinned, nextTimers, { keepDialogOpen: false })
  }

  async function refreshCardTimer(note: NoteView, timerId: string): Promise<void> {
    const now = Date.now()
    let refreshed = false
    const nextTimers = note.timers.map((timer) => {
      if (timer.id !== timerId) {
        return timer
      }
      const nextTimer = refreshQuickTimer(timer, now)
      if (!nextTimer) {
        return timer
      }
      refreshed = true
      return nextTimer
    })
    if (!refreshed) {
      return
    }
    await saveNote(note, note.html, note.pinned, nextTimers, { keepDialogOpen: false })
  }

  async function confirmReminder(): Promise<void> {
    if (!reminderNotice || !workspace) {
      return
    }

    const note = (await getAllReminderNotes()).find((candidate) => candidate.id === reminderNotice.noteId)

    if (!note) {
      setReminderNotice(null)
      return
    }

    const nextTimers = acknowledgeFiredTimers(note.timers, reminderNotice.timerIds, Date.now())
    addReminderHistory(reminderNotice, 'confirmed', '已确认')
    await saveNote(note, note.html, note.pinned, nextTimers, { keepDialogOpen: false })
    setReminderNotice(null)
    setShowReminderHistory(false)
  }

  async function confirmReminderForNote(note: ReminderNoteView): Promise<void> {
    const firedTimers = note.timers.filter((timer) => timer.status === 'fired')
    if (firedTimers.length === 0) {
      return
    }

    const notice = buildReminderNotice(note, firedTimers)
    const nextTimers = acknowledgeFiredTimers(note.timers, notice.timerIds, Date.now())
    addReminderHistory(notice, 'confirmed', '已确认')
    await saveNote(note, note.html, note.pinned, nextTimers, { keepDialogOpen: false })
    if (reminderNotice?.noteId === note.id) {
      setReminderNotice(null)
    }
    setShowReminderHistory(false)
  }

  async function snoozeReminder(delayMs: number, label: string): Promise<void> {
    if (!reminderNotice || !workspace) {
      return
    }

    const note = (await getAllReminderNotes()).find((candidate) => candidate.id === reminderNotice.noteId)

    if (!note) {
      setReminderNotice(null)
      return
    }

    const nextTimers = snoozeFiredTimers(note.timers, reminderNotice.timerIds, delayMs, Date.now())
    addReminderHistory(reminderNotice, 'snoozed', `稍后提醒：${label}`)
    await saveNote(note, note.html, note.pinned, nextTimers, { keepDialogOpen: false })
    setReminderNotice(null)
    setShowReminderHistory(false)
  }

  async function saveSelectedNote(note: NoteView): Promise<void> {
    const timers = getPendingTimerEdit(note)
    if (!timers) {
      return
    }

    setEditingTimerId(null)
    setTimerName('')
    setTimerQuota('')
    setTimerDueAt('')
    setTimerRepeat('none')
    setTimerQuickPreset(null)
    await saveNote(note, getCurrentEditorHtml(), note.pinned, timers, { closeAfterSave: true })
  }

  async function deleteTimer(note: NoteView, timerId: string): Promise<void> {
    if (editingTimerId === timerId) {
      setEditingTimerId(null)
      setTimerName('')
      setTimerQuota('')
      setTimerDueAt('')
      setTimerRepeat('none')
      setTimerQuickPreset(null)
    }
    await saveNote(
      note,
      getCurrentEditorHtml(),
      note.pinned,
      note.timers.filter((timer) => timer.id !== timerId)
    )
  }

  async function deleteNote(noteId: string): Promise<void> {
    setSaving(true)
    setError(null)
    try {
      const nextWorkspace = await window.stickban.deleteCard(noteId)
      setWorkspace(nextWorkspace)
      setSelectedNote(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '删除便签失败')
    } finally {
      setSaving(false)
    }
  }

  async function reorderNote(targetNote: NoteView, placement: DropPlacement): Promise<void> {
    if (!draggingNoteId || trimmedSearchQuery) {
      return
    }

    const draggedNote = notes.find((note) => note.id === draggingNoteId)
    if (!draggedNote || draggedNote.id === targetNote.id) {
      return
    }

    if (draggedNote.pinned !== targetNote.pinned) {
      setError('置顶便签和普通便签不能混排')
      return
    }

    const toIndex = getNoteDropIndex(notes, draggedNote.id, targetNote.id, placement)
    if (toIndex === null) {
      return
    }

    setSaving(true)
    setError(null)
    try {
      const nextWorkspace = await window.stickban.moveCard({
        cardId: draggedNote.id,
        toColumnId: targetNote.columnId,
        toIndex
      })
      setWorkspace(nextWorkspace)
    } catch (moveError) {
      setError(moveError instanceof Error ? moveError.message : '调整便签顺序失败')
    } finally {
      setSaving(false)
      setDraggingNoteId(null)
    }
  }

  async function openSearchResult(note: NoteView & { boardId?: string }): Promise<void> {
    if (!note.boardId || note.boardId === workspace?.activeBoardId) {
      openNote(note)
      return
    }

    setSaving(true)
    setError(null)
    try {
      const nextWorkspace = await window.stickban.setActiveBoard(note.boardId)
      setWorkspace(nextWorkspace)
      const openedNote = nextWorkspace.activeBoard.columns
        .flatMap((column) => column.cards)
        .map(createNoteView)
        .find((candidate) => candidate.id === note.id)
      if (openedNote) {
        openNote(openedNote)
      }
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : '打开搜索结果失败')
    } finally {
      setSaving(false)
    }
  }

  function openNote(note: NoteView): void {
    setSelectedNote(note)
    editorHtmlRef.current = note.html
  }

  function getCurrentEditorHtml(): string {
    return editorRef.current?.innerHTML ?? editorHtmlRef.current
  }

  function applyEditorCommand(command: 'bold' | 'italic' | 'underline' | 'insertUnorderedList' | 'insertOrderedList'): void {
    editorRef.current?.focus()
    document.execCommand(command)
    editorHtmlRef.current = getCurrentEditorHtml()
  }

  function clearLauncherPress(): { wasDragging: boolean } {
    const press = launcherPressRef.current
    if (!press) {
      return { wasDragging: false }
    }

    if (press.timer) {
      clearTimeout(press.timer)
    }

    launcherPressRef.current = null
    return { wasDragging: press.dragging }
  }

  function handleLauncherPointerDown(event: PointerEvent<HTMLElement>): void {
    if (event.button !== 0) {
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    launcherPressRef.current = {
      dragging: false,
      lastScreenX: event.screenX,
      lastScreenY: event.screenY,
      pointerId: event.pointerId,
      timer: setTimeout(() => {
        if (launcherPressRef.current?.pointerId === event.pointerId) {
          launcherPressRef.current.dragging = true
        }
      }, LAUNCHER_DRAG_HOLD_MS)
    }
  }

  function handleLauncherPointerMove(event: PointerEvent<HTMLElement>): void {
    const press = launcherPressRef.current
    if (!press || press.pointerId !== event.pointerId || !press.dragging) {
      return
    }

    const deltaX = event.screenX - press.lastScreenX
    const deltaY = event.screenY - press.lastScreenY
    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
      return
    }

    press.lastScreenX = event.screenX
    press.lastScreenY = event.screenY
    void window.stickban.moveFloatingWindowBy({ deltaX, deltaY })
  }

  function handleLauncherPointerUp(event: PointerEvent<HTMLElement>): void {
    event.currentTarget.releasePointerCapture(event.pointerId)
    const { wasDragging } = clearLauncherPress()
    if (!wasDragging) {
      void setPanelOpen(true)
    }
  }

  function handleLauncherPointerCancel(event: PointerEvent<HTMLElement>): void {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    clearLauncherPress()
  }

  useEffect(() => {
    void (async () => {
      try {
        const nextWindowState = await window.stickban.getWindowState()
        const nextUpdateStatus = await window.stickban.getUpdateStatus()
        setWindowState(nextWindowState)
        setUpdateStatus(nextUpdateStatus)
        setIsOpen(nextWindowState.floatingPanelOpen)
        await refreshWorkspace()
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : '加载便签失败')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    try {
      const storedTemplate = window.localStorage.getItem(TEMPLATE_STORAGE_KEY)
      if (storedTemplate && normalizeTemplateRows(storedTemplate).length > 0) {
        setTemplateText(storedTemplate)
      }
      const storedColumns = window.localStorage.getItem(TEMPLATE_COLUMNS_STORAGE_KEY)
      if (storedColumns && normalizeTemplateColumns(storedColumns).length > 0) {
        setTemplateColumnsText(storedColumns)
      }
      const storedTemplateId = window.localStorage.getItem(TEMPLATE_SELECTED_STORAGE_KEY)
      if (storedTemplateId && DEFAULT_NOTE_TEMPLATES.some((template) => template.id === storedTemplateId)) {
        setSelectedTemplateId(storedTemplateId)
      }
    } catch {
      setTemplateText(DEFAULT_TEMPLATE_TEXT)
      setTemplateColumnsText(DEFAULT_TEMPLATE_COLUMNS_TEXT)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(TEMPLATE_STORAGE_KEY, templateText)
  }, [templateText])

  useEffect(() => {
    window.localStorage.setItem(TEMPLATE_COLUMNS_STORAGE_KEY, templateColumnsText)
  }, [templateColumnsText])

  useEffect(() => {
    window.localStorage.setItem(TEMPLATE_SELECTED_STORAGE_KEY, selectedTemplateId)
  }, [selectedTemplateId])

  useEffect(() => {
    try {
      window.localStorage.setItem(REMINDER_HISTORY_STORAGE_KEY, JSON.stringify(reminderHistory))
    } catch {
      // Local reminder history is a convenience cache; storage failures should not block note use.
    }
  }, [reminderHistory])

  useEffect(() => {
    const groupIds = new Set(groups.map((group) => group.id))
    setSelectedGroupIds((currentIds) => {
      const nextIds = currentIds.filter((groupId) => groupIds.has(groupId))
      return nextIds.length === currentIds.length ? currentIds : nextIds
    })
  }, [workspace?.boards])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimerNow(Date.now())
    }, 60 * 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (!workspace || reminderNotice) {
      return
    }

    let disposed = false
    let checking = false

    const checkReminders = async (): Promise<void> => {
      if (checking) {
        return
      }

      checking = true
      try {
        const now = Date.now()
        const activeNotes = await getAllReminderNotes()

        const firedNote = activeNotes.find((note) => note.timers.some((timer) => timer.status === 'fired'))
        if (firedNote) {
          if (disposed) {
            return
          }
          const firedTimers = firedNote.timers.filter((timer) => timer.status === 'fired')
          setReminderNotice(buildReminderNotice(firedNote, firedTimers, now))
          return
        }

        const dueNote = activeNotes
          .find((note) => note.timers.some((timer) => timer.status === 'scheduled' && timer.dueAt <= now))

        if (!dueNote) {
          return
        }

        const { timers: nextTimers, dueTimers } = markDueTimersFired(dueNote.timers, now)

        void saveNote(dueNote, dueNote.html, dueNote.pinned, nextTimers, { keepDialogOpen: false })
        if (disposed) {
          return
        }
        setReminderNotice(buildReminderNotice(dueNote, dueTimers, now))
      } finally {
        checking = false
      }
    }

    void checkReminders()
    const interval = window.setInterval(() => {
      void checkReminders()
    }, 10000)

    return () => {
      disposed = true
      window.clearInterval(interval)
    }
  }, [workspace, reminderNotice])

  useEffect(() => {
    if (!trimmedSearchQuery) {
      setSearchResults([])
      setSearching(false)
      return
    }

    let disposed = false
    setSearching(true)
    const timeout = window.setTimeout(() => {
      void (async () => {
        try {
          const results = await window.stickban.searchNotes(trimmedSearchQuery)
          if (!disposed) {
            setSearchResults(results)
          }
        } catch (searchError) {
          if (!disposed) {
            setError(searchError instanceof Error ? searchError.message : '搜索失败')
          }
        } finally {
          if (!disposed) {
            setSearching(false)
          }
        }
      })()
    }, 180)

    return () => {
      disposed = true
      window.clearTimeout(timeout)
    }
  }, [trimmedSearchQuery])

  if (!isOpen) {
    return (
      <main className="launcher-shell">
        <section
          className="launcher-widget"
          role="button"
          tabIndex={0}
          aria-label="单击打开任意签，长按拖动"
          onPointerDown={handleLauncherPointerDown}
          onPointerMove={handleLauncherPointerMove}
          onPointerUp={handleLauncherPointerUp}
          onPointerCancel={handleLauncherPointerCancel}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              void setPanelOpen(true)
            }
          }}
        >
          <span className="launcher-logo-drag" aria-hidden="true">
            <img className="launcher-hero-logo" src={renyiqianLogoUrl} alt="" aria-hidden="true" draggable={false} />
          </span>
        </section>
      </main>
    )
  }

  return (
    <main className="floatnote-shell">
      <header className="floatnote-titlebar">
        <div className="title-drag-region">
          <img className="app-logo" src={renyiqianLogoUrl} alt="" aria-hidden="true" />
          <div>
            <div className="title-line">
              <div className="title">任意签</div>
              {windowState?.appVersion ? <span className="title-version">v{windowState.appVersion}</span> : null}
            </div>
            <div className="subtitle">{saving ? '正在保存' : '随手打开、随手记录、随时看见的桌面便签中心'}</div>
          </div>
        </div>
        <div className="window-actions">
          <button
            type="button"
            className={windowState?.launchOnStartup ? 'text-action active' : 'text-action'}
            onClick={() => void toggleLaunchOnStartup()}
            disabled={saving}
            aria-label="开机启动"
          >
            <Power size={13} />
            <span>开机启动</span>
          </button>
          <button
            type="button"
            className="text-action"
            onClick={() => void checkForUpdates()}
            disabled={saving}
            aria-label="检查更新"
          >
            <Download size={13} />
            <span>检查更新</span>
          </button>
          <button
            type="button"
            className={canInstallUpdate ? 'text-action active' : 'text-action'}
            onClick={() => void downloadAvailableUpdate()}
            disabled={saving || isDownloadingUpdate || (!canDownloadUpdate && !canInstallUpdate)}
            aria-label={canInstallUpdate ? '安装更新' : '下载更新'}
          >
            <span>
              {canInstallUpdate
                ? '安装更新'
                : isDownloadingUpdate
                  ? `${updateProgress ?? 0}%`
              : '下载更新'}
            </span>
          </button>
          <div className="reminder-history-anchor">
            <button
              type="button"
              className={reminderButtonCount > 0 ? 'icon-button reminder-history-button active' : 'icon-button reminder-history-button'}
              onClick={() => setShowReminderHistory((currentValue) => !currentValue)}
              aria-label="查看提醒历史"
              title="提醒历史"
            >
              <AlertCircle size={14} />
              {reminderButtonCount > 0 ? <span className="reminder-history-count">{reminderButtonCount}</span> : null}
            </button>
            {showReminderHistory ? (
              <section className="reminder-history-panel" aria-label="提醒历史">
                <header className="reminder-history-header">
                  <strong>提醒</strong>
                  <button type="button" onClick={clearReminderHistory} disabled={reminderHistory.length === 0}>
                    清空
                  </button>
                </header>
                {reminderNotice ? (
                  <div className="reminder-current">
                    <div className="reminder-current-title">{reminderNotice.message}</div>
                    <div className="reminder-current-meta">{reminderNotice.noteTitle}</div>
                    <div className="reminder-current-actions">
                      {REMINDER_SNOOZE_OPTIONS.map((option) => (
                        <button
                          type="button"
                          key={option.label}
                          onClick={() => void snoozeReminder(option.delayMs, option.label)}
                        >
                          {option.label}
                        </button>
                      ))}
                      <button type="button" className="primary-mini" onClick={() => void confirmReminder()}>
                        确认
                      </button>
                    </div>
                  </div>
                ) : null}
                <div className="reminder-history-list">
                  {reminderHistory.length > 0 ? (
                    reminderHistory.map((entry) => (
                      <div className="reminder-history-item" key={entry.id}>
                        <strong>{entry.noteTitle}</strong>
                        <span>{entry.actionLabel}</span>
                        <small>{new Date(entry.handledAt).toLocaleString()}</small>
                      </div>
                    ))
                  ) : (
                    <div className="reminder-history-empty">暂无历史提醒</div>
                  )}
                </div>
              </section>
            ) : null}
          </div>
          <button type="button" className="icon-button" onClick={() => void window.stickban.setAlwaysOnTop(true)} aria-label="保持置顶">
            <Pin size={14} />
          </button>
          <button type="button" className="icon-button" onClick={() => void setPanelOpen(false)} aria-label="收起为悬浮入口">
            <ChevronDown size={15} />
          </button>
          <button type="button" className="icon-button danger" onClick={() => void window.stickban.closeWindow()} aria-label="关闭">
            <X size={14} />
          </button>
        </div>
      </header>

      <section className="global-search" aria-label="全局搜索">
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="全局搜索所有分组和便签"
        />
        {trimmedSearchQuery ? (
          <button type="button" onClick={() => setSearchQuery('')} aria-label="清空搜索">
            <X size={13} />
          </button>
        ) : null}
      </section>

      <section className={showQuickAddInput ? 'quick-add expanded' : 'quick-add collapsed'}>
        {showQuickAddInput ? (
          <input
            ref={quickAddInputRef}
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void createQuickNote()
              } else if (event.key === 'Escape') {
                setDraftTitle('')
                setShowQuickAddInput(false)
              }
            }}
            placeholder="快速记录一条便签"
            disabled={loading || saving || !firstColumnId}
          />
        ) : null}
        <button
          type="button"
          onClick={() => {
            if (showQuickAddInput) {
              void createQuickNote()
            } else {
              setShowQuickAddInput(true)
            }
          }}
          disabled={loading || saving || !firstColumnId || (showQuickAddInput && !draftTitle.trim())}
          aria-label={showQuickAddInput ? '新增便签' : '打开快速记录'}
        >
          <Plus size={16} />
        </button>
        <button type="button" className="template-toggle" onClick={() => setShowTemplatePanel((currentValue) => !currentValue)}>
          模板
        </button>
      </section>

      {error ? (
        <button type="button" className="status-indicator" title={error} aria-label={error} onClick={() => setError(null)}>
          <AlertCircle size={14} />
        </button>
      ) : null}

      {(updateNotice || isDownloadingUpdate || canInstallUpdate) ? (
        <div className="update-notice" role="status">
          <div className="update-notice-row">
            <Download size={13} />
            <span>
              {isDownloadingUpdate
                ? `正在下载 ${updateProgress ?? 0}%`
                : updateNotice ?? (canInstallUpdate ? '新版本已下载' : '')}
            </span>
            <button type="button" onClick={() => setUpdateNotice(null)} aria-label="关闭下载提示">
              <X size={12} />
            </button>
          </div>
          {isDownloadingUpdate || canInstallUpdate ? (
            <div className="update-progress-track" aria-label="下载进度">
              <span style={{ width: `${canInstallUpdate ? 100 : updateProgress ?? 0}%` }} />
            </div>
          ) : null}
        </div>
      ) : null}

      {showTemplatePanel ? (
        <section className="template-panel" aria-label="便签模板">
          <div className="template-header">
            <div>
              <div className="template-title">生成模板便签</div>
              <div className="template-subtitle">选择一个模板生成一条便签；表格模板可继续编辑行和列</div>
            </div>
            {selectedTemplate?.id === 'custom-table' ? (
              <button type="button" className="secondary-action" onClick={() => setTemplateText((currentText) => appendTemplateRow(currentText))}>
                新增项目
              </button>
            ) : null}
          </div>
          <div className="template-choice-list">
            {DEFAULT_NOTE_TEMPLATES.map((template) => (
              <button
                type="button"
                key={template.id}
                className={template.id === selectedTemplateId ? 'template-choice active' : 'template-choice'}
                onClick={() => setSelectedTemplateId(template.id)}
              >
                <strong>{template.name}</strong>
                <span>{template.description}</span>
              </button>
            ))}
          </div>
          {selectedTemplate?.id === 'account-membership' ? (
            <div className="account-template-options">
              <label>
                <span>生成数量</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={accountTemplateCount}
                  onChange={(event) => setAccountTemplateCount(Math.max(1, Math.min(20, Number(event.target.value) || 1)))}
                />
              </label>
              <label>
                <span>其他自定义内容</span>
                <textarea
                  className="template-textarea"
                  value={accountTemplateCustomText}
                  onChange={(event) => setAccountTemplateCustomText(event.target.value)}
                  placeholder={`例如：恢复邮箱
安全问题
备注`}
                />
              </label>
            </div>
          ) : null}
          {selectedTemplate?.id === 'custom-table' ? (
            <div className="template-grid">
              <label>
                <span>横向项目</span>
                <textarea
                  className="template-textarea"
                  value={templateText}
                  onChange={(event) => setTemplateText(event.target.value)}
                  placeholder={`例如：客户
电话
地址
备注`}
                />
              </label>
              <label>
                <span>列名</span>
                <textarea
                  className="template-textarea"
                  value={templateColumnsText}
                  onChange={(event) => setTemplateColumnsText(event.target.value)}
                  placeholder={`例如：内容
跟进记录
结果`}
                />
              </label>
            </div>
          ) : null}
          <footer className="template-actions">
            <button type="button" className="secondary-action" onClick={() => setTemplateColumnsText((currentText) => appendTemplateColumn(currentText))} disabled={selectedTemplate?.id !== 'custom-table'}>
              新增列
            </button>
            <button type="button" className="secondary-action" onClick={() => {
              setTemplateText(DEFAULT_TEMPLATE_TEXT)
              setTemplateColumnsText(DEFAULT_TEMPLATE_COLUMNS_TEXT)
            }}>
              重置
            </button>
            <button type="button" className="primary-action" onClick={() => void createTemplateNote()} disabled={saving || !firstColumnId || normalizeTemplateRows(getTemplateRowsText()).length === 0 || normalizeTemplateColumns(getTemplateColumnsText()).length === 0}>
              生成模板便签
            </button>
          </footer>
        </section>
      ) : null}

      <div className="note-workspace">
        <aside className="group-sidebar" aria-label="便签分组">
          <div className="group-sidebar-header">
            <span>便签分组</span>
            <button
              type="button"
              className="group-delete-selected"
              onClick={() => void removeSelectedGroups()}
              disabled={selectedGroupIds.length === 0 || saving}
              aria-label="删除选中分组"
              title={selectedGroupIds.length > 0 ? '删除选中分组' : '先勾选要删除的分组'}
            >
              <Trash2 size={13} />
            </button>
          </div>
          <div className="group-list">
            {groups.map((group) => (
              <div className={group.id === workspace?.activeBoardId ? 'group-item active' : 'group-item'} key={group.id}>
                <input
                  type="checkbox"
                  className="group-select"
                  checked={selectedGroupIds.includes(group.id)}
                  onChange={() => toggleGroupSelection(group.id)}
                  aria-label={`选择分组 ${group.title}`}
                />
                <div className="group-main" onClick={() => void selectGroup(group)} role="button" tabIndex={0}>
                  <button
                    type="button"
                    className="group-title-button"
                    onClick={(event) => {
                      event.stopPropagation()
                      void selectGroup(group)
                    }}
                    onDoubleClick={(event) => {
                      event.stopPropagation()
                      void renameGroup(group)
                    }}
                    title="单击切换分组，双击修改名称"
                  >
                    {group.title}
                  </button>
                  <small>{group.cardCount}</small>
                </div>
              </div>
            ))}
          </div>
          <div className="group-add">
            <input
              value={draftGroupTitle}
              onChange={(event) => setDraftGroupTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void createGroup()
                }
              }}
              placeholder="新分组"
            />
            <button type="button" onClick={() => void createGroup()} disabled={!draftGroupTitle.trim() || saving} aria-label="新增分组">
              <Plus size={14} />
            </button>
          </div>
        </aside>

        <section className="notes-list" aria-label={trimmedSearchQuery ? '全局搜索结果' : '便签列表'}>
          {loading ? (
            <div className="empty-state">正在加载便签</div>
          ) : searching ? (
            <div className="empty-state">正在搜索</div>
          ) : visibleNotes.length > 0 ? (
            visibleNotes.map((note) => (
              <article
                className={[
                  'note-card',
                  note.pinned ? 'pinned' : '',
                  note.timers.some((timer) => timer.status === 'fired') ? 'timer-alert' : ''
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={note.id}
                draggable={!trimmedSearchQuery}
                onDragStart={(event) => {
                  setDraggingNoteId(note.id)
                  event.dataTransfer.effectAllowed = 'move'
                  event.dataTransfer.setData('text/plain', note.id)
                }}
                onDragOver={(event) => {
                  if (draggingNoteId && draggingNoteId !== note.id && !trimmedSearchQuery) {
                    event.preventDefault()
                    event.dataTransfer.dropEffect = 'move'
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  const cardBounds = event.currentTarget.getBoundingClientRect()
                  const placement = event.clientY > cardBounds.top + cardBounds.height / 2 ? 'after' : 'before'
                  void reorderNote(note, placement)
                }}
                onDragEnd={() => setDraggingNoteId(null)}
              >
                <button type="button" className="note-pin" onClick={() => void togglePinned(note)} aria-label={note.pinned ? '取消置顶' : '置顶便签'}>
                  {note.pinned ? <Pin size={14} /> : <PinOff size={14} />}
                </button>
                {note.timers.some((timer) => timer.status === 'fired') ? (
                  <button
                    type="button"
                    className="note-reminder-chip"
                    onClick={(event) => {
                      event.stopPropagation()
                      void confirmReminderForNote(note)
                    }}
                    aria-label="确认这条便签提醒"
                    title="点击确认并收入提醒历史"
                  >
                    <AlertCircle size={12} />
                    <span>提醒</span>
                  </button>
                ) : null}
                <button type="button" className="note-preview-button" onClick={() => void openSearchResult(note)}>
                  {'boardTitle' in note && typeof note.boardTitle === 'string' ? <span className="note-search-badge">{note.boardTitle}</span> : null}
                  <div className="note-preview" dangerouslySetInnerHTML={{ __html: note.html }} />
                </button>
                {note.timers.some((timer) => timer.status !== 'done') ? (
                  <div className="note-timer-stack" aria-label="倒计时">
                    {getVisibleTimerRows(note.timers).map((timer) => (
                      <div className="note-timer-row" key={timer.id} title={timer.title}>
                        <span className="timer-card-name">{timer.name}</span>
                        {editingCardQuota?.noteId === note.id && editingCardQuota.timerId === timer.id ? (
                          <input
                            className="timer-card-quota-input"
                            type="number"
                            min="0"
                            autoFocus
                            value={editingCardQuota.value}
                            onChange={(event) =>
                              setEditingCardQuota({ noteId: note.id, timerId: timer.id, value: event.target.value })
                            }
                            onBlur={(event) => void saveCardTimerQuota(note, timer.id, event.currentTarget.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.currentTarget.blur()
                              } else if (event.key === 'Escape') {
                                setEditingCardQuota(null)
                              }
                            }}
                            aria-label="修改剩余额度"
                          />
                        ) : (
                          <button
                            type="button"
                            className="timer-card-quota"
                            onClick={() =>
                              setEditingCardQuota({
                                noteId: note.id,
                                timerId: timer.id,
                                value: getTimerQuotaInputValue(timer.quota)
                              })
                            }
                            aria-label="修改剩余额度"
                          >
                            {timer.quota || '-'}
                          </button>
                        )}
                        <strong>{timer.due}</strong>
                        <button
                          type="button"
                          className="timer-card-refresh"
                          onClick={() => void refreshCardTimer(note, timer.id)}
                          disabled={!note.timers.find((candidate) => candidate.id === timer.id)?.quickPreset}
                          aria-label="刷新快捷倒计时"
                          title="按当前时间刷新快捷倒计时"
                        >
                          <RefreshCw size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="note-timer-stack empty" aria-hidden="true" />
                )}
                <button type="button" className="note-delete" onClick={() => void deleteNote(note.id)} aria-label="删除便签">
                  <X size={13} />
                </button>
              </article>
            ))
          ) : (
          <div className="empty-state">{trimmedSearchQuery ? '没有匹配的便签' : '这个分组还没有便签'}</div>
          )}
        </section>
      </div>

      {selectedNote ? (
        <section className="note-dialog" role="dialog" aria-modal="true" aria-label="编辑便签">
          <div className="note-dialog-panel">
            <header className="note-dialog-header">
              <div>
                <div className="dialog-title">便签内容</div>
                <div className="dialog-subtitle">{selectedNote.pinned ? '已置顶' : '未置顶'}</div>
              </div>
              <button type="button" className="icon-button" onClick={() => setSelectedNote(null)} aria-label="关闭便签">
                <X size={15} />
              </button>
            </header>

            <div className="rich-toolbar" aria-label="富文本工具栏">
              <button type="button" onClick={() => applyEditorCommand('bold')} aria-label="加粗">
                <Bold size={14} />
              </button>
              <button type="button" onClick={() => applyEditorCommand('italic')} aria-label="斜体">
                <Italic size={14} />
              </button>
              <button type="button" onClick={() => applyEditorCommand('underline')} aria-label="下划线">
                <Underline size={14} />
              </button>
              <button type="button" onClick={() => applyEditorCommand('insertUnorderedList')} aria-label="无序列表">
                <List size={14} />
              </button>
              <button type="button" onClick={() => applyEditorCommand('insertOrderedList')} aria-label="有序列表">
                <ListOrdered size={14} />
              </button>
              <button type="button" className={selectedNote.pinned ? 'active' : ''} onClick={() => void saveNote(selectedNote, getCurrentEditorHtml(), !selectedNote.pinned)} aria-label="切换置顶">
                <Pin size={14} />
              </button>
            </div>

            <div
              key={selectedNote.id}
              ref={editorRef}
              className="rich-editor"
              contentEditable
              suppressContentEditableWarning
              dangerouslySetInnerHTML={{ __html: selectedNote.html }}
              onInput={(event) => {
                editorHtmlRef.current = event.currentTarget.innerHTML
              }}
              onCompositionEnd={(event) => {
                editorHtmlRef.current = event.currentTarget.innerHTML
              }}
            />

            <section className="timer-panel" aria-label="便签计时器">
              <div className="timer-panel-header">
                <div>
                  <div className="timer-title">计时器</div>
                  <div className="timer-subtitle">到时间后会弹出提醒</div>
                </div>
                <AlarmClock size={16} />
              </div>
              <div className="quick-timer-presets" aria-label="快捷倒计时">
                {QUICK_TIMER_PRESETS.map((preset) => (
                  <button
                    type="button"
                    key={preset.id}
                    className={timerQuickPreset === preset.id ? 'active' : ''}
                    onClick={() => applyQuickTimerPreset(preset.id)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              {selectedNote.timers.length > 0 ? (
                <div className="timer-list">
                  {selectedNote.timers.map((timer) => (
                    <div className={timer.status === 'fired' ? 'timer-item fired' : 'timer-item'} key={timer.id}>
                      <div>
                        <strong>{timer.name}</strong>
                        <span>
                          {timer.quota ? `${timer.quota} · ` : ''}{formatTimerRemaining(resolveTimerDueAt(timer, timerNow), timerNow)} · {new Date(resolveTimerDueAt(timer, timerNow)).toLocaleString()}
                        </span>
                      </div>
                      <div className="timer-item-actions">
                        <button type="button" onClick={() => startEditingTimer(timer)} aria-label="编辑计时器">
                          <Pencil size={13} />
                        </button>
                        <button type="button" onClick={() => void deleteTimer(selectedNote, timer.id)} aria-label="删除计时器">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="timer-empty">这条便签还没有计时器</div>
              )}
              <div className="timer-form">
                <input
                  value={timerName}
                  onChange={(event) => setTimerName(event.target.value)}
                  placeholder="计时器名称"
                />
                <label className="timer-quota-field">
                  <input
                    type="number"
                    min="0"
                    value={timerQuota}
                    onChange={(event) => setTimerQuota(event.target.value)}
                    placeholder="剩余额度"
                    aria-label="剩余额度百分比"
                  />
                  <span aria-hidden="true">%</span>
                </label>
                <input
                  type="datetime-local"
                  value={timerDueAt}
                  onChange={(event) => {
                    setTimerDueAt(event.target.value)
                    setTimerQuickPreset(null)
                  }}
                />
                <select
                  value={timerRepeat}
                  onChange={(event) => {
                    setTimerRepeat(event.target.value as NoteTimerRepeat)
                    setTimerQuickPreset(null)
                  }}
                  aria-label="计时器周期"
                >
                  <option value="none">单次</option>
                  <option value="daily">每天</option>
                  <option value="weekly">每周</option>
                  <option value="monthly">每月</option>
                </select>
                <button type="button" onClick={() => void addTimer(selectedNote)}>
                  {editingTimerId ? '保存' : '添加'}
                </button>
              </div>
            </section>

            <footer className="note-dialog-actions">
              <button type="button" className="secondary-action" onClick={() => setSelectedNote(null)}>
                取消
              </button>
              <button type="button" className="primary-action" onClick={() => void saveSelectedNote(selectedNote)}>
                保存
              </button>
            </footer>
          </div>
        </section>
      ) : null}
    </main>
  )
}

export default App
