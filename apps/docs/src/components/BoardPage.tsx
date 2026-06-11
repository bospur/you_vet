import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createTask,
  deleteTask,
  fetchTasks,
  loadVisitor,
  registerVisitor,
  updateTaskStatus,
  type DocsTask,
  type TaskStatus,
} from '../api'

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'todo', title: 'Туду' },
  { status: 'in_progress', title: 'В работе' },
  { status: 'done', title: 'Готова' },
]

const NEXT_STATUS: Record<TaskStatus, TaskStatus | null> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: null,
}

const PREV_STATUS: Record<TaskStatus, TaskStatus | null> = {
  todo: null,
  in_progress: 'todo',
  done: 'in_progress',
}

export function BoardPage() {
  const [tasks, setTasks] = useState<DocsTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [visitor, setVisitor] = useState(() => loadVisitor())
  const [registerName, setRegisterName] = useState('')

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
      const task = await createTask(title)
      setTasks((prev) => [...prev, task])
      setTitle('')
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

  async function moveTask(task: DocsTask, status: TaskStatus) {
    setBusy(true)
    setError('')
    try {
      const updated = await updateTaskStatus(task.id, status)
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

  return (
    <div className="board-page">
      <div className="doc-back">
        <Link to="/">← Все документы</Link>
      </div>

      <header className="board-header">
        <h1>Задачи команды</h1>
        <p className="board-lead">Канбан: туду → в работе → готова. Общая доска для всех на портале.</p>
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
          <button type="submit" disabled={busy || !title.trim()}>
            Добавить
          </button>
        </form>
      )}

      {loading ? <p className="comments-muted">Загрузка…</p> : null}

      <div className="board-columns">
        {COLUMNS.map((col) => (
          <section key={col.status} className="board-column">
            <h2>{col.title}</h2>
            <div className="board-cards">
              {tasks
                .filter((t) => t.status === col.status)
                .map((task) => (
                  <article key={task.id} className="board-card">
                    <p className="board-card-title">{task.title}</p>
                    <p className="board-card-meta">{task.display_name}</p>
                    {visitor ? (
                      <div className="board-card-actions">
                        {PREV_STATUS[task.status] ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => moveTask(task, PREV_STATUS[task.status]!)}
                          >
                            ←
                          </button>
                        ) : null}
                        {NEXT_STATUS[task.status] ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => moveTask(task, NEXT_STATUS[task.status]!)}
                          >
                            →
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
