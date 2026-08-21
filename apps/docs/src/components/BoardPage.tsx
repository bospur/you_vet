import { type DragEvent, type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
  type DocsTask,
  type TaskPriority,
  type TaskStatus,
  type TaskTag,
} from '../api'
import { COLUMNS, nextPriority, PRIORITY_META, PRIORITY_ORDER, TAG_META, TASK_TAGS } from '../board'
import { useVisitor } from '../visitor-context'

export function BoardPage() {
  const [tasks, setTasks] = useState<DocsTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('normal')
  const [tags, setTags] = useState<TaskTag[]>([])
  const [busy, setBusy] = useState(false)
  const [openId, setOpenId] = useState<number | null>(null)
  const { visitor, login, logout } = useVisitor()
  const [registerName, setRegisterName] = useState('')
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null)
  const [filterTags, setFilterTags] = useState<TaskTag[]>([])

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
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setCanDrag(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (openId === null) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [openId])

  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(registerName)
      setRegisterName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации')
    } finally {
      setBusy(false)
    }
  }

  const visibleTasks = useMemo(() => {
    if (filterTags.length === 0) return tasks
    return tasks.filter((task) => task.tags.some((tag) => filterTags.includes(tag)))
  }, [tasks, filterTags])

  function toggleFilterTag(tag: TaskTag) {
    setFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  function toggleCreateTag(tag: TaskTag) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !visitor) return
    setBusy(true)
    setError('')
    try {
      const task = await createTask({ title, priority, description, tags })
      setTasks((prev) => [...prev, task])
      setTitle('')
      setDescription('')
      setPriority('normal')
      setTags([])
    } catch (err) {
      if (err instanceof Error && err.message === 'auth_required') {
        logout()
        setError('Войдите, чтобы создавать задачи')
      } else {
        setError(err instanceof Error ? err.message : 'Ошибка создания')
      }
    } finally {
      setBusy(false)
    }
  }

  async function patchTask(id: number, patch: Parameters<typeof updateTask>[1]) {
    setBusy(true)
    setError('')
    try {
      const updated = await updateTask(id, patch)
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления')
    } finally {
      setBusy(false)
    }
  }

  async function removeTask(id: number) {
    if (!window.confirm('Удалить задачу?')) return
    setBusy(true)
    setError('')
    try {
      await deleteTask(id)
      setTasks((prev) => prev.filter((t) => t.id !== id))
      if (openId === id) setOpenId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления')
    } finally {
      setBusy(false)
    }
  }

  function onDragStart(e: DragEvent, taskId: number) {
    e.dataTransfer.setData('text/plain', String(taskId))
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOverColumn(e: DragEvent, status: TaskStatus) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(status)
  }

  async function onDropColumn(e: DragEvent, status: TaskStatus) {
    e.preventDefault()
    setDragOver(null)
    if (!visitor) return
    const taskId = Number(e.dataTransfer.getData('text/plain'))
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === status) return
    await patchTask(taskId, { status })
  }

  return (
    <div className="board-page">
      <div className="doc-back">
        <Link to="/">← Все документы</Link>
      </div>

      <header className="board-header">
        <h1>Задачи команды</h1>
        <p className="board-lead">
          Карточку можно открыть целиком. Статус — в списке колонок. На телефоне колонки
          листаются вбок, карточка выезжает снизу.
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
            <button type="submit" disabled={busy}>
              Войти
            </button>
          </div>
        </form>
      ) : (
        <form className="board-create" onSubmit={handleCreate}>
          <div className="board-create-row">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Новая задача…"
              maxLength={200}
              required
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              aria-label="Важность"
            >
              <option value="low">Низкая важность</option>
              <option value="normal">Обычная</option>
              <option value="high">Срочно</option>
            </select>
            <button type="submit" disabled={busy || !title.trim()}>
              Добавить
            </button>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание (необязательно)"
            rows={3}
            maxLength={4000}
          />
          <div className="board-tag-picker" role="group" aria-label="Теги">
            {TASK_TAGS.map((tag) => (
              <label key={tag} className={`board-tag-option ${TAG_META[tag].className}`}>
                <input
                  type="checkbox"
                  checked={tags.includes(tag)}
                  onChange={() => toggleCreateTag(tag)}
                />
                {TAG_META[tag].label}
              </label>
            ))}
          </div>
        </form>
      )}

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

      {loading ? <p className="comments-muted">Загрузка…</p> : null}

      <div className="board-columns">
        {COLUMNS.map((col) => (
          <section
            key={col.status}
            className={`board-column${dragOver === col.status ? ' board-column-over' : ''}`}
            onDragOver={(e) => onDragOverColumn(e, col.status)}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => onDropColumn(e, col.status)}
          >
            <h2>
              {col.title}
              <span className="board-column-count">
                {visibleTasks.filter((t) => t.status === col.status).length}
              </span>
            </h2>
            <div className="board-cards">
              {visibleTasks
                .filter((t) => t.status === col.status)
                .map((task) => (
                  <article
                    key={task.id}
                    className={`board-card ${PRIORITY_META[task.priority].className}`}
                    draggable={canDrag && !!visitor && !busy}
                    onDragStart={(e) => onDragStart(e, task.id)}
                  >
                    <div className="board-card-top">
                      <button
                        type="button"
                        className="board-card-title"
                        onClick={() => setOpenId(task.id)}
                      >
                        {task.title}
                      </button>
                      {visitor ? (
                        <button
                          type="button"
                          className={`board-priority ${PRIORITY_META[task.priority].className}`}
                          disabled={busy}
                          title="Сменить важность"
                          onClick={() =>
                            patchTask(task.id, { priority: nextPriority(task.priority) })
                          }
                        >
                          {PRIORITY_META[task.priority].label}
                        </button>
                      ) : (
                        <span
                          className={`board-priority board-priority-readonly ${PRIORITY_META[task.priority].className}`}
                        >
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
                    {task.description ? (
                      <p className="board-card-preview">{task.description}</p>
                    ) : null}
                    <p className="board-card-meta">{task.display_name}</p>
                    {visitor ? (
                      <div className="board-card-actions">
                        <select
                          className="board-status-select"
                          value={task.status}
                          disabled={busy}
                          aria-label="Колонка"
                          onChange={(e) => {
                            const next = e.target.value as TaskStatus
                            if (next !== task.status) patchTask(task.id, { status: next })
                          }}
                        >
                          {COLUMNS.map((column) => (
                            <option key={column.status} value={column.status}>
                              {column.title}
                            </option>
                          ))}
                        </select>
                        <div className="board-card-icons">
                          <button
                            type="button"
                            className="board-icon-btn board-open"
                            disabled={busy}
                            aria-label="Открыть"
                            title="Открыть"
                            onClick={() => setOpenId(task.id)}
                          >
                            <OpenIcon />
                          </button>
                          <button
                            type="button"
                            className="board-icon-btn board-delete"
                            disabled={busy}
                            aria-label="Удалить"
                            title="Удалить"
                            onClick={() => removeTask(task.id)}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="board-card-icons">
                        <button
                          type="button"
                          className="board-icon-btn board-open"
                          aria-label="Открыть"
                          title="Открыть"
                          onClick={() => setOpenId(task.id)}
                        >
                          <OpenIcon />
                        </button>
                      </div>
                    )}
                  </article>
                ))}
            </div>
          </section>
        ))}
      </div>

      {error ? <p className="comments-error">{error}</p> : null}

      {openTask ? (
        <TaskModal
          key={openTask.id}
          task={openTask}
          visitor={!!visitor}
          busy={busy}
          onClose={() => setOpenId(null)}
          onPatch={(patch) => patchTask(openTask.id, patch)}
          onDelete={() => removeTask(openTask.id)}
        />
      ) : null}
    </div>
  )
}

