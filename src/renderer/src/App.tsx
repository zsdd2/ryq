import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import {
  AlarmClock,
  Bold,
  ChevronDown,
  Download,
  Italic,
  List,
  ListOrdered,
  Pin,
  PinOff,
  Plus,
  Power,
  Trash2,
  Underline,
  X
} from 'lucide-react'
import type { BoardSummary, NoteSearchResult, UpdateStatus, WindowState, WorkspaceRecord } from '@shared/types'
import renyiqianLogoUrl from '../../../logos/renyiqian-logo.png'
import {
  buildNoteDescription,
  buildNoteDescriptionWithTimers,
  createNoteView,
  escapeHtml,
  getSummaryFromHtml,
  type NoteTimer,
  type NoteView
} from './note-content'
import {
  appendTemplateColumn,
  appendTemplateRow,
  buildTemplateNoteHtml,
  normalizeTemplateColumns,
  normalizeTemplateRows
} from './note-template'

const TEMPLATE_STORAGE_KEY = 'renyiqian.noteTemplateText'
const TEMPLATE_COLUMNS_STORAGE_KEY = 'renyiqian.noteTemplateColumnsText'
const DEFAULT_TEMPLATE_TEXT = '客户\n电话\n事项\n备注'
const DEFAULT_TEMPLATE_COLUMNS_TEXT = '内容'
const LAUNCHER_DRAG_HOLD_MS = 220

