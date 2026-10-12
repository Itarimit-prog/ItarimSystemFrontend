import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'
import { WIDGETS, type WidgetType } from '@/components/dashboard/registry'

export interface WidgetItem {
  id: string
  type: WidgetType
  span: number
}

const STORAGE_KEY = 'dashboardLayout'

const DEFAULT_LAYOUT: WidgetItem[] = [
  { id: 'roadmap', type: 'roadmap', span: 2 },
  { id: 'habits', type: 'habits', span: 2 },
  { id: 'tasks', type: 'tasks', span: 2 },
]

function sanitize(raw: unknown): WidgetItem[] | null {
  if (!Array.isArray(raw)) return null
  const seen = new Set<string>()
  const items: WidgetItem[] = []
  for (const it of raw) {
    if (!it || typeof it !== 'object') continue
    const { type, span } = it as { type?: string; span?: number }
    if (!type || !(type in WIDGETS) || seen.has(type)) continue
    seen.add(type)
    items.push({ id: type, type: type as WidgetType, span: [2, 3, 4, 6].includes(Number(span)) ? Number(span) : WIDGETS[type as WidgetType].defaultSpan })
  }
  return items
}

export const useDashboardStore = defineStore('dashboard', () => {
  const layout = ref<WidgetItem[]>(DEFAULT_LAYOUT.map(w => ({ ...w })))

  try {
    const local = sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'))
    if (local) layout.value = local
  } catch { /* битый JSON — остаётся раскладка по умолчанию */ }

  function persist() {
    const json = JSON.stringify(layout.value)
    localStorage.setItem(STORAGE_KEY, json)
    api.put('/settings/', { dashboard_layout: json })
      .catch(err => console.error('Не удалось сохранить раскладку дашборда:', err))
  }

  // Раскладка хранится и в базе — переживает перезапуск приложения
  async function syncFromServer() {
    try {
      const { data } = await api.get<{ dashboard_layout: string | null }>('/settings/')
      if (data.dashboard_layout) {
        const server = sanitize(JSON.parse(data.dashboard_layout))
        if (server) {
          layout.value = server
          localStorage.setItem(STORAGE_KEY, data.dashboard_layout)
        }
      }
    } catch (err) {
      console.error('Не удалось загрузить раскладку дашборда:', err)
    }
  }

  const missingTypes = computed(() =>
    (Object.keys(WIDGETS) as WidgetType[]).filter(t => !layout.value.some(w => w.type === t))
  )

  function setSpan(id: string, span: number) {
    const w = layout.value.find(x => x.id === id)
    if (w) { w.span = span; persist() }
  }

  function remove(id: string) {
    layout.value = layout.value.filter(w => w.id !== id)
    persist()
  }

  function add(type: WidgetType) {
    if (layout.value.some(w => w.type === type)) return
    layout.value = [...layout.value, { id: type, type, span: WIDGETS[type].defaultSpan }]
    persist()
  }

  function move(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= layout.value.length || to >= layout.value.length) return
    const next = [...layout.value]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    layout.value = next
    persist()
  }

  function reset() {
    layout.value = DEFAULT_LAYOUT.map(w => ({ ...w }))
    persist()
  }

  return { layout, missingTypes, syncFromServer, setSpan, remove, add, move, reset }
})
