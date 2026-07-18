<template>
  <div class="column" :data-column-id="column.id" :class="{ 'drop-active': isDropTarget }">
    <div class="col-header">
      <div class="col-dot" :style="{ background: column.color }"></div>

      <span v-if="!editingTitle" class="col-title" @dblclick="startEdit">
        {{ column.title }}
        <span v-if="localDone" class="done-badge">✓</span>
      </span>
      <input v-else ref="titleInput" v-model="titleDraft"
        class="col-title-input"
        @blur="saveTitle"
        @keyup.enter="saveTitle"
        @keyup.escape="editingTitle = false"
      />

      <span class="col-count">{{ cards.length }}</span>

      <button class="col-menu" @click="showSettings = true">⋯</button>
    </div>

    <div class="col-cards">
      <template v-for="(card, index) in cards" :key="card.id">
        <div v-if="isDropTarget && dropIndex === index" class="drop-indicator"></div>
        <KanbanCard
          :card="card"
          @edit="$emit('edit-card', $event)"
          @delete="$emit('delete-card', $event, column.id)"
          @dragstart="(card, event) => $emit('drag-start', card, event, column.id)"
        />
      </template>
      <div v-if="isDropTarget && dropIndex === cards.length" class="drop-indicator"></div>
      <div v-if="cards.length === 0 && !isDropTarget" class="drop-placeholder">
        Перетащите сюда
      </div>
    </div>

    <div class="col-footer">
      <button v-if="!addingCard" class="add-card-btn" @click="addingCard = true">
        + Добавить карточку
      </button>
      <div v-else class="add-card-form">
        <input
          ref="cardInput"
          v-model="newCardTitle"
          placeholder="Название задачи..."
          @keyup.enter="submitCard"
          @keyup.escape="addingCard = false"
        />
        <DatePicker v-model="newCardDeadline" />
        <div class="form-actions">
          <button class="btn-add" @click="submitCard" :disabled="!newCardTitle">Добавить</button>
          <button class="btn-cancel" @click="addingCard = false">Отмена</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Модальное окно настроек колонки -->
  <Teleport to="body" v-if="showSettings">
    <div class="overlay" @click.self="showSettings = false">
      <div class="settings-modal">
        <h3>{{ column.title }}</h3>

        <div class="settings-row" @click="startEdit(); showSettings = false">
          <span>✏️</span>
          <span>Переименовать</span>
        </div>

        <div class="settings-divider"></div>

        <div class="settings-row" @click="showColorPicker = !showColorPicker">
          <span>🎨</span>
          <span>Цвет</span>
        </div>

        <div v-if="showColorPicker" class="color-picker-inline">
          <button v-for="c in COLORS" :key="c"
            class="color-swatch"
            :style="{ background: c }"
            :class="{ active: column.color === c }"
            @click="pickColor(c); showSettings = false"
          ></button>
        </div>

        <div class="settings-divider"></div>

        <label class="settings-row check-row">
          <input
            type="checkbox"
            v-model="localDone"
            @change="onCheckChange"
          />
          <span>Завершающая</span>
        </label>

        <div class="settings-divider"></div>

        <div class="settings-row danger" @click="$emit('delete', column.id); showSettings = false">
          <span>🗑</span>
          <span>Удалить колонку</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, computed } from 'vue'
import type { KanbanColumn, KanbanCard as KanbanCardType } from '@/types/kanban'
import KanbanCard from './KanbanCard.vue'
import DatePicker from './DatePicker.vue'

const COLORS = ['#7AADD4','#1A7AE8','#EF9F27','#5A9C1A','#E24B4A','#9B59B6','#16A085','#E67E22']

const props = defineProps<{
  column: KanbanColumn
  cards: KanbanCardType[]
  dropTarget?: string | null
  dropIndex?: number | null
}>()

const isDropTarget = computed(() => props.dropTarget === props.column.id)

const emit = defineEmits<{
  'delete': [id: string]
  'update': [id: string, payload: Partial<KanbanColumn>]
  'add-card': [columnId: string, title: string, deadline?: string]
  'edit-card': [card: KanbanCardType]
  'delete-card': [cardId: string, columnId: string]
  'drag-start': [card: KanbanCardType, event: MouseEvent, columnId: string]
}>()

// ЛОКАЛЬНОЕ реактивное состояние — Vue 100% увидит изменение
const localDone = ref(props.column.is_completed_column ?? false)

// Синхронизация с пропсами (если данные обновились извне)
watch(() => props.column.is_completed_column, (v) => {
  localDone.value = v ?? false
})

const editingTitle = ref(false)
const titleDraft = ref(props.column.title)
const titleInput = ref<HTMLInputElement>()
const showSettings = ref(false)
const showColorPicker = ref(false)
const addingCard = ref(false)
const newCardTitle = ref('')
const newCardDeadline = ref('')
const cardInput = ref<HTMLInputElement>()

watch(addingCard, async (val) => {
  if (val) { await nextTick(); cardInput.value?.focus() }
})

function startEdit() {
  titleDraft.value = props.column.title
  editingTitle.value = true
  nextTick(() => titleInput.value?.focus())
}

function saveTitle() {
  if (titleDraft.value.trim() && titleDraft.value !== props.column.title) {
    emit('update', props.column.id, { title: titleDraft.value.trim() })
  }
  editingTitle.value = false
}

