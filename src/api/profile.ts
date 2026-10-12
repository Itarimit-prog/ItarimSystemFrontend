import api from './index'
import type { PlayerProfile } from '@/types/profile'

export const profileApi = {
  getProfile: () =>
    api.get<PlayerProfile>('/profile/').then(r => r.data),

  recalculate: () =>
    api.post<PlayerProfile>('/profile/recalculate', null, { timeout: 60000 }).then(r => r.data),

  reset: () =>
    api.post<PlayerProfile>('/profile/reset').then(r => r.data),
}
