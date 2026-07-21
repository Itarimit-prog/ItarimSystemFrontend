<template>
  <div class="workouts-page">
    <div class="topbar">
      <span class="page-title">Тренировки</span>
      <button class="start-btn" @click="startWorkout" :disabled="isTimerRunning" :class="{ active: isTimerRunning }">
        <IconPlayerPlay size="13" /> {{ isTimerRunning ? 'Идёт тренировка...' : 'Начать тренировку' }}
      </button>
    </div>

    <div v-if="loading" class="loading">Загружаем...</div>

    <div v-else class="body">
      <div class="main">
        <div class="section-label">Упражнения</div>

        <div class="ex-card" v-for="e in exercises" :key="e.id">
          <div class="ex-header">
            <span class="ex-name">{{ e.name }}</span>
            <div class="ex-actions">
              <button class="ex-btn" @click="editExercise(e)">
                <IconPencil size="13" />
              </button>
              <button class="ex-btn del" @click="showDeleteConfirm('exercise', e.id)">
                <IconTrash size="13" />
              </button>
            </div>
          </div>
          <div class="ex-metrics">
            <label class="metric">
              <span class="metric-lbl">Подходы</span>
              <input
                type="number" min="0" placeholder="—"
                :value="e.sets ?? ''"
                @change="onMetricChange(e, 'sets', $event)"
              />
            </label>
            <label class="metric">
              <span class="metric-lbl">Повторения</span>
              <input
                type="number" min="0" placeholder="—"
                :value="e.max_reps ?? ''"
                @change="onMetricChange(e, 'max_reps', $event)"
              />
            </label>
            <label class="metric">
              <span class="metric-lbl">Вес, кг</span>
              <input
                type="number" min="0" step="0.5" placeholder="—"
                :value="e.max_weight ?? ''"
                @change="onMetricChange(e, 'max_weight', $event)"
              />
            </label>
          </div>
        </div>
        <button class="add-ex-btn" @click="addExercise">
          <IconPlus size="13" /> Добавить упражнение
        </button>
      </div>

      <div class="right">
        <!-- Таймер (показывается только когда идёт тренировка) -->
        <div v-if="isTimerRunning" class="timer-card">
          <div class="timer-row">
            <span class="timer-title">Тренировка идёт</span>
            <button class="timer-stop" @click="stopWorkout" title="Завершить">
              <IconPlayerStop size="16" />
            </button>
          </div>
          <div class="timer-val">{{ timerDisplay }}</div>
          <div class="timer-hint">Нажми ■ чтобы завершить и сохранить</div>
        </div>
        <div class="bmi-card">
          <div class="bmi-row">
            <span class="bmi-title">Мои характеристики</span>
            <button class="bmi-edit" @click="editProfile">
              <IconPencil size="13" />
            </button>
          </div>
          <div class="bmi-stats">
            <div class="bmi-stat">
              <span class="bmi-val">{{ userProfile?.height_cm }} см</span>
              <span class="bmi-lbl">Рост</span>
            </div>
            <div class="bmi-stat">
              <span class="bmi-val">{{ userProfile?.weight_kg }} кг</span>
              <span class="bmi-lbl">Вес</span>
            </div>
            <div class="bmi-stat">
              <span class="bmi-index">{{ bmi || '—' }}</span>
              <span class="bmi-status" :style="{ color: bmiStatus.color }">{{ bmiStatus.label }}</span>
              <span class="bmi-lbl">ИМТ</span>
            </div>
          </div>
        </div>

        <div class="divider"></div>
        <div class="section-label">История</div>

        <div class="last-card" v-for="l in workoutLogs" :key="l.id">
          <div class="last-date">{{ formatDate(l.date) }}</div>
          <div class="last-name">Тренировка — {{ l.duration_minutes }} мин.</div>
          <div class="last-pills">
            <span class="last-pill" v-for="exId in l.exercises" :key="exId">
              {{ exerciseNameById(exId) }}
            </span>
          </div>
          <button class="ex-btn del" style="margin-top:6px" @click="deleteLog(l.id)">
            <IconTrash size="12" /> Удалить
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Модал: упражнение -->
  <ExerciseModal
    v-if="showExerciseModal"
    :exercise="editingExercise"
    @close="showExerciseModal = false"
    @save="onExerciseSaved"
  />

  <!-- Модал: профиль -->
  <UserMetricsModal
    v-if="showMetricsModal"
    :metrics="userProfile"
    @close="showMetricsModal = false"
    @save="onProfileSaved"
  />

  <!-- Модал: подтверждение удаления -->
  <Teleport to="body" v-if="showDeleteConfirmModal">
    <div class="overlay" @click.self="showDeleteConfirmModal = false">
      <div class="confirm-modal">
        <h3>Удалить?</h3>
        <p>Это действие нельзя отменить.</p>
        <div class="confirm-actions">
          <button class="btn-cancel" @click="showDeleteConfirmModal = false">Отмена</button>
          <button class="btn-danger" @click="confirmDelete">Удалить</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useWorkoutsStore } from '@/stores/workouts'
