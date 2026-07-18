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

        <div class="field-row">
          <div class="field">
            <label>Начало</label>
            <input v-model="form.time_start" type="time" />
          </div>
          <div class="field">
            <label>Конец</label>
            <input v-model="form.time_end" type="time" />
          </div>
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
import { reactive, computed, ref } from 'vue'
import type { Task, TaskType, TaskStatus } from '@/types'
import { TASK_TYPE_META, STATUS_META } from '@/types'
import { usePlannerStore } from '@/stores/planner'

const props = defineProps<{ task?: Task | null; date: string }>()
const emit = defineEmits<{ close: []; saved: []; saving: [boolean] }>()
const store = usePlannerStore()

const isEdit = computed(() => !!props.task)
const isSaving = ref(false)

const form = reactive({
  title: props.task?.title ?? '',
  task_type: (props.task?.task_type ?? 'routine') as TaskType,
  status: (props.task?.status ?? 'todo') as TaskStatus,
  time_start: props.task?.time_start ?? '09:00',
  time_end: props.task?.time_end ?? '10:00',
})

async function save(event: MouseEvent) {
  if (isSaving.value || !form.title) {
    event.preventDefault()
    event.stopPropagation()
    return
  }
  
  isSaving.value = true
  emit('saving', true)
  
  try {
    if (isEdit.value && props.task) {
      await store.updateTask(props.task.id, { ...form })
    } else {
      await store.createTask({ ...form, date: props.date })
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

.type-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.type-btn {
  padding: 7px; border-radius: 9px; border: 1px solid var(--border);
  background: var(--bg-primary); font-size: 12px; color: var(--text-secondary);
  cursor: pointer; transition: all 0.15s;
}
.type-btn:hover { border-color: var(--accent); color: var(--accent); }
.type-btn.active { font-weight: 500; }

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
