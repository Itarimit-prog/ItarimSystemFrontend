<template>
  <div class="planner">
    <div class="left-panel">
      <div class="day-header">
        <div>
          <div class="day-title">{{ dayLabel }}</div>
          <div class="day-sub">{{ stats.total }} задач · {{ totalHours }} ч запланировано</div>
        </div>
        <div class="btn-row">
          <button class="btn-ghost" @click="showTemplateModal = true">⊞ Шаблон</button>
          <button class="btn-primary" @click="openCreate" :disabled="isSaving">+ Задача</button>
        </div>
      </div>

      <div class="stats-pills">
        <span class="pill"><b>{{ stats.done }}</b> выполнено</span>
        <span class="pill"><b>{{ stats.pending }}</b> в ожидании</span>
        <span class="pill"><b>{{ stats.todo }}</b> не выполнено</span>
      </div>

      <div v-if="loading" class="empty-state">Загружаем...</div>
      <div v-else-if="sortedTasks.length === 0" class="empty-state">
        Нет задач на этот день.<br>
        <span class="empty-hint">Нажми «+ Задача» или примени шаблон</span>
      </div>

      <TaskCard
        v-for="task in sortedTasks"
        :key="task.id"
        :task="task"
        @edit="openEdit"
        @delete="deleteTask"
      />
    </div>

    <div class="right-panel">
      <MiniCalendar />

      <!-- Дедлайны из канбана -->
      <div v-if="urgentDeadlines.length > 0" class="deadlines-block">
        <div class="deadlines-header">
          <span class="fire">🔥</span>
          <span class="deadlines-title">Дедлайны горят</span>
          <span class="deadlines-count">{{ urgentDeadlines.length }}</span>
        </div>
        <div v-for="item in urgentDeadlines" :key="item.id" class="deadline-item">
          <div class="deadline-left">
            <div class="deadline-name">{{ item.title }}</div>
            <div class="deadline-meta">{{ item.boardName }}</div>
          </div>
          <div class="deadline-date" :class="item.urgency">
            {{ item.label }}
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="section-label">Шаблоны</div>
      <div v-if="templates.length === 0" class="no-templates">Нет шаблонов</div>
      <div v-for="tpl in templates" :key="tpl.id" class="tpl-item">
        <div class="tpl-dot"></div>
        <span class="tpl-name">{{ tpl.name }}</span>
        <button class="tpl-apply-btn" @click="applyTemplate(tpl.id)">Применить</button>
        <button class="tpl-del-btn" @click="deleteTemplate(tpl.id)">×</button>
      </div>
    </div>

    <TaskModal
      v-if="showTaskModal"
      :task="editingTask"
      :date="selectedDate"
      @close="showTaskModal = false"
      @saving="isSaving = $event"
      @saved="onTaskSaved"
    />

    <Teleport to="body" v-if="showTemplateModal">
      <div class="overlay" @click.self="showTemplateModal = false">
        <div class="tpl-modal">
          <h3>Сохранить как шаблон</h3>
          <p class="tpl-hint">{{ sortedTasks.length }} задач будет сохранено</p>
          <input v-model="templateName" placeholder="Название (напр. Понедельник)" @keyup.enter="saveTemplate" />
          <div class="tpl-modal-footer">
            <button class="btn-cancel" @click="showTemplateModal = false">Отмена</button>
            <button class="btn-save" @click="saveTemplate" :disabled="!templateName || isSavingTemplate">
              {{ isSavingTemplate ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePlannerStore } from '@/stores/planner'
import { useKanbanStore } from '@/stores/kanban'
import MiniCalendar from '@/components/calendar/MiniCalendar.vue'
import TaskCard from '@/components/tasks/TaskCard.vue'
import TaskModal from '@/components/tasks/TaskModal.vue'
import type { Task } from '@/types'

const store = usePlannerStore()
const kanbanStore = useKanbanStore()
const { sortedTasks, stats, selectedDate, loading, templates } = storeToRefs(store)
const { boards, cards, columns } = storeToRefs(kanbanStore)

const showTaskModal = ref(false)
const showTemplateModal = ref(false)
const editingTask = ref<Task | null>(null)
const templateName = ref('')
const isSaving = ref(false)
const isSavingTemplate = ref(false)

function onTaskSaved() {
  showTaskModal.value = false
  isSaving.value = false
}

const dayLabel = computed(() => {
  const date = new Date(selectedDate.value + 'T00:00')
  return date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
    .replace(/^./, s => s.toUpperCase())
})

const totalHours = computed(() => {
  let total = 0
  for (const t of sortedTasks.value) {
    const [sh, sm] = t.time_start.split(':').map(Number)
    const [eh, em] = t.time_end.split(':').map(Number)
    total += (eh * 60 + em) - (sh * 60 + sm)
  }
  return Math.round(total / 60 * 10) / 10
})

const endOfWeek = computed(() => {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 0 : 7 - day
  const end = new Date(now)
  end.setDate(now.getDate() + diff)
  end.setHours(23, 59, 59, 0)
  return end
})

const urgentDeadlines = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const result: { id: string; title: string; boardName: string; deadline: Date; label: string; urgency: string }[] = []

  for (const [colId, colCards] of Object.entries(cards.value)) {
    const col = columns.value.find(c => c.id === colId)
    if (col?.is_completed_column) continue
    for (const card of colCards) {
      if (!card.deadline) continue
      const d = new Date(card.deadline + 'T00:00')
      if (d > endOfWeek.value) continue

      const col = columns.value.find(c => c.id === colId)
      const board = col ? boards.value.find(b => b.id === col.board_id) : null

      const diffDays = Math.floor((d.getTime() - today.getTime()) / 86400000)
      let label = ''
      let urgency = 'soon'
      if (diffDays < 0) { label = 'Просрочено'; urgency = 'overdue' }
      else if (diffDays === 0) { label = 'Сегодня'; urgency = 'today' }
      else if (diffDays === 1) { label = 'Завтра'; urgency = 'tomorrow' }
      else { label = `${diffDays} дн.`; urgency = 'soon' }

      result.push({
        id: card.id,
        title: card.title,
        boardName: board?.name ?? 'Канбан',
        deadline: d,
        label,
        urgency,
      })
    }
  }
  return result.sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
})

