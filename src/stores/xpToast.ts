import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface XpToastData {
  xp: number
  statKey?: string
  statLabel?: string
  levelUp?: boolean
  level?: number
}

export const useXpToastStore = defineStore('xpToast', () => {
  const current = ref<XpToastData | null>(null)
  const queue = ref<XpToastData[]>([])
  let timer: ReturnType<typeof setTimeout> | null = null

  function show(data: XpToastData) {
    if (current.value) {
      queue.value.push(data)
    } else {
      current.value = data
      timer = setTimeout(dismiss, 3000)
    }
  }

  function dismiss() {
    current.value = null
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (queue.value.length > 0) {
      const next = queue.value.shift()!
      setTimeout(() => show(next), 250)
    }
  }

  return { current, show, dismiss }
})
