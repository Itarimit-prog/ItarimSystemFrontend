export interface RoadmapStep {
  id: string
  label: string
  position: number
  x: number
  y: number
  parent_step_id?: string | null
  done: boolean
}

export interface Roadmap {
  id: string
  name: string
  position: number
  current_step_id?: string | null
  goal_id?: string | null
  steps: RoadmapStep[]
}
