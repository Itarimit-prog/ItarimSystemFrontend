<template>
  <Teleport to="body">
    <div class="overlay" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ isEdit ? 'Редактировать задачу' : 'Новая задача' }}</h3>
          <button class="close-btn" @click="$emit('close')">×</button>
        </div>

        <div class="field">
          <label>Название</label>
          <input v-model="form.title" placeholder="Название задачи" />
        </div>

        <div class="field">
          <label>Тип</label>
          <div class="type-grid">
            <button v-for="(meta, key) in TASK_TYPE_META" :key="key"
              class="type-btn"
              :class="{ active: form.task_type === key }"
              :style="form.task_type === key ? { background: meta.bg, borderColor: meta.border, color: meta.color } : {}"
              @click="form.task_type = key as TaskType"
            >
              {{ meta.label }}
            </button>
          </div>
        </div>

        <div class="field" v-if="form.task_type === 'workout'">
          <label>Какая тренировка</label>
          <select v-model="form.routine_id" class="routine-select">
            <option value="" disabled>Выберите тренировку</option>
            <option v-for="r in routines" :key="r.id" :value="r.id">{{ r.icon }} {{ r.name }}</option>
          </select>
          <div v-if="routines.length === 0" class="routine-hint">Нет ни одной тренировки — создайте в модуле «Тренировки»</div>
        </div>

        <div class="field" v-if="settings.plannerMode === 'mixed'">
          <div class="mode-toggle">
            <button
              class="mode-toggle-btn" :class="{ active: entryMode === 'fixed' }"
              @click="entryMode = 'fixed'"
            >Точное время</button>
            <button
              class="mode-toggle-btn" :class="{ active: entryMode === 'duration' }"
              @click="entryMode = 'duration'"
            >Длительность</button>
          </div>
        </div>

        <div class="field-row" v-if="effectiveMode === 'fixed'">
          <div class="field">
            <label>Начало</label>
            <TimeSelect v-model="form.time_start" />
          </div>
          <div class="field">
            <label>Конец</label>
            <TimeSelect v-model="form.time_end" />
          </div>
        </div>

        <div class="field" v-else>
          <label>Длительность</label>
          <div class="duration-row">
            <button
              v-for="p in durationPresets" :key="p"
              class="duration-chip" :class="{ active: form.duration_minutes === p }"
              @click="form.duration_minutes = p"
            >{{ formatDuration(p) }}</button>
          </div>
          <input
            type="number" min="5" step="5"
            v-model.number="form.duration_minutes"
            class="duration-input" placeholder="Минут"
          />
        </div>

        <div class="field">
          <label>Статус</label>
          <div class="status-row">
            <button v-for="(meta, key) in STATUS_META" :key="key"
              class="status-btn"
              :class="{ active: form.status === key }"
              :style="form.status === key ? { background: meta.bg, color: meta.color } : {}"
              @click="form.status = key as TaskStatus"
            >
              {{ meta.label }}
            </button>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="$emit('close')">Отмена</button>
          <button 
            class="btn-save" 
            @click="save($event)" 
            :disabled="!form.title || isSaving"
          >
            {{ isSaving ? 'Сохранение...' : (isEdit ? 'Сохранить' : 'Добавить') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import type { Task, TaskType, TaskStatus } from '@/types'
import { TASK_TYPE_META, STATUS_META } from '@/types'
import { usePlannerStore } from '@/stores/planner'
import { useWorkoutsStore } from '@/stores/workouts'
import { useSettingsStore } from '@/stores/settings'
import TimeSelect from '@/components/shared/TimeSelect.vue'

const props = defineProps<{ task?: Task | null; date: string }>()
const emit = defineEmits<{ close: []; saved: []; saving: [boolean] }>()
const store = usePlannerStore()
const { routines } = storeToRefs(useWorkoutsStore())
const settings = useSettingsStore()

const isEdit = computed(() => !!props.task)
const isSaving = ref(false)

const durationPresets = [30, 60, 90, 120]
function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} мин`
  if (m === 0) return `${h} ч`
  return `${h} ч ${m} мин`
}

const entryMode = ref<'fixed' | 'duration'>(props.task?.duration_minutes != null ? 'duration' : 'fixed')
const effectiveMode = computed(() => {
  if (settings.plannerMode === 'full') return 'fixed'
  if (settings.plannerMode === 'free') return 'duration'
  return entryMode.value
})

const form = reactive({
  title: props.task?.title ?? '',
  task_type: (props.task?.task_type ?? 'routine') as TaskType,
  status: (props.task?.status ?? 'todo') as TaskStatus,
  time_start: props.task?.time_start ?? '09:00',
  time_end: props.task?.time_end ?? '10:00',
  duration_minutes: props.task?.duration_minutes ?? 60,
  routine_id: props.task?.routine_id ?? '',
})

// Если сменили тип на "Тренировка" и роутин ещё не выбран — подставляем первый доступный
watch(() => form.task_type, (type) => {
  if (type === 'workout' && !form.routine_id && routines.value.length > 0) {
    form.routine_id = routines.value[0].id
  }
})

async function save(event: MouseEvent) {
  if (isSaving.value || !form.title) {
    event.preventDefault()
    event.stopPropagation()
    return
  }
  
  isSaving.value = true
  emit('saving', true)

  const payload: Partial<Task> = {
    ...form,
    routine_id: form.task_type === 'workout' ? (form.routine_id || undefined) : undefined,
  }

  if (effectiveMode.value === 'duration') {
    payload.time_start = null
    payload.time_end = null
    payload.duration_minutes = form.duration_minutes || 30
  } else {
    payload.duration_minutes = null
    payload.order_index = null
  }

  try {
    if (isEdit.value && props.task) {
      await store.updateTask(props.task.id, payload)
    } else {
      await store.createTask({ ...payload, date: props.date } as Omit<Task, 'id'>)
    }
    emit('saved')
  } catch (e) {
    console.error('Ошибка сохранения задачи:', e)
  } finally {
    isSaving.value = false
    emit('saving', false)
  }
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0; background: rgba(10, 30, 53, 0.35);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; backdrop-filter: blur(4px);
}
.modal {
  background: var(--bg-card); border-radius: 20px; padding: 24px;
  width: 400px; max-width: 95vw;
  box-shadow: 0 20px 60px rgba(10, 30, 53, 0.15);
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px;
}
.modal-header h3 { font-size: 16px; font-weight: 500; color: var(--text-primary); }
.close-btn {
  background: none; border: none; font-size: 22px;
  color: #aaa; cursor: pointer; line-height: 1;
}
.close-btn:hover { color: var(--text-primary); }

.field { margin-bottom: 14px; }
.field label { display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; font-weight: 500; }
.field input {
  width: 100%; padding: 9px 12px; border-radius: 10px;
  border: 1px solid var(--border); font-size: 14px; color: var(--text-primary);
  background: var(--bg-card);
  outline: none; transition: border-color 0.15s;
  box-sizing: border-box;
}
.field input:focus { border-color: var(--accent); }

.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

.routine-select {
  width: 100%; padding: 9px 12px; border-radius: 10px;
  border: 1px solid var(--border); font-size: 14px; color: var(--text-primary);
  background: var(--bg-card); outline: none; box-sizing: border-box;
}
.routine-select:focus { border-color: var(--accent); }
.routine-hint { font-size: 11px; color: var(--text-muted); margin-top: 6px; }

.type-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.type-btn {
  padding: 7px; border-radius: 9px; border: 1px solid var(--border);
  background: var(--bg-primary); font-size: 12px; color: var(--text-secondary);
  cursor: pointer; transition: all 0.15s;
}
.type-btn:hover { border-color: var(--accent); color: var(--accent); }
.type-btn.active { font-weight: 500; }

.mode-toggle { display: flex; gap: 6px; }
.mode-toggle-btn {
  flex: 1; padding: 8px; border-radius: 9px;
  border: 1px solid var(--border); background: var(--bg-primary);
  font-size: 12px; color: var(--text-secondary); cursor: pointer; transition: all 0.15s;
}
.mode-toggle-btn:hover { border-color: var(--accent); color: var(--accent); }
.mode-toggle-btn.active { background: var(--accent-light); color: var(--accent); border-color: var(--accent); font-weight: 500; }

.duration-row { display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
.duration-chip {
  padding: 7px 12px; border-radius: 980px; border: 1px solid var(--border);
  background: var(--bg-primary); font-size: 12px; color: var(--text-secondary); cursor: pointer; transition: all 0.15s;
}
.duration-chip:hover { border-color: var(--accent); color: var(--accent); }
.duration-chip.active { background: var(--accent-light); color: var(--accent); border-color: var(--accent); font-weight: 500; }
.duration-input {
  width: 100%; padding: 9px 12px; border-radius: 10px;
  border: 1px solid var(--border); font-size: 14px; color: var(--text-primary);
  background: var(--bg-card); outline: none; box-sizing: border-box;
}
.duration-input:focus { border-color: var(--accent); }

.status-row { display: flex; gap: 6px; }
.status-btn {
  flex: 1; padding: 7px; border-radius: 9px;
  border: 1px solid var(--border); background: var(--bg-primary);
  font-size: 11px; color: var(--text-secondary); cursor: pointer; transition: all 0.15s;
}
.status-btn:hover { border-color: var(--accent); }
.status-btn.active { font-weight: 500; }

.modal-footer {
  display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px;
}
.btn-cancel {
  padding: 9px 18px; border-radius: 980px; border: 1px solid var(--border);
  background: none; font-size: 13px; color: var(--text-secondary); cursor: pointer;
}
.btn-save {
  padding: 9px 20px; border-radius: 980px; border: none;
  background: var(--accent); color: #fff; font-size: 13px;
  font-weight: 500; cursor: pointer;
}
.btn-save:disabled { 
  opacity: 0.5; 
  cursor: not-allowed; 
  pointer-events: none;
}
.btn-save:not(:disabled):hover { background: var(--accent-hover); }

/* Mobile */
@media (max-width: 768px) {
  .modal {
    width: 92vw;
    padding: 16px;
    border-radius: 16px;
  }
  .field-row {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .field input {
    padding: 8px 10px;
    font-size: 13px;
    background: var(--bg-card);
}
  .type-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }
  .type-btn {
    padding: 6px 4px;
    font-size: 11px;
  }
  .status-btn {
    padding: 6px 4px;
    font-size: 10px;
  }
}
</style>
