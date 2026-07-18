export interface Stat {
  stat_key: string
  xp: number
  level: number
}

export interface PlayerProfile {
  total_xp: number
  level: number
  xp_to_next: number
  stats: Stat[]
}

export interface Achievement {
  code: string
  title: string
  description: string
  icon: string
  stat_key: string | null
  xp_reward: number
  unlocked_at: string
}

export interface AchievementUnlockEvent {
  achievement: Achievement
  xp_gained: number
  stat_gained: string | null
  stat_xp_gained: number
}

export const STAT_LABELS: Record<string, string> = {
  strength: 'Сила',
  health: 'Здоровье',
  intelligence: 'Интеллект',
  discipline: 'Дисциплина',
  wisdom: 'Мудрость',
  charisma: 'Харизма',
}

export const STAT_ICONS: Record<string, string> = {
  strength: '💪',
  health: '❤️',
  intelligence: '🧠',
  discipline: '⚡',
  wisdom: '💰',
  charisma: '😊',
}

export const STAT_COLORS: Record<string, string> = {
  strength: '#E24B4A',
  health: '#5A9C1A',
  intelligence: '#4A7CE2',
  discipline: '#E2A84B',
  wisdom: '#9B59B6',
  charisma: '#E88D4A',
}
