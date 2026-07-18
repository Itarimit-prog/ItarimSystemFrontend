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
  work:     { label: 'Работа',       color: '#B22E2E', bg: '#FFF0F0', border: '#E24B4A', badgeBg: '#FCDCDC', badgeText: '#A32D2D' },
  study:    { label: 'Учёба',        color: '#1A5BB5', bg: '#EEF5FF', border: '#2B7BE8', badgeBg: '#D4E6FF', badgeText: '#1A5BB5' },
  personal: { label: 'Личная жизнь', color: '#0D7050', bg: '#EDFAF4', border: '#1D9E75', badgeBg: '#C8EFE1', badgeText: '#0D7050' },
  routine:  { label: 'Рутина',       color: '#4A4945', bg: '#F5F5F4', border: '#9B9A97', badgeBg: '#E2E1DF', badgeText: '#4A4945' },
  rest:     { label: 'Отдых',        color: '#3A7010', bg: '#F2F9EA', border: '#5A9C1A', badgeBg: '#D8EFBB', badgeText: '#3A7010' },
}

export const STATUS_META: Record<TaskStatus, { label: string; bg: string; color: string; icon: string }> = {
  done:    { label: 'Выполнено',    bg: '#D8EFBB', color: '#3A7010', icon: 'check' },
  pending: { label: 'В ожидании',   bg: '#FEF0D4', color: '#9A6200', icon: 'clock' },
  todo:    { label: 'Не выполнено', bg: '#DDE9F8', color: '#1A5BB5', icon: 'circle' },
}
