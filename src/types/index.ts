export type TaskType = 'work' | 'study' | 'personal' | 'routine' | 'rest' | 'workout'
export type TaskStatus = 'todo' | 'done' | 'pending'

export interface Task {
  id: string
  title: string
  task_type: TaskType
  status: TaskStatus
  time_start?: string | null  // "HH:MM" — задано у задач с точным временем
  time_end?: string | null    // "HH:MM" — задано у задач с точным временем
  duration_minutes?: number | null  // задано у задач-длительностей (режим "свободное планирование")
  order_index?: number | null       // ручной порядок среди задач-длительностей
  date: string        // "YYYY-MM-DD"
  routine_id?: string | null  // для task_type='workout' — какая тренировка запланирована
  recurring_id?: string | null  // если задача создана по правилу повторения
}

export interface RecurringRule {
  id: string
  title: string
  task_type: TaskType
  time_start?: string | null
  time_end?: string | null
  duration_minutes?: number | null
  routine_id?: string | null
  days: number[]  // 0 = понедельник ... 6 = воскресенье
  start_date: string
}

export const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export interface TemplateTaskItem {
  title: string
  task_type: TaskType
  time_start?: string | null
  time_end?: string | null
  duration_minutes?: number | null
}

export interface Template {
  id: string
  name: string
  tasks: TemplateTaskItem[]
}

export const TASK_TYPE_META: Record<TaskType, { label: string; color: string; bg: string; border: string; badgeBg: string; badgeText: string }> = {
  work:     { label: 'Работа',       color: 'var(--danger)',            bg: 'var(--danger-light)',   border: '#E24B4A', badgeBg: 'var(--danger-light)',   badgeText: 'var(--danger)' },
  study:    { label: 'Учёба',        color: 'var(--accent)',            bg: 'var(--accent-light)',   border: '#2B7BE8', badgeBg: 'var(--accent-light)',   badgeText: 'var(--accent)' },
  personal: { label: 'Личная жизнь', color: 'var(--tag-emerald-text)',  bg: 'var(--tag-emerald-bg)', border: '#1D9E75', badgeBg: 'var(--tag-emerald-bg)', badgeText: 'var(--tag-emerald-text)' },
  routine:  { label: 'Рутина',       color: 'var(--tag-gray-text)',     bg: 'var(--tag-gray-bg)',    border: '#9B9A97', badgeBg: 'var(--tag-gray-bg)',    badgeText: 'var(--tag-gray-text)' },
  rest:     { label: 'Отдых',        color: 'var(--success)',           bg: 'var(--success-light)',  border: '#5A9C1A', badgeBg: 'var(--success-light)',  badgeText: 'var(--success)' },
  workout:  { label: 'Тренировка',   color: '#9B59B6',                  bg: 'var(--tag-purple-bg)',  border: '#9B59B6', badgeBg: 'var(--tag-purple-bg)',  badgeText: '#9B59B6' },
}

export const STATUS_META: Record<TaskStatus, { label: string; bg: string; color: string; icon: string }> = {
  done:    { label: 'Выполнено',    bg: 'var(--success-light)', color: 'var(--success)',        icon: 'check' },
  pending: { label: 'В ожидании',   bg: 'var(--tag-amber-bg)',  color: 'var(--tag-amber-text)', icon: 'clock' },
  todo:    { label: 'Не выполнено', bg: 'var(--accent-light)',  color: 'var(--accent)',         icon: 'circle' },
}
