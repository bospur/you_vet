const STORAGE_KEY = 'youvet_docs_token'
const VISITOR_KEY = 'youvet_docs_visitor'

export type DocsVisitor = {
  id: number
  display_name: string
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

function authHeaders(): HeadersInit {
  const token = localStorage.getItem(STORAGE_KEY)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function handleAuthError(res: Response) {
  if (res.status === 401) {
    clearSession()
    throw new Error('auth_required')
  }
}

function normalizeTask(raw: DocsTask): DocsTask {
  return {
    ...raw,
    description: raw.description ?? '',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
  }
}

export function loadVisitor(): DocsVisitor | null {
  const raw = localStorage.getItem(VISITOR_KEY)
  if (!raw) return null
  try {
    const visitor = JSON.parse(raw) as DocsVisitor
    return { ...visitor, id: Number(visitor.id) }
  } catch {
    return null
  }
}

export function saveSession(token: string, visitor: DocsVisitor) {
  localStorage.setItem(STORAGE_KEY, token)
  localStorage.setItem(VISITOR_KEY, JSON.stringify({ ...visitor, id: Number(visitor.id) }))
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
  const visitor = { ...data.visitor, id: Number(data.visitor.id) }
  saveSession(data.token, visitor)
  return visitor
}

export async function fetchComments(pageSlug: string): Promise<DocsComment[]> {
  const res = await fetch(
    `${apiBase}/api/docs/v1/comments?page=${encodeURIComponent(pageSlug)}`,
  )
  if (!res.ok) throw new Error('Не удалось загрузить комментарии')
  const data = (await res.json()) as { comments: DocsComment[] }
  return data.comments.map((c) => ({ ...c, visitor_id: Number(c.visitor_id), id: Number(c.id) }))
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
  handleAuthError(res)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Не удалось отправить комментарий')
  }
  const data = (await res.json()) as { comment: DocsComment }
  const c = data.comment
  return { ...c, visitor_id: Number(c.visitor_id), id: Number(c.id) }
}

export async function patchComment(id: number, body: string): Promise<DocsComment> {
  const res = await fetch(`${apiBase}/api/docs/v1/comments/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ body: body.trim() }),
  })
  handleAuthError(res)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Не удалось изменить комментарий')
  }
  const data = (await res.json()) as { comment: DocsComment }
  const c = data.comment
  return { ...c, visitor_id: Number(c.visitor_id), id: Number(c.id) }
}

export async function deleteComment(id: number): Promise<void> {
  const res = await fetch(`${apiBase}/api/docs/v1/comments/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  handleAuthError(res)
  if (!res.ok && res.status !== 204) {
    const text = await res.text()
    throw new Error(text || 'Не удалось удалить комментарий')
  }
}

export async function fetchTasks(): Promise<DocsTask[]> {
  const res = await fetch(`${apiBase}/api/docs/v1/tasks`)
  if (!res.ok) throw new Error('Не удалось загрузить задачи')
  const data = (await res.json()) as { tasks: DocsTask[] }
  return data.tasks.map(normalizeTask)
}

export async function createTask(input: CreateTaskInput): Promise<DocsTask> {
  const res = await fetch(`${apiBase}/api/docs/v1/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
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
  const res = await fetch(`${apiBase}/api/docs/v1/tasks/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
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
  const res = await fetch(`${apiBase}/api/docs/v1/tasks/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  handleAuthError(res)
  if (!res.ok && res.status !== 204) {
    const text = await res.text()
    throw new Error(text || 'Не удалось удалить задачу')
  }
}
