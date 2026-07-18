<template>
  <div class="card" @mousedown="onMouseDown" @touchstart="onMouseDown">
    <div class="card-top">
      <span class="card-name">{{ card.title }}</span>
      <div class="card-actions">
        <button class="action-btn" @click.stop="$emit('edit', card)" title="Редактировать">
          <IconPencil size="13" stroke="1.5" />
        </button>
        <button class="action-btn delete" @click.stop="$emit('delete', card.id)" title="Удалить">
          <IconTrash size="13" stroke="1.5" />
        </button>
      </div>
    </div>
    <div v-if="card.deadline" class="card-deadline" :class="{ overdue: isOverdue }">
      <IconCalendar size="11" stroke="1.5" />
      {{ formattedDeadline }}
      <span v-if="isOverdue"> — просрочено</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IconPencil, IconTrash, IconCalendar } from '@tabler/icons-vue'
import type { KanbanCard } from '@/types/kanban'

const props = defineProps<{ card: KanbanCard }>()
const emit = defineEmits<{
  edit: [card: KanbanCard]
  delete: [id: string]
  dragstart: [card: KanbanCard, event: MouseEvent]
}>()

const isOverdue = computed(() => {
  if (!props.card.deadline) return false
  const deadline = new Date(props.card.deadline + 'T00:00')
  const today = new Date(new Date().toISOString().split('T')[0] + 'T00:00')
  return deadline < today
})

const formattedDeadline = computed(() => {
  if (!props.card.deadline) return ''
  return new Date(props.card.deadline + 'T00:00').toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long'
  })
})

function onMouseDown(e: MouseEvent | TouchEvent) {
  if ('button' in e && e.button !== 0) return
  // Предотвращаем drag при клике по кнопкам действий
  const target = e.target as HTMLElement
  if (target.closest('.card-actions') || target.closest('.action-btn')) return
  // Предотвращаем выделение текста и запускаем drag
  if ('preventDefault' in e) e.preventDefault()
  emit('dragstart', props.card, e as any)
}
</script>

<style scoped>
.card {
  background: var(--bg-card);
  border: 0.5px solid var(--border);
  border-radius: 11px;
  padding: 9px 11px;
  cursor: grab;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  user-select: none;
}
.card:hover {
  border-color: var(--accent);
  background: var(--accent-light);
  box-shadow: 0 2px 8px rgba(26, 122, 232, 0.08);
}
.card:active { cursor: grabbing; }
.card.dragging {
  opacity: 0.4;
  border: 2px dashed var(--accent);
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
}
.card-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  letter-spacing: -0.1px;
  line-height: 1.35;
  flex: 1;
}
.card-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}
.card:hover .card-actions { opacity: 1; }

.action-btn {
  width: 24px; height: 24px;
  border-radius: 7px;
  border: none;
  background: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px;
}
.action-btn:hover { background: var(--accent-light); color: var(--accent); }
.action-btn.delete:hover { background: var(--danger-light); color: var(--danger); }

.card-deadline {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 6px;
}
.card-deadline.overdue { color: var(--danger); }
</style>
