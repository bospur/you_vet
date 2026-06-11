const STORAGE_KEY = 'youvet_docs_token'
const VISITOR_KEY = 'youvet_docs_visitor'

export type DocsVisitor = {
  id: number
  display_name: string
}

export type DocsComment = {
  id: number
  page_slug: string
  body: string
  display_name: string
  created_at: string
}

const apiBase = import.meta.env.VITE_API_URL ?? 'https://api.snzbeachvolleyball25.ru'

function authHeaders(): HeadersInit {
  const token = localStorage.getItem(STORAGE_KEY)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function loadVisitor(): DocsVisitor | null {
  const raw = localStorage.getItem(VISITOR_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as DocsVisitor
  } catch {
    return null
  }
}

export function saveSession(token: string, visitor: DocsVisitor) {
  localStorage.setItem(STORAGE_KEY, token)
  localStorage.setItem(VISITOR_KEY, JSON.stringify(visitor))
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(VISITOR_KEY)
}

export async function registerVisitor(displayName: string): Promise<DocsVisitor> {
  const res = await fetch(`${apiBase}/api/docs/v1/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ display_name: displayName.trim() }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Не удалось зарегистрироваться')
  }
  const data = (await res.json()) as { token: string; visitor: DocsVisitor }
  saveSession(data.token, data.visitor)
  return data.visitor
}

export async function fetchComments(pageSlug: string): Promise<DocsComment[]> {
  const res = await fetch(
    `${apiBase}/api/docs/v1/comments?page=${encodeURIComponent(pageSlug)}`,
  )
  if (!res.ok) throw new Error('Не удалось загрузить комментарии')
  const data = (await res.json()) as { comments: DocsComment[] }
  return data.comments
}

export async function postComment(pageSlug: string, body: string): Promise<DocsComment> {
  const res = await fetch(`${apiBase}/api/docs/v1/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ page_slug: pageSlug, body: body.trim() }),
  })
  if (res.status === 401) {
    clearSession()
    throw new Error('auth_required')
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Не удалось отправить комментарий')
  }
  const data = (await res.json()) as { comment: DocsComment }
  return data.comment
}
