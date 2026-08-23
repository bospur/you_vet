import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { recordVisit } from '../api'
import { useVisitor } from '../visitor-context'
import { VisitorBar } from './VisitorBar'
import { CatLogo } from './CatLogo'

export function Layout() {
  const { pathname, search } = useLocation()
  const { visitor, ready } = useVisitor()
  const wide = pathname === '/board'

  useEffect(() => {
    if (!ready || !visitor) return
    const path = `${pathname}${search}`
    recordVisit(path).catch(() => {})
  }, [ready, visitor, pathname, search])

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
