<template>
  <div class="w-card">
    <div class="row" v-for="t in todayTasks" :key="t.id" @click="router.push('/planner')">
      <div class="dot" :style="{ background: TASK_TYPE_META[t.task_type].border }"></div>
      <span class="name">{{ t.title }}</span>
      <span v-if="t.task_type === 'workout'" class="badge" :style="{ background: TASK_TYPE_META.workout.badgeBg, color: TASK_TYPE_META.workout.badgeText }">
        {{ routineName(t.routine_id) }}
      </span>
      <span class="time">{{ t.time_start ?? formatDuration(t.duration_minutes) }}</span>
    </div>
    <div v-if="todayTasks.length === 0" class="empty">Нет рабочих/учебных дел и тренировок на сегодня</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { usePlannerStore } from '@/stores/planner'
import { useWorkoutsStore } from '@/stores/workouts'
import { TASK_TYPE_META } from '@/types'

const router = useRouter()
const { todayTasks: allTodayTasks } = storeToRefs(usePlannerStore())
const { routines } = storeToRefs(useWorkoutsStore())

// Именно СЕГОДНЯШНИЕ дела — не зависит от того, какой день открыт в планере
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

const routineName = (id?: string | null) => routines.value.find(r => r.id === id)?.name ?? 'Тренировка'
</script>

<style scoped>
.w-card { background: var(--bg-card); border: 0.5px solid var(--border); border-radius: 16px; padding: 15px 17px; height: 100%; box-sizing: border-box; }
.row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-top: 0.5px solid var(--border); cursor: pointer; }
.row:first-of-type { border-top: none; padding-top: 0; }
.row:hover .name { color: var(--accent); }
.dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.name { flex: 1; font-size: 12.5px; color: var(--text-primary); transition: color 0.15s; }
.time { font-size: 11px; color: var(--text-muted); }
.badge { font-size: 9.5px; font-weight: 600; padding: 1px 7px; border-radius: 980px; }
.empty { font-size: 12px; color: var(--text-muted); padding: 10px 0; text-align: center; }
</style>
