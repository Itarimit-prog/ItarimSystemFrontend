import api from './index'
import type { Board, KanbanColumn, KanbanCard } from '@/types/kanban'

export const boardsApi = {
  getAll: () => api.get<Board[]>('/kanban/boards').then(r => r.data),
  create: (name: string) => api.post<Board>('/kanban/boards', { name }).then(r => r.data),
  delete: (id: string) => api.delete(`/kanban/boards/${id}`),
}

export const columnsApi = {
  getByBoard: (boardId: string) =>
    api.get<KanbanColumn[]>(`/kanban/boards/${boardId}/columns`).then(r => r.data),
  create: (payload: Omit<KanbanColumn, 'id'>) =>
    api.post<KanbanColumn>('/kanban/columns', payload).then(r => r.data),
  update: (id: string, payload: Partial<KanbanColumn>) =>
    api.patch<KanbanColumn>(`/kanban/columns/${id}`, payload).then(r => r.data),
  delete: (id: string) => api.delete(`/kanban/columns/${id}`),
}

export const cardsApi = {
  getByColumn: (colId: string) =>
    api.get<KanbanCard[]>(`/kanban/columns/${colId}/cards`).then(r => r.data),
  create: (payload: Omit<KanbanCard, 'id'>) =>
    api.post<KanbanCard>('/kanban/cards', payload).then(r => r.data),
  update: (id: string, payload: Partial<KanbanCard>) =>
    api.patch<KanbanCard>(`/kanban/cards/${id}`, payload).then(r => r.data),
  move: (card_id: string, target_column_id: string, position: number) =>
    api.post<KanbanCard>('/kanban/cards/move', { card_id, target_column_id, position }).then(r => r.data),
  delete: (id: string) => api.delete(`/kanban/cards/${id}`),
}
