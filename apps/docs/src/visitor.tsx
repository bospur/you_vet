import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { clearSession, loadVisitor, registerVisitor } from './api'
import { VisitorContext } from './visitor-context'

export function VisitorProvider({ children }: { children: ReactNode }) {
  const [visitor, setVisitor] = useState(() => loadVisitor())

  const login = useCallback(async (name: string) => {
    const next = await registerVisitor(name)
    setVisitor(next)
    return next
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setVisitor(null)
  }, [])

  const value = useMemo(
    () => ({ visitor, login, logout }),
    [visitor, login, logout],
  )

  return <VisitorContext.Provider value={value}>{children}</VisitorContext.Provider>
}
