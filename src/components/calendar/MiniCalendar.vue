<template>
  <div class="mini-calendar">
    <div class="cal-header">
      <button class="nav-btn" @click="prevMonth">‹</button>
      <span class="month-label">{{ monthLabel }}</span>
      <button class="nav-btn" @click="nextMonth">›</button>
    </div>

    <div class="cal-grid">
      <div v-for="d in dayNames" :key="d" class="day-name">{{ d }}</div>
      <div v-for="(day, i) in calendarDays" :key="i"
        class="day-cell"
        :class="{
          empty: !day,
          today: day === todayStr,
          selected: day === selectedDate,
          'has-tasks': day && datesWithTasks.includes(day)
        }"
        @click="day && selectDate(day)"
      >
        {{ day ? new Date(day + 'T00:00').getDate() : '' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onActivated } from 'vue'
import { usePlannerStore } from '@/stores/planner'
import { storeToRefs } from 'pinia'

const store = usePlannerStore()
const { selectedDate, datesWithTasks } = storeToRefs(store)

function formatDateLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const todayStr = ref(formatDateLocal(new Date()))
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())

// Компонент живёт внутри <KeepAlive> — без этого "сегодня" замрёт
// на дате открытия приложения, если сессия оставлена открытой через полночь
onActivated(() => {
  todayStr.value = formatDateLocal(new Date())
})

const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const monthLabel = computed(() =>
  new Date(viewYear.value, viewMonth.value, 1)
    .toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
)

const calendarDays = computed(() => {
  const year = viewYear.value
  const month = viewMonth.value
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  let offset = firstDay.getDay() - 1
  if (offset < 0) offset = 6
  const days: (string | null)[] = Array(offset).fill(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }
  return days
})

function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
  else viewMonth.value--
}
function nextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
  else viewMonth.value++
}
function selectDate(date: string) { store.selectDate(date) }
</script>

<style scoped>
.mini-calendar { width: 100%; }

.cal-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}
.month-label {
  font-size: 14px; font-weight: 500; color: var(--text-primary); letter-spacing: -0.2px;
}
.nav-btn {
  background: none; border: none; font-size: 20px; color: var(--accent);
  cursor: pointer; width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; line-height: 1;
}
.nav-btn:hover { background: var(--accent-light); }

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
}

.day-name {
  font-size: 11px; color: var(--text-muted); text-align: center;
  padding: 4px 0; font-weight: 500;
}

.day-cell {
  font-size: 13px; text-align: center;
  padding: 7px 2px;
  border-radius: 9px; cursor: pointer;
  color: var(--calendar-days);
  position: relative; user-select: none;
  transition: background 0.1s;
}
.day-cell.empty { cursor: default; }
.day-cell:not(.empty):hover { background: var(--accent-light); }

.day-cell.today {
  background: var(--accent); color: #fff; font-weight: 500;
}
.day-cell.selected:not(.today) {
  background: var(--accent-light); color: var(--text-primary); font-weight: 500;
}
.day-cell.has-tasks::after {
  content: '';
  display: block; width: 4px; height: 4px;
  border-radius: 50%; background: var(--accent);
  margin: 2px auto 0;
}
.day-cell.today.has-tasks::after { background: rgba(255,255,255,0.7); }
</style>
