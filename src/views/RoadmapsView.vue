<template>
  <div class="rm-page">
    <div class="topbar">
      <span class="page-title">Роадмапы</span>
      <button class="btn-primary" @click="openNewRoadmap">+ Роадмап</button>
    </div>

    <div class="rm-layout">
      <!-- Список роадмапов -->
      <aside class="rm-list">
        <div v-if="roadmaps.length === 0" class="rm-list-empty">Пока нет ни одного роадмапа</div>
        <button
          v-for="r in roadmaps" :key="r.id"
          class="rm-list-item" :class="{ active: r.id === activeRoadmapId }"
          @click="selectRoadmap(r.id)"
        >
          <span class="rm-list-name">{{ r.goal_id ? '🎯 ' : '' }}{{ r.name }}</span>
          <span class="rm-list-count">{{ r.steps.filter(s => s.done).length }}/{{ r.steps.length }}</span>
        </button>
      </aside>

      <!-- Холст -->
      <section class="rm-main">
        <template v-if="activeRoadmap">
          <div class="rm-toolbar">
            <span class="rm-title">{{ activeRoadmap.name }}</span>
            <div class="rm-toolbar-actions">
              <button class="tb-btn" @click="openAddStep(null)">+ Этап</button>
              <button class="tb-btn" @click="zoomBy(1.2)" title="Приблизить">+</button>
              <button class="tb-btn" @click="zoomBy(1 / 1.2)" title="Отдалить">−</button>
              <button class="tb-btn" @click="fitView" title="Показать всё">⌖</button>
              <button v-if="!activeRoadmap.goal_id" class="tb-btn" @click="openRename">Переим.</button>
              <button v-if="!activeRoadmap.goal_id" class="tb-btn danger" @click="showDeleteConfirm = true">Удалить</button>
            </div>
          </div>

          <div class="hint">Чтобы связать этапы, потяни за кружок справа от этапа на другой этап. Клик по стрелке выделяет её.</div>

          <div
            ref="canvasEl" class="canvas"
            :class="{ panning: pan.active, connecting: !!link }"
            @pointerdown="onCanvasPointerDown"
            @wheel.prevent="onWheel"
          >
            <div class="world" :style="worldStyle">
              <svg class="edges" width="1" height="1">
                <defs>
                  <marker
                    v-for="c in arrowColors" :key="c" :id="'arrow-' + c.slice(1)"
                    viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" :fill="c" />
                  </marker>
                </defs>
                <g v-for="e in edgePaths" :key="e.id">
                  <path
                    :d="e.d" class="edge-hit"
                    @pointerdown.stop
                    @click.stop="selectEdge(e.id)"
                  />
                  <path
                    :d="e.d" class="edge"
                    :class="{ selected: e.id === selectedEdgeId }"
                    :stroke="e.color"
                    :marker-end="'url(#arrow-' + e.color.slice(1) + ')'"
                  />
                </g>
                <path v-if="linkPath" :d="linkPath" class="edge temp" :stroke="LINK_COLOR" />
              </svg>

              <div
                v-for="s in activeRoadmap.steps" :key="s.id"
                class="node"
                :data-step-id="s.id"
                :class="{
                  done: s.done,
                  selected: s.id === selectedId,
                  target: link && linkTargetId === s.id,
                }"
                :style="{
                  left: s.x + 'px', top: s.y + 'px',
                  width: NODE_W + 'px', height: NODE_H + 'px',
                  '--c': nodeColor(s),
                }"
                @pointerdown.stop="onNodePointerDown($event, s)"
                @dblclick.stop="selectStep(s.id); openEditStep()"
              >
                <button
                  class="node-check" :class="{ on: s.done }"
                  @pointerdown.stop
                  @click.stop="toggleDone(s)"
                  :title="s.done ? 'Снять отметку' : 'Отметить выполненным'"
                >
                  <span v-if="s.done">✓</span>
                </button>
                <span class="node-label">{{ s.label }}</span>
                <span
                  class="node-handle" title="Потяните на другой этап, чтобы связать"
                  @pointerdown.stop.prevent="onHandleDown($event, s)"
                ></span>
              </div>
            </div>

            <div v-if="activeRoadmap.steps.length === 0" class="canvas-empty">
              Добавьте первый этап кнопкой «+ Этап»
            </div>
          </div>

          <!-- Панель выбранного этапа -->
          <div v-if="selectedStep" class="inspector">
            <span class="insp-name">{{ selectedStep.label }}</span>
            <div class="swatches">
              <button
                v-for="c in COLORS" :key="c.key ?? 'none'"
                class="swatch" :class="{ active: (selectedStep.color ?? null) === c.key }"
                :style="{ background: c.hex ?? 'var(--bg-card)' }"
                :title="c.title"
                @click="setColor(c.key)"
              ></button>
            </div>
            <button class="tb-btn" @click="openAddStep(selectedStep.id)">+ Следующий этап</button>
            <button class="tb-btn" @click="openEditStep">Переименовать</button>
            <button class="tb-btn danger" @click="removeSelected">Удалить этап</button>
          </div>

          <!-- Панель выбранной связи -->
          <div v-else-if="selectedEdge" class="inspector">
            <span class="insp-name">{{ edgeTitle }}</span>
            <button class="tb-btn" @click="reverseEdge">⇄ Развернуть</button>
            <button class="tb-btn danger" @click="removeEdge">Удалить связь</button>
          </div>
        </template>

        <div v-else class="rm-empty">
          Выберите роадмап слева или создайте новый
        </div>
      </section>
    </div>

    <!-- Модалка: новый роадмап -->
    <Teleport to="body" v-if="showNewRoadmap">
      <div class="overlay" @click.self="showNewRoadmap = false">
        <div class="mini-modal">
          <h3>Новый роадмап</h3>
          <input v-model="roadmapName" placeholder="Название" @keyup.enter="submitNewRoadmap" />
          <div class="mini-footer">
            <button class="btn-cancel" @click="showNewRoadmap = false">Отмена</button>
            <button class="btn-save" :disabled="!roadmapName.trim() || busy" @click="submitNewRoadmap">Создать</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Модалка: переименование роадмапа -->
    <Teleport to="body" v-if="showRename">
      <div class="overlay" @click.self="showRename = false">
        <div class="mini-modal">
          <h3>Переименовать роадмап</h3>
          <input v-model="roadmapName" placeholder="Название" @keyup.enter="submitRename" />
          <div class="mini-footer">
            <button class="btn-cancel" @click="showRename = false">Отмена</button>
            <button class="btn-save" :disabled="!roadmapName.trim() || busy" @click="submitRename">Сохранить</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Модалка: удалить роадмап -->
    <Teleport to="body" v-if="showDeleteConfirm">
      <div class="overlay" @click.self="showDeleteConfirm = false">
        <div class="mini-modal">
          <h3>Удалить роадмап?</h3>
          <p class="confirm-text">«{{ activeRoadmap?.name }}» будет удалён вместе со всеми этапами.</p>
          <div class="mini-footer">
            <button class="btn-cancel" @click="showDeleteConfirm = false">Отмена</button>
            <button class="btn-danger" @click="submitDelete">Удалить</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Модалка: добавить / переименовать этап -->
    <Teleport to="body" v-if="stepModal.open">
      <div class="overlay" @click.self="stepModal.open = false">
        <div class="mini-modal">
          <h3>{{ stepModal.editId ? 'Переименовать этап' : 'Новый этап' }}</h3>
          <input v-model="stepModal.label" placeholder="Название этапа" @keyup.enter="submitStep" />
          <div class="mini-footer">
            <button class="btn-cancel" @click="stepModal.open = false">Отмена</button>
            <button class="btn-save" :disabled="!stepModal.label.trim() || busy" @click="submitStep">
              {{ stepModal.editId ? 'Сохранить' : 'Добавить' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useRoadmapStore } from '@/stores/roadmap'
import type { RoadmapStep } from '@/types/roadmap'

const NODE_W = 190
const NODE_H = 56

// Палитра узлов. key хранится в базе; null — обычный узел без цвета
const COLORS: { key: string | null; hex: string | null; title: string }[] = [
  { key: null, hex: null, title: 'Без цвета' },
  { key: 'teal', hex: '#4DB6AC', title: 'Бирюзовый' },
  { key: 'blue', hex: '#4A90E2', title: 'Синий' },
  { key: 'purple', hex: '#9B7BE8', title: 'Фиолетовый' },
  { key: 'pink', hex: '#E86A8A', title: 'Розовый' },
  { key: 'red', hex: '#E24B4A', title: 'Красный' },
  { key: 'orange', hex: '#F0903C', title: 'Оранжевый' },
  { key: 'yellow', hex: '#D9A82B', title: 'Жёлтый' },
  { key: 'green', hex: '#5A9C1A', title: 'Зелёный' },
]
const NEUTRAL = '#9AA7B8'
const LINK_COLOR = '#4A90E2'
const colorHex = (key?: string | null) => COLORS.find(c => c.key === key)?.hex ?? null
const nodeColor = (s: RoadmapStep) => colorHex(s.color) ?? 'var(--border)'
const arrowColors = [NEUTRAL, ...COLORS.map(c => c.hex).filter((h): h is string => !!h)]

const store = useRoadmapStore()
const { roadmaps, activeRoadmapId } = storeToRefs(store)
const route = useRoute()

const activeRoadmap = computed(() => roadmaps.value.find(r => r.id === activeRoadmapId.value) ?? null)
const selectedId = ref<string | null>(null)
const selectedEdgeId = ref<string | null>(null)
const selectedStep = computed(() => activeRoadmap.value?.steps.find(s => s.id === selectedId.value) ?? null)
const selectedEdge = computed(() => activeRoadmap.value?.edges.find(e => e.id === selectedEdgeId.value) ?? null)

function selectStep(id: string) { selectedId.value = id; selectedEdgeId.value = null }
function selectEdge(id: string) { selectedEdgeId.value = id; selectedId.value = null }
function clearSelection() { selectedId.value = null; selectedEdgeId.value = null }

const canvasEl = ref<HTMLElement | null>(null)
const view = reactive({ x: 0, y: 0, zoom: 1 })
const worldStyle = computed(() => ({
  transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
}))

// ── Геометрия стрелок ──

type Pt = { x: number; y: number }

// Выходим из боковой стороны узла, если цель левее/правее, иначе из верхней/нижней
function anchors(a: RoadmapStep, b: Pt): { p: Pt; dir: Pt } {
  const cx = a.x + NODE_W / 2, cy = a.y + NODE_H / 2
  const dx = b.x - cx, dy = b.y - cy
  if (Math.abs(dx) * NODE_H > Math.abs(dy) * NODE_W) {
    return dx > 0
      ? { p: { x: a.x + NODE_W, y: cy }, dir: { x: 1, y: 0 } }
      : { p: { x: a.x, y: cy }, dir: { x: -1, y: 0 } }
  }
  return dy > 0
    ? { p: { x: cx, y: a.y + NODE_H }, dir: { x: 0, y: 1 } }
    : { p: { x: cx, y: a.y }, dir: { x: 0, y: -1 } }
}

function curve(from: RoadmapStep, to: RoadmapStep): string {
  const toCenter = { x: to.x + NODE_W / 2, y: to.y + NODE_H / 2 }
  const fromCenter = { x: from.x + NODE_W / 2, y: from.y + NODE_H / 2 }
  const a = anchors(from, toCenter)
  const b = anchors(to, fromCenter)
  const dist = Math.hypot(b.p.x - a.p.x, b.p.y - a.p.y)
  const k = Math.max(30, dist / 3)
  return `M ${a.p.x} ${a.p.y} C ${a.p.x + a.dir.x * k} ${a.p.y + a.dir.y * k}, ${b.p.x + b.dir.x * k} ${b.p.y + b.dir.y * k}, ${b.p.x} ${b.p.y}`
}

const edgePaths = computed(() => {
  const r = activeRoadmap.value
  if (!r) return []
  const byId = new Map(r.steps.map(s => [s.id, s]))
  const list: { id: string; d: string; color: string }[] = []
  for (const e of r.edges) {
    const from = byId.get(e.from_id), to = byId.get(e.to_id)
    if (!from || !to) continue
    list.push({ id: e.id, d: curve(from, to), color: colorHex(from.color) ?? NEUTRAL })
  }
  return list
})

const edgeTitle = computed(() => {
  const r = activeRoadmap.value, e = selectedEdge.value
  if (!r || !e) return ''
  const name = (id: string) => r.steps.find(s => s.id === id)?.label ?? '?'
  return `${name(e.from_id)} → ${name(e.to_id)}`
})

// ── Создание связи перетаскиванием от кружка ──

const link = ref<{ from: RoadmapStep; x: number; y: number } | null>(null)
const linkTargetId = ref<string | null>(null)

const linkPath = computed(() => {
  if (!link.value) return ''
  const { from, x, y } = link.value
  const a = anchors(from, { x, y })
  return `M ${a.p.x} ${a.p.y} L ${x} ${y}`
})

function toWorld(clientX: number, clientY: number): Pt {
  const rect = canvasEl.value!.getBoundingClientRect()
  return { x: (clientX - rect.left - view.x) / view.zoom, y: (clientY - rect.top - view.y) / view.zoom }
}

function stepIdAt(clientX: number, clientY: number): string | null {
  const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null
  return el?.closest<HTMLElement>('[data-step-id]')?.dataset.stepId ?? null
}

function onHandleDown(e: PointerEvent, step: RoadmapStep) {
  selectStep(step.id)
  const p = toWorld(e.clientX, e.clientY)
  link.value = { from: step, x: p.x, y: p.y }
  window.addEventListener('pointermove', onLinkMove)
  window.addEventListener('pointerup', onLinkUp, { once: true })
}

function onLinkMove(e: PointerEvent) {
  if (!link.value) return
  const p = toWorld(e.clientX, e.clientY)
  link.value.x = p.x
  link.value.y = p.y
  const id = stepIdAt(e.clientX, e.clientY)
  linkTargetId.value = id && id !== link.value.from.id ? id : null
}

async function onLinkUp(e: PointerEvent) {
  window.removeEventListener('pointermove', onLinkMove)
  const from = link.value?.from
  const target = stepIdAt(e.clientX, e.clientY)
  link.value = null
  linkTargetId.value = null
  if (!from || !target || target === from.id || !activeRoadmap.value) return
  try {
    await store.addEdge(activeRoadmap.value.id, from.id, target)
  } catch (err) {
    console.error('Ошибка создания связи:', err)
  }
}

async function removeEdge() {
  if (!activeRoadmap.value || !selectedEdge.value) return
  try {
    await store.deleteEdge(activeRoadmap.value.id, selectedEdge.value.id)
    selectedEdgeId.value = null
  } catch (err) {
    console.error('Ошибка удаления связи:', err)
  }
}

async function reverseEdge() {
  const r = activeRoadmap.value, e = selectedEdge.value
  if (!r || !e) return
  try {
    await store.deleteEdge(r.id, e.id)
    await store.addEdge(r.id, e.to_id, e.from_id)
    selectedEdgeId.value = r.edges.find(x => x.from_id === e.to_id && x.to_id === e.from_id)?.id ?? null
  } catch (err) {
    console.error('Ошибка разворота связи:', err)
  }
}

// ── Масштаб / панорамирование ──

function selectRoadmap(id: string) {
  store.selectRoadmap(id)
}

function fitView() {
  const r = activeRoadmap.value
  const el = canvasEl.value
  if (!el) return
  const w = el.clientWidth, h = el.clientHeight
  if (!r || r.steps.length === 0) {
    view.x = w / 2 - NODE_W / 2
    view.y = 60
    view.zoom = 1
    return
  }
  const minX = Math.min(...r.steps.map(s => s.x))
  const maxX = Math.max(...r.steps.map(s => s.x + NODE_W))
  const minY = Math.min(...r.steps.map(s => s.y))
  const maxY = Math.max(...r.steps.map(s => s.y + NODE_H))
  const pad = 60
  const zoom = Math.min(1, (w - pad * 2) / (maxX - minX), (h - pad * 2) / (maxY - minY))
  view.zoom = Math.max(0.25, zoom)
  view.x = (w - (maxX - minX) * view.zoom) / 2 - minX * view.zoom
  view.y = (h - (maxY - minY) * view.zoom) / 2 - minY * view.zoom
}

watch(activeRoadmapId, async () => {
  clearSelection()
  await nextTick()
  fitView()
})

onMounted(async () => {
  const wanted = route.query.id as string | undefined
  if (wanted && roadmaps.value.some(r => r.id === wanted)) store.selectRoadmap(wanted)
  await nextTick()
  fitView()
})

// Роадмап могут выбрать по ссылке со страницы целей, пока этот экран уже в KeepAlive
watch(() => route.query.id, async (id) => {
  if (id && roadmaps.value.some(r => r.id === id)) store.selectRoadmap(id as string)
})

function zoomAt(factor: number, cx: number, cy: number) {
  const next = Math.min(2.5, Math.max(0.25, view.zoom * factor))
  const k = next / view.zoom
  view.x = cx - (cx - view.x) * k
  view.y = cy - (cy - view.y) * k
  view.zoom = next
}

function zoomBy(factor: number) {
  const el = canvasEl.value
  if (!el) return
  zoomAt(factor, el.clientWidth / 2, el.clientHeight / 2)
}

function onWheel(e: WheelEvent) {
  const el = canvasEl.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  zoomAt(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX - rect.left, e.clientY - rect.top)
}

const pan = reactive({ active: false, sx: 0, sy: 0, vx: 0, vy: 0, moved: false })

function onCanvasPointerDown(e: PointerEvent) {
  pan.active = true
  pan.moved = false
  pan.sx = e.clientX; pan.sy = e.clientY
  pan.vx = view.x; pan.vy = view.y
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  window.addEventListener('pointermove', onPanMove)
  window.addEventListener('pointerup', onPanUp, { once: true })
}

function onPanMove(e: PointerEvent) {
  if (!pan.active) return
  const dx = e.clientX - pan.sx, dy = e.clientY - pan.sy
  if (Math.abs(dx) + Math.abs(dy) > 3) pan.moved = true
  view.x = pan.vx + dx
  view.y = pan.vy + dy
}

function onPanUp() {
  window.removeEventListener('pointermove', onPanMove)
  pan.active = false
  // Клик по пустому месту снимает выделение
  if (!pan.moved) clearSelection()
}

// ── Перетаскивание узлов ──

const drag = reactive<{ step: RoadmapStep | null; sx: number; sy: number; ox: number; oy: number; moved: boolean }>({
  step: null, sx: 0, sy: 0, ox: 0, oy: 0, moved: false,
})

function onNodePointerDown(e: PointerEvent, step: RoadmapStep) {
  selectStep(step.id)
  drag.step = step
  drag.moved = false
  drag.sx = e.clientX; drag.sy = e.clientY
  drag.ox = step.x; drag.oy = step.y
  window.addEventListener('pointermove', onNodeMove)
  window.addEventListener('pointerup', onNodeUp, { once: true })
}

function onNodeMove(e: PointerEvent) {
  const s = drag.step
  if (!s) return
  const dx = (e.clientX - drag.sx) / view.zoom
  const dy = (e.clientY - drag.sy) / view.zoom
  if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true
  if (drag.moved) {
    s.x = Math.round(drag.ox + dx)
    s.y = Math.round(drag.oy + dy)
  }
}

async function onNodeUp() {
  window.removeEventListener('pointermove', onNodeMove)
  const s = drag.step
  drag.step = null
  if (!s || !drag.moved || !activeRoadmap.value) return
  try {
    await store.updateStep(activeRoadmap.value.id, s.id, { x: s.x, y: s.y })
  } catch (err) {
    console.error('Ошибка сохранения позиции этапа:', err)
  }
}

// ── Действия с этапами ──

const busy = ref(false)

async function toggleDone(s: RoadmapStep) {
  if (!activeRoadmap.value) return
  try {
    await store.updateStep(activeRoadmap.value.id, s.id, { done: !s.done })
  } catch (err) {
    console.error('Ошибка обновления этапа:', err)
  }
}

async function setColor(key: string | null) {
  if (!activeRoadmap.value || !selectedStep.value) return
  try {
    await store.updateStep(activeRoadmap.value.id, selectedStep.value.id, { color: key })
  } catch (err) {
    console.error('Ошибка смены цвета:', err)
  }
}

async function removeSelected() {
  if (!activeRoadmap.value || !selectedStep.value) return
  try {
    await store.deleteStep(activeRoadmap.value.id, selectedStep.value.id)
    selectedId.value = null
  } catch (err) {
    console.error('Ошибка удаления этапа:', err)
  }
}

const stepModal = reactive<{ open: boolean; label: string; parentId: string | null; editId: string | null }>({
  open: false, label: '', parentId: null, editId: null,
})

function openAddStep(parentId: string | null) {
  stepModal.open = true
  stepModal.label = ''
  stepModal.parentId = parentId
  stepModal.editId = null
}

function openEditStep() {
  if (!selectedStep.value) return
  stepModal.open = true
  stepModal.label = selectedStep.value.label
  stepModal.editId = selectedStep.value.id
}

async function submitStep() {
  if (!activeRoadmap.value || !stepModal.label.trim() || busy.value) return
  busy.value = true
  try {
    const label = stepModal.label.trim()
    if (stepModal.editId) {
      await store.renameStep(activeRoadmap.value.id, stepModal.editId, label)
    } else {
      const before = new Set(activeRoadmap.value.steps.map(s => s.id))
      const opts: { parent_step_id?: string; x?: number; y?: number } = {}
      if (stepModal.parentId) {
        opts.parent_step_id = stepModal.parentId // создаст и стрелку от родителя
      } else if (canvasEl.value) {
        // Свободный этап появляется в центре видимой области
        const c = toWorld(
          canvasEl.value.getBoundingClientRect().left + canvasEl.value.clientWidth / 2,
          canvasEl.value.getBoundingClientRect().top + canvasEl.value.clientHeight / 2,
        )
        opts.x = Math.round(c.x - NODE_W / 2)
        opts.y = Math.round(c.y - NODE_H / 2)
      }
      const updated = await store.addStep(activeRoadmap.value.id, label, opts)
      const created = updated.steps.find(s => !before.has(s.id))
      if (created) selectStep(created.id)
    }
    stepModal.open = false
  } catch (err) {
    console.error('Ошибка сохранения этапа:', err)
  } finally {
    busy.value = false
  }
}

// ── Роадмапы ──

const showNewRoadmap = ref(false)
const showRename = ref(false)
const showDeleteConfirm = ref(false)
const roadmapName = ref('')

function openNewRoadmap() { roadmapName.value = ''; showNewRoadmap.value = true }
function openRename() { roadmapName.value = activeRoadmap.value?.name ?? ''; showRename.value = true }

async function submitNewRoadmap() {
  if (!roadmapName.value.trim() || busy.value) return
  busy.value = true
  try {
    await store.createRoadmap(roadmapName.value.trim())
    showNewRoadmap.value = false
  } catch (err) {
    console.error('Ошибка создания роадмапа:', err)
  } finally {
    busy.value = false
  }
}

async function submitRename() {
  if (!activeRoadmap.value || !roadmapName.value.trim() || busy.value) return
  busy.value = true
  try {
    await store.renameRoadmap(activeRoadmap.value.id, roadmapName.value.trim())
    showRename.value = false
  } catch (err) {
    console.error('Ошибка переименования роадмапа:', err)
  } finally {
    busy.value = false
  }
}

async function submitDelete() {
  if (!activeRoadmap.value) return
  try {
    await store.deleteRoadmap(activeRoadmap.value.id)
    showDeleteConfirm.value = false
  } catch (err) {
    console.error('Ошибка удаления роадмапа:', err)
  }
}
</script>

<style scoped>
.rm-page {
  display: flex; flex-direction: column;
  width: 100%; height: 100vh; overflow: hidden;
  background: var(--bg-primary);
}
.topbar {
  background: var(--bg-card); border-bottom: 0.5px solid var(--border);
  padding: 13px 20px; display: flex; align-items: center;
  justify-content: space-between; flex-shrink: 0;
}
.page-title { font-size: 15px; font-weight: 500; color: var(--text-primary); letter-spacing: -0.2px; }
.btn-primary {
  padding: 7px 14px; border-radius: 980px; border: none;
  background: var(--accent); color: #fff; font-size: 13px; font-weight: 500; cursor: pointer;
}
.btn-primary:hover { background: var(--accent-hover); }

.rm-layout { flex: 1; display: flex; min-height: 0; }

.rm-list {
  width: 230px; flex-shrink: 0; padding: 14px 10px;
  border-right: 0.5px solid var(--border); background: var(--bg-card);
  overflow-y: auto; display: flex; flex-direction: column; gap: 4px;
}
.rm-list-empty { font-size: 12px; color: var(--text-muted); padding: 10px; }
.rm-list-item {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 9px 12px; border-radius: 10px; border: 1px solid transparent;
  background: none; cursor: pointer; text-align: left;
  color: var(--text-secondary); font-size: 13px;
}
.rm-list-item:hover { background: var(--accent-light); }
.rm-list-item.active { background: var(--accent-light); color: var(--accent); border-color: var(--accent); font-weight: 500; }
.rm-list-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rm-list-count { font-size: 11px; color: var(--text-muted); flex-shrink: 0; }

.rm-main { flex: 1; min-width: 0; display: flex; flex-direction: column; position: relative; }
.rm-empty { margin: auto; color: var(--text-muted); font-size: 14px; }

.rm-toolbar {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 10px 16px 4px; flex-shrink: 0; flex-wrap: wrap;
}
.rm-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.rm-toolbar-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.hint { font-size: 11.5px; color: var(--text-muted); padding: 0 16px 8px; }
.tb-btn {
  padding: 6px 12px; border-radius: 980px; border: 1px solid var(--border);
  background: var(--bg-card); color: var(--text-secondary); font-size: 12px; cursor: pointer;
}
.tb-btn:hover { border-color: var(--accent); color: var(--accent); }
.tb-btn.danger:hover { border-color: var(--danger); color: var(--danger); }

.canvas {
  flex: 1; position: relative; overflow: hidden; cursor: grab;
  touch-action: none; user-select: none; -webkit-user-select: none;
  margin: 0 16px 16px; border-radius: 16px;
  border: 1px solid var(--border);
  background-color: var(--bg-card);
  background-image: radial-gradient(var(--border) 1px, transparent 1px);
  background-size: 22px 22px;
}
.canvas.panning { cursor: grabbing; }
.canvas.connecting { cursor: crosshair; }
.world { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
.edges { position: absolute; left: 0; top: 0; overflow: visible; pointer-events: none; }
.edge { fill: none; stroke-width: 2.5; pointer-events: none; }
.edge.selected { stroke-width: 4; }
.edge.temp { stroke-dasharray: 6 5; }
/* Широкая невидимая «подложка», чтобы по тонкой стрелке было удобно кликать */
.edge-hit { fill: none; stroke: transparent; stroke-width: 14; pointer-events: stroke; cursor: pointer; }

.node {
  position: absolute; box-sizing: border-box;
  display: flex; align-items: center; gap: 10px; padding: 0 12px;
  background: color-mix(in srgb, var(--c) 12%, var(--bg-card));
  border: 2px solid var(--c); border-radius: 12px;
  box-shadow: 0 2px 8px rgba(26,122,232,0.08); cursor: pointer;
}
.node:hover { box-shadow: 0 2px 12px rgba(26,122,232,0.18); }
.node.selected { outline: 2px solid var(--accent); outline-offset: 2px; }
.node.target { outline: 3px solid var(--accent); outline-offset: 3px; }
.node-label {
  font-size: 13px; color: var(--text-primary); font-weight: 500; line-height: 1.25; flex: 1; min-width: 0;
  overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.node.done .node-label { color: var(--text-muted); text-decoration: line-through; }
.node-check {
  width: 20px; height: 20px; flex-shrink: 0; border-radius: 6px;
  border: 1.5px solid var(--text-muted); background: var(--bg-card);
  color: #fff; font-size: 12px; line-height: 1; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.node-check.on { background: var(--accent); border-color: var(--accent); }
.node-handle {
  position: absolute; right: -9px; top: 50%; transform: translateY(-50%);
  width: 16px; height: 16px; border-radius: 50%;
  background: var(--bg-card); border: 2px solid var(--accent); cursor: crosshair;
  opacity: 0; transition: opacity 0.12s;
}
.node:hover .node-handle, .node.selected .node-handle { opacity: 1; }
.node-handle:hover { background: var(--accent); }
.canvas-empty {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  color: var(--text-muted); font-size: 13px; pointer-events: none;
}

/* Панель под холстом, а не поверх него — не перекрывает нижние этапы */
.inspector {
  flex-shrink: 0; margin: -6px 16px 16px;
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: center;
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px;
  padding: 8px 12px;
}
.insp-name {
  font-size: 12px; font-weight: 600; color: var(--text-primary);
  max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 4px;
}
.swatches { display: flex; gap: 5px; }
.swatch {
  width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid var(--border); cursor: pointer; padding: 0;
}
.swatch.active { outline: 2px solid var(--accent); outline-offset: 1px; }

.overlay {
  position: fixed; inset: 0; background: rgba(10,30,53,0.35);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; backdrop-filter: blur(4px);
}
.mini-modal {
  background: var(--bg-card); border-radius: 20px; padding: 22px;
  width: 320px; max-width: 90vw; box-shadow: 0 20px 60px rgba(10,30,53,0.15);
}
.mini-modal h3 { font-size: 15px; font-weight: 500; color: var(--text-primary); margin-bottom: 14px; }
.confirm-text { font-size: 13px; color: var(--text-secondary); margin-bottom: 18px; margin-top: -6px; }
.mini-modal input {
  width: 100%; padding: 9px 12px; border-radius: 10px;
  border: 1px solid var(--border); font-size: 14px; color: var(--text-primary);
  outline: none; box-sizing: border-box; margin-bottom: 16px; background: var(--bg-card);
}
.mini-modal input:focus { border-color: var(--accent); }
.mini-footer { display: flex; gap: 8px; justify-content: flex-end; }
.btn-cancel {
  padding: 8px 16px; border-radius: 980px; border: 1px solid var(--border);
  background: none; font-size: 13px; color: var(--text-secondary); cursor: pointer;
}
.btn-save {
  padding: 8px 18px; border-radius: 980px; border: none;
  background: var(--accent); color: #fff; font-size: 13px; font-weight: 500; cursor: pointer;
}
.btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-danger {
  padding: 8px 18px; border-radius: 980px; border: none;
  background: var(--danger); color: #fff; font-size: 13px; font-weight: 500; cursor: pointer;
}

@media (max-width: 768px) {
  .rm-page { height: auto; min-height: 100vh; }
  .rm-layout { flex-direction: column; }
  .rm-list { width: 100%; flex-direction: row; overflow-x: auto; border-right: none; border-bottom: 0.5px solid var(--border); }
  .rm-list-item { flex-shrink: 0; }
  .canvas { height: 60vh; flex: none; }
}
</style>
