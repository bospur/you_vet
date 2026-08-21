import { createContext, useContext } from 'react'
import type { DocsVisitor } from './api'

export type VisitorContextValue = {
  visitor: DocsVisitor | null
  login: (name: string) => Promise<DocsVisitor>
  logout: () => void
}

export const VisitorContext = createContext<VisitorContextValue | null>(null)

export function useVisitor() {
  const ctx = useContext(VisitorContext)
  if (!ctx) {
    throw new Error('useVisitor: нет VisitorProvider')
  }
  return ctx
}