function App(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [workspace, setWorkspace] = useState<WorkspaceRecord | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftGroupTitle, setDraftGroupTitle] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<NoteSearchResult[]>([])
  const [windowState, setWindowState] = useState<WindowState | null>(null)
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null)
  const [selectedNote, setSelectedNote] = useState<NoteView | null>(null)
  const [showTemplatePanel, setShowTemplatePanel] = useState(false)
  const [templateText, setTemplateText] = useState(DEFAULT_TEMPLATE_TEXT)
  const [templateColumnsText, setTemplateColumnsText] = useState(DEFAULT_TEMPLATE_COLUMNS_TEXT)
  const [timerName, setTimerName] = useState('')
  const [timerDueAt, setTimerDueAt] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

  async function refreshWorkspace(): Promise<void> {
    const nextWorkspace = await window.stickban.getWorkspace()
    setWorkspace(nextWorkspace)
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
    setError(null)
    try {
      if (updateStatus?.phase === 'downloaded') {
        await window.stickban.quitAndInstallUpdate()
        return
      }

      if (updateStatus?.phase === 'available') {
        setError(`正在下载新版本 ${updateStatus.availableUpdate?.version ?? ''}`)
        const downloadedStatus = await window.stickban.downloadUpdate()
        setUpdateStatus(downloadedStatus)
        if (downloadedStatus.phase === 'downloaded') {
          setError(`新版本 ${downloadedStatus.downloadedUpdate?.version ?? updateStatus.availableUpdate?.version ?? ''} 已下载，点击“安装更新”重启安装`)
        } else if (downloadedStatus.phase === 'error') {
          setError(downloadedStatus.lastError?.message ?? '下载更新失败')
        }
        return
      }

      const nextUpdateStatus = await window.stickban.checkForUpdates()
      setUpdateStatus(nextUpdateStatus)
      if (!nextUpdateStatus.supported) {
        setError('远程升级需要安装后的正式版本使用')
      } else if (nextUpdateStatus.phase === 'up-to-date') {
        setError('当前已经是最新版本')
      } else if (nextUpdateStatus.phase === 'available') {
        setError(`发现新版本 ${nextUpdateStatus.availableUpdate?.version ?? ''}，正在下载`)
        const downloadedStatus = await window.stickban.downloadUpdate()
        setUpdateStatus(downloadedStatus)
        if (downloadedStatus.phase === 'downloaded') {
          setError(`新版本 ${downloadedStatus.downloadedUpdate?.version ?? nextUpdateStatus.availableUpdate?.version ?? ''} 已下载，点击“安装更新”重启安装`)
        } else if (downloadedStatus.phase === 'error') {
          setError(downloadedStatus.lastError?.message ?? '下载更新失败')
        }
      } else if (nextUpdateStatus.phase === 'downloaded') {
        await window.stickban.quitAndInstallUpdate()
      } else if (nextUpdateStatus.phase === 'error') {
        setError(nextUpdateStatus.lastError?.message ?? '检查更新失败')
      }
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : '检查更新失败')
    } finally {
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

    const templateRows = normalizeTemplateRows(templateText)
    if (templateRows.length === 0) {
      setError('请先设置模板表格项目')
      return
    }

    const html = buildTemplateNoteHtml(templateText, templateColumnsText)
    const title = getSummaryFromHtml(html).slice(0, 80) || '模板便签'

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
    timers: NoteTimer[] = note.timers
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
      setSelectedNote(updatedNote ?? null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存便签失败')
    } finally {
      setSaving(false)
    }
  }

  async function togglePinned(note: NoteView): Promise<void> {
    await saveNote(note, note.html, !note.pinned)
  }

  async function addTimer(note: NoteView): Promise<void> {
    const dueAt = new Date(timerDueAt).getTime()
    if (!Number.isFinite(dueAt) || dueAt <= Date.now()) {
      setError('请选择一个未来提醒时间')
      return
    }

    const nextTimer: NoteTimer = {
      id: crypto.randomUUID(),
      name: timerName.trim() || '计时器',
      dueAt,
      status: 'scheduled'
    }

    setTimerName('')
    setTimerDueAt('')
    await saveNote(note, getCurrentEditorHtml(), note.pinned, [...note.timers, nextTimer])
  }

  async function deleteTimer(note: NoteView, timerId: string): Promise<void> {
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
    if (!workspace) {
      return
    }

    const interval = window.setInterval(() => {
      const now = Date.now()
      const dueNote = workspace.activeBoard.columns
        .flatMap((column) => column.cards)
        .map(createNoteView)
        .find((note) => note.timers.some((timer) => timer.status === 'scheduled' && timer.dueAt <= now))

      if (!dueNote) {
        return
      }

      const dueTimers = dueNote.timers.filter((timer) => timer.status === 'scheduled' && timer.dueAt <= now)
      const nextTimers = dueNote.timers.map((timer) =>
        dueTimers.some((dueTimer) => dueTimer.id === timer.id)
          ? {
              ...timer,
              status: 'fired' as const
            }
          : timer
      )

      void saveNote(dueNote, dueNote.html, dueNote.pinned, nextTimers)
      window.alert(`便签提醒：${dueTimers.map((timer) => timer.name).join('、')}`)
    }, 10000)

    return () => {
      window.clearInterval(interval)
    }
  }, [workspace])

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
            <div className="title">任意签</div>
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
            className={updateStatus?.phase === 'downloaded' ? 'text-action active' : 'text-action'}
            onClick={() => void checkForUpdates()}
            disabled={saving}
            aria-label="检查更新"
          >
            <Download size={13} />
            <span>{updateStatus?.phase === 'downloaded' ? '安装更新' : '检查更新'}</span>
          </button>
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

      <section className="quick-add">
        <input
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              void createQuickNote()
            }
          }}
          placeholder="快速记录一条便签"
          disabled={loading || saving || !firstColumnId}
        />
        <button type="button" onClick={() => void createQuickNote()} disabled={loading || saving || !draftTitle.trim() || !firstColumnId} aria-label="新增便签">
          <Plus size={16} />
        </button>
        <button type="button" className="template-toggle" onClick={() => setShowTemplatePanel((currentValue) => !currentValue)}>
          模板
        </button>
      </section>

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

      {error ? <div className="status status-error">{error}</div> : null}

      {showTemplatePanel ? (
        <section className="template-panel" aria-label="便签模板">
          <div className="template-header">
            <div>
              <div className="template-title">便签模板</div>
              <div className="template-subtitle">左侧设置横向项目，右侧设置列名，生成一条可编辑表格便签</div>
            </div>
            <button type="button" className="secondary-action" onClick={() => setTemplateText((currentText) => appendTemplateRow(currentText))}>
              新增项目
            </button>
          </div>
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
          <footer className="template-actions">
            <button type="button" className="secondary-action" onClick={() => setTemplateColumnsText((currentText) => appendTemplateColumn(currentText))}>
              新增列
            </button>
            <button type="button" className="secondary-action" onClick={() => {
              setTemplateText(DEFAULT_TEMPLATE_TEXT)
              setTemplateColumnsText(DEFAULT_TEMPLATE_COLUMNS_TEXT)
            }}>
              重置
            </button>
            <button type="button" className="primary-action" onClick={() => void createTemplateNote()} disabled={saving || !firstColumnId || normalizeTemplateRows(templateText).length === 0 || normalizeTemplateColumns(templateColumnsText).length === 0}>
              生成表格便签
            </button>
          </footer>
        </section>
      ) : null}

      <div className="note-workspace">
        <aside className="group-sidebar" aria-label="便签分组">
          <div className="group-list">
            {groups.map((group) => (
              <button
                type="button"
                className={group.id === workspace?.activeBoardId ? 'group-item active' : 'group-item'}
                key={group.id}
                onClick={() => void selectGroup(group)}
              >
                <span>{group.title}</span>
                <small>{group.cardCount}</small>
              </button>
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
              <article className={note.pinned ? 'note-card pinned' : 'note-card'} key={note.id}>
                <button type="button" className="note-pin" onClick={() => void togglePinned(note)} aria-label={note.pinned ? '取消置顶' : '置顶便签'}>
                  {note.pinned ? <Pin size={14} /> : <PinOff size={14} />}
                </button>
                <button type="button" className="note-preview-button" onClick={() => void openSearchResult(note)}>
                  {'boardTitle' in note && typeof note.boardTitle === 'string' ? <span className="note-search-badge">{note.boardTitle}</span> : null}
                  <div className="note-preview" dangerouslySetInnerHTML={{ __html: note.html }} />
                </button>
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
              {selectedNote.timers.length > 0 ? (
                <div className="timer-list">
                  {selectedNote.timers.map((timer) => (
                    <div className={timer.status === 'fired' ? 'timer-item fired' : 'timer-item'} key={timer.id}>
                      <div>
                        <strong>{timer.name}</strong>
                        <span>{new Date(timer.dueAt).toLocaleString()}</span>
                      </div>
                      <button type="button" onClick={() => void deleteTimer(selectedNote, timer.id)} aria-label="删除计时器">
                        <Trash2 size={13} />
                      </button>
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
                <input
                  type="datetime-local"
                  value={timerDueAt}
                  onChange={(event) => setTimerDueAt(event.target.value)}
                />
                <button type="button" onClick={() => void addTimer(selectedNote)}>
                  添加
                </button>
              </div>
            </section>

            <footer className="note-dialog-actions">
              <button type="button" className="secondary-action" onClick={() => setSelectedNote(null)}>
                取消
              </button>
              <button type="button" className="primary-action" onClick={() => void saveNote(selectedNote, getCurrentEditorHtml())}>
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
