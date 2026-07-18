import axios from 'axios'
import type { Task, Template } from '@/types'
import type { Exercise, UserProfile } from '@/types/workouts_models'
import type { WorkoutLog } from '@/types/workouts'
import type { Transaction, Debt, Balance } from '@/types/finances'

// Определение базового URL API
// Всегда используем Railway backend
const RAILWAY_API_URL = 'https://web-production-c2708.up.railway.app'

const getApiBaseURL = () => {
  // Проверка на Tauri окружение
  if (typeof window !== 'undefined' && '__TAURI__' in window) {
    return RAILWAY_API_URL
  }
  // Web режим (локальный или production) - всегда Railway
  return RAILWAY_API_URL
}

const api = axios.create({ baseURL: getApiBaseURL() })

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
}

export const financesApi = {
  // Баланс
  getBalance: () =>
    api.get<Balance>('/finances/balance/').then(r => r.data),

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
