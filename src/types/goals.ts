export interface Goal {
  id: string
  name: string
  description?: string | null
  target_count: number
  current_count: number
  position: number
  created_at: string
  completed_at?: string | null
  roadmap_id?: string | null
}
