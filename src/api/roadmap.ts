import api from './index'
import type { Roadmap, RoadmapStep } from '@/types/roadmap'

export interface StepUpdate {
  label?: string
  position?: number
  x?: number
  y?: number
  parent_step_id?: string | null
  done?: boolean
}

export const roadmapApi = {
  getAll: () => api.get<Roadmap[]>('/roadmaps/').then(r => r.data),

  create: (name: string) => api.post<Roadmap>('/roadmaps/', { name }).then(r => r.data),

  update: (id: string, payload: { name?: string; current_step_id?: string | null }) =>
    api.patch<Roadmap>(`/roadmaps/${id}`, payload).then(r => r.data),

  delete: (id: string) => api.delete(`/roadmaps/${id}`),

  addStep: (roadmapId: string, label: string, opts: { parent_step_id?: string | null; x?: number; y?: number } = {}) =>
    api.post<Roadmap>(`/roadmaps/${roadmapId}/steps`, { label, ...opts }).then(r => r.data),

  updateStep: (stepId: string, payload: StepUpdate) =>
    api.patch<RoadmapStep>(`/roadmaps/steps/${stepId}`, payload).then(r => r.data),

  deleteStep: (stepId: string) =>
    api.delete(`/roadmaps/steps/${stepId}`),
}