import ExerciseModal from '@/components/workouts/ExerciseModal.vue'
import UserMetricsModal from '@/components/workouts/UserMetricsModal.vue'
import { IconPlayerPlay, IconPlayerStop, IconPencil, IconTrash, IconPlus } from '@tabler/icons-vue'
import type { Exercise } from '@/types/workouts_models'

const store = useWorkoutsStore()
const { exercises, workoutLogs, userProfile, loading, bmi, bmiStatus } = storeToRefs(store)

const showExerciseModal = ref(false)
const showMetricsModal = ref(false)
const showDeleteConfirmModal = ref(false)
const editingExercise = ref<Exercise | null>(null)
const deleteTarget = ref<{ type: 'exercise' | 'workout'; id: string } | null>(null)
const isSavingExercise = ref(false)
const isSavingProfile = ref(false)

// ── Таймер тренировки ──
const isTimerRunning = ref(false)
const timerSeconds = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

const timerDisplay = computed(() => {
  const h = Math.floor(timerSeconds.value / 3600)
  const m = Math.floor((timerSeconds.value % 3600) / 60)
  const s = timerSeconds.value % 60
  return [
    String(h).padStart(2, '0'),
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0'),
  ].join(':')
})

const timerMinutes = computed(() => Math.floor(timerSeconds.value / 60))

function formatDate(d: string) {
  return new Date(d + 'T00:00').toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long'
  })
}

function formatDateLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function exerciseNameById(id: string) {
  return exercises.value.find(e => e.id === id)?.name ?? id
}

function startWorkout() {
  if (isTimerRunning.value) return
  timerSeconds.value = 0
  isTimerRunning.value = true
  timerInterval = setInterval(() => { timerSeconds.value++ }, 1000)
}

async function stopWorkout() {
  if (!isTimerRunning.value) return
  isTimerRunning.value = false
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
  if (timerSeconds.value > 0) {
    try {
      await store.createWorkout({
        date: formatDateLocal(new Date()),
        duration_minutes: Math.max(1, timerMinutes.value),
        exercises: exercises.value.map(e => e.id),
        notes: `Тренировка ${timerDisplay.value}`,
      })
    } catch (err: any) {
      console.error('Ошибка сохранения тренировки:', err)
      alert('Ошибка сохранения тренировки: ' + (err?.message || err))
    }
  }
  timerSeconds.value = 0
}

function addExercise() {
  editingExercise.value = null
  isSavingExercise.value = false
  showExerciseModal.value = true
}

function editExercise(e: Exercise) {
  editingExercise.value = e
  isSavingExercise.value = false
  showExerciseModal.value = true
}

async function onMetricChange(e: Exercise, field: 'sets' | 'max_reps' | 'max_weight', event: Event) {
  const raw = (event.target as HTMLInputElement).value
  const value = raw === '' ? undefined : Number(raw)
  try {
    await store.updateExercise(e.id, {
      name: e.name,
      description: e.description,
      exercise_type: e.exercise_type,
      muscle_groups: e.muscle_groups,
      max_weight: e.max_weight,
      max_reps: e.max_reps,
      sets: e.sets,
      [field]: value,
    })
  } catch (err) {
    console.error('Ошибка сохранения показателя:', err)
  }
}

function editProfile() {
  isSavingProfile.value = false
  showMetricsModal.value = true
}

