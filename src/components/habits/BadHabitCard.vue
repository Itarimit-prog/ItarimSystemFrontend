<template>
  <div class="bcard">
    <div class="card-header">
      <div class="card-info">
        <div class="habit-name">{{ habit.name }}</div>
        <div v-if="habit.description" class="habit-desc">{{ habit.description }}</div>
      </div>
      <button class="edit-btn" @click="$emit('edit', habit)">
        <IconPencil size="14" stroke="1.5" aria-hidden="true" />
      </button>
    </div>

    <div class="timer-wrap">
      <div class="timer-left">
        <span class="timer-tag">Без срывов</span>
        <span class="timer-val">{{ timerDisplay }}</span>
        <span class="timer-since" v-if="lastRelapse">с {{ formatDate(lastRelapse) }}</span>
        <span class="timer-since" v-else>Срывов не было</span>
      </div>
      <button class="relapse-btn" @click="showConfirm = true">Срыв</button>
    </div>

    <div v-if="recordDisplay" class="record">
      🏆 Рекорд: {{ recordDisplay }}
    </div>

    <!-- Confirm dialog -->
    <Teleport to="body">
      <div v-if="showConfirm" class="overlay" @click.self="showConfirm = false">
        <div class="confirm-modal">
          <h3>Зафиксировать срыв?</h3>
          <p>Таймер «{{ habit.name }}» будет сброшен.</p>
          <div class="confirm-actions">
            <button class="btn-cancel" @click="showConfirm = false">Отмена</button>
            <button class="btn-danger" @click="confirmRelapse">Да, сорвался</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { IconPencil } from '@tabler/icons-vue'
import type { Habit } from '@/types/habits'
import { useHabitsStore } from '@/stores/habits'

const props = defineProps<{ habit: Habit }>()
const emit = defineEmits<{ edit: [habit: Habit] }>()
const store = useHabitsStore()
const showConfirm = ref(false)
const now = ref(Date.now())

let timer: ReturnType<typeof setInterval>

onMounted(() => { 
  timer = setInterval(() => { now.value = Date.now() }, 1000) 
})
onUnmounted(() => clearInterval(timer))

const lastRelapse = computed(() => store.stats[props.habit.id]?.last_relapse ?? null)
const recordSeconds = computed(() => store.stats[props.habit.id]?.record_seconds ?? 0)

const elapsedSeconds = computed(() => {
  // Если есть запись о срыве в сторе, считаем разницу от этого момента
  if (lastRelapse.value) {
    const relapseTime = new Date(lastRelapse.value + 'Z').getTime()
    return Math.max(0, Math.floor((now.value - relapseTime) / 1000))
  }
  
  // Если срывов не было, возвращаем 0.
  // Это предотвращает "прыжки" времени (например, те самые 3 часа), 
  // так как мы больше не привязываемся к моменту открытия страницы.
  return 0
})

function formatSeconds(s: number): string {
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (d > 0) return `${d}д ${h}ч ${m}м`
  if (h > 0) return `${h}ч ${m}м ${sec}с`
  return `${m}м ${sec}с`
}

const timerDisplay = computed(() => formatSeconds(elapsedSeconds.value))
const recordDisplay = computed(() =>
  recordSeconds.value > 0 ? formatSeconds(recordSeconds.value) : null
)

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) +
    ', ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

async function confirmRelapse() {
  // 1. МГНОВЕННО закрываем окно, чтобы пользователь не ждал ответа сервера
  showConfirm.value = false
  
  try {
    // 2. Выполняем запрос в фоне
    await store.addRelapse(props.habit.id)
    await store.loadHabitData(props.habit.id)
  } catch (e) {
    console.error('Failed to record relapse:', e)
  }
}
</script>

<style scoped>
.bcard {
  background: var(--bg-card); border-radius: 14px; border: 0.5px solid var(--border);
  padding: 13px 14px; margin-bottom: 8px; transition: border-color 0.15s;
}
.bcard:hover { border-color: var(--danger-border); }

.card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 9px; }
.habit-name { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.habit-desc { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.edit-btn {
  color: var(--border); cursor: pointer; background: none; border: none;
  opacity: 0; padding: 2px; display: flex; align-items: center;
}
.bcard:hover .edit-btn { opacity: 1; }
.edit-btn:hover { color: var(--accent); }

.timer-wrap {
  background: var(--bg-card); border: 0.5px solid var(--danger-border); border-radius: 10px;
  padding: 10px 12px; margin-bottom: 9px;
  display: flex; align-items: center; justify-content: space-between;
}
.timer-left { display: flex; flex-direction: column; gap: 2px; }
.timer-tag { font-size: 10px; font-weight: 500; color: var(--danger); text-transform: uppercase; letter-spacing: 0.05em; }
.timer-val { font-size: 18px; font-weight: 500; color: var(--text-primary); letter-spacing: -0.3px; font-variant-numeric: tabular-nums; }
.timer-since { font-size: 10px; color: var(--text-muted); }

.relapse-btn {
  padding: 5px 11px; border-radius: 980px;
  border: 0.5px solid var(--danger-border); background: none;
  color: var(--danger); font-size: 11px; font-weight: 500; cursor: pointer;
}
.relapse-btn:hover { background: var(--danger-light); }

.record {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; color: #3B6D11; background: #EAF3DE;
  padding: 3px 9px; border-radius: 980px;
}

.overlay {
  position: fixed; inset: 0; background: rgba(10,30,53,0.35);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; backdrop-filter: blur(4px);
}
.confirm-modal {
  background: var(--bg-card); border-radius: 20px; padding: 24px;
  width: 300px; box-shadow: 0 20px 60px rgba(10,30,53,0.15);
}
.confirm-modal h3 { font-size: 15px; font-weight: 500; color: var(--text-primary); margin-bottom: 8px; }
.confirm-modal p { font-size: 13px; color: var(--text-secondary); margin-bottom: 18px; }
.confirm-actions { display: flex; gap: 8px; justify-content: flex-end; }
.btn-cancel {
  padding: 7px 14px; border-radius: 980px; border: 1px solid var(--border);
  background: none; font-size: 12px; color: var(--text-secondary); cursor: pointer;
}
.btn-danger {
  padding: 7px 14px; border-radius: 980px; border: none;
  background: var(--danger); color: #fff; font-size: 12px; font-weight: 500; cursor: pointer;
}
</style>
