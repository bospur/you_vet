import type { TaskPriority, TaskStatus, TaskTag } from './api'

export const PRIORITY_META: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  low: { label: 'Низкая', className: 'priority-low' },
  normal: { label: 'Обычная', className: 'priority-normal' },
  high: { label: 'Срочно', className: 'priority-high' },
}

export const PRIORITY_ORDER: TaskPriority[] = ['low', 'normal', 'high']

export function nextPriority(current: TaskPriority): TaskPriority {
  const idx = PRIORITY_ORDER.indexOf(current)
  return PRIORITY_ORDER[(idx + 1) % PRIORITY_ORDER.length]
}

export const TAG_META: Record<TaskTag, { label: string; className: string }> = {
  management: { label: 'Менеджмент', className: 'tag-management' },
  development: { label: 'Разработка', className: 'tag-development' },
  customer: { label: 'Заказчик', className: 'tag-customer' },
}

export const TASK_TAGS: TaskTag[] = ['management', 'development', 'customer']

export const TAG_OPTIONS: { value: TaskTag; label: string }[] = TASK_TAGS.map((tag) => ({
  value: tag,
  label: TAG_META[tag].label,
}))

export const TAG_SELECT_OPTIONS: { value: TaskTag | ''; label: string }[] = [
  { value: '', label: 'Не указано' },
  ...TAG_OPTIONS,
]

export const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'analysis', title: 'Анализ' },
  { status: 'todo', title: 'К выполнению' },
  { status: 'in_progress', title: 'В работе' },
  { status: 'testing', title: 'Тестирование' },
  { status: 'done', title: 'Готова' },
]

export const COLUMN_OPTIONS: { value: TaskStatus; label: string }[] = COLUMNS.map((col) => ({
  value: col.status,
  label: col.title,
}))

export const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = PRIORITY_ORDER.map(
  (level) => ({
    value: level,
    label: PRIORITY_META[level].label,
  }),
)

export const PRIORITY_CREATE_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Низкая важность' },
  { value: 'normal', label: 'Обычная' },
  { value: 'high', label: 'Срочно' },
]
