import api from './index'
import type { Goal } from '@/types/goals'

export const goalsApi = {
  getAll: () => api.get<Goal[]>('/goals/').then(r => r.data),

  create: (payload: { name: string; description?: string | null; target_count: number }) =>
    api.post<Goal>('/goals/', payload).then(r => r.data),

  update: (id: string, payload: { name?: string; description?: string | null; target_count?: number }) =>
    api.patch<Goal>(`/goals/${id}`, payload).then(r => r.data),

  progress: (id: string, delta: number) =>
    api.post<Goal>(`/goals/${id}/progress`, { delta }).then(r => r.data),

  delete: (id: string) => api.delete(`/goals/${id}`),
}
