import { type FormEvent, useEffect, useState } from 'react'
import {
  fetchComments,
  loadVisitor,
  postComment,
  registerVisitor,
  type DocsComment,
  type DocsVisitor,
} from '../api'

type Props = {
  pageSlug: string
}

export function CommentsPanel({ pageSlug }: Props) {
  const [visitor, setVisitor] = useState<DocsVisitor | null>(() => loadVisitor())
  const [comments, setComments] = useState<DocsComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

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
      const v = await registerVisitor(name)
      setVisitor(v)
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
        setVisitor(null)
        setShowRegister(true)
        setError('Войдите снова, чтобы оставить комментарий')
      } else {
        setError(err instanceof Error ? err.message : 'Ошибка отправки')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="comments">
      <h2>Комментарии</h2>
      <p className="comments-hint">
        Анонимная регистрация — только имя для подписи. Без email и пароля.
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
              <time dateTime={c.created_at}>
                {new Date(c.created_at).toLocaleString('ru-RU')}
              </time>
            </div>
            <p>{c.body}</p>
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
            {submitting ? '…' : 'Зарегистрироваться'}
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
