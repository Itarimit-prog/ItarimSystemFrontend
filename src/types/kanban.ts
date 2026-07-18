export interface Board {
  id: string
  name: string
}

export interface KanbanColumn {
  id: string
  board_id: string
  title: string
  color: string
  position: number
  is_completed_column: boolean
}

export interface KanbanCard {
  id: string
  column_id: string
  title: string
  deadline?: string | null  // "YYYY-MM-DD"
  position: number
  completed: boolean
  completed_at?: string | null
  task_id?: string | null
}
