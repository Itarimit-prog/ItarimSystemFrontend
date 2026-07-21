<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title">{{ exercise ? 'Редактировать упражнение' : 'Новое упражнение' }}</span>
        <button class="modal-close" @click="$emit('close')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Название</label>
          <input v-model="form.name" class="form-input" />
        </div>
        <div class="form-group">
          <label>Описание</label>
          <textarea v-model="form.description" class="form-textarea"></textarea>
        </div>
        <div class="form-group">
          <label>Тип упражнения</label>
          <select v-model="form.exercise_type" class="form-select">
            <option value="strength">Сила</option>
            <option value="cardio">Кардио</option>
            <option value="flexibility">Гибкость</option>
          </select>
        </div>
        <div class="form-group">
          <label>Мышечные группы (через запятую)</label>
          <input v-model="muscleGroupsInput" class="form-input" placeholder="грудь, спина, ноги" />
        </div>

        <div class="form-divider">Дополнительные показатели</div>

        <div class="form-row form-row-3">
          <div class="form-group">
            <label>Подходы</label>
            <input v-model.number="form.sets" type="number" min="0" class="form-input" />
          </div>
          <div class="form-group">
            <label>Повторения</label>
            <input v-model.number="form.max_reps" type="number" min="0" class="form-input" />
          </div>
          <div class="form-group">
            <label>Рекордный вес (кг)</label>
            <input v-model.number="form.max_weight" type="number" class="form-input" />
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">Отмена</button>
        <button class="btn btn-primary" @click="save($event)" :disabled="!form.name.trim() || isSaving">
          {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Exercise, ExerciseType } from '@/types/workouts_models'

const props = defineProps<{
  exercise?: Exercise | null
}>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saving', value: boolean): void
  (e: 'save', data: Omit<Exercise, 'id'>): void
}>()

const isSaving = ref(false)
const form = ref({
  name: '',
  description: '',
  exercise_type: 'strength' as ExerciseType,
  muscle_groups: [] as string[],
  max_weight: undefined as number | undefined,
  max_reps: undefined as number | undefined,
  sets: undefined as number | undefined,
})
const muscleGroupsInput = ref('')

watch(() => props.exercise, (newVal) => {
  if (newVal) {
    form.value = {
      name: newVal.name,
      description: newVal.description || '',
      exercise_type: newVal.exercise_type,
      muscle_groups: newVal.muscle_groups || [],
      max_weight: newVal.max_weight,
      max_reps: newVal.max_reps,
      sets: newVal.sets,
    }
    muscleGroupsInput.value = newVal.muscle_groups?.join(', ') || ''
  } else {
    form.value = {
      name: '',
      description: '',
      exercise_type: 'strength',
      muscle_groups: [],
      max_weight: undefined,
      max_reps: undefined,
      sets: undefined,
    }
    muscleGroupsInput.value = ''
  }
}, { immediate: true })

watch(muscleGroupsInput, (val) => {
  form.value.muscle_groups = val.split(',').map(s => s.trim()).filter(Boolean)
})

async function save(event: MouseEvent) {
  if (isSaving.value || !form.value.name.trim()) {
    event.preventDefault()
    event.stopPropagation()
    return
  }
  isSaving.value = true
  emit('saving', true)
  try {
    emit('save', { ...form.value })
  } catch (e) {
    console.error('Ошибка сохранения упражнения:', e)
  } finally {
    isSaving.value = false
    emit('saving', false)
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal { background: var(--bg-card); border-radius: 16px; width: 90%; max-width: 500px; }
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 0.5px solid var(--border);
}
.modal-title { font-size: 15px; font-weight: 500; color: var(--text-primary); }
.modal-close {
  border: none; background: none; font-size: 24px; color: var(--text-muted); cursor: pointer;
}
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
.modal-footer {
  display: flex; gap: 8px; justify-content: flex-end; padding: 16px 20px;
  border-top: 0.5px solid var(--border);
}

.form-group { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.form-group label { font-size: 12px; color: var(--text-secondary); }
.form-input, .form-textarea, .form-select {
  width: 100%; box-sizing: border-box; min-width: 0;
  padding: 10px 12px; border: 1px solid var(--border); border-radius: 10px;
  font-size: 14px; color: var(--text-primary); outline: none;
  background: var(--bg-card);
}
.form-input:focus, .form-textarea:focus, .form-select:focus {
  border-color: var(--accent);
}
.form-textarea { min-height: 80px; resize: vertical; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-row-3 { grid-template-columns: 1fr 1fr 1fr; }
.form-divider {
  font-size: 11px; font-weight: 500; color: var(--text-muted);
  text-transform: uppercase; margin-top: 8px; margin-bottom: -4px;
}

.btn {
  padding: 8px 16px; border-radius: 10px; border: none; cursor: pointer; font-size: 14px; font-weight: 500;
}
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
.btn-primary:disabled { 
  opacity: 0.5; 
  cursor: not-allowed; 
  pointer-events: none;
}
.btn-secondary { background: var(--bg-primary); color: var(--text-secondary); }
.btn-secondary:hover { background: var(--accent-light); }

/* ── Mobile ── */
@media (max-width: 768px) {
  .modal {
    width: 94vw;
    max-height: 88vh;
    display: flex;
    flex-direction: column;
  }
  .modal-body {
    padding: 14px 16px;
    gap: 10px;
    overflow-y: auto;
  }
  .modal-header { padding: 14px 16px; }
  .modal-footer { padding: 12px 16px; }
  .form-row-3 {
    grid-template-columns: 1fr;
  }
  .form-input, .form-textarea, .form-select {
    font-size: 16px; /* предотвращает авто-zoom на iOS при фокусе */
  }
}
</style>
