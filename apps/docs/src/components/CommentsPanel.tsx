import { type FormEvent, useEffect, useState } from 'react'
import {
  deleteComment,
  fetchComments,
  patchComment,
  postComment,
  type DocsComment,
  type DocsVisitor,
} from '../api'
import { useVisitor } from '../visitor-context'

type Props = {
  pageSlug: string
}

function wasEdited(c: DocsComment): boolean {
  return new Date(c.updated_at).getTime() - new Date(c.created_at).getTime() > 2000
}

function isOwnComment(visitor: DocsVisitor | null, c: DocsComment): boolean {
  if (!visitor) return false
  return Number(visitor.id) === Number(c.visitor_id)
}

export function CommentsPanel({ pageSlug }: Props) {
  const { visitor, login, logout } = useVisitor()
  const [comments, setComments] = useState<DocsComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editBody, setEditBody] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchComments(pageSlug)
      .then((items) => {
        if (!cancelled) setComments(items)
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить комментарии')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [pageSlug])

  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(name)
      setShowRegister(false)
      setName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleComment(e: FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    if (!visitor) {
      setShowRegister(true)
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const comment = await postComment(pageSlug, body)
      setComments((prev) => [...prev, comment])
      setBody('')
    } catch (err) {
      if (err instanceof Error && err.message === 'auth_required') {
        logout()
        setShowRegister(true)
        setError('Войдите снова, чтобы оставить комментарий')
      } else {
        setError(err instanceof Error ? err.message : 'Ошибка отправки')
      }
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(c: DocsComment) {
    setEditingId(c.id)
    setEditBody(c.body)
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditBody('')
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault()
    if (editingId === null || !editBody.trim()) return
    setError('')
    setSubmitting(true)
    try {
      const updated = await patchComment(editingId, editBody)
      setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      cancelEdit()
    } catch (err) {
      if (err instanceof Error && err.message === 'auth_required') {
        logout()
        setError('Войдите снова, чтобы редактировать')
      } else {
        setError(err instanceof Error ? err.message : 'Ошибка сохранения')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(c: DocsComment) {
    if (!window.confirm('Удалить комментарий?')) return
    setError('')
    setSubmitting(true)
    try {
      await deleteComment(c.id)
      setComments((prev) => prev.filter((item) => item.id !== c.id))
      if (editingId === c.id) cancelEdit()
    } catch (err) {
      if (err instanceof Error && err.message === 'auth_required') {
        logout()
        setError('Войдите снова, чтобы удалить')
      } else {
        setError(err instanceof Error ? err.message : 'Ошибка удаления')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="comments">
      <h2>Комментарии</h2>
      <p className="comments-hint">
        Свои комментарии можно изменить или удалить. Если кнопок нет — выйдите в шапке и
        войдите с тем же именем.
      </p>

      {loading ? <p className="comments-muted">Загрузка…</p> : null}
      {!loading && comments.length === 0 ? (
        <p className="comments-muted">Пока нет комментариев. Будьте первым.</p>
      ) : null}

      <ul className="comments-list">
        {comments.map((c) => (
          <li key={c.id} className="comment-item">
            <div className="comment-meta">
              <strong>{c.display_name}</strong>
              <time dateTime={c.updated_at}>
                {new Date(c.updated_at).toLocaleString('ru-RU')}
                {wasEdited(c) ? ' · изменён' : ''}
              </time>
            </div>
            {editingId === c.id ? (
              <form className="comment-edit-form" onSubmit={saveEdit}>
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  required
                  autoFocus
                />
                <div className="comment-edit-actions">
                  <button type="submit" disabled={submitting}>
                    Сохранить
                  </button>
                  <button type="button" className="link-btn" onClick={cancelEdit}>
                    Отмена
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="comment-body">{c.body}</p>
                {isOwnComment(visitor, c) ? (
                  <div className="comment-actions">
                    <button
                      type="button"
                      className="comment-action-btn"
                      disabled={submitting}
                      onClick={() => startEdit(c)}
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      className="comment-action-btn comment-action-delete"
                      disabled={submitting}
                      onClick={() => handleDelete(c)}
                    >
                      Удалить
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </li>
        ))}
      </ul>

      {visitor ? (
        <p className="comments-user">
          Вы: <strong>{visitor.display_name}</strong>
        </p>
      ) : null}

      {showRegister || !visitor ? (
        <form className="comments-form" onSubmit={handleRegister}>
          <label>
            Имя для комментариев
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Мария"
              minLength={2}
              maxLength={40}
              required
            />
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? '…' : 'Войти'}
          </button>
        </form>
      ) : null}

      <form className="comments-form" onSubmit={handleComment}>
        <label>
          Новый комментарий
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Вопрос или замечание к документу…"
            rows={3}
            maxLength={2000}
            required
          />
        </label>
        <button type="submit" disabled={submitting || !visitor}>
          {submitting ? '…' : 'Отправить'}
        </button>
      </form>

      {error ? <p className="comments-error">{error}</p> : null}
    </section>
  )
}
