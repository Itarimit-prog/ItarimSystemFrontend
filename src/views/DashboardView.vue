<template>
  <div class="dashboard-page">
    <div class="topbar">
      <span class="page-title">Дашборд</span>
    </div>

    <div class="body">
      <div class="dash-layout">
        <div class="dash-left">
          <div class="section-label">Roadmap</div>
          <RoadmapWidget />
        </div>

        <div class="dash-right">
          <div>
            <div class="section-label">Привычки сегодня</div>
            <div class="card block-card">
              <div class="block-head">
                <span class="block-title">🔥 Сегодня</span>
                <span class="block-count">{{ checkedGoodCount }} из {{ goodHabits.length }}</span>
              </div>
              <div class="hab-row" v-for="h in goodHabits" :key="h.id">
                <button class="hab-check" :class="{ on: isChecked(h.id) }" @click="toggle(h.id)">
                  <IconCheck v-if="isChecked(h.id)" size="12" stroke="2.5" />
                </button>
                <span class="hab-name" :class="{ done: isChecked(h.id) }">{{ h.name }}</span>
                <span class="hab-pct" v-if="stats[h.id]">{{ stats[h.id].completion_percent }}%</span>
              </div>
              <div v-if="goodHabits.length === 0" class="empty-mini">Нет хороших привычек</div>
            </div>
          </div>

          <div>
            <div class="section-label">Дела и тренировки<span class="section-hint">по расписанию на сегодня</span></div>
            <div class="card block-card">
              <div class="task-row" v-for="t in todayTasks" :key="t.id" @click="goToPlanner">
                <div class="task-dot" :style="{ background: TASK_TYPE_META[t.task_type].border }"></div>
                <span class="task-name">{{ t.title }}</span>
                <span v-if="t.task_type === 'workout'" class="task-badge" :style="{ background: TASK_TYPE_META.workout.badgeBg, color: TASK_TYPE_META.workout.badgeText }">
                  {{ routineName(t.routine_id) }}
                </span>
                <span class="task-time">{{ t.time_start ?? formatDuration(t.duration_minutes) }}</span>
              </div>
              <div v-if="todayTasks.length === 0" class="empty-mini">Нет рабочих/учебных дел и тренировок на сегодня</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useHabitsStore } from '@/stores/habits'
import { usePlannerStore } from '@/stores/planner'
import { useWorkoutsStore } from '@/stores/workouts'
import { TASK_TYPE_META } from '@/types'
import { IconCheck } from '@tabler/icons-vue'
import RoadmapWidget from '@/components/dashboard/RoadmapWidget.vue'

const router = useRouter()

const habitsStore = useHabitsStore()
const { habits, stats } = storeToRefs(habitsStore)

const plannerStore = usePlannerStore()
const { todayTasks: allTodayTasks } = storeToRefs(plannerStore)

const workoutsStore = useWorkoutsStore()
const { routines } = storeToRefs(workoutsStore)

const goodHabits = computed(() => habits.value.filter(h => h.kind === 'good'))
function isChecked(habitId: string) { return habitsStore.isChecked(habitId) }
function toggle(habitId: string) { habitsStore.toggleCheck(habitId) }
const checkedGoodCount = computed(() => goodHabits.value.filter(h => isChecked(h.id)).length)

// Именно СЕГОДНЯШНИЕ дела — не зависит от того, какой день сейчас открыт в планере
const todayTasks = computed(() =>
  allTodayTasks.value.filter(t => ['work', 'study', 'workout'].includes(t.task_type))
)

function formatDuration(minutes?: number | null): string {
  if (!minutes) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `⏱ ${m} мин`
  if (m === 0) return `⏱ ${h} ч`
  return `⏱ ${h} ч ${m} мин`
}

function routineName(routineId?: string | null) {
  return routines.value.find(r => r.id === routineId)?.name ?? 'Тренировка'
}

function goToPlanner() {
  router.push('/planner')
}
</script>

<style scoped>
.dashboard-page {
  display: flex; flex-direction: column;
  width: 100%; height: 100vh; overflow: hidden;
  background: var(--bg-primary);
}

.topbar {
  background: var(--bg-card); border-bottom: 0.5px solid var(--border);
  padding: 13px 20px; flex-shrink: 0;
}
.page-title { font-size: 15px; font-weight: 500; color: var(--text-primary); letter-spacing: -0.2px; }

.body { flex: 1; overflow-y: auto; padding: 20px; }

.dash-layout { display: flex; align-items: flex-start; gap: 16px; max-width: 1100px; margin: 0 auto; }
.dash-left { width: 300px; flex-shrink: 0; }
.dash-right { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px; }

.section-label {
  font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;
  letter-spacing: .06em; display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 10px;
}
.section-hint { font-size: 11px; color: var(--text-muted); text-transform: none; font-weight: 400; letter-spacing: 0; }

.card { background: var(--bg-card); border: 0.5px solid var(--border); border-radius: 16px; }
.block-card { padding: 15px 17px; }
.block-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.block-title { font-size: 13px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 7px; }
.block-count { font-size: 11px; color: var(--text-muted); font-weight: 400; }

.hab-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-top: 0.5px solid var(--border); }
.hab-row:first-of-type { border-top: none; padding-top: 0; }
.hab-check {
  width: 22px; height: 22px; border-radius: 7px; border: 1.5px solid var(--border);
  flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  background: none; color: #fff; cursor: pointer; padding: 0;
}
.hab-check.on { background: var(--success); border-color: var(--success); }
.hab-name { flex: 1; font-size: 12.5px; color: var(--text-primary); }
.hab-name.done { color: var(--text-muted); text-decoration: line-through; }
.hab-pct { font-size: 10.5px; color: var(--text-muted); font-weight: 500; }

.task-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-top: 0.5px solid var(--border); cursor: pointer; }
.task-row:first-of-type { border-top: none; padding-top: 0; }
.task-row:hover .task-name { color: var(--accent); }
.task-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.task-name { flex: 1; font-size: 12.5px; color: var(--text-primary); transition: color 0.15s; }
.task-time { font-size: 11px; color: var(--text-muted); }
.task-badge { font-size: 9.5px; font-weight: 600; padding: 1px 7px; border-radius: 980px; }

.empty-mini { font-size: 12px; color: var(--text-muted); padding: 10px 0; text-align: center; }

/* ── Mobile ── */
@media (max-width: 768px) {
  .dashboard-page { height: auto; overflow-y: auto; }
  .body { padding: 12px; }
  .dash-layout { flex-direction: column; }
  .dash-left { width: 100%; }
}
</style>
