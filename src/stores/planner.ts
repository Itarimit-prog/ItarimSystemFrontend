import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tasksApi, templatesApi, recurringApi, type RecurringPayload } from '@/api'
import { useXpToastStore } from '@/stores/xpToast'
import type { Task, Template, TaskStatus, RecurringRule } from '@/types'

function formatDateLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getWeekDates(date: Date): string[] {
  const day = date.getDay() // 0 = Вс, 1 = Пн ... 6 = Сб
  const diff = day === 0 ? -6 : 1 - day // смещение к понедельнику
  const monday = new Date(date)
  monday.setDate(date.getDate() + diff)
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(formatDateLocal(d))
  }
  return dates
}

export const usePlannerStore = defineStore('planner', () => {
  const tasks = ref<Task[]>([])
  const tasksCache = ref<Record<string, Task[]>>({}) // кэш задач по датам
  const templates = ref<Template[]>([])
  const recurringRules = ref<RecurringRule[]>([])
  const selectedDate = ref<string>(formatDateLocal(new Date()))
  const datesWithTasks = ref<string[]>([])
  const loading = ref(false)

  // Задачи с точным временем — сверху, по времени начала
  function sortTimeline(list: Task[]): Task[] {
    return list
      .filter(t => !!t.time_start)
      .sort((a, b) => a.time_start!.localeCompare(b.time_start!))
  }
  // Задачи-длительности (без точного времени) — снизу, в ручном порядке
  function sortDuration(list: Task[]): Task[] {
    return list
      .filter(t => t.duration_minutes != null)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
  }

  const timelineTasks = computed(() => sortTimeline(tasks.value))
  const durationTasks = computed(() => sortDuration(tasks.value))
  const sortedTasks = computed(() => [...timelineTasks.value, ...durationTasks.value])

  // Задачи за РЕАЛЬНОЕ сегодня — не зависит от того, какой день пользователь
  // сейчас листает в планере (selectedDate меняется при навигации по календарю,
  // а виджеты вроде дашборда должны всегда показывать именно сегодняшний день)
  const todayTasks = computed(() => {
    const todayStr = formatDateLocal(new Date())
    const list = tasksCache.value[todayStr] ?? []
    return [...sortTimeline(list), ...sortDuration(list)]
  })

  const stats = computed(() => ({
    done: tasks.value.filter(t => t.status === 'done').length,
    pending: tasks.value.filter(t => t.status === 'pending').length,
    todo: tasks.value.filter(t => t.status === 'todo').length,
    total: tasks.value.length,
  }))

  async function loadTasks(date?: string) {
    const d = date ?? selectedDate.value
    // Если в кэше — берём оттуда
    if (tasksCache.value[d]) {
      tasks.value = tasksCache.value[d]
      return
    }
    loading.value = true
    try {
      const fetched = await tasksApi.getByDate(d)
      tasksCache.value[d] = fetched
      tasks.value = fetched
    } finally {
      loading.value = false
    }
  }

  async function loadWeekTasks() {
    const weekDates = getWeekDates(new Date())
    const promises = weekDates.map(async d => {
      if (!tasksCache.value[d]) {
        tasksCache.value[d] = await tasksApi.getByDate(d)
      }
    })
    await Promise.all(promises)
    // Устанавливаем текущий день из кэша
    tasks.value = tasksCache.value[selectedDate.value] ?? []
  }

  async function loadDatesWithTasks() {
    datesWithTasks.value = await tasksApi.getDatesWithTasks()
  }

  async function loadRecurring() {
    recurringRules.value = await recurringApi.getAll()
  }

  // Правила повторения меняют задачи на много дней вперёд — проще перечитать всё, чем чинить кэш
  async function refreshAfterRecurringChange() {
    tasksCache.value = {}
    await loadRecurring()
    await loadWeekTasks()
    await loadTasks(selectedDate.value)
    await loadDatesWithTasks()
  }

  async function createRecurring(payload: RecurringPayload, linkTaskId?: string) {
    await recurringApi.create({ ...payload, ...(linkTaskId ? { link_task_id: linkTaskId } : {}) })
    await refreshAfterRecurringChange()
  }

  async function updateRecurring(id: string, payload: Partial<RecurringPayload>) {
    await recurringApi.update(id, payload)
    await refreshAfterRecurringChange()
  }

  async function deleteRecurring(id: string) {
    await recurringApi.delete(id)
    await refreshAfterRecurringChange()
  }

  async function loadTemplates() {
    templates.value = await templatesApi.getAll()
  }

  async function selectDate(date: string) {
    selectedDate.value = date
    if (tasksCache.value[date]) {
      tasks.value = tasksCache.value[date]
    } else {
      await loadTasks(date)
    }
  }

  async function createTask(rawPayload: Omit<Task, 'id'>) {
    let payload = rawPayload
    if (payload.duration_minutes != null) {
      // Новая задача-длительность встаёт в конец списка таких задач за день
      const existing = (tasksCache.value[payload.date] ?? []).filter(t => t.duration_minutes != null)
      const maxOrder = existing.reduce((m, t) => Math.max(m, t.order_index ?? -1), -1)
      payload = { ...payload, order_index: maxOrder + 1 }
    }

    // Optimistic: сразу в кэш и текущий список
    const tempId = 'temp-' + Date.now()
    const optimisticTask = { ...payload, id: tempId } as Task

    const currentList = tasksCache.value[payload.date] ?? []
    tasksCache.value[payload.date] = [...currentList, optimisticTask]
    if (payload.date === selectedDate.value) {
      tasks.value = tasksCache.value[payload.date]
    }
    if (!datesWithTasks.value.includes(payload.date)) {
      datesWithTasks.value.push(payload.date)
    }

    try {
      const task = await tasksApi.create(payload)
      // Заменяем временную задачу на реальную
      const list = tasksCache.value[payload.date]
      const idx = list.findIndex(t => t.id === tempId)
      if (idx !== -1) {
        list[idx] = task
        tasksCache.value[payload.date] = [...list]
      } else {
        tasksCache.value[payload.date] = [...list, task]
      }
      if (payload.date === selectedDate.value) {
        tasks.value = tasksCache.value[payload.date]
      }
    } catch (e) {
      // Rollback
      tasksCache.value[payload.date] = currentList
      if (payload.date === selectedDate.value) {
        tasks.value = currentList
      }
      throw e
    }
  }

  async function updateTaskStatus(id: string, status: TaskStatus) {
    const idx = tasks.value.findIndex(t => t.id === id)
    if (idx === -1) return
    const oldTask = tasks.value[idx]
    const oldStatus = oldTask.status

    // Optimistic
    const optimistic = { ...oldTask, status }
    tasks.value[idx] = optimistic
    if (tasksCache.value[oldTask.date]) {
      const cacheIdx = tasksCache.value[oldTask.date].findIndex(t => t.id === id)
      if (cacheIdx !== -1) {
        const updatedCache = [...tasksCache.value[oldTask.date]]
        updatedCache[cacheIdx] = optimistic
        tasksCache.value[oldTask.date] = updatedCache
      }
    }

    try {
      const updated = await tasksApi.update(id, { status })
      tasks.value[idx] = updated
      if (tasksCache.value[updated.date]) {
        const cacheIdx = tasksCache.value[updated.date].findIndex(t => t.id === id)
        if (cacheIdx !== -1) {
          const updatedCache = [...tasksCache.value[updated.date]]
          updatedCache[cacheIdx] = updated
          tasksCache.value[updated.date] = updatedCache
        }
      }
      if ((updated as any).xp_result) {
        const xp = (updated as any).xp_result
        useXpToastStore().show({
          xp: xp.xp_gained,
          statKey: xp.stat_key,
          statLabel: xp.stat_label,
          levelUp: xp.level_up,
          level: xp.level,
        })
      }
    } catch (e) {
      // Rollback
      tasks.value[idx] = oldTask
      if (tasksCache.value[oldTask.date]) {
        const cacheIdx = tasksCache.value[oldTask.date].findIndex(t => t.id === id)
        if (cacheIdx !== -1) {
          const updatedCache = [...tasksCache.value[oldTask.date]]
          updatedCache[cacheIdx] = oldTask
          tasksCache.value[oldTask.date] = updatedCache
        }
      }
      throw e
    }
  }

  async function updateTask(id: string, payload: Partial<Task>) {
    const idx = tasks.value.findIndex(t => t.id === id)
    if (idx === -1) return
    const oldTask = tasks.value[idx]
    const oldDate = oldTask.date

    // Optimistic
    const optimistic = { ...oldTask, ...payload }
    tasks.value[idx] = optimistic
    if (tasksCache.value[oldDate]) {
      const cacheIdx = tasksCache.value[oldDate].findIndex(t => t.id === id)
      if (cacheIdx !== -1) {
        const updatedCache = [...tasksCache.value[oldDate]]
        updatedCache[cacheIdx] = optimistic
        tasksCache.value[oldDate] = updatedCache
      }
    }

    try {
      const updated = await tasksApi.update(id, payload)
      tasks.value[idx] = updated
      // Если дата изменилась — перемещаем в кэше
      if (tasksCache.value[oldDate]) {
        tasksCache.value[oldDate] = tasksCache.value[oldDate].filter(t => t.id !== id)
      }
      if (!tasksCache.value[updated.date]) tasksCache.value[updated.date] = []
      if (!tasksCache.value[updated.date].find(t => t.id === id)) {
        tasksCache.value[updated.date] = [...tasksCache.value[updated.date], updated]
      }
      if (updated.date !== oldDate && selectedDate.value === updated.date) {
        tasks.value = tasksCache.value[updated.date]
      }
      if ((updated as any).xp_result) {
        const xp = (updated as any).xp_result
        useXpToastStore().show({
          xp: xp.xp_gained,
          statKey: xp.stat_key,
          statLabel: xp.stat_label,
          levelUp: xp.level_up,
          level: xp.level,
        })
      }
    } catch (e) {
      // Rollback
      tasks.value[idx] = oldTask
      if (tasksCache.value[oldDate]) {
        const cacheIdx = tasksCache.value[oldDate].findIndex(t => t.id === id)
        if (cacheIdx !== -1) {
          const updatedCache = [...tasksCache.value[oldDate]]
          updatedCache[cacheIdx] = oldTask
          tasksCache.value[oldDate] = updatedCache
        } else {
          tasksCache.value[oldDate] = [...tasksCache.value[oldDate], oldTask]
        }
      }
      throw e
    }
  }

  async function reorderDurationTasks(date: string, orderedIds: string[]) {
    const list = tasksCache.value[date]
    if (!list) return
    const oldList = list

    const byId = new Map(list.map(t => [t.id, t]))
    const reordered: Task[] = []
    orderedIds.forEach((id, i) => {
      const t = byId.get(id)
      if (t) reordered.push({ ...t, order_index: i })
    })
    const others = list.filter(t => !orderedIds.includes(t.id))
    const newList = [...others, ...reordered]

    tasksCache.value[date] = newList
    if (selectedDate.value === date) tasks.value = newList

    try {
      await Promise.all(reordered.map(t => tasksApi.update(t.id, { order_index: t.order_index })))
    } catch (e) {
      tasksCache.value[date] = oldList
      if (selectedDate.value === date) tasks.value = oldList
      throw e
    }
  }

  async function deleteTask(id: string) {
    const idx = tasks.value.findIndex(t => t.id === id)
    if (idx === -1) return
    const oldTask = tasks.value[idx]
    const oldDate = oldTask.date
    const oldList = tasksCache.value[oldDate] ?? tasks.value

    // Optimistic
    tasks.value = tasks.value.filter(t => t.id !== id)
    if (tasksCache.value[oldDate]) {
      tasksCache.value[oldDate] = tasksCache.value[oldDate].filter(t => t.id !== id)
    }

    try {
      await tasksApi.delete(id)
    } catch (e) {
      // Rollback
      tasks.value = [...oldList]
      if (tasksCache.value[oldDate]) {
        tasksCache.value[oldDate] = [...oldList]
      }
      throw e
    }
  }

  async function saveAsTemplate(name: string) {
    const templateTasks = sortedTasks.value.map(({ title, task_type, time_start, time_end, duration_minutes }) => (
      duration_minutes != null
        ? { title, task_type, duration_minutes }
        : { title, task_type, time_start, time_end }
    ))
    const tpl = await templatesApi.create({ name, tasks: templateTasks })
    templates.value.push(tpl)
  }

  async function applyTemplate(templateId: string) {
    const newTasks = await templatesApi.apply(templateId, selectedDate.value)
    const currentList = tasksCache.value[selectedDate.value] ?? []
    tasksCache.value[selectedDate.value] = [...currentList, ...newTasks]
    tasks.value = tasksCache.value[selectedDate.value]
    if (!datesWithTasks.value.includes(selectedDate.value)) {
      datesWithTasks.value.push(selectedDate.value)
    }
  }

  async function deleteTemplate(id: string) {
    await templatesApi.delete(id)
    templates.value = templates.value.filter(t => t.id !== id)
  }

  return {
    tasks, tasksCache, templates, recurringRules, selectedDate, datesWithTasks, loading,
    sortedTasks, timelineTasks, durationTasks, todayTasks, stats,
    loadTasks, loadWeekTasks, loadDatesWithTasks, loadTemplates, selectDate,
    loadRecurring, createRecurring, updateRecurring, deleteRecurring,
    createTask, updateTask, updateTaskStatus, deleteTask, reorderDurationTasks,
    saveAsTemplate, applyTemplate, deleteTemplate,
  }
})
