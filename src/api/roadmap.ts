import api from './index'
import type { Roadmap } from '@/types/roadmap'

export const roadmapApi = {
  getAll: () => api.get<Roadmap[]>('/roadmaps/').then(r => r.data),

  create: (name: string) => api.post<Roadmap>('/roadmaps/', { name }).then(r => r.data),

  update: (id: string, payload: { name?: string; current_step_id?: string }) =>
    api.patch<Roadmap>(`/roadmaps/${id}`, payload).then(r => r.data),

  delete: (id: string) => api.delete(`/roadmaps/${id}`),

  addStep: (roadmapId: string, label: string) =>
    api.post<Roadmap>(`/roadmaps/${roadmapId}/steps`, { label }).then(r => r.data),

  updateStep: (stepId: string, payload: { label?: string; position?: number }) =>
    api.patch(`/roadmaps/steps/${stepId}`, payload).then(r => r.data),

  deleteStep: (stepId: string) =>
    api.delete(`/roadmaps/steps/${stepId}`),
}