function showDeleteConfirm(type: 'exercise' | 'workout', id: string) {
  deleteTarget.value = { type, id }
  showDeleteConfirmModal.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  if (deleteTarget.value.type === 'exercise') {
    await store.deleteExercise(deleteTarget.value.id)
  } else {
    await store.deleteWorkoutLog(deleteTarget.value.id)
  }
  showDeleteConfirmModal.value = false
  deleteTarget.value = null
}

async function onExerciseSaved(data: Omit<Exercise, 'id'>) {
  if (isSavingExercise.value) return
  isSavingExercise.value = true
  try {
    if (editingExercise.value) {
      await store.updateExercise(editingExercise.value.id, data)
    } else {
      await store.createExercise(data)
    }
    showExerciseModal.value = false
  } catch (err) {
    console.error('Ошибка сохранения упражнения:', err)
  } finally {
    isSavingExercise.value = false
  }
}

async function onProfileSaved(data: { height_cm: number; weight_kg: number }) {
  if (isSavingProfile.value) return
  isSavingProfile.value = true
  try {
    await store.updateMetrics(data)
    showMetricsModal.value = false
  } catch (err) {
    console.error('Ошибка сохранения профиля:', err)
  } finally {
    isSavingProfile.value = false
  }
}

async function deleteLog(id: string) {
  await store.deleteWorkoutLog(id)
}

onUnmounted(() => { if (timerInterval) clearInterval(timerInterval) })
</script>

<style scoped>
.workouts-page {
  display: flex; flex-direction: column;
  width: 100%; height: 100vh; overflow: hidden;
  background: var(--bg-primary);
}

.topbar {
  background: var(--bg-card); border-bottom: 0.5px solid var(--border);
  padding: 12px 20px; display: flex; align-items: center;
  justify-content: space-between; flex-shrink: 0;
}
.page-title { font-size: 15px; font-weight: 500; color: var(--text-primary); }
.start-btn {
  padding: 6px 16px; border-radius: 980px; border: none;
  background: var(--accent); color: #fff; font-size: 12px;
  font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(26, 122, 232, 0.2);
}
.start-btn:hover {
  background: var(--accent-hover);
  box-shadow: 0 4px 8px rgba(26, 122, 232, 0.3);
  transform: translateY(-1px);
}
.start-btn:active { transform: translateY(0); }
.start-btn:disabled {
  background: var(--text-secondary); cursor: default;
  box-shadow: none; transform: none;
}
.start-btn.active { background: var(--text-secondary); }

.body {
  display: grid; grid-template-columns: 1fr 240px;
  flex: 1; overflow: hidden;
}

.main { padding: 16px; overflow-y: auto; }
.section-label {
  font-size: 11px; font-weight: 500; color: var(--text-secondary);
  text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px;
}

