<template>
  <div class="task-row">
    <div class="time-col">
      <span class="time-lbl">{{ task.time_start }}</span>
      <div class="time-line"></div>
    </div>
    <div class="task-card" :style="cardStyle" @click="$emit('edit', task)">
      <div class="card-top">
        <span class="card-name" :style="{ color: meta.color }">{{ task.title }}</span>
        <button class="delete-btn" @click.stop="$emit('delete', task.id)">×</button>
      </div>
      <div class="card-meta">
        <span class="time-range">{{ task.time_start }} – {{ task.time_end }}</span>
        <span class="badge" :style="{ background: meta.badgeBg, color: meta.badgeText }">
          {{ meta.label }}
        </span>
        <span class="status-pill" :style="{ background: statusMeta.bg, color: statusMeta.color }"
          @click.stop="cycleStatus">
          {{ statusMeta.label }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Task, TaskStatus } from '@/types'
import { TASK_TYPE_META, STATUS_META } from '@/types'
import { usePlannerStore } from '@/stores/planner'

const props = defineProps<{ task: Task }>()
const emit = defineEmits<{ edit: [task: Task]; delete: [id: string] }>()
const store = usePlannerStore()

const meta = computed(() => TASK_TYPE_META[props.task.task_type])
const statusMeta = computed(() => STATUS_META[props.task.status])

const cardStyle = computed(() => ({
  background: meta.value.bg,
  borderLeftColor: meta.value.border,
}))

const statusCycle: TaskStatus[] = ['todo', 'pending', 'done']
function cycleStatus() {
  const idx = statusCycle.indexOf(props.task.status)
  const next = statusCycle[(idx + 1) % statusCycle.length]
  store.updateTaskStatus(props.task.id, next)
}
</script>

<style scoped>
.task-row { display: flex; gap: 10px; align-items: stretch; margin-bottom: 10px; }

.time-col {
  display: flex; flex-direction: column; align-items: flex-end;
  padding-top: 11px; min-width: 42px;
}
.time-lbl { font-size: 11px; color: var(--text-muted); font-weight: 500; }
.time-line { width: 1px; background: var(--border); flex: 1; margin: 4px 4px 0 auto; }

.task-card {
  flex: 1; border-radius: 0 14px 14px 0;
  padding: 10px 13px; cursor: pointer;
  border-left: 3.5px solid transparent;
  transition: opacity 0.15s;
}
.task-card:hover { opacity: 0.85; }

.card-top { display: flex; align-items: center; justify-content: space-between; }
.card-name { font-size: 14px; font-weight: 500; letter-spacing: -0.2px; }

.delete-btn {
  background: none; border: none; color: #aaa;
  font-size: 18px; cursor: pointer; padding: 0 2px; line-height: 1;
  opacity: 0; transition: opacity 0.15s;
}
.task-card:hover .delete-btn { opacity: 1; }
.delete-btn:hover { color: var(--danger); }

.card-meta { display: flex; align-items: center; gap: 6px; margin-top: 5px; flex-wrap: wrap; }
.time-range { font-size: 11px; color: var(--text-muted); }

.badge {
  font-size: 10px; padding: 2px 8px;
  border-radius: 980px; font-weight: 500;
}
.status-pill {
  font-size: 10px; padding: 2px 8px;
  border-radius: 980px; cursor: pointer;
  transition: opacity 0.15s;
}
.status-pill:hover { opacity: 0.75; }
</style>