function TaskModal({
  task,
  visitor,
  busy,
  onClose,
  onPatch,
  onDelete,
}: {
  task: DocsTask
  visitor: boolean
  busy: boolean
  onClose: () => void
  onPatch: (patch: Parameters<typeof updateTask>[1]) => void
  onDelete: () => void
}) {
  const [draft, setDraft] = useState(task.description)
  const [editing, setEditing] = useState(false)

  function toggleTag(tag: TaskTag) {
    const next = task.tags.includes(tag)
      ? task.tags.filter((t) => t !== tag)
      : [...task.tags, tag]
    onPatch({ tags: next })
  }

  return (
    <div className="board-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="board-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`task-modal-${task.id}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="board-modal-handle" aria-hidden />
        <div className="board-modal-head">
          <h2 id={`task-modal-${task.id}`}>{task.title}</h2>
          <button type="button" className="board-modal-close" onClick={onClose}>
            Закрыть
          </button>
        </div>
        <div className="board-modal-scroll">
          <p className="board-card-meta">
            {task.display_name} · {new Date(task.updated_at).toLocaleString('ru-RU')}
          </p>
          <div className="board-tags">
            {TASK_TAGS.map((tag) =>
              visitor ? (
                <button
                  key={tag}
                  type="button"
                  className={`board-tag board-tag-toggle ${TAG_META[tag].className}${task.tags.includes(tag) ? ' is-on' : ''}`}
                  disabled={busy}
                  onClick={() => toggleTag(tag)}
                >
                  {TAG_META[tag].label}
                </button>
              ) : task.tags.includes(tag) ? (
                <span key={tag} className={`board-tag ${TAG_META[tag].className}`}>
                  {TAG_META[tag].label}
                </span>
              ) : null,
            )}
          </div>
          {visitor ? (
            <div className="board-modal-controls">
              <label>
                Колонка
                <select
                  className="board-status-select"
                  value={task.status}
                  disabled={busy}
                  onChange={(e) => onPatch({ status: e.target.value as TaskStatus })}
                >
                  {COLUMNS.map((column) => (
                    <option key={column.status} value={column.status}>
                      {column.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Срочность
                <select
                  className="board-status-select"
                  value={task.priority}
                  disabled={busy}
                  onChange={(e) => onPatch({ priority: e.target.value as TaskPriority })}
                >
                  {PRIORITY_ORDER.map((level) => (
                    <option key={level} value={level}>
                      {PRIORITY_META[level].label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
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
              <div className="comment-edit-actions">
                <button type="submit" disabled={busy}>
                  Сохранить
                </button>
                <button
                  type="button"
                  className="link-btn"
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
        </div>
        {visitor ? (
          <div className="board-modal-footer">
            {!editing ? (
              <button type="button" disabled={busy} onClick={() => setEditing(true)}>
                Править описание
              </button>
            ) : null}
            <button
              type="button"
              className="board-icon-btn board-delete"
              disabled={busy}
              aria-label="Удалить"
              title="Удалить"
              onClick={onDelete}
            >
              <TrashIcon />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function OpenIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m6 0-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7m4 4v7m6-7v7"
      />
    </svg>
  )
}
