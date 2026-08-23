import { Link, Outlet, useLocation } from 'react-router-dom'
import { VisitorBar } from './VisitorBar'
import { CatLogo } from './CatLogo'

export function Layout() {
  const { pathname } = useLocation()
  const wide = pathname === '/board'

  return (
    <div className={wide ? 'layout layout-wide' : 'layout'}>
      <header className="layout-header">
        <div className="layout-header-inner">
          <Link to="/" className="layout-brand">
            <CatLogo />
            <div>
              <div className="layout-brand-title">YouVet</div>
              <div className="layout-brand-sub">Документация проекта</div>
            </div>
          </Link>
          <VisitorBar />
        </div>
      </header>
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  )
}
