export interface RoadmapStep {
  id: string
  label: string
  position: number
}

export interface Roadmap {
  id: string
  name: string
  position: number
  current_step_id?: string | null
  steps: RoadmapStep[]
}
