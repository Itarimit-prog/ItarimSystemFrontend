<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title">{{ debt ? 'Редактировать долг' : 'Новый долг' }}</span>
        <button class="modal-close" @click="$emit('close')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Имя / название</label>
          <input v-model="form.name" class="form-input" placeholder="Максим, Банк..." />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Сумма (₽)</label>
            <input v-model.number="form.amount" type="number" min="0.01" step="0.01" class="form-input" />
          </div>
          <div class="form-group">
            <label>Направление</label>
            <select v-model="form.direction" class="form-select">
              <option value="owe">Я должен</option>
              <option value="owed">Мне должны</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Заметка</label>
          <input v-model="form.note" class="form-input" placeholder="За ужин, до 30 июня..." />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Срок (необязательно)</label>
            <DatePicker v-model="form.due_date" />
          </div>
          <div class="form-group">
            <label>Статус</label>
            <select v-model="form.status" class="form-select">
              <option value="active">Активен</option>
              <option value="paid">Погашен</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">Отмена</button>
        <button class="btn btn-primary" @click="save($event)" :disabled="!isValid || isSaving">
          {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Debt, DebtDirection, DebtStatus } from '@/types/finances'
import DatePicker from '@/components/kanban/DatePicker.vue'

const props = defineProps<{
  debt?: Debt | null
}>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saving', value: boolean): void
  (e: 'save', data: Omit<Debt, 'id'> & { id?: string }): void
}>()

const isSaving = ref(false)
const form = ref({
  name: '',
  amount: 0,
  direction: 'owe' as DebtDirection,
  note: '',
  due_date: '',
  status: 'active' as DebtStatus,
})

watch(() => props.debt, (val) => {
  if (val) {
    form.value = {
      name: val.name,
      amount: val.amount,
      direction: val.direction,
      note: val.note || '',
      due_date: val.due_date || '',
      status: val.status,
    }
  } else {
    form.value = { name: '', amount: 0, direction: 'owe', note: '', due_date: '', status: 'active' }
  }
}, { immediate: true })

const isValid = computed(() => form.value.name.trim() && form.value.amount > 0)

async function save(event: MouseEvent) {
  if (!isValid.value || isSaving.value) {
    event.preventDefault()
    event.stopPropagation()
    return
  }
  isSaving.value = true
  emit('saving', true)
  try {
    const payload: any = { ...form.value }
    if (!payload.due_date) delete payload.due_date
    if (!payload.note) delete payload.note
    if (props.debt?.id) payload.id = props.debt.id
    emit('save', payload)
  } catch (e) {
    console.error('Ошибка сохранения долга:', e)
  } finally {
    isSaving.value = false
    emit('saving', false)
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(10,30,53,0.35);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; backdrop-filter: blur(4px);
}
.modal { background: var(--bg-card); border-radius: 20px; width: 90%; max-width: 440px; box-shadow: 0 20px 60px rgba(10,30,53,0.15); }
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 0.5px solid var(--border);
}
.modal-title { font-size: 15px; font-weight: 500; color: var(--text-primary); }
.modal-close { border: none; background: none; font-size: 24px; color: var(--text-muted); cursor: pointer; }
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
.modal-footer {
  display: flex; gap: 8px; justify-content: flex-end; padding: 16px 20px;
  border-top: 0.5px solid var(--border);
}
.form-group { display: flex; flex-direction: column; gap: 5px; flex: 1; }
.form-group label { font-size: 11px; color: var(--text-secondary); font-weight: 500; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-input, .form-select {
  padding: 9px 12px; border: 1px solid var(--border); border-radius: 10px;
  font-size: 13px; color: var(--text-primary); outline: none; background: var(--bg-card);
}
.form-input:focus, .form-select:focus { border-color: var(--accent); }
.btn { padding: 8px 18px; border-radius: 10px; border: none; cursor: pointer; font-size: 13px; font-weight: 500; }
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
.btn-primary:disabled { 
  opacity: 0.5; 
  cursor: not-allowed; 
  pointer-events: none;
}
.btn-secondary { background: var(--bg-primary); color: var(--text-secondary); }
.btn-secondary:hover { background: var(--color-btn-secondary-hover) }
</style>
