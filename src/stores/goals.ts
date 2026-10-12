import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Goal } from '@/types/goals'
import { goalsApi } from '@/api/goals'
import { useRoadmapStore } from '@/stores/roadmap'

export const useGoalsStore = defineStore('goals', () => {
  const goals = ref<Goal[]>([])
  const loading = ref(false)

  async function loadAll() {
    loading.value = true
    try {
      goals.value = await goalsApi.getAll()
    } finally {
      loading.value = false
    }
  }

  function replace(updated: Goal) {
    goals.value = goals.value.map(g => g.id === updated.id ? updated : g)
  }

  async function createGoal(name: string, target_count: number, description?: string) {
    const created = await goalsApi.create({ name, target_count, description: description || null })
    goals.value = [...goals.value, created]
    // У цели сразу появился свой роадмап — подтягиваем его в стор роадмапов
    await useRoadmapStore().loadAll()
    return created
  }

  async function updateGoal(id: string, payload: { name?: string; description?: string | null; target_count?: number }) {
    const updated = await goalsApi.update(id, payload)
    replace(updated)
    if (payload.name) await useRoadmapStore().loadAll()
  }

  async function addProgress(id: string, delta = 1) {
    const goal = goals.value.find(g => g.id === id)
    if (!goal) return
    // Оптимистично: счётчик должен реагировать на клик мгновенно
    const before = { ...goal }
    goal.current_count = Math.max(0, Math.min(goal.target_count, goal.current_count + delta))
    try {
      replace(await goalsApi.progress(id, delta))
    } catch (e) {
      replace(before)
      throw e
    }
  }

  async function deleteGoal(id: string) {
    await goalsApi.delete(id)
    goals.value = goals.value.filter(g => g.id !== id)
    await useRoadmapStore().loadAll()
  }

  return { goals, loading, loadAll, createGoal, updateGoal, addProgress, deleteGoal }
})
