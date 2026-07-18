<template>
  <Teleport to="body">
    <div class="overlay" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ habit ? 'Редактировать' : 'Новая привычка' }}</h3>
          <button class="close-btn" @click="$emit('close')">×</button>
        </div>

        <div class="field">
          <label>Тип</label>
          <div class="kind-row">
            <button class="kind-btn" :class="{ active: form.kind === 'good' }" @click="form.kind = 'good'">
              ✅ Хорошая
            </button>
            <button class="kind-btn bad" :class="{ active: form.kind === 'bad' }" @click="form.kind = 'bad'">
              ❌ Плохая
            </button>
          </div>
        </div>

        <div class="field">
          <label>Название</label>
          <input v-model="form.name" placeholder="Название привычки" />
        </div>

        <div class="field">
          <label>Описание <span class="opt">— необязательно</span></label>
          <input v-model="form.description" placeholder="Короткое описание" />
        </div>

        <template v-if="form.kind === 'good'">
          <div class="field">
            <label>Повторяемость</label>
            <div class="freq-row">
              <button class="freq-btn" :class="{ active: form.freq_type === 'days' }" @click="form.freq_type = 'days'">
                По дням
              </button>
              <button class="freq-btn" :class="{ active: form.freq_type === 'times' }" @click="form.freq_type = 'times'">
                Раз в день
              </button>
            </div>
          </div>

          <div v-if="form.freq_type === 'days'" class="field">
            <label>Дни недели</label>
            <div class="days-picker">
              <button v-for="(d, i) in DAY_NAMES" :key="i"
                class="day-btn"
                :class="{ active: form.freq_days.includes(i) }"
                @click="toggleDay(i)"
              >{{ d }}</button>
            </div>
          </div>

          <div v-else class="field">
            <label>Количество раз в день</label>
            <div class="times-row">
              <button v-for="n in [1,2,3,4]" :key="n"
                class="times-btn"
                :class="{ active: form.freq_times === n }"
                @click="form.freq_times = n"
              >{{ n }}×</button>
            </div>
          </div>
        </template>

        <div class="modal-footer">
          <button v-if="habit" class="btn-delete" @click="deleteHabit">Удалить</button>
          <div style="flex:1"></div>
          <button class="btn-cancel" @click="$emit('close')">Отмена</button>
          <button class="btn-save" @click="save($event)" :disabled="!form.name || isSaving">
            {{ isSaving ? 'Сохранение...' : (habit ? 'Сохранить' : 'Создать') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { Habit } from '@/types/habits'
import { useHabitsStore } from '@/stores/habits'

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const props = defineProps<{ habit?: Habit | null }>()
const emit = defineEmits<{ close: []; saved: []; saving: [boolean] }>()
const store = useHabitsStore()
const isSaving = ref(false)

const form = reactive({
  name: props.habit?.name ?? '',
  description: props.habit?.description ?? '',
  kind: props.habit?.kind ?? 'good' as 'good' | 'bad',
  freq_type: props.habit?.freq_type ?? 'days' as 'days' | 'times',
  freq_days: [...(props.habit?.freq_days ?? [0, 1, 2, 3, 4])],
  freq_times: props.habit?.freq_times ?? 1,
})

function toggleDay(i: number) {
  const idx = form.freq_days.indexOf(i)
  if (idx === -1) form.freq_days.push(i)
  else form.freq_days.splice(idx, 1)
}

async function save(event: MouseEvent) {
  if (!form.name || isSaving.value) {
    event.preventDefault()
    event.stopPropagation()
    return
  }
  
  isSaving.value = true
  emit('saving', true)
  
  try {
    const payload = {
      name: form.name,
      description: form.description || null,
      kind: form.kind,
      freq_type: form.freq_type,
      freq_days: form.freq_type === 'days' ? form.freq_days : null,
      freq_times: form.freq_type === 'times' ? form.freq_times : null,
    }
    if (props.habit) {
      await store.updateHabit(props.habit.id, payload)
    } else {
      await store.createHabit(payload)
    }
    emit('saved')
  } catch (e) {
    console.error('Ошибка сохранения привычки:', e)
  } finally {
    isSaving.value = false
    emit('saving', false)
  }
}

async function deleteHabit() {
  if (props.habit) {
    await store.deleteHabit(props.habit.id)
    emit('close')
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
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.modal-header h3 { font-size: 15px; font-weight: 500; color: var(--text-primary); }
.close-btn { background: none; border: none; font-size: 22px; color: #aaa; cursor: pointer; }
.close-btn:hover { color: var(--text-primary); }

.field { margin-bottom: 14px; }
.field label { display: block; font-size: 11px; font-weight: 500; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
.opt { font-weight: 400; color: var(--text-muted); text-transform: none; }
.field input {
  width: 100%; padding: 9px 12px; border-radius: 10px;
  border: 1px solid var(--border); font-size: 13px; color: var(--text-primary);
  outline: none; box-sizing: border-box;
  background: var(--bg-card);
}
.field input:focus { border-color: var(--accent); }

.kind-row, .freq-row { display: flex; gap: 7px; }
.kind-btn, .freq-btn {
  flex: 1; padding: 8px; border-radius: 10px;
  border: 1px solid var(--border); background: var(--bg-primary);
  font-size: 12px; color: var(--text-secondary); cursor: pointer; transition: all 0.15s;
}
.kind-btn.active { background: #EAF3DE; border-color: #C0DD97; color: #3B6D11; }
.kind-btn.bad.active { background: var(--danger-light); border-color: var(--danger-border); color: var(--danger); }
.freq-btn.active { background: var(--accent-light); border-color: var(--accent); color: var(--accent); }

.days-picker { display: flex; gap: 4px; flex-wrap: wrap; }
.day-btn {
  width: 34px; height: 34px; border-radius: 9px;
  border: 1px solid var(--border); background: var(--bg-primary);
  font-size: 11px; font-weight: 500; color: var(--text-muted); cursor: pointer;
}
.day-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }

.times-row { display: flex; gap: 7px; }
.times-btn {
  flex: 1; padding: 8px; border-radius: 10px;
  border: 1px solid var(--border); background: var(--bg-primary);
  font-size: 13px; font-weight: 500; color: var(--text-secondary); cursor: pointer;
}
.times-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }

.modal-footer { display: flex; align-items: center; gap: 8px; margin-top: 20px; }
.btn-delete {
  padding: 8px 14px; border-radius: 980px; border: 1px solid var(--danger-border);
  background: none; font-size: 12px; color: var(--danger); cursor: pointer;
}
.btn-cancel {
  padding: 8px 16px; border-radius: 980px; border: 1px solid var(--border);
  background: none; font-size: 12px; color: var(--text-secondary); cursor: pointer;
}
.btn-save {
  padding: 8px 18px; border-radius: 980px; border: none;
  background: var(--accent); color: #fff; font-size: 12px; font-weight: 500; cursor: pointer;
}
.btn-save:disabled { 
  opacity: 0.5; 
  cursor: not-allowed; 
  pointer-events: none;
}
</style>
