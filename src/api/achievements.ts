import api from './index'
import type { Achievement } from '@/types/achievements'

type Payload = {
  title?: string
  description?: string | null
  reward_name?: string | null
  reward_photo?: string | null
  done?: boolean
}

export const achievementsApi = {
  getAll: () => api.get<Achievement[]>('/achievements/').then(r => r.data),
  create: (payload: Payload & { title: string }) =>
    api.post<Achievement>('/achievements/', payload).then(r => r.data),
  update: (id: string, payload: Payload) =>
    api.patch<Achievement>(`/achievements/${id}`, payload).then(r => r.data),
  delete: (id: string) => api.delete(`/achievements/${id}`),
}
