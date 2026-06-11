import { Link, Outlet } from 'react-router-dom'
import { VisitorBar } from './VisitorBar'
import { CatLogo } from './CatLogo'

export function Layout() {
  return (
    <div className="layout">
      <header className="layout-header">
        <Link to="/" className="layout-brand">
          <CatLogo />
          <div>
            <div className="layout-brand-title">YouVet</div>
            <div className="layout-brand-sub">Документация проекта</div>
          </div>
        </Link>
        <VisitorBar />
      </header>
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  )
}
