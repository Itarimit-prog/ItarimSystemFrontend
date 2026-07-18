import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', () => {
  const isDark = ref(false)

  function load() {
    const saved = localStorage.getItem('theme')
    isDark.value = saved === 'dark'
    apply()
  }

  function toggle() {
    isDark.value = !isDark.value
    apply()
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  }

  function setDark(value: boolean) {
    isDark.value = value
    apply()
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
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

  return { isDark, toggle, setDark, load }
})
