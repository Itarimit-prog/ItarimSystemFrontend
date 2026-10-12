export interface RoadmapStep {
  id: string
  label: string
  position: number
  x: number
  y: number
  done: boolean
  color?: string | null
}

export interface RoadmapEdge {
  id: string
  from_id: string
  to_id: string
}

export interface Roadmap {
  id: string
  name: string
  position: number
  current_step_id?: string | null
  goal_id?: string | null
  steps: RoadmapStep[]
  edges: RoadmapEdge[]
}
