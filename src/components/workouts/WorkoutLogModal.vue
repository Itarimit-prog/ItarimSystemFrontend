<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title">{{ log ? 'Тренировка' : 'Новая тренировка' }}</span>
        <button class="modal-close" @click="$emit('close')">&times;</button>
      </div>
      <div class="modal-body" v-if="log">
        <p><b>Дата:</b> {{ log.date }}</p>
        <p><b>Длительность:</b> {{ log.duration_minutes }} мин.</p>
        <p v-if="log.notes"><b>Заметки:</b> {{ log.notes }}</p>
        <div v-if="log.exercises.length">
          <b>Упражнения:</b>
          <ul style="margin-top:6px; padding-left:16px">
            <li v-for="exId in log.exercises" :key="exId" style="font-size:13px; color:#0A1E35">
              {{ exId }}
            </li>
          </ul>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WorkoutLog } from '@/types/workouts'

defineProps<{
  log: WorkoutLog | null
}>()

defineEmits<{
  (e: 'close'): void
}>()
</script>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;
  z-index: 1000; backdrop-filter: blur(4px);
}
.modal { background: var(--bg-card); border-radius: 16px; width: 90%; max-width: 400px; }
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 0.5px solid var(--border);
}
.modal-title { font-size: 15px; font-weight: 500; color: var(--text-primary); }
.modal-close { border: none; background: none; font-size: 24px; color: var(--text-muted); cursor: pointer; }
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 10px; font-size: 13px; color: var(--text-secondary); }
.modal-footer {
  display: flex; gap: 8px; justify-content: flex-end; padding: 16px 20px;
  border-top: 0.5px solid var(--border);
}
.btn {
  padding: 8px 16px; border-radius: 10px; border: none; cursor: pointer; font-size: 14px; font-weight: 500;
}
.btn-secondary { background: var(--bg-primary); color: var(--text-secondary); }
.btn-secondary:hover { background: var(--accent-light); }
</style>
