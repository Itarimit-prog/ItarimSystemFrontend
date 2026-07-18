<template>
  <div class="hcard">
    <div class="card-header">
      <div class="card-info">
        <div class="habit-name">{{ habit.name }}</div>
        <div v-if="habit.description" class="habit-desc">{{ habit.description }}</div>
      </div>
      <button class="edit-btn" @click="$emit('edit', habit)">
        <IconPencil size="14" stroke="1.5" aria-hidden="true" />
      </button>
    </div>

    <!-- Дни недели -->
    <div v-if="habit.freq_type === 'days'" class="days-row">
      <div v-for="(d, i) in DAY_NAMES" :key="i"
        class="day"
        :class="habit.freq_days?.includes(i) ? 'on' : 'off'"
      >{{ d }}</div>
    </div>

    <!-- Кратность в день -->
    <div v-else class="freq-line">
      Повторений в день: <b>{{ habit.freq_times }}×</b>
    </div>

    <!-- Чекбоксы -->
    <div class="checks">
      <template v-if="habit.freq_type === 'times'">
        <button
          v-for="i in (habit.freq_times ?? 1)"
          :key="i"
          class="check"
          :class="isChecked(habit.id, i - 1) ? 'done' : 'todo'"
          @click="toggle(i - 1)"
        >
          <IconCheck v-if="isChecked(habit.id, i - 1)" size="11" stroke="2" aria-hidden="true" />
          <IconCircle v-else size="11" stroke="1.5" aria-hidden="true" />
          {{ i }}-й приём
        </button>
      </template>
      <template v-else>
        <button
          class="check"
          :class="isChecked(habit.id) ? 'done' : 'todo'"
          @click="toggle(0)"
        >
          <IconCheck v-if="isChecked(habit.id)" size="11" stroke="2" aria-hidden="true" />
          <IconCircle v-else size="11" stroke="1.5" aria-hidden="true" />
          {{ isChecked(habit.id) ? 'Выполнено' : 'Отметить' }}
        </button>
      </template>
    </div>

    <!-- Прогресс -->
    <div class="progress-section">
      <span class="pct">{{ pct }}%</span>
      <div class="bar">
        <div class="bar-fill" :style="{ width: pct + '%', background: pct >= 80 ? 'var(--success)' : 'var(--accent)' }"></div>
      </div>
      <span class="pct-label">за месяц</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { IconPencil, IconCheck, IconCircle } from '@tabler/icons-vue'
import type { Habit } from '@/types/habits'
import { useHabitsStore } from '@/stores/habits'

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const props = defineProps<{ habit: Habit }>()
const emit = defineEmits<{ edit: [habit: Habit] }>()
const store = useHabitsStore()
const { stats } = storeToRefs(store)

const pct = computed(() => stats.value[props.habit.id]?.completion_percent ?? 0)

function isChecked(habitId: string, index = 0) { return store.isChecked(habitId, index) }
async function toggle(index: number) { await store.toggleCheck(props.habit.id, index) }
</script>

<style scoped>
.hcard {
  background: var(--bg-card); border-radius: 14px; border: 0.5px solid var(--border);
  padding: 13px 14px; margin-bottom: 8px; transition: border-color 0.15s;
}
.hcard:hover { border-color: var(--accent); }

.card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
.habit-name { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.habit-desc { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.edit-btn {
  color: var(--border); cursor: pointer; background: none; border: none;
  opacity: 0; padding: 2px; display: flex; align-items: center;
}
.hcard:hover .edit-btn { opacity: 1; }
.edit-btn:hover { color: var(--accent); }

.days-row { display: flex; gap: 3px; margin-bottom: 10px; }
.day {
  width: 24px; height: 24px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 500;
}
.day.on { background: var(--accent); color: #fff; }
.day.off { background: var(--bg-primary); color: var(--text-muted); }

.freq-line { font-size: 11px; color: var(--text-secondary); margin-bottom: 10px; }
.freq-line b { color: var(--accent); font-weight: 500; }

.checks { display: flex; gap: 5px; margin-bottom: 10px; flex-wrap: wrap; }
.check {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 9px; border-radius: 980px;
  font-size: 11px; font-weight: 500; cursor: pointer; border: none;
  transition: all 0.15s;
}
.check.done { background: var(--success-light); color: var(--success); }
.check.todo { background: var(--bg-primary); color: var(--text-muted); border: 0.5px solid var(--border); }
.check.todo:hover { background: var(--accent-light); color: var(--accent); border-color: var(--accent); }

.progress-section { display: flex; align-items: center; gap: 8px; }
.pct { font-size: 12px; font-weight: 500; color: var(--text-primary); min-width: 32px; }
.bar { flex: 1; height: 4px; background: var(--accent-light); border-radius: 4px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
.pct-label { font-size: 10px; color: var(--text-muted); }
</style>
