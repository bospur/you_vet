import { useState } from 'react'
import { useVisitor } from '../visitor'

export function VisitorBar() {
  const { visitor, login, logout } = useVisitor()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (name.trim().length < 2) return
    setBusy(true)
    try {
      await login(name)
      setOpen(false)
      setName('')
    } finally {
      setBusy(false)
    }
  }

  if (visitor) {
    return (
      <div className="visitor-bar">
        <span>{visitor.display_name}</span>
        <button type="button" className="link-btn" onClick={logout}>
          Выйти
        </button>
      </div>
    )
  }

  return (
    <div className="visitor-bar">
      {open ? (
        <>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ваше имя"
            maxLength={40}
          />
          <button type="button" onClick={submit} disabled={busy}>
            OK
          </button>
          <button type="button" className="link-btn" onClick={() => setOpen(false)}>
            Отмена
          </button>
        </>
      ) : (
        <button type="button" className="link-btn" onClick={() => setOpen(true)}>
          Войти
        </button>
      )}
    </div>
  )
}