function openCreate() { 
  editingTask.value = null
  isSaving.value = false
  showTaskModal.value = true 
}
function openEdit(task: Task) { 
  editingTask.value = task
  isSaving.value = false
  showTaskModal.value = true 
}
async function deleteTask(id: string) { await store.deleteTask(id) }
async function saveTemplate() {
  if (!templateName.value || isSavingTemplate.value) return
  isSavingTemplate.value = true
  try {
    await store.saveAsTemplate(templateName.value)
    templateName.value = ''
    showTemplateModal.value = false
  } catch (err) {
    console.error('Ошибка сохранения шаблона:', err)
  } finally {
    isSavingTemplate.value = false
  }
}
async function applyTemplate(id: string) { await store.applyTemplate(id) }
async function deleteTemplate(id: string) { await store.deleteTemplate(id) }
</script>

<style scoped>
.planner {
  display: grid;
  grid-template-columns: 1fr 300px;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-primary);
}

.left-panel {
  padding: 28px 24px;
  overflow-y: auto;
  height: 100vh;
}

.right-panel {
  background: var(--bg-card);
  border-left: 0.5px solid var(--border);
  padding: 20px 18px;
  overflow-y: auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.day-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 16px;
}
.day-title { font-size: 22px; font-weight: 500; color: var(--text-primary); letter-spacing: -0.4px; }
.day-sub { font-size: 13px; color: var(--text-secondary); margin-top: 3px; }

.btn-row { display: flex; gap: 8px; flex-shrink: 0; }
.btn-primary {
  padding: 7px 14px; border-radius: 980px; border: none;
  background: var(--accent); color: #fff; font-size: 13px; font-weight: 500; cursor: pointer;
}
.btn-primary:hover { background: var(--accent-hover); }
.btn-ghost {
  padding: 7px 14px; border-radius: 980px;
  border: 0.5px solid var(--text-muted); background: var(--accent-light);
  color: var(--accent); font-size: 13px; font-weight: 500; cursor: pointer;
}
.btn-ghost:hover { filter: brightness(0.94); }

.stats-pills { display: flex; gap: 6px; margin-bottom: 20px; flex-wrap: wrap; }
.pill {
  font-size: 12px; padding: 4px 11px; border-radius: 980px;
  background: var(--accent-light); color: var(--accent);
}
.pill b { color: var(--text-primary); }

.empty-state {
  text-align: center; color: var(--text-muted); font-size: 14px;
  padding: 40px 0; line-height: 1.6;
}
.empty-hint { font-size: 12px; color: var(--text-muted); }

.deadlines-block {
  margin-top: 14px;
  background: var(--bg-card);
  border: 0.5px solid #FDDCB0;
  border-radius: 14px;
  padding: 12px;
  flex-shrink: 0;
}
.deadlines-header {
  display: flex; align-items: center; gap: 6px; margin-bottom: 10px;
}
.fire { font-size: 15px; }
.deadlines-title {
  font-size: 12px; font-weight: 600; color: #B45309;
  text-transform: uppercase; letter-spacing: 0.05em; flex: 1;
}
.deadlines-count {
  font-size: 11px; background: #FDE68A; color: #92400E;
  padding: 1px 7px; border-radius: 980px; font-weight: 500;
}

