import api from './index'
import type { Habit, Check, Relapse, HabitStats } from '@/types/habits'

export const habitsApi = {
  getAll: () => api.get<Habit[]>('/habits/').then(r => r.data),

  create: (payload: Omit<Habit, 'id'>) =>
    api.post<Habit>('/habits/', payload).then(r => r.data),

  update: (id: string, payload: Partial<Habit>) =>
    api.patch<Habit>(`/habits/${id}`, payload).then(r => r.data),

  delete: (id: string) => api.delete(`/habits/${id}`),

  getChecks: (habitId: string, date: string) =>
    api.get<Check[]>(`/habits/${habitId}/checks`, { params: { date } }).then(r => r.data),

  addCheck: (habitId: string, date: string, checkIndex = 0) =>
    api.post<Check>(`/habits/${habitId}/checks`, {
      habit_id: habitId, date, check_index: checkIndex
    }).then(r => r.data),

  removeCheck: (habitId: string, date: string, checkIndex = 0) =>
    api.delete(`/habits/${habitId}/checks`, { params: { date, check_index: checkIndex } }),

  addRelapse: (habitId: string) =>
    api.post<Relapse>(`/habits/${habitId}/relapses`).then(r => r.data),

  getStats: (habitId: string) =>
    api.get<HabitStats>(`/habits/${habitId}/stats`).then(r => r.data),
}
