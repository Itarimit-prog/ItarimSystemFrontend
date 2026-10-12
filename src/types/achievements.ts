export interface Achievement {
  id: string
  title: string
  description?: string | null
  reward_name?: string | null
  reward_photo?: string | null
  done: boolean
  done_at?: string | null
  position: number
  created_at: string
}
