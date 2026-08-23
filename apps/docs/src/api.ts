export type DocsVisitor = {
  id: number
  display_name: string
  created_at?: string
}

export type AuthPayload = {
  display_name: string
  password: string
}

export type DocsComment = {
  id: number
  page_slug: string
  visitor_id: number
  body: string
  display_name: string
  created_at: string
  updated_at: string
}

export type TaskStatus = 'analysis' | 'todo' | 'in_progress' | 'testing' | 'done'
export type TaskPriority = 'low' | 'normal' | 'high'
export type TaskTag = 'management' | 'development' | 'customer'

export type DocsTask = {
  id: number
  title: string
  description: string
  tags: TaskTag[]
  status: TaskStatus
  priority: TaskPriority
  position: number
  display_name: string
  created_at: string
  updated_at: string
}

export type TaskPatch = {
  status?: TaskStatus
  priority?: TaskPriority
  title?: string
  description?: string
  tags?: TaskTag[]
}

export type CreateTaskInput = {
  title: string
  priority?: TaskPriority
  description?: string
  tags?: TaskTag[]
}

const apiBase = import.meta.env.VITE_API_URL ?? 'https://api.bospur.ru'
const SESSION_FLAG = 'yv_docs_session='

let refreshInFlight: Promise<boolean> | null = null

export function hasSessionFlag(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split(';').some((part) => part.trim().startsWith(SESSION_FLAG))
}

function jsonHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' }
}

async function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${apiBase}/api/docs/v1/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => res.ok)
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

async function docsFetch(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const res = await fetch(`${apiBase}${path}`, {
    ...init,
    credentials: 'include',
    headers: init.headers,
  })
  if (res.status !== 401 || !retry) return res
  const refreshed = await refreshSession()
  if (!refreshed) return res
  return docsFetch(path, init, false)
}

function handleAuthError(res: Response) {
  if (res.status === 401) {
    throw new Error('auth_required')
  }
}

function normalizeVisitor(raw: DocsVisitor): DocsVisitor {
  return { ...raw, id: Number(raw.id) }
}

function normalizeTask(raw: DocsTask): DocsTask {
  return {
    ...raw,
    description: raw.description ?? '',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
  }
}

function normalizeComment(c: DocsComment): DocsComment {
  return { ...c, visitor_id: Number(c.visitor_id), id: Number(c.id) }
}

async function parseAuthResponse(res: Response): Promise<DocsVisitor> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Не удалось войти')
  }
  const data = (await res.json()) as { visitor: DocsVisitor }
  return normalizeVisitor(data.visitor)
}

export async function registerVisitor(payload: AuthPayload): Promise<DocsVisitor> {
  const res = await fetch(`${apiBase}/api/docs/v1/register`, {
    method: 'POST',
    credentials: 'include',
    headers: jsonHeaders(),
    body: JSON.stringify({
      display_name: payload.display_name.trim(),
      password: payload.password,
    }),
  })
  return parseAuthResponse(res)
}

export async function loginVisitor(payload: AuthPayload): Promise<DocsVisitor> {
  const res = await fetch(`${apiBase}/api/docs/v1/login`, {
    method: 'POST',
    credentials: 'include',
    headers: jsonHeaders(),
    body: JSON.stringify({
      display_name: payload.display_name.trim(),
      password: payload.password,
    }),
  })
  return parseAuthResponse(res)
}

export async function logoutVisitor(): Promise<void> {
  await fetch(`${apiBase}/api/docs/v1/logout`, {
    method: 'POST',
    credentials: 'include',
  })
}

export async function fetchMe(): Promise<DocsVisitor> {
  const res = await docsFetch('/api/docs/v1/me')
  handleAuthError(res)
  if (!res.ok) throw new Error('Не удалось проверить сессию')
  const data = (await res.json()) as { visitor: DocsVisitor }
  return normalizeVisitor(data.visitor)
}

export async function fetchComments(pageSlug: string): Promise<DocsComment[]> {
  const res = await docsFetch(`/api/docs/v1/comments?page=${encodeURIComponent(pageSlug)}`)
  handleAuthError(res)
  if (!res.ok) throw new Error('Не удалось загрузить комментарии')
  const data = (await res.json()) as { comments: DocsComment[] }
  return data.comments.map(normalizeComment)
}

export async function postComment(pageSlug: string, body: string): Promise<DocsComment> {
  const res = await docsFetch('/api/docs/v1/comments', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ page_slug: pageSlug, body: body.trim() }),
  })
  handleAuthError(res)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Не удалось отправить комментарий')
  }
  const data = (await res.json()) as { comment: DocsComment }
  return normalizeComment(data.comment)
}

export async function patchComment(id: number, body: string): Promise<DocsComment> {
  const res = await docsFetch(`/api/docs/v1/comments/${id}`, {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify({ body: body.trim() }),
  })
  handleAuthError(res)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Не удалось изменить комментарий')
  }
  const data = (await res.json()) as { comment: DocsComment }
  return normalizeComment(data.comment)
}

export async function deleteComment(id: number): Promise<void> {
  const res = await docsFetch(`/api/docs/v1/comments/${id}`, { method: 'DELETE' })
  handleAuthError(res)
  if (!res.ok && res.status !== 204) {
    const text = await res.text()
    throw new Error(text || 'Не удалось удалить комментарий')
  }
}

export async function fetchTasks(): Promise<DocsTask[]> {
  const res = await docsFetch('/api/docs/v1/tasks')
  handleAuthError(res)
  if (!res.ok) throw new Error('Не удалось загрузить задачи')
  const data = (await res.json()) as { tasks: DocsTask[] }
  return data.tasks.map(normalizeTask)
}

export async function createTask(input: CreateTaskInput): Promise<DocsTask> {
  const res = await docsFetch('/api/docs/v1/tasks', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      title: input.title.trim(),
      priority: input.priority ?? 'normal',
      description: input.description?.trim() ?? '',
      tags: input.tags ?? [],
    }),
  })
  handleAuthError(res)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Не удалось создать задачу')
  }
  const data = (await res.json()) as { task: DocsTask }
  return normalizeTask(data.task)
}

export async function updateTask(id: number, patch: TaskPatch): Promise<DocsTask> {
  const res = await docsFetch(`/api/docs/v1/tasks/${id}`, {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify(patch),
  })
  handleAuthError(res)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Не удалось обновить задачу')
  }
  const data = (await res.json()) as { task: DocsTask }
  return normalizeTask(data.task)
}

export async function deleteTask(id: number): Promise<void> {
  const res = await docsFetch(`/api/docs/v1/tasks/${id}`, { method: 'DELETE' })
  handleAuthError(res)
  if (!res.ok && res.status !== 204) {
    const text = await res.text()
    throw new Error(text || 'Не удалось удалить задачу')
  }
}
