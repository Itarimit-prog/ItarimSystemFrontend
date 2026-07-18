import { defineStore } from 'pinia'
import { ref } from 'vue'
import { habitsApi } from '@/api/habits'
import { useXpToastStore } from '@/stores/xpToast'
import type { Habit, Check, HabitStats } from '@/types/habits'

function formatDateLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const useHabitsStore = defineStore('habits', () => {
  const habits = ref<Habit[]>([])
  const checks = ref<Record<string, Check[]>>({})   // habitId -> checks today
  const stats = ref<Record<string, HabitStats>>({}) // habitId -> stats
  const loading = ref(false)

  const today = () => formatDateLocal(new Date())

  async function loadAll() {
    loading.value = true
    try {
      habits.value = await habitsApi.getAll()
      await Promise.all(habits.value.map(h => loadHabitData(h.id)))
    } finally {
      loading.value = false
    }
  }

  async function loadHabitData(habitId: string) {
    const [habitChecks, habitStats] = await Promise.all([
      habitsApi.getChecks(habitId, today()),
      habitsApi.getStats(habitId),
    ])
    checks.value = { ...checks.value, [habitId]: habitChecks }
    stats.value = { ...stats.value, [habitId]: habitStats }
  }

  // ── Привычки (optimistic) ──

  async function createHabit(payload: Omit<Habit, 'id'>) {
    const tempId = 'temp-habit-' + Date.now()
    const optimistic: Habit = { ...payload, id: tempId } as Habit

    habits.value = [...habits.value, optimistic]

    try {
      const created = await habitsApi.create(payload)
      habits.value = habits.value.map(h => h.id === tempId ? created : h)
      // Загружаем данные для новой привычки
      await loadHabitData(created.id)
      return created
    } catch (e) {
      habits.value = habits.value.filter(h => h.id !== tempId)
      throw e
    }
  }

  async function updateHabit(id: string, payload: Partial<Habit>) {
    const idx = habits.value.findIndex(h => h.id === id)
    if (idx === -1) return
    const oldHabit = { ...habits.value[idx] }
    const optimistic = { ...oldHabit, ...payload }

    habits.value = habits.value.map(h => h.id === id ? optimistic : h)

    try {
      const updated = await habitsApi.update(id, payload)
      habits.value = habits.value.map(h => h.id === id ? updated : h)
      return updated
    } catch (e) {
      habits.value = habits.value.map(h => h.id === id ? oldHabit : h)
      throw e
    }
  }

  async function deleteHabit(id: string) {
    const oldHabits = [...habits.value]
    const oldChecks = { ...checks.value }
    const oldStats = { ...stats.value }

    habits.value = habits.value.filter(h => h.id !== id)
    delete checks.value[id]
    delete stats.value[id]

    try {
      await habitsApi.delete(id)
    } catch (e) {
      habits.value = oldHabits
      checks.value = oldChecks
      stats.value = oldStats
      throw e
    }
  }

  // ── Чеки (optimistic) ──

  async function toggleCheck(habitId: string, checkIndex = 0) {
    const existing = (checks.value[habitId] || []).find(c => c.check_index === checkIndex)

    if (existing) {
      // Удаляем чек — optimistic
      const oldChecks = [...(checks.value[habitId] || [])]
      checks.value[habitId] = oldChecks.filter(c => c.check_index !== checkIndex)

      try {
        await habitsApi.removeCheck(habitId, today(), checkIndex)
        // Обновляем статистику (immutable, чтобы Vue отреагировал)
        const newStats = await habitsApi.getStats(habitId)
        stats.value = { ...stats.value, [habitId]: newStats }
      } catch (e) {
        checks.value[habitId] = oldChecks
        throw e
      }
    } else {
      // Добавляем чек — optimistic
      const tempCheck: Check = {
        id: 'temp-check-' + Date.now(),
        habit_id: habitId,
        date: today(),
        check_index: checkIndex,
      }
      const oldChecks = [...(checks.value[habitId] || [])]
      checks.value[habitId] = [...oldChecks, tempCheck]

      try {
        const check = await habitsApi.addCheck(habitId, today(), checkIndex)
        checks.value[habitId] = checks.value[habitId].map(c =>
          c.id === tempCheck.id ? check : c
        )

        // Показываем XP тост если вернулся xp_result
        if ((check as any).xp_result) {
          const xp = (check as any).xp_result
          useXpToastStore().show({
            xp: xp.xp_gained,
            statKey: xp.stat_key,
            statLabel: xp.stat_label,
            levelUp: xp.level_up,
            level: xp.level,
          })
        }

        // Обновляем статистику (immutable, чтобы Vue отреагировал)
        const newStats = await habitsApi.getStats(habitId)
        stats.value = { ...stats.value, [habitId]: newStats }
      } catch (e) {
        checks.value[habitId] = oldChecks
        throw e
      }
    }
  }

  async function addRelapse(habitId: string) {
    const oldStats = stats.value[habitId] ? { ...stats.value[habitId] } : null

    // Оптимистично: обнуляем рекорд и сбрасываем %
    if (stats.value[habitId]) {
      stats.value = { ...stats.value, [habitId]: { ...stats.value[habitId], record_seconds: 0 } }
    }

    try {
      await habitsApi.addRelapse(habitId)
      const newStats = await habitsApi.getStats(habitId)
      stats.value = { ...stats.value, [habitId]: newStats }
    } catch (e) {
      if (oldStats) stats.value = { ...stats.value, [habitId]: oldStats }
      throw e
    }
  }

  function isChecked(habitId: string, checkIndex = 0): boolean {
    return (checks.value[habitId] || []).some(c => c.check_index === checkIndex)
  }

  return {
    habits, checks, stats, loading,
    loadAll, loadHabitData, createHabit, updateHabit, deleteHabit,
    toggleCheck, addRelapse, isChecked,
  }
})
