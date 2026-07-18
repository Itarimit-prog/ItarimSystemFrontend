import { defineStore } from 'pinia'
import { ref } from 'vue'
import { profileApi } from '@/api/profile'
import { useXpToastStore } from '@/stores/xpToast'
import type { PlayerProfile, Achievement, AchievementUnlockEvent } from '@/types/profile'

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<PlayerProfile | null>(null)
  const achievements = ref<Achievement[]>([])
  const loading = ref(false)
  const newUnlocks = ref<AchievementUnlockEvent[]>([])

  async function loadProfile() {
    loading.value = true
    try {
      profile.value = await profileApi.getProfile()
    } finally {
      loading.value = false
    }
  }

  async function loadAchievements() {
    achievements.value = await profileApi.getAchievements()
  }

  async function checkAchievements() {
    loading.value = true
    try {
      const events = await profileApi.checkAchievements()
      newUnlocks.value = events
      if (events.length > 0) {
        // Показываем XP toast для каждого нового достижения
        const xpToast = useXpToastStore()
        for (const ev of events) {
          xpToast.show({
            xp: ev.xp_gained,
            statKey: ev.stat_gained ?? undefined,
            statLabel: ev.stat_gained ?? undefined,
          })
        }
        // Обновляем профиль и список достижений (без loadProfile, чтобы не мигать loading)
        const [prof] = await Promise.all([
          profileApi.getProfile(),
          loadAchievements(),
        ])
        profile.value = prof
      }
      return events
    } finally {
      loading.value = false
    }
  }

  async function recalculate() {
    profile.value = await profileApi.recalculate()
    await loadAchievements()
  }

  async function resetProfile() {
    loading.value = true
    try {
      profile.value = await profileApi.reset()
      await loadAchievements()
    } finally {
      loading.value = false
    }
  }

  async function loadAll() {
    loading.value = true
    try {
      const [prof] = await Promise.all([
        profileApi.getProfile(),
        loadAchievements(),
      ])
      profile.value = prof
    } finally {
      loading.value = false
    }
  }

  function clearNewUnlocks() {
    newUnlocks.value = []
  }

  return {
    profile, achievements, loading, newUnlocks,
    loadProfile, loadAchievements, checkAchievements,
    recalculate, loadAll, clearNewUnlocks, resetProfile,
  }
})
