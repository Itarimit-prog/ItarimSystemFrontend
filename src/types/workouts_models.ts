export type ExerciseType = 'strength' | 'cardio' | 'flexibility'

export interface Exercise {
  id: string
  name: string
  description?: string
  exercise_type: ExerciseType
  muscle_groups: string[]
  max_weight?: number
  max_reps?: number
}

export interface UserProfile {
  height_cm: number
  weight_kg: number
}