export type HabitKind = 'good' | 'bad'
export type FreqType = 'days' | 'times'

export interface Habit {
  id: string
  name: string
  description?: string | null
  kind: HabitKind
  freq_type: FreqType
  freq_days?: number[] | null   // 0=пн, 6=вс
  freq_times?: number | null
}

export interface Check {
  id: string
  habit_id: string
  date: string
  check_index: number
}

export interface Relapse {
  id: string
  habit_id: string
  timestamp: string
}

export interface HabitStats {
  completion_percent: number
  last_relapse: string | null
  record_seconds: number
}