function pickColor(color: string) {
  emit('update', props.column.id, { color })
  showColorPicker.value = false
}

function onCheckChange() {
  emit('update', props.column.id, {
    is_completed_column: localDone.value
  })
}

function submitCard() {
  if (!newCardTitle.value.trim()) return
  emit('add-card', props.column.id, newCardTitle.value.trim(), newCardDeadline.value || undefined)
  newCardTitle.value = ''
  newCardDeadline.value = ''
  addingCard.value = false
}
</script>

<style scoped>
.column {
  background: var(--bg-card);
  border-radius: 16px;
  border: 0.5px solid var(--border);
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.column.drop-active {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(26,122,232,0.15);
  background: var(--bg-primary);
}

.col-header {
  padding: 11px 12px 9px;
  display: flex; align-items: center; gap: 7px;
  border-bottom: 0.5px solid var(--accent-light);
}
.col-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.col-title { font-size: 13px; font-weight: 500; color: var(--text-primary); flex: 1; cursor: text; display: flex; align-items: center; gap: 6px; }
.done-badge {
  font-size: 10px; font-weight: 600; color: #fff;
  background: var(--success); padding: 1px 5px; border-radius: 980px;
  line-height: 1;
}
.col-title-input {
  flex: 1; font-size: 13px; font-weight: 500; color: var(--text-primary);
  border: none; outline: none; background: var(--accent-light);
  border-radius: 6px; padding: 2px 5px;
}
.col-count {
  font-size: 11px; color: var(--text-muted);
  background: var(--accent-light); padding: 1px 7px; border-radius: 980px;
}

.col-menu {
  color: var(--border); font-size: 18px; cursor: pointer;
  background: none; border: none; padding: 2px 4px;
  border-radius: 6px; line-height: 1; letter-spacing: 1px;
}
.col-menu:hover { color: var(--accent); background: var(--accent-light); }

.col-cards {
  padding: 8px; display: flex; flex-direction: column;
  gap: 6px; min-height: 60px; flex: 1;
}
.drop-indicator {
  height: 3px;
  background: var(--accent);
  border-radius: 2px;
  margin: 2px 0;
  animation: pulse 0.6s ease-in-out infinite alternate;
}

@keyframes pulse {
  from { opacity: 0.4; transform: scaleX(0.6); }
  to { opacity: 1; transform: scaleX(1); }
}

.drop-placeholder {
  border: 1.5px dashed var(--accent); border-radius: 11px;
  padding: 12px; text-align: center;
  font-size: 12px; color: var(--text-muted);
}

.col-footer { padding: 6px 8px 8px; }
.add-card-btn {
  display: flex; align-items: center; gap: 6px;
  width: 100%; padding: 7px 10px;
  border-radius: 9px; border: 0.5px dashed var(--border);
  background: transparent; color: var(--text-muted);
  font-size: 12px; cursor: pointer; transition: all 0.15s;
}
.add-card-btn:hover {
  background: var(--accent-light); border-color: var(--accent);
  color: var(--accent); border-style: solid;
}

.add-card-form { display: flex; flex-direction: column; gap: 6px; }
.add-card-form input {
  width: 100%; padding: 7px 10px;
  border-radius: 9px; border: 0.5px solid var(--border);
  font-size: 13px; color: var(--text-primary); outline: none; box-sizing: border-box;
  background: var(--bg-card);
}
.add-card-form input:focus { border-color: var(--accent); }

.form-actions { display: flex; gap: 6px; }
.btn-add {
  flex: 1; padding: 6px; border-radius: 8px;
  border: none; background: var(--accent); color: #fff;
  font-size: 12px; font-weight: 500; cursor: pointer;
}
.btn-add:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-cancel {
  padding: 6px 10px; border-radius: 8px;
  border: 0.5px solid var(--border); background: none;
  font-size: 12px; color: var(--text-secondary); cursor: pointer;
}

/* Модальное окно настроек */
.overlay {
  position: fixed; inset: 0; background: rgba(10,30,53,0.35);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; backdrop-filter: blur(4px);
}
.settings-modal {
  background: var(--bg-card); border-radius: 20px; padding: 22px;
  width: 260px; box-shadow: 0 20px 60px rgba(10,30,53,0.15);
}
.settings-modal h3 {
  font-size: 15px; font-weight: 500; color: var(--text-primary);
  margin-bottom: 14px;
}
.settings-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 0;
  font-size: 13px; color: var(--text-primary);
  cursor: pointer;
  transition: color 0.15s;
}
.settings-row:hover { color: var(--accent); }
.settings-row.danger { color: var(--danger); }
.settings-row.danger:hover { color: #C0392B; }

.check-row {
  cursor: pointer;
  display: flex; align-items: center; gap: 10px;
}
.check-row input[type="checkbox"] {
  width: 16px; height: 16px;
  accent-color: var(--success);
  cursor: pointer;
}

.settings-divider {
  border: none; border-top: 0.5px solid var(--accent-light);
  margin: 2px 0;
}

.color-picker-inline {
  display: flex; gap: 6px; padding: 8px 0;
  flex-wrap: wrap;
}
.color-swatch {
  width: 20px; height: 20px; border-radius: 50%;
  border: 2px solid transparent; cursor: pointer; transition: transform 0.1s;
}
.color-swatch:hover { transform: scale(1.2); }
.color-swatch.active { border-color: var(--text-primary); }
</style>
