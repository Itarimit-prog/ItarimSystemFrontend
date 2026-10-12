import api from './index'
import type { Roadmap, RoadmapStep, RoadmapEdge } from '@/types/roadmap'

export interface StepUpdate {
  label?: string
  position?: number
  x?: number
  y?: number
  done?: boolean
  color?: string | null
}

export const roadmapApi = {
  getAll: () => api.get<Roadmap[]>('/roadmaps/').then(r => r.data),

  create: (name: string) => api.post<Roadmap>('/roadmaps/', { name }).then(r => r.data),

  update: (id: string, payload: { name?: string; current_step_id?: string | null }) =>
    api.patch<Roadmap>(`/roadmaps/${id}`, payload).then(r => r.data),

  delete: (id: string) => api.delete(`/roadmaps/${id}`),

  addStep: (roadmapId: string, label: string, opts: { parent_step_id?: string | null; x?: number; y?: number; color?: string | null } = {}) =>
    api.post<Roadmap>(`/roadmaps/${roadmapId}/steps`, { label, ...opts }).then(r => r.data),

  updateStep: (stepId: string, payload: StepUpdate) =>
    api.patch<RoadmapStep>(`/roadmaps/steps/${stepId}`, payload).then(r => r.data),

  deleteStep: (stepId: string) =>
    api.delete(`/roadmaps/steps/${stepId}`),

  addEdge: (roadmapId: string, from_id: string, to_id: string) =>
    api.post<RoadmapEdge>(`/roadmaps/${roadmapId}/edges`, { from_id, to_id }).then(r => r.data),

  deleteEdge: (edgeId: string) =>
    api.delete(`/roadmaps/edges/${edgeId}`),
}
