import { Link, useLocation } from 'react-router-dom'
import { useVisitor } from '../visitor-context'

export function VisitorBar() {
  const { visitor, ready, logout } = useVisitor()
  const location = useLocation()
  const next = `${location.pathname}${location.search}`
  const loginTo = next && next !== '/' ? `/login?next=${encodeURIComponent(next)}` : '/login'

  if (!ready) {
    return <div className="visitor-bar visitor-bar-muted">…</div>
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
      <Link className="visitor-login-link" to={loginTo}>
        Войти
      </Link>
    </div>
  )
}
