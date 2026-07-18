<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title">Мои характеристики</span>
        <button class="modal-close" @click="$emit('close')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Рост (см)</label>
          <input v-model.number="form.height_cm" type="number" class="form-input" />
        </div>
        <div class="form-group">
          <label>Вес (кг)</label>
          <input v-model.number="form.weight_kg" type="number" class="form-input" />
        </div>
        <div class="bmi-preview" v-if="bmi !== null">
          <span>Ваш ИМТ: <strong>{{ bmi }}</strong> ({{ bmiStatus.label }})</span>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">Отмена</button>
        <button class="btn btn-primary" @click="save($event)" :disabled="isSaving">
          {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { UserProfile } from '@/types/workouts_models'

const props = defineProps<{
  metrics?: UserProfile | null
}>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saving', value: boolean): void
  (e: 'save', data: UserProfile): void
}>()

const isSaving = ref(false)
const form = ref({
  height_cm: props.metrics?.height_cm || 0,
  weight_kg: props.metrics?.weight_kg || 0
})

watch(() => props.metrics, (val) => {
  if (val) {
    form.value.height_cm = val.height_cm
    form.value.weight_kg = val.weight_kg
  }
}, { immediate: true })

const bmi = computed(() => {
  if (!form.value.height_cm || !form.value.weight_kg) return null
  const heightM = form.value.height_cm / 100
  return (form.value.weight_kg / (heightM * heightM)).toFixed(1)
})

const bmiStatus = computed(() => {
  const val = parseFloat(bmi.value || '0')
  if (val === 0) return { label: 'Не определено' }
  if (val < 18.5) return { label: 'Недовес' }
  if (val < 25) return { label: 'Норма' }
  if (val < 30) return { label: 'Избыточный вес' }
  return { label: 'Ожирение' }
})

async function save(event: MouseEvent) {
  if (isSaving.value) {
    event.preventDefault()
    event.stopPropagation()
    return
  }
  // Блокируем кнопку мгновенно
  isSaving.value = true
  emit('saving', true)
  try {
    emit('save', { ...form.value })
  } catch (e) {
    console.error('Ошибка сохранения профиля:', e)
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
.modal { background: var(--bg-card); border-radius: 16px; width: 90%; max-width: 400px; }
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 0.5px solid var(--border);
}
.modal-title { font-size: 15px; font-weight: 500; color: var(--text-primary); }
.modal-close {
  border: none; background: none; font-size: 24px; color: var(--text-muted); cursor: pointer;
}
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.modal-footer {
  display: flex; gap: 8px; justify-content: flex-end; padding: 16px 20px;
  border-top: 0.5px solid var(--border);
}

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 12px; color: var(--text-secondary); }
.form-input {
  padding: 10px 12px; border: 1px solid var(--border); border-radius: 10px;
  font-size: 14px; color: var(--text-primary); outline: none;
  background: var(--bg-card);
}
.form-input:focus { border-color: var(--accent); }

.bmi-preview {
  background: var(--bg-primary); padding: 10px; border-radius: 10px;
  font-size: 13px; color: var(--text-secondary); text-align: center;
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
</style>
