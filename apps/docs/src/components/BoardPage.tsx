import {
  memo,
  type DragEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { LuCheck, LuChevronLeft, LuChevronRight, LuExpand, LuLink, LuPencil, LuTrash2 } from 'react-icons/lu'
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
  type DocsTask,
  type TaskPatch,
  type CreateTaskInput,
  type TaskPriority,
  type TaskStatus,
  type TaskTag,
} from '../api'
import {
  COLUMNS,
  COLUMN_OPTIONS,
  nextPriority,
  PRIORITY_CREATE_OPTIONS,
  PRIORITY_META,
  PRIORITY_OPTIONS,
  TAG_META,
  TAG_OPTIONS,
  TASK_TAGS,
} from '../board'
import { useVisitor } from '../visitor-context'
import { BoardDrawer } from './ui/BoardDrawer'
import { Select } from './ui/Select'

function parseTaskId(params: URLSearchParams): number | null {
  const raw = params.get('task')
  if (!raw || !/^\d+$/.test(raw)) return null
  const id = Number(raw)
  return id > 0 ? id : null
}

function taskHref(id: number) {
  return { pathname: '/board', search: `?task=${id}` }
}

export function BoardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const openId = parseTaskId(searchParams)
  const [tasks, setTasks] = useState<DocsTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formBusy, setFormBusy] = useState(false)
  const [pendingIds, setPendingIds] = useState<ReadonlySet<number>>(() => new Set())
  const [creating, setCreating] = useState(false)
  const { visitor, login, logout } = useVisitor()
  const [registerName, setRegisterName] = useState('')
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null)
  const [filterTags, setFilterTags] = useState<TaskTag[]>([])
  const tasksRef = useRef(tasks)
  tasksRef.current = tasks
  const columnsRef = useRef<HTMLDivElement>(null)
  const [activeCol, setActiveCol] = useState<TaskStatus>('analysis')

  const setTaskQuery = useCallback(
    (id: number | null, replace = false) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        const current = next.get('task')
        const nextVal = id == null ? null : String(id)
        if (current === nextVal) return prev
        if (nextVal == null) next.delete('task')
        else next.set('task', nextVal)
        return next
      }, { replace })
    },
    [setSearchParams],
  )

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setTasks(await fetchTasks())
    } catch {
      setError('Не удалось загрузить доску')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const openTask = tasks.find((t) => t.id === openId) ?? null
  const [canDrag, setCanDrag] = useState(false)

  useEffect(() => {
    if (openId != null) setCreating(false)
  }, [openId])

  useEffect(() => {
    if (loading || openId == null) return
    if (tasks.some((t) => t.id === openId)) return
    setError('Задача не найдена или удалена')
    setTaskQuery(null, true)
  }, [loading, openId, tasks, setTaskQuery])

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setCanDrag(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const scrollToColumn = useCallback((status: TaskStatus) => {
    const root = columnsRef.current
    const el = root?.querySelector(`[data-board-col="${status}"]`)
    if (!root || !(el instanceof HTMLElement)) return
    const delta = el.getBoundingClientRect().left - root.getBoundingClientRect().left
    root.scrollBy({ left: delta, behavior: 'smooth' })
    setActiveCol(status)
  }, [])

  useEffect(() => {
    const root = columnsRef.current
    if (!root) return
    let frame = 0
    function syncActive() {
      frame = 0
      if (!root) return
      const origin = root.getBoundingClientRect().left
      let best: { status: TaskStatus; dist: number } | null = null
      for (const col of COLUMNS) {
        const el = root.querySelector(`[data-board-col="${col.status}"]`)
        if (!(el instanceof HTMLElement)) continue
        const dist = Math.abs(el.getBoundingClientRect().left - origin)
        if (!best || dist < best.dist) best = { status: col.status, dist }
      }
      if (best) setActiveCol(best.status)
    }
    function onScroll() {
      if (frame) return
      frame = requestAnimationFrame(syncActive)
    }
    root.addEventListener('scroll', onScroll, { passive: true })
    syncActive()
    return () => {
      root.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [loading])

  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    setFormBusy(true)
    setError('')
    try {
      await login(registerName)
      setRegisterName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации')
    } finally {
      setFormBusy(false)
    }
  }

  const visibleTasks = useMemo(() => {
    if (filterTags.length === 0) return tasks
    return tasks.filter((task) => task.tags.some((tag) => filterTags.includes(tag)))
  }, [tasks, filterTags])

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, DocsTask[]> = {
      analysis: [],
      todo: [],
      in_progress: [],
      testing: [],
      done: [],
    }
    for (const task of visibleTasks) {
      grouped[task.status].push(task)
    }
    return grouped
  }, [visibleTasks])

  function toggleFilterTag(tag: TaskTag) {
    setFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  const handleCreate = useCallback(
    async (input: CreateTaskInput) => {
      setFormBusy(true)
      setError('')
      try {
        const task = await createTask(input)
        setTasks((prev) => [...prev, task])
        setCreating(false)
        setTaskQuery(task.id)
      } catch (err) {
        if (err instanceof Error && err.message === 'auth_required') {
          logout()
          setCreating(false)
          setError('Войдите, чтобы создавать задачи')
          return
        }
        throw err instanceof Error ? err : new Error('Ошибка создания')
      } finally {
        setFormBusy(false)
      }
    },
    [logout, setTaskQuery],
  )

  const markPending = useCallback((id: number, on: boolean) => {
    setPendingIds((prev) => {
      if (on === prev.has(id)) return prev
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const patchTask = useCallback(
    async (id: number, patch: TaskPatch) => {
      const snapshot = tasksRef.current.find((t) => t.id === id)
      if (!snapshot) return
      setError('')
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
      markPending(id, true)
      try {
        const updated = await updateTask(id, patch)
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      } catch (err) {
        setTasks((prev) => prev.map((t) => (t.id === id ? snapshot : t)))
        setError(err instanceof Error ? err.message : 'Ошибка обновления')
      } finally {
        markPending(id, false)
      }
    },
    [markPending],
  )

  const removeTask = useCallback(async (id: number) => {
    if (!window.confirm('Удалить задачу?')) return
    setError('')
    markPending(id, true)
    try {
      await deleteTask(id)
      setTasks((prev) => prev.filter((t) => t.id !== id))
      if (openId === id) setTaskQuery(null, true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления')
    } finally {
      markPending(id, false)
    }
  }, [markPending, openId, setTaskQuery])

  const onDragStart = useCallback((e: DragEvent, taskId: number) => {
    e.dataTransfer.setData('text/plain', String(taskId))
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const onDragOverColumn = useCallback((e: DragEvent, status: TaskStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver((prev) => (prev === status ? prev : status))
  }, [])

  const onDropColumn = useCallback(
    async (e: DragEvent, status: TaskStatus) => {
      e.preventDefault()
      setDragOver(null)
      if (!visitor) return
      const taskId = Number(e.dataTransfer.getData('text/plain'))
      const task = tasksRef.current.find((t) => t.id === taskId)
      if (!task || task.status === status) return
      await patchTask(taskId, { status })
    },
    [visitor, patchTask],
  )

  const onDragLeaveColumn = useCallback(() => setDragOver(null), [])

  const closeTaskModal = useCallback(() => {
    setTaskQuery(null, true)
  }, [setTaskQuery])

  return (
    <div className="board-page">
      <div className="doc-back">
        <Link to="/">← Все документы</Link>
      </div>

      <header className="board-header">
        <h1>Задачи команды</h1>
        <p className="board-lead">
          Карточку можно открыть целиком и поделиться ссылкой. Статус — в списке колонок.
          На телефоне колонки листаются вбок, карточка выезжает снизу.
        </p>
      </header>

      {!visitor ? (
        <form className="board-register" onSubmit={handleRegister}>
          <p>Войдите с именем, чтобы добавлять и двигать задачи.</p>
          <div className="board-register-row">
            <input
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
              placeholder="Ваше имя"
              minLength={2}
              maxLength={40}
              required
            />
            <button type="submit" disabled={formBusy}>
              Войти
            </button>
          </div>
        </form>
      ) : null}

      <div className="board-toolbar">
        <div className="board-filters" role="group" aria-label="Фильтр по тегам">
          <span className="board-filters-label">Для кого</span>
          <button
            type="button"
            className={`board-filter-chip${filterTags.length === 0 ? ' is-on' : ''}`}
            onClick={() => setFilterTags([])}
          >
            Все
          </button>
          {TASK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`board-filter-chip ${TAG_META[tag].className}${filterTags.includes(tag) ? ' is-on' : ''}`}
              onClick={() => toggleFilterTag(tag)}
            >
              {TAG_META[tag].label}
            </button>
          ))}
        </div>
        {visitor ? (
          <button
            type="button"
            className="board-btn board-btn-primary board-add-btn"
            onClick={() => {
              closeTaskModal()
              setCreating(true)
            }}
          >
            Новая задача
          </button>
        ) : null}
      </div>

      {loading ? <p className="comments-muted">Загрузка…</p> : null}

      <ColumnNav active={activeCol} byStatus={tasksByStatus} onSelect={scrollToColumn} />

      <div className="board-columns" ref={columnsRef}>
        {COLUMNS.map((col) => (
          <BoardColumn
            key={col.status}
            title={col.title}
            status={col.status}
            tasks={tasksByStatus[col.status]}
            isOver={dragOver === col.status}
            visitor={!!visitor}
            canDrag={canDrag}
            pendingIds={pendingIds}
            onDragOver={onDragOverColumn}
            onDragLeave={onDragLeaveColumn}
            onDrop={onDropColumn}
            onDragStart={onDragStart}
            onPatch={patchTask}
            onDelete={removeTask}
          />
        ))}
      </div>

      {error ? <p className="comments-error">{error}</p> : null}

      {creating ? (
        <CreateTaskModal
          busy={formBusy}
          onClose={() => setCreating(false)}
          onCreate={handleCreate}
        />
      ) : null}

      {openTask ? (
        <TaskModal
          key={openTask.id}
          task={openTask}
          visitor={!!visitor}
          pending={pendingIds.has(openTask.id)}
          onClose={closeTaskModal}
          onPatch={(patch) => patchTask(openTask.id, patch)}
          onDelete={() => removeTask(openTask.id)}
        />
      ) : null}
    </div>
  )
}

function ColumnNav({
  active,
  byStatus,
  onSelect,
}: {
  active: TaskStatus
  byStatus: Record<TaskStatus, DocsTask[]>
  onSelect: (status: TaskStatus) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const idx = COLUMNS.findIndex((col) => col.status === active)

  useEffect(() => {
    const track = trackRef.current
    const pill = track?.querySelector<HTMLElement>('.board-col-nav-item.is-on')
    if (!track || !pill) return
    const left = pill.offsetLeft - (track.clientWidth - pill.offsetWidth) / 2
    track.scrollTo({ left, behavior: 'smooth' })
  }, [active])

  return (
    <nav className="board-col-nav" aria-label="Колонки доски">
      <button
        type="button"
        className="board-col-nav-arrow"
        disabled={idx <= 0}
        aria-label="Предыдущая колонка"
        onClick={() => onSelect(COLUMNS[idx - 1].status)}
      >
        <LuChevronLeft size={20} aria-hidden />
      </button>
      <div className="board-col-nav-track" ref={trackRef}>
        {COLUMNS.map((col) => (
          <button
            key={col.status}
            type="button"
            className={`board-col-nav-item${active === col.status ? ' is-on' : ''}`}
            onClick={() => onSelect(col.status)}
          >
            {col.title}
            <span>{byStatus[col.status].length}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="board-col-nav-arrow"
        disabled={idx >= COLUMNS.length - 1}
        aria-label="Следующая колонка"
        onClick={() => onSelect(COLUMNS[idx + 1].status)}
      >
        <LuChevronRight size={20} aria-hidden />
      </button>
    </nav>
  )
}

const BoardColumn = memo(function BoardColumn({
  title,
  status,
  tasks,
  isOver,
  visitor,
  canDrag,
  pendingIds,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onPatch,
  onDelete,
}: {
  title: string
  status: TaskStatus
  tasks: DocsTask[]
  isOver: boolean
  visitor: boolean
  canDrag: boolean
  pendingIds: ReadonlySet<number>
  onDragOver: (e: DragEvent, status: TaskStatus) => void
  onDragLeave: () => void
  onDrop: (e: DragEvent, status: TaskStatus) => void
  onDragStart: (e: DragEvent, taskId: number) => void
  onPatch: (id: number, patch: TaskPatch) => void
  onDelete: (id: number) => void
}) {
  return (
    <section
      className={`board-column${isOver ? ' board-column-over' : ''}`}
      data-board-col={status}
      onDragOver={(e) => onDragOver(e, status)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, status)}
    >
      <h2>
        {title}
        <span className="board-column-count">{tasks.length}</span>
      </h2>
      <div className="board-cards">
        {tasks.map((task) => (
          <BoardCard
            key={task.id}
            task={task}
            visitor={visitor}
            canDrag={canDrag}
            pending={pendingIds.has(task.id)}
            onDragStart={onDragStart}
            onPatch={onPatch}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  )
})

const BoardCard = memo(function BoardCard({
  task,
  visitor,
  canDrag,
  pending,
  onDragStart,
  onPatch,
  onDelete,
}: {
  task: DocsTask
  visitor: boolean
  canDrag: boolean
  pending: boolean
  onDragStart: (e: DragEvent, taskId: number) => void
  onPatch: (id: number, patch: TaskPatch) => void
  onDelete: (id: number) => void
}) {
  return (
    <article
      className={`board-card ${PRIORITY_META[task.priority].className}`}
      draggable={canDrag && visitor && !pending}
      onDragStart={(e) => onDragStart(e, task.id)}
    >
      <div className="board-card-top">
        <Link to={taskHref(task.id)} className="board-card-title">
          {task.title}
        </Link>
        {visitor ? (
          <button
            type="button"
            className={`board-priority ${PRIORITY_META[task.priority].className}`}
            disabled={pending}
            title="Сменить важность"
            onClick={() => onPatch(task.id, { priority: nextPriority(task.priority) })}
          >
            {PRIORITY_META[task.priority].label}
          </button>
        ) : (
          <span className={`board-priority board-priority-readonly ${PRIORITY_META[task.priority].className}`}>
            {PRIORITY_META[task.priority].label}
          </span>
        )}
      </div>
      {task.tags.length > 0 ? (
        <div className="board-tags">
          {task.tags.map((tag) =>
            TAG_META[tag] ? (
              <span key={tag} className={`board-tag ${TAG_META[tag].className}`}>
                {TAG_META[tag].label}
              </span>
            ) : null,
          )}
        </div>
      ) : null}
      {task.description ? <p className="board-card-preview">{task.description}</p> : null}
      <p className="board-card-meta">{task.display_name}</p>
      {visitor ? (
        <div className="board-card-actions">
          <Select
            size="sm"
            value={task.status}
            options={COLUMN_OPTIONS}
            disabled={pending}
            aria-label="Колонка"
            onChange={(next) => {
              if (next !== task.status) onPatch(task.id, { status: next })
            }}
          />
          <div className="board-card-icons">
            <Link
              to={taskHref(task.id)}
              className="board-icon-btn board-open"
              aria-label="Открыть"
              title="Открыть"
            >
              <LuExpand size={16} aria-hidden />
            </Link>
            <button
              type="button"
              className="board-icon-btn board-delete"
              disabled={pending}
              aria-label="Удалить"
              title="Удалить"
              onClick={() => onDelete(task.id)}
            >
              <LuTrash2 size={16} aria-hidden />
            </button>
          </div>
        </div>
      ) : (
        <div className="board-card-icons">
          <Link
            to={taskHref(task.id)}
            className="board-icon-btn board-open"
            aria-label="Открыть"
            title="Открыть"
          >
            <LuExpand size={16} aria-hidden />
          </Link>
        </div>
      )}
    </article>
  )
})

function CreateTaskModal({
  busy,
  onClose,
  onCreate,
}: {
  busy: boolean
  onClose: () => void
  onCreate: (input: CreateTaskInput) => Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('normal')
  const [tags, setTags] = useState<TaskTag[]>([])
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setError('')
    try {
      await onCreate({ title: title.trim(), priority, description, tags })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания')
    }
  }

  return (
    <BoardDrawer
      as="form"
      title="Новая задача"
      titleId="create-task-modal"
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <>
          <button type="button" className="board-btn board-btn-secondary" onClick={onClose}>
            Отмена
          </button>
          <button
            type="submit"
            className="board-btn board-btn-primary"
            disabled={busy || !title.trim()}
          >
            Добавить
          </button>
        </>
      }
    >
      <div className="board-create-form">
            <label>
              Название
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Что нужно сделать"
                maxLength={200}
                required
                autoFocus
              />
            </label>
            <label>
              Срочность
              <Select
                value={priority}
                options={PRIORITY_CREATE_OPTIONS}
                onChange={setPriority}
              />
            </label>
            <label>
              Для кого
              <Select
                multiple
                value={tags}
                options={TAG_OPTIONS}
                onChange={setTags}
              />
            </label>
            <label>
              Описание
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Необязательно"
                rows={5}
                maxLength={4000}
              />
            </label>
            {error ? <p className="comments-error">{error}</p> : null}
          </div>
    </BoardDrawer>
  )
}

function TaskModal({
  task,
  visitor,
  pending,
  onClose,
  onPatch,
  onDelete,
}: {
  task: DocsTask
  visitor: boolean
  pending: boolean
  onClose: () => void
  onPatch: (patch: TaskPatch) => void
  onDelete: () => void
}) {
  const [draft, setDraft] = useState(task.description)
  const [editing, setEditing] = useState(false)

  return (
    <BoardDrawer
      title={task.title}
      titleId={`task-modal-${task.id}`}
      onClose={onClose}
      footer={
        <>
          <CopyTaskLinkButton taskId={task.id} />
          {visitor ? (
            <button
              type="button"
              className="board-icon-btn board-delete"
              disabled={pending}
              aria-label="Удалить"
              title="Удалить"
              onClick={onDelete}
            >
              <LuTrash2 size={16} aria-hidden />
            </button>
          ) : null}
        </>
      }
    >
          <p className="board-card-meta">
            {task.display_name} · {new Date(task.updated_at).toLocaleString('ru-RU')}
          </p>
          {!visitor && task.tags.length > 0 ? (
            <div className="board-tags">
              {task.tags.map((tag) =>
                TAG_META[tag] ? (
                  <span key={tag} className={`board-tag ${TAG_META[tag].className}`}>
                    {TAG_META[tag].label}
                  </span>
                ) : null,
              )}
            </div>
          ) : null}
          {visitor ? (
            <div className="board-modal-controls">
              <label>
                Колонка
                <Select
                  value={task.status}
                  options={COLUMN_OPTIONS}
                  disabled={pending}
                  onChange={(status) => onPatch({ status })}
                />
              </label>
              <label>
                Срочность
                <Select
                  value={task.priority}
                  options={PRIORITY_OPTIONS}
                  disabled={pending}
                  onChange={(level) => onPatch({ priority: level })}
                />
              </label>
              <label>
                Для кого
                <Select
                  multiple
                  value={task.tags}
                  options={TAG_OPTIONS}
                  disabled={pending}
                  onChange={(tags) => onPatch({ tags })}
                />
              </label>
            </div>
          ) : null}
          <div className="board-modal-desc-head">
            <span>Описание</span>
            {visitor && !editing ? (
              <button
                type="button"
                className="board-icon-btn"
                disabled={pending}
                aria-label="Править описание"
                title="Править описание"
                onClick={() => setEditing(true)}
              >
                <LuPencil size={16} aria-hidden />
              </button>
            ) : null}
          </div>
          {visitor && editing ? (
            <form
              className="board-modal-edit"
              onSubmit={(e) => {
                e.preventDefault()
                onPatch({ description: draft })
                setEditing(false)
              }}
            >
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={8}
                maxLength={4000}
                autoFocus
              />
              <div className="board-modal-edit-actions">
                <button type="submit" className="board-btn board-btn-primary" disabled={pending}>
                  Сохранить
                </button>
                <button
                  type="button"
                  className="board-btn board-btn-secondary"
                  onClick={() => {
                    setDraft(task.description)
                    setEditing(false)
                  }}
                >
                  Отмена
                </button>
              </div>
            </form>
          ) : (
            <div className="board-modal-body">
              {task.description ? (
                <p>{task.description}</p>
              ) : (
                <p className="comments-muted">Описания пока нет.</p>
              )}
            </div>
          )}
    </BoardDrawer>
  )
}

function CopyTaskLinkButton({ taskId }: { taskId: number }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    const url = new URL(window.location.href)
    url.searchParams.set('task', String(taskId))
    try {
      await navigator.clipboard.writeText(url.toString())
    } catch {
      window.prompt('Ссылка на задачу', url.toString())
      return
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button
      type="button"
      className="board-icon-btn"
      aria-label={copied ? 'Скопировано' : 'Скопировать ссылку'}
      title={copied ? 'Скопировано' : 'Скопировать ссылку'}
      onClick={() => void copy()}
    >
      {copied ? <LuCheck size={16} aria-hidden /> : <LuLink size={16} aria-hidden />}
    </button>
  )
}

