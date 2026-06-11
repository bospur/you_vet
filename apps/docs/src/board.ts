import type { TaskPriority } from './api'

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
