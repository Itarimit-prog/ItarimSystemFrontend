export type ExerciseType = 'strength' | 'cardio' | 'flexibility'

export interface Exercise {
  id: string
  name: string
  description?: string
  exercise_type: ExerciseType
  muscle_groups: string[]
  max_weight?: number
  max_reps?: number
  sets?: number
}

export interface UserProfile {
  height_cm: number
  weight_kg: number
}

export interface Routine {
  id: string
  name: string
  icon?: string
  position: number
}

export interface RoutineExercise {
  id: string  // id связи routine_exercises (не exercise_id)
  exercise_id: string
  name: string
  description?: string
  exercise_type: ExerciseType
  muscle_groups: string[]
  sets?: number
  reps?: number
  weight?: number
  position: number
}

export interface RoutineExerciseCreate {
  name: string
  description?: string
  exercise_type: ExerciseType
  muscle_groups: string[]
  sets?: number
  reps?: number
  weight?: number
}