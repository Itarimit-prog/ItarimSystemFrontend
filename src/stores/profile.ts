import { defineStore } from 'pinia'
import { ref } from 'vue'
import { profileApi } from '@/api/profile'
import type { PlayerProfile } from '@/types/profile'

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<PlayerProfile | null>(null)
  const loading = ref(false)

  async function loadProfile() {
    loading.value = true
    try {
      profile.value = await profileApi.getProfile()
    } finally {
      loading.value = false
    }
  }

  async function recalculate() {
    profile.value = await profileApi.recalculate()
  }

  async function resetProfile() {
    loading.value = true
    try {
      profile.value = await profileApi.reset()
    } finally {
      loading.value = false
    }
  }

  const loadAll = loadProfile

  return { profile, loading, loadProfile, recalculate, loadAll, resetProfile }
})
