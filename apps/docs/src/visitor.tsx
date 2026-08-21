import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { clearSession, loadVisitor, registerVisitor, type DocsVisitor } from './api'

type VisitorContextValue = {
  visitor: DocsVisitor | null
  login: (name: string) => Promise<DocsVisitor>
  logout: () => void
}

const VisitorContext = createContext<VisitorContextValue | null>(null)

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

export function useVisitor() {
  const ctx = useContext(VisitorContext)
  if (!ctx) {
    throw new Error('useVisitor: нет VisitorProvider')
  }
  return ctx
}
