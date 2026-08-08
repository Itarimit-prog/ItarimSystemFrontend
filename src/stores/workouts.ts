import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { WorkoutLog } from '@/types/workouts'
import type { Exercise, UserProfile, Routine, RoutineExercise, RoutineExerciseCreate } from '@/types/workouts_models'
import { workoutsApi } from '@/api'
import { useXpToastStore } from '@/stores/xpToast'

export const useWorkoutsStore = defineStore('workouts', () => {
  const exercises = ref<Exercise[]>([])
  const workoutLogs = ref<WorkoutLog[]>([])
  const userProfile = ref<UserProfile | null>(null)
  const loading = ref(false)

  // ── Тренировки-роутины ──
  const routines = ref<Routine[]>([])
  const routineExercises = ref<Record<string, RoutineExercise[]>>({})
  const activeRoutineId = ref<string | null>(null)

  const lastWorkoutDate = computed(() => (routineId: string): string | null => {
    const logs = workoutLogs.value.filter(w => w.routine_id === routineId)
    if (logs.length === 0) return null
    return logs.reduce((max, w) => w.date > max ? w.date : max, logs[0].date)
  })

  async function loadRoutines() {
    routines.value = await workoutsApi.getRoutines()
    if (!activeRoutineId.value && routines.value.length > 0) {
      activeRoutineId.value = routines.value[0].id
    }
    // Загружаем упражнения всех тренировок параллельно, но сливаем в стор ОДНИМ
    // присваиванием — иначе конкурентные read-modify-write по routineExercises.value
    // затирают друг друга (чья запись завершится последней, та и "выигрывает").
    const lists = await Promise.all(routines.value.map(r => workoutsApi.getRoutineExercises(r.id)))
    const merged: Record<string, RoutineExercise[]> = {}
    routines.value.forEach((r, i) => { merged[r.id] = lists[i] })
    routineExercises.value = merged
  }

  async function loadRoutineExercises(routineId: string) {
    const list = await workoutsApi.getRoutineExercises(routineId)
    routineExercises.value = { ...routineExercises.value, [routineId]: list }
  }

  function selectRoutine(id: string) {
    activeRoutineId.value = id
  }

  async function createRoutine(name: string, icon?: string) {
    const created = await workoutsApi.createRoutine(name, icon)
    routines.value = [...routines.value, created]
    routineExercises.value = { ...routineExercises.value, [created.id]: [] }
    activeRoutineId.value = created.id
    return created
  }

  async function renameRoutine(id: string, name: string) {
    const updated = await workoutsApi.updateRoutine(id, { name })
    routines.value = routines.value.map(r => r.id === id ? updated : r)
  }

  async function deleteRoutine(id: string) {
    await workoutsApi.deleteRoutine(id)
    routines.value = routines.value.filter(r => r.id !== id)
    const rest = { ...routineExercises.value }
    delete rest[id]
    routineExercises.value = rest
    if (activeRoutineId.value === id) {
      activeRoutineId.value = routines.value[0]?.id ?? null
    }
  }

  async function addRoutineExercise(routineId: string, payload: RoutineExerciseCreate) {
    const created = await workoutsApi.addRoutineExercise(routineId, payload)
    routineExercises.value = {
      ...routineExercises.value,
      [routineId]: [...(routineExercises.value[routineId] ?? []), created]
    }
    return created
  }

  async function updateRoutineExercise(routineId: string, routineExerciseId: string, payload: Partial<Pick<RoutineExercise, 'sets' | 'reps' | 'weight'>>) {
    const list = routineExercises.value[routineId] ?? []
    const oldList = [...list]
    routineExercises.value = {
      ...routineExercises.value,
      [routineId]: list.map(e => e.id === routineExerciseId ? { ...e, ...payload } : e)
    }
    try {
      const updated = await workoutsApi.updateRoutineExercise(routineExerciseId, payload)
      routineExercises.value = {
        ...routineExercises.value,
        [routineId]: (routineExercises.value[routineId] ?? []).map(e => e.id === routineExerciseId ? updated : e)
      }
    } catch (e) {
      routineExercises.value = { ...routineExercises.value, [routineId]: oldList }
      throw e
    }
  }

  async function deleteRoutineExercise(routineId: string, routineExerciseId: string) {
    const list = routineExercises.value[routineId] ?? []
    routineExercises.value = { ...routineExercises.value, [routineId]: list.filter(e => e.id !== routineExerciseId) }
    try {
      await workoutsApi.deleteRoutineExercise(routineExerciseId)
    } catch (e) {
      routineExercises.value = { ...routineExercises.value, [routineId]: list }
      throw e
    }
  }

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
        loadRoutines(),
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
    routines, routineExercises, activeRoutineId, lastWorkoutDate,
    loadRoutines, selectRoutine, createRoutine, renameRoutine, deleteRoutine,
    addRoutineExercise, updateRoutineExercise, deleteRoutineExercise,
  }
})