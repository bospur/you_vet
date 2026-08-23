import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  fetchMe,
  hasSessionFlag,
  loginVisitor,
  logoutVisitor,
  registerVisitor,
  type AuthPayload,
  type DocsVisitor,
} from './api'
import { VisitorContext } from './visitor-context'

export function VisitorProvider({ children }: { children: ReactNode }) {
  const [visitor, setVisitor] = useState<DocsVisitor | null>(null)
  const [ready, setReady] = useState(!hasSessionFlag())

  useEffect(() => {
    if (!hasSessionFlag()) return
    let cancelled = false
    fetchMe()
      .then((next) => {
        if (!cancelled) setVisitor(next)
      })
      .catch(() => {
        void logoutVisitor()
        if (!cancelled) setVisitor(null)
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (payload: AuthPayload) => {
    const next = await loginVisitor(payload)
    setVisitor(next)
    return next
  }, [])

  const register = useCallback(async (payload: AuthPayload) => {
    const next = await registerVisitor(payload)
    setVisitor(next)
    return next
  }, [])

  const logout = useCallback(() => {
    void logoutVisitor()
    setVisitor(null)
  }, [])

  const value = useMemo(
    () => ({ visitor, ready, login, register, logout }),
    [visitor, ready, login, register, logout],
  )

  return <VisitorContext.Provider value={value}>{children}</VisitorContext.Provider>
}
