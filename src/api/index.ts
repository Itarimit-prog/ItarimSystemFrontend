import axios from 'axios'
import type { Task, Template, RecurringRule } from '@/types'
import type { Exercise, UserProfile, Routine, RoutineExercise, RoutineExerciseCreate } from '@/types/workouts_models'
import type { WorkoutLog } from '@/types/workouts'
import type { Transaction, Debt, Balance, MonthArchiveEntry } from '@/types/finances'

// Бэкенд теперь всегда локальный: в Tauri-сборке это sidecar-процесс,
// запускаемый main.rs на этом порту; при обычной веб-разработке (npm run dev)
// это локально запущенный uvicorn на том же порту.
const LOCAL_API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8420'

const api = axios.create({
  baseURL: LOCAL_API_URL,
  headers: { 'X-API-Key': import.meta.env.VITE_API_KEY ?? '' },
})

export const systemApi = {
  resetAll: () => api.post('/reset-all').then(r => r.data),
}

export default api

export const tasksApi = {
  getByDate: (date: string) =>
    api.get<Task[]>('/tasks/', { params: { date } }).then(r => r.data),

  getDatesWithTasks: () =>
    api.get<string[]>('/tasks/dates').then(r => r.data),

  create: (payload: Omit<Task, 'id'>) =>
    api.post<Task>('/tasks/', payload).then(r => r.data),

  update: (id: string, payload: Partial<Task>) =>
    api.patch<Task>(`/tasks/${id}`, payload).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/tasks/${id}`),
}

export const templatesApi = {
  getAll: () =>
    api.get<Template[]>('/templates/').then(r => r.data),

  create: (payload: Omit<Template, 'id'>) =>
    api.post<Template>('/templates/', payload).then(r => r.data),

  apply: (template_id: string, target_date: string) =>
    api.post<Task[]>('/templates/apply', { template_id, target_date }).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/templates/${id}`),
}

export type RecurringPayload = Omit<RecurringRule, 'id'>

export const recurringApi = {
  getAll: () =>
    api.get<RecurringRule[]>('/recurring/').then(r => r.data),

  create: (payload: RecurringPayload & { link_task_id?: string }) =>
    api.post<RecurringRule>('/recurring/', payload).then(r => r.data),

  update: (id: string, payload: Partial<RecurringPayload>) =>
    api.patch<RecurringRule>(`/recurring/${id}`, payload).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/recurring/${id}`),
}

export const workoutsApi = {
  // Тренировки
  getAll: () =>
    api.get<WorkoutLog[]>('/workouts/').then(r => r.data),

  create: (payload: Omit<WorkoutLog, 'id'>) =>
    api.post<WorkoutLog>('/workouts/', payload).then(r => r.data),

  update: (id: string, payload: Partial<WorkoutLog>) =>
    api.put<WorkoutLog>(`/workouts/${id}`, payload).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/workouts/${id}`),

  // Упражнения
  getExercises: () =>
    api.get<Exercise[]>('/workouts/exercises/').then(r => r.data),

  createExercise: (payload: Omit<Exercise, 'id'>) =>
    api.post<Exercise>('/workouts/exercises/', payload).then(r => r.data),

  updateExercise: (id: string, payload: Omit<Exercise, 'id'>) =>
    api.put<Exercise>(`/workouts/exercises/${id}`, payload).then(r => r.data),

  deleteExercise: (id: string) =>
    api.delete(`/workouts/exercises/${id}`),

  // Профиль
  getProfile: () =>
    api.get<UserProfile>('/workouts/profile/').then(r => r.data),

  updateProfile: (payload: Partial<UserProfile>) =>
    api.put<UserProfile>('/workouts/profile/', payload).then(r => r.data),

  // Тренировки (роутины)
  getRoutines: () =>
    api.get<Routine[]>('/workouts/routines/').then(r => r.data),

  createRoutine: (name: string, icon?: string) =>
    api.post<Routine>('/workouts/routines/', { name, icon }).then(r => r.data),

  updateRoutine: (id: string, payload: Partial<Pick<Routine, 'name' | 'icon'>>) =>
    api.patch<Routine>(`/workouts/routines/${id}`, payload).then(r => r.data),

  deleteRoutine: (id: string) =>
    api.delete(`/workouts/routines/${id}`),

  getRoutineExercises: (routineId: string) =>
    api.get<RoutineExercise[]>(`/workouts/routines/${routineId}/exercises`).then(r => r.data),

  addRoutineExercise: (routineId: string, payload: RoutineExerciseCreate) =>
    api.post<RoutineExercise>(`/workouts/routines/${routineId}/exercises`, payload).then(r => r.data),

  updateRoutineExercise: (routineExerciseId: string, payload: Partial<Pick<RoutineExercise, 'sets' | 'reps' | 'weight'>>) =>
    api.patch<RoutineExercise>(`/workouts/routines/exercises/${routineExerciseId}`, payload).then(r => r.data),

  deleteRoutineExercise: (routineExerciseId: string) =>
    api.delete(`/workouts/routines/exercises/${routineExerciseId}`),
}

export const financesApi = {
  // Баланс
  getBalance: () =>
    api.get<Balance>('/finances/balance/').then(r => r.data),

  getArchive: () =>
    api.get<MonthArchiveEntry[]>('/finances/archive/').then(r => r.data),

  // Транзакции
  getTransactions: () =>
    api.get<Transaction[]>('/finances/transactions/').then(r => r.data),

  createTransaction: (payload: Omit<Transaction, 'id'>) =>
    api.post<Transaction>('/finances/transactions/', payload).then(r => r.data),

  updateTransaction: (id: string, payload: Partial<Transaction>) =>
    api.put<Transaction>(`/finances/transactions/${id}`, payload).then(r => r.data),

  deleteTransaction: (id: string) =>
    api.delete(`/finances/transactions/${id}`),

  // Долги
  getDebts: () =>
    api.get<Debt[]>('/finances/debts/').then(r => r.data),

  createDebt: (payload: Omit<Debt, 'id'>) =>
    api.post<Debt>('/finances/debts/', payload).then(r => r.data),

  updateDebt: (id: string, payload: Partial<Debt>) =>
    api.put<Debt>(`/finances/debts/${id}`, payload).then(r => r.data),

  deleteDebt: (id: string) =>
    api.delete(`/finances/debts/${id}`),
}
