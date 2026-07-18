import api from './index'
import type { PlayerProfile, Achievement, AchievementUnlockEvent } from '@/types/profile'

export const profileApi = {
  getProfile: () =>
    api.get<PlayerProfile>('/profile/').then(r => r.data),

  getAchievements: () =>
    api.get<Achievement[]>('/profile/achievements').then(r => r.data),

  checkAchievements: () =>
    api.post<AchievementUnlockEvent[]>('/profile/check-achievements', null, { timeout: 60000 }).then(r => r.data),

  recalculate: () =>
    api.post<PlayerProfile>('/profile/recalculate', null, { timeout: 60000 }).then(r => r.data),

  reset: () =>
    api.post<PlayerProfile>('/profile/reset').then(r => r.data),
}