.ex-card {
  background: var(--bg-card); border-radius: 14px; border: 0.5px solid var(--border);
  padding: 12px 14px; margin-bottom: 8px; transition: border-color 0.15s;
}
.ex-card:hover { border-color: var(--accent); }
.ex-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;
}
.ex-name { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.ex-actions {
  display: flex; gap: 4px; opacity: 0; transition: opacity 0.15s;
}
.ex-card:hover .ex-actions { opacity: 1; }
.ex-btn {
  background: none; border: none; color: var(--border); cursor: pointer;
  padding: 2px 4px; border-radius: 6px; font-size: 13px;
}
.ex-btn:hover { color: var(--accent); background: var(--accent-light); }
.ex-btn.del:hover { color: var(--danger); background: var(--danger-light); }

.ex-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.metric { display: flex; flex-direction: column; gap: 3px; }
.metric-lbl { font-size: 10px; color: var(--text-muted); }
.metric input {
  width: 100%; padding: 5px 8px; border-radius: 8px;
  border: 0.5px solid var(--border); background: var(--bg-primary);
  font-size: 12px; color: var(--text-primary); outline: none;
  box-sizing: border-box; transition: border-color 0.15s;
}
.metric input:focus { border-color: var(--accent); }

.sets-row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.set-pill {
  display: flex; align-items: center; gap: 4px; padding: 3px 9px;
  border-radius: 980px; background: var(--accent-light); border: 0.5px solid var(--border);
  font-size: 11px; color: #185FA5;
}
.set-best { background: #EAF3DE; border-color: #C0DD97; color: #3B6D11; }
.add-set {
  padding: 3px 9px; border-radius: 980px; border: 0.5px dashed var(--text-muted);
  background: none; color: var(--text-muted); font-size: 11px; cursor: pointer;
}
.add-set:hover { background: var(--accent-light); color: var(--accent); border-style: solid; }

.progress-mini { margin-top: 8px; display: flex; align-items: center; gap: 6px; }
.prog-label { font-size: 10px; color: var(--text-muted); }
.prog-bar { flex: 1; height: 3px; background: var(--accent-light); border-radius: 3px; overflow: hidden; }
.prog-fill { height: 100%; background: var(--accent);border-radius: 3px; }
.prog-val { font-size: 10px; color: var(--accent); font-weight: 500; }

.add-ex-btn {
  display: flex; align-items: center; gap: 6px; width: 100%;
  padding: 10px 14px; border-radius: 12px; border: 0.5px dashed var(--text-muted);
  background: none; color: var(--text-muted); font-size: 12px; cursor: pointer; margin-top: 4px;
}
.add-ex-btn:hover { background: var(--bg-card); color: var(--accent); border-color: var(--accent); }

.right {
  background: var(--bg-card); border-left: 0.5px solid var(--border);
  padding: 16px; overflow-y: auto; display: flex; flex-direction: column;
}

.bmi-card { background: var(--bg-primary); border-radius: 14px; padding: 13px; margin-bottom: 14px; }
.bmi-row { display: flex; align-items:center; justify-content: space-between; margin-bottom: 8px; }
.bmi-title { font-size: 11px; font-weight: 500; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em; }
.bmi-edit {background: none; border: none; color: var(--border); cursor: pointer; font-size: 13px; }
.bmi-edit:hover { color: var(--accent); }
.bmi-stats { display: grid; grid-template-columns: 1fr 1fr; gap:8px; }
.bmi-stat { display: flex; flex-direction: column; gap: 2px; }
.bmi-val { font-size: 16px; font-weight: 500; color: var(--text-primary); letter-spacing: -0.2px; }
.bmi-lbl { font-size: 10px; color: var(--text-muted); }
.bmi-index { font-size: 22px; font-weight: 500; color: var(--success); letter-spacing: -0.4px; }
.bmi-status { font-size: 11px; color: var(--success); margin-top: 1px; }

.divider { border: none; border-top: 0.5px solid var(--border); margin: 12px 0; }

.last-card{ background: var(--bg-primary); border-radius: 14px; padding: 12px; margin-bottom: 8px; }
.last-date { font-size: 10px; color: var(--text-muted); margin-bottom: 4px; }
.last-name {font-size: 12px; font-weight: 500; color: var(--text-primary); margin-bottom: 4px; }
.last-pills { display: flex; gap: 4px; flex-wrap: wrap; }
.last-pill { font-size: 10px; padding: 2px 7px; border-radius: 980px; background: var(--accent-light); color: #185FA5; }

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

.timer-card {
  background: var(--accent-light); border-radius:14px; padding: 13px; margin-bottom: 14px;
  border: 1px solid var(--accent); animation: pulse 2s infinite;
}
.timer-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;}
.timer-title { font-size: 11px; font-weight: 500; color: var(--accent); text-transform: uppercase; letter-spacing: 0.06em; }
.timer-stop { background: none; border: none; color: var(--border); cursor: pointer;}
.timer-stop:hover { color: var(--danger); }
.timer-val { font-size: 24px; font-weight: 600; color: var(--text-primary); text-align: center; font-variant-numeric: tabular-nums; }

.timer-hint { font-size: 10px; color: var(--text-muted); text-align: center; margin-top: 4px; }

.loading { color: var(--text-muted); font-size: 14px; padding: 40px 20px; text-align: center; }

@keyframes pulse{
  0% { box-shadow: 0 0 0 0 rgba(26, 122, 232, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(26, 122, 232, 0); }
  100% { box-shadow: 0 0 0 0 rgba(26, 122, 232, 0); }
}

/* ── Mobile ── */
@media (max-width: 768px) {
  .workouts-page {
    height: auto;
    overflow-y: auto;
  }
  .body {
    grid-template-columns: 1fr;
    overflow: visible;
  }
  .main { overflow: visible; }
  .right {
    overflow: visible;
    border-left: none;
    border-top: 0.5px solid var(--border);
  }
}
</style>
