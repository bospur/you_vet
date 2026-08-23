import { type FormEvent, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useVisitor } from '../visitor-context'

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/'
  return raw
}

export function AuthPage() {
  const { visitor, ready, login, register } = useVisitor()
  const navigate = useNavigate()
  const location = useLocation()
  const next = useMemo(
    () => safeNext(new URLSearchParams(location.search).get('next')),
    [location.search],
  )
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (ready && visitor) {
    return <Navigate to={next} replace />
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (mode === 'register' && password !== confirm) {
      setError('Пароли не совпадают')
      return
    }
    setBusy(true)
    try {
      const payload = { display_name: name, password }
      if (mode === 'register') await register(payload)
      else await login(payload)
      navigate(next, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <h1>{mode === 'login' ? 'Вход на портал' : 'Регистрация'}</h1>
      <p className="auth-lead">
        Документы открыты всем. Канбан и комментарии — только для своей учётки с паролем.
      </p>

      <div className="auth-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className={mode === 'login' ? 'is-on' : ''}
          aria-selected={mode === 'login'}
          onClick={() => {
            setMode('login')
            setError('')
          }}
        >
          Войти
        </button>
        <button
          type="button"
          role="tab"
          className={mode === 'register' ? 'is-on' : ''}
          aria-selected={mode === 'register'}
          onClick={() => {
            setMode('register')
            setError('')
          }}
        >
          Создать аккаунт
        </button>
      </div>

      <form className="auth-form" onSubmit={submit}>
        <label>
          Имя
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Как в комментариях и на доске"
            autoComplete="username"
            minLength={2}
            maxLength={40}
            required
          />
        </label>
        <label>
          Пароль
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={8}
            maxLength={72}
            required
          />
        </label>
        {mode === 'register' ? (
          <label>
            Пароль ещё раз
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
            />
          </label>
        ) : null}
        {error ? <p className="comments-error">{error}</p> : null}
        <button type="submit" disabled={busy || !ready}>
          {busy ? '…' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>

      <p className="auth-back">
        <Link to="/">← К документам без входа</Link>
      </p>
    </div>
  )
}
