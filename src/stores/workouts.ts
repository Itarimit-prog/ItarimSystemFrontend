import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { WorkoutLog } from '@/types/workouts'
import type { Exercise, UserProfile } from '@/types/workouts_models'
import { workoutsApi } from '@/api'
import { useXpToastStore } from '@/stores/xpToast'

export const useWorkoutsStore = defineStore('workouts', () => {
  const exercises = ref<Exercise[]>([])
  const workoutLogs = ref<WorkoutLog[]>([])
  const userProfile = ref<UserProfile | null>(null)
  const loading = ref(false)

  const bmi = computed<number | null>(() => {
    if (!userProfile.value?.height_cm || !userProfile.value?.weight_kg) return null
    const h = userProfile.value.height_cm / 100
    return Math.round((userProfile.value.weight_kg / (h * h)) * 10) / 10
  })

  const bmiStatus = computed(() => {
    const v = bmi.value
    if (v === null) return { label: 'Не определено', color: '#A8C8E8' }
    if (v < 18.5) return { label: 'Недовес', color: '#EF9F27' }
    if (v < 25)   return { label: 'Норма', color: '#5A9C1A' }
    if (v < 30)   return { label: 'Избыток', color: '#EF9F27' }
    return { label: 'Ожирение', color: '#E24B4A' }
  })

  async function loadAll() {
    loading.value = true
    try {
      const [exList, wList, profile] = await Promise.all([
        workoutsApi.getExercises(),
        workoutsApi.getAll(),
        workoutsApi.getProfile(),
      ])
      exercises.value = exList
      workoutLogs.value = wList
      userProfile.value = profile
    } finally {
      loading.value = false
    }
  }

  // ── Упражнения (optimistic) ──

  async function createExercise(payload: Omit<Exercise, 'id'>) {
    const tempId = 'temp-ex-' + Date.now()
    const optimistic: Exercise = { ...payload, id: tempId } as Exercise

    exercises.value = [...exercises.value, optimistic]

    try {
      const created = await workoutsApi.createExercise(payload)
      exercises.value = exercises.value.map(e => e.id === tempId ? created : e)
      return created
    } catch (e) {
      exercises.value = exercises.value.filter(e => e.id !== tempId)
      throw e
    }
  }

  async function updateExercise(id: string, payload: Omit<Exercise, 'id'>) {
    const idx = exercises.value.findIndex(e => e.id === id)
    if (idx === -1) return
    const oldExercise = { ...exercises.value[idx] }
    const optimistic = { ...oldExercise, ...payload }

    exercises.value = exercises.value.map(e => e.id === id ? optimistic : e)

    try {
      const updated = await workoutsApi.updateExercise(id, payload)
      exercises.value = exercises.value.map(e => e.id === id ? updated : e)
      return updated
    } catch (e) {
      exercises.value = exercises.value.map(e => e.id === id ? oldExercise : e)
      throw e
    }
  }

  async function deleteExercise(id: string) {
    const oldList = [...exercises.value]
    exercises.value = exercises.value.filter(e => e.id !== id)

    try {
      await workoutsApi.deleteExercise(id)
    } catch (e) {
      exercises.value = oldList
      throw e
    }
  }

  // ── Тренировки (optimistic) ──

  async function createWorkout(payload: Omit<WorkoutLog, 'id'>) {
    const tempId = 'temp-wl-' + Date.now()
    const optimistic: WorkoutLog = { ...payload, id: tempId }

    workoutLogs.value = [optimistic, ...workoutLogs.value]

    try {
      const created = await workoutsApi.create(payload)
      workoutLogs.value = workoutLogs.value.map(w => w.id === tempId ? created : w)

      if ((created as any).xp_result) {
        const xp = (created as any).xp_result
        useXpToastStore().show({
          xp: xp.xp_gained,
          statKey: xp.stat_key,
          statLabel: xp.stat_label,
          levelUp: xp.level_up,
          level: xp.level,
        })
      }

      return created
    } catch (e) {
      workoutLogs.value = workoutLogs.value.filter(w => w.id !== tempId)
      throw e
    }
  }

  async function deleteWorkoutLog(id: string) {
    const oldList = [...workoutLogs.value]
    workoutLogs.value = workoutLogs.value.filter(w => w.id !== id)

    try {
      await workoutsApi.delete(id)
    } catch (e) {
      workoutLogs.value = oldList
      throw e
    }
  }

  // ── Профиль (optimistic) ──

  async function updateMetrics(data: Partial<UserProfile>) {
    const oldProfile = userProfile.value ? { ...userProfile.value } : null
    if (userProfile.value) {
      userProfile.value = { ...userProfile.value, ...data }
    }

    try {
      const updated = await workoutsApi.updateProfile(data)
      userProfile.value = updated
      return updated
    } catch (e) {
      if (oldProfile) userProfile.value = oldProfile
      throw e
    }
  }

  return {
    exercises, workoutLogs, userProfile, loading, bmi, bmiStatus,
    loadAll, createExercise, updateExercise, deleteExercise,
    createWorkout, deleteWorkoutLog, updateMetrics,
  }
})