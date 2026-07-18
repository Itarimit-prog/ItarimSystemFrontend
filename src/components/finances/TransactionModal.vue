<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title">{{ transaction ? 'Редактировать' : 'Новая транзакция' }}</span>
        <button class="modal-close" @click="$emit('close')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Описание</label>
          <input v-model="form.description" class="form-input" placeholder="Зарплата, Продукты..." />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Сумма (₽)</label>
            <input v-model.number="form.amount" type="number" min="0.01" step="0.01" class="form-input" />
          </div>
          <div class="form-group">
            <label>Тип</label>
            <select v-model="form.transaction_type" class="form-select">
              <option value="income">Доход</option>
              <option value="expense">Расход</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Категория</label>
            <select v-model="form.category" class="form-select">
              <option v-for="(meta, key) in CATEGORY_META" :key="key" :value="key">
                {{ meta.icon }} {{ meta.label }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Дата</label>
            <DatePicker v-model="form.date" />
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
import type { Transaction, TransactionType, TransactionCategory } from '@/types/finances'
import { CATEGORY_META } from '@/types/finances'
import DatePicker from '@/components/kanban/DatePicker.vue'

const props = defineProps<{
  transaction?: Transaction | null
}>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saving', value: boolean): void
  (e: 'save', data: Omit<Transaction, 'id'> & { id?: string }): void
}>()

const isSaving = ref(false)

function formatDateLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const today = formatDateLocal(new Date())

const form = ref({
  description: '',
  amount: 0,
  transaction_type: 'expense' as TransactionType,
  category: 'other' as TransactionCategory,
  date: today,
})

watch(() => props.transaction, (val) => {
  if (val) {
    form.value = {
      description: val.description,
      amount: val.amount,
      transaction_type: val.transaction_type,
      category: val.category,
      date: val.date,
    }
  } else {
    form.value = { description: '', amount: 0, transaction_type: 'expense', category: 'other', date: today }
  }
}, { immediate: true })

const isValid = computed(() => form.value.description.trim() && form.value.amount > 0)

async function save(event: MouseEvent) {
  if (!isValid.value || isSaving.value) {
    event.preventDefault()
    event.stopPropagation()
    return
  }
  isSaving.value = true
  emit('saving', true)
  try {
    emit('save', {
      ...form.value,
      ...(props.transaction?.id ? { id: props.transaction.id } : {}),
    })
  } catch (e) {
    console.error('Ошибка сохранения транзакции:', e)
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
.btn-secondary:hover { background: var(--accent-light); }
</style>
