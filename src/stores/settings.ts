import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/api'

export type PlannerMode = 'full' | 'free' | 'mixed'

export const useSettingsStore = defineStore('settings', () => {
  const isDark = ref(false)
  const plannerMode = ref<PlannerMode>('full')

  function load() {
    const saved = localStorage.getItem('theme')
    isDark.value = saved === 'dark'
    apply()

    const savedMode = localStorage.getItem('plannerMode')
    if (savedMode === 'full' || savedMode === 'free' || savedMode === 'mixed') {
      plannerMode.value = savedMode
    }
  }

  // Настройки дублируются в базе: localStorage WebView может сброситься,
  // а база лежит в папке данных приложения и переживает перезапуски
  function saveToServer(payload: { theme?: string; planner_mode?: string }) {
    api.put('/settings/', payload).catch(err => console.error('Не удалось сохранить настройки:', err))
  }

  async function syncFromServer() {
    try {
      const { data } = await api.get<{ theme: string | null; planner_mode: string | null }>('/settings/')
      if (data.theme) {
        isDark.value = data.theme === 'dark'
        apply()
        localStorage.setItem('theme', data.theme)
      } else {
        // На сервере ещё пусто (первый запуск после обновления) — отправляем то, что есть локально
        saveToServer({ theme: isDark.value ? 'dark' : 'light', planner_mode: plannerMode.value })
        return
      }
      if (data.planner_mode === 'full' || data.planner_mode === 'free' || data.planner_mode === 'mixed') {
        plannerMode.value = data.planner_mode
        localStorage.setItem('plannerMode', data.planner_mode)
      }
    } catch (err) {
      console.error('Не удалось загрузить настройки:', err)
    }
  }

  function setPlannerMode(mode: PlannerMode) {
    plannerMode.value = mode
    localStorage.setItem('plannerMode', mode)
    saveToServer({ planner_mode: mode })
  }

  function toggle() {
    setDark(!isDark.value)
  }

  function setDark(value: boolean) {
    isDark.value = value
    apply()
    const theme = isDark.value ? 'dark' : 'light'
    localStorage.setItem('theme', theme)
    saveToServer({ theme })
  }

  function apply() {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // auto-load on creation
  load()

  return { isDark, toggle, setDark, load, plannerMode, setPlannerMode, syncFromServer }
})
