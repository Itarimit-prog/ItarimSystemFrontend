// WorkoutLog — локальное представление (обогащает Workout с бэкенда)
export interface WorkoutLog {
  id: string
  date: string
  duration_minutes: number
  exercises: string[]  // список ID упражнений
  notes?: string
}