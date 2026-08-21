import { type DragEvent, type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createTask,
  deleteTask,
  fetchTasks,
  loadVisitor,
  registerVisitor,
  updateTask,
  type DocsTask,
  type TaskPriority,
  type TaskStatus,
} from '../api'
import { nextPriority, PRIORITY_META } from '../board'

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'todo', title: 'К выполнению' },
  { status: 'in_progress', title: 'В работе' },
  { status: 'done', title: 'Готова' },
]

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'done']

function neighborStatus(status: TaskStatus, dir: -1 | 1): TaskStatus | null {
  const i = STATUS_ORDER.indexOf(status)
  const next = i + dir
  return next >= 0 && next < STATUS_ORDER.length ? STATUS_ORDER[next] : null
}

const MOVE_LABEL: Record<TaskStatus, string> = {
  todo: 'К выполнению',
  in_progress: 'В работу',
  done: 'Готово',
}

export function BoardPage() {
  const [tasks, setTasks] = useState<DocsTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('normal')
  const [busy, setBusy] = useState(false)
  const [visitor, setVisitor] = useState(() => loadVisitor())
  const [registerName, setRegisterName] = useState('')
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null)

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

  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const v = await registerVisitor(registerName)
      setVisitor(v)
      setRegisterName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации')
    } finally {
      setBusy(false)
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !visitor) return
    setBusy(true)
    setError('')
    try {
      const task = await createTask(title, priority)
      setTasks((prev) => [...prev, task])
      setTitle('')
      setPriority('normal')
    } catch (err) {
      if (err instanceof Error && err.message === 'auth_required') {
        setVisitor(null)
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
    setBusy(true)
    setError('')
    try {
      await deleteTask(id)
      setTasks((prev) => prev.filter((t) => t.id !== id))
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
          На компьютере карточки можно перетаскивать. На телефоне — кнопки «В работу» / «Готово».
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
        </form>
      )}

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
            <h2>{col.title}</h2>
            <div className="board-cards">
              {tasks
                .filter((t) => t.status === col.status)
                .map((task) => (
                  <article
                    key={task.id}
                    className={`board-card ${PRIORITY_META[task.priority].className}`}
                    draggable={!!visitor && !busy}
                    onDragStart={(e) => onDragStart(e, task.id)}
                  >
                    <div className="board-card-top">
                      <p className="board-card-title">{task.title}</p>
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
                    <p className="board-card-meta">{task.display_name}</p>
                    {visitor ? (
                      <div className="board-card-actions">
                        {neighborStatus(task.status, -1) ? (
                          <button
                            type="button"
                            className="board-move"
                            disabled={busy}
                            onClick={() => {
                              const next = neighborStatus(task.status, -1)
                              if (next) patchTask(task.id, { status: next })
                            }}
                          >
                            ← {MOVE_LABEL[neighborStatus(task.status, -1)!]}
                          </button>
                        ) : null}
                        {neighborStatus(task.status, 1) ? (
                          <button
                            type="button"
                            className="board-move"
                            disabled={busy}
                            onClick={() => {
                              const next = neighborStatus(task.status, 1)
                              if (next) patchTask(task.id, { status: next })
                            }}
                          >
                            {MOVE_LABEL[neighborStatus(task.status, 1)!]} →
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="board-delete"
                          disabled={busy}
                          onClick={() => removeTask(task.id)}
                        >
                          Удалить
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))}
            </div>
          </section>
        ))}
      </div>

      {error ? <p className="comments-error">{error}</p> : null}
    </div>
  )
}
