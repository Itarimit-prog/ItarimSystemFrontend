import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Achievement } from '@/types/achievements'
import { achievementsApi } from '@/api/achievements'

export const useAchievementsStore = defineStore('achievements', () => {
  const achievements = ref<Achievement[]>([])
  const loading = ref(false)

  async function loadAll() {
    loading.value = true
    try {
      achievements.value = await achievementsApi.getAll()
    } finally {
      loading.value = false
    }
  }

  function replace(updated: Achievement) {
    achievements.value = achievements.value.map(a => a.id === updated.id ? updated : a)
  }

  async function create(payload: Parameters<typeof achievementsApi.create>[0]) {
    const created = await achievementsApi.create(payload)
    achievements.value = [...achievements.value, created]
  }

  async function update(id: string, payload: Parameters<typeof achievementsApi.update>[1]) {
    replace(await achievementsApi.update(id, payload))
  }

  async function remove(id: string) {
    await achievementsApi.delete(id)
    achievements.value = achievements.value.filter(a => a.id !== id)
  }

  return { achievements, loading, loadAll, create, update, remove }
})
