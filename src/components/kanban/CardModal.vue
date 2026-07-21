<template>
  <Teleport to="body">
    <div class="overlay" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ card ? 'Редактировать' : 'Новая карточка' }}</h3>
          <button class="close-btn" @click="$emit('close')">×</button>
        </div>
        <div class="field">
          <label>Название</label>
          <input v-model="form.title" placeholder="Название задачи" />
        </div>
        <div class="field" v-if="props.card.completed">
          <label>Дата завершения</label>
          <div class="completed-date">{{ props.card.completed_at }}</div>
        </div>
        <div class="field">
          <label>Дедлайн <span class="optional">— необязательно</span></label>
          <DatePicker v-model="form.deadline" />
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="$emit('close')">Отмена</button>
          <button class="btn-save" @click="save($event)" :disabled="!form.title || isSaving">
            {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { KanbanCard } from '@/types/kanban'
import { useKanbanStore } from '@/stores/kanban'
import DatePicker from './DatePicker.vue'

const props = defineProps<{ card: KanbanCard }>()
const emit = defineEmits<{ close: []; saved: []; saving: [boolean] }>()
const store = useKanbanStore()
const isSaving = ref(false)

const form = reactive({
  title: props.card.title,
  deadline: props.card.deadline ?? '',
})

async function save(event: MouseEvent) {
  if (!form.title || isSaving.value) {
    event.preventDefault()
    event.stopPropagation()
    return
  }

  isSaving.value = true
  emit('saving', true)

  try {
    await store.updateCard(props.card.id, props.card.column_id, {
      title: form.title,
      deadline: form.deadline || null,
    })
    emit('saved')
  } catch (e) {
    console.error('Ошибка сохранения карточки:', e)
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0; background: rgba(10,30,53,0.35);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; backdrop-filter: blur(4px);
}
.modal {
  background: var(--bg-card); border-radius: 20px; padding: 24px;
  width: 380px; max-width: 95vw;
  box-shadow: 0 20px 60px rgba(10,30,53,0.15);
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 18px;
}
.modal-header h3 { font-size: 16px; font-weight: 500; color: var(--text-primary); }
.close-btn {
  background: none; border: none; font-size: 22px;
  color: #aaa; cursor: pointer; line-height: 1;
}
.close-btn:hover { color: var(--text-primary); }
.field { margin-bottom: 14px; }
.field label {
  display: block; font-size: 12px; color: var(--text-secondary);
  margin-bottom: 6px; font-weight: 500;
}
.optional { font-weight: 400; color: var(--text-muted); }
.field input {
  width: 100%; padding: 9px 12px; border-radius: 10px;
  border: 1px solid var(--border); font-size: 14px; color: var(--text-primary);
  outline: none; box-sizing: border-box;
  background: var(--bg-card);
}
.field input:focus { border-color: var(--accent); }
.modal-footer {
  display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px;
}
.btn-cancel {
  padding: 9px 18px; border-radius: 980px;
  border: 1px solid var(--border); background: none;
  font-size: 13px; color: var(--text-secondary); cursor: pointer;
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
.completed-date {
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--accent-light);
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
}
</style>
