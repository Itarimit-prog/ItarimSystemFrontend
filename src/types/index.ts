export type TaskType = 'work' | 'study' | 'personal' | 'routine' | 'rest'
export type TaskStatus = 'todo' | 'done' | 'pending'

export interface Task {
  id: string
  title: string
  task_type: TaskType
  status: TaskStatus
  time_start: string  // "HH:MM"
  time_end: string    // "HH:MM"
  date: string        // "YYYY-MM-DD"
}

export interface TemplateTaskItem {
  title: string
  task_type: TaskType
  time_start: string
  time_end: string
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
}

export const STATUS_META: Record<TaskStatus, { label: string; bg: string; color: string; icon: string }> = {
  done:    { label: 'Выполнено',    bg: 'var(--success-light)', color: 'var(--success)',        icon: 'check' },
  pending: { label: 'В ожидании',   bg: 'var(--tag-amber-bg)',  color: 'var(--tag-amber-text)', icon: 'clock' },
  todo:    { label: 'Не выполнено', bg: 'var(--accent-light)',  color: 'var(--accent)',         icon: 'circle' },
}