.deadline-item {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px; padding: 6px 0;
  border-top: 0.5px solid #FDDCB0;
}
.deadline-left { flex: 1; min-width: 0; }
.deadline-name {
  font-size: 12px; font-weight: 500; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.deadline-meta { font-size: 11px; color: var(--text-muted); margin-top: 1px; }

.deadline-date {
  font-size: 11px; font-weight: 500; padding: 2px 8px;
  border-radius: 980px; white-space: nowrap; flex-shrink: 0;
}
.deadline-date.overdue { background: var(--danger-light); color: var(--danger); }
.deadline-date.today   { background: #FDE68A; color: #92400E; }
.deadline-date.tomorrow{ background: #FEF0D4; color: #B45309; }
.deadline-date.soon    { background: var(--accent-light); color: #2B6CB0; }

.divider { border: none; border-top: 0.5px solid var(--border); margin: 14px 0; flex-shrink: 0; }
.section-label {
  font-size: 11px; font-weight: 500; color: var(--text-secondary);
  text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;
}
.no-templates { font-size: 12px; color: var(--text-muted); padding: 8px 0; }

.tpl-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: 12px; margin-bottom: 3px;
  min-width: 0;
}
.tpl-item:hover { background: var(--accent-light); }
.tpl-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
.tpl-name { 
  flex: 1; font-size: 13px; color: var(--text-primary); 
  min-width: 0; 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis;
}
.tpl-apply-btn {
  font-size: 11px; color: var(--accent); background: none;
  border: none; cursor: pointer; opacity: 0; padding: 2px 6px; border-radius: 6px;
  flex-shrink: 0;
  white-space: nowrap;
}
.tpl-item:hover .tpl-apply-btn { opacity: 1; }
.tpl-apply-btn:hover { background: var(--accent-light); filter: brightness(0.94); }
.tpl-del-btn {
  font-size: 16px; color: var(--text-muted); background: none;
  border: none; cursor: pointer; opacity: 0; line-height: 1;
  flex-shrink: 0;
}
.tpl-item:hover .tpl-del-btn { opacity: 1; }
.tpl-del-btn:hover { color: var(--danger); }

/* ── Mobile ── */
@media (max-width: 768px) {
  .planner {
    grid-template-columns: 1fr;
    height: auto;
    overflow-y: auto;
  }
  .left-panel {
    padding: 16px;
    height: auto;
    overflow: visible;
  }
  .right-panel {
    height: auto;
    overflow: visible;
    border-left: none;
    border-top: 0.5px solid var(--border);
    padding: 16px;
  }
  .day-header {
    flex-wrap: wrap;
    gap: 10px;
  }
  .day-title { font-size: 18px; }
  .tpl-apply-btn,
  .tpl-del-btn {
    opacity: 1;
  }
  .tpl-item:hover .tpl-apply-btn,
  .tpl-item:hover .tpl-del-btn {
    opacity: 1;
  }
}

.overlay {
  position: fixed; inset: 0; background: rgba(10,30,53,0.35);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; backdrop-filter: blur(4px);
}
.tpl-modal {
  background: var(--bg-card); border-radius: 20px; padding: 24px;
  width: 340px; box-shadow: 0 20px 60px rgba(10,30,53,0.15);
}
.tpl-modal h3 { font-size: 16px; font-weight: 500; color: var(--text-primary); margin-bottom: 6px; }
.tpl-hint { font-size: 12px; color: var(--text-muted); margin-bottom: 14px; }
.tpl-modal input {
  width: 100%; padding: 9px 12px; border-radius: 10px;
  border: 1px solid var(--border); font-size: 14px; color: var(--text-primary);
  outline: none; box-sizing: border-box; margin-bottom: 16px;
  background: var(--bg-card);
}
.tpl-modal input:focus { border-color: var(--accent); }
.tpl-modal-footer { display: flex; gap: 8px; justify-content: flex-end; }
.btn-cancel {
  padding: 9px 18px; border-radius: 980px; border: 1px solid var(--border);
  background: none; font-size: 13px; color: var(--text-secondary); cursor: pointer;
}
.btn-save {
  padding: 9px 20px; border-radius: 980px; border: none;
  background: var(--accent); color: #fff; font-size: 13px; font-weight: 500; cursor: pointer;
}
.btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
