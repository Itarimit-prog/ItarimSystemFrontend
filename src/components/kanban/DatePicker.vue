<template>
  <div class="date-picker" ref="pickerRef">
    <div class="input-wrapper" @click="toggleCalendar">
      <div class="input-content">
        <IconCalendar size="16" stroke="1.5" />
        <span v-if="modelValue">{{ formattedDate }}</span>
        <span v-else class="placeholder">Выберите дату</span>
      </div>
      <div class="arrow"> l </div>
    </div>

    <div v-if="isOpen" class="calendar-popover">
      <div class="calendar-header">
        <button @click="prevMonth"><IconChevronLeft size="18" /></button>
        <div class="current-month">{{ monthYear }}</div>
        <button @click="nextMonth"><IconChevronRight size="18" /></button>
      </div>

      <div class="calendar-grid">
        <div v-for="day in daysOfWeek" :key="day" class="weekday">{{ day }}</div>
        <div v-for="date in calendarDays" 
             :key="date.fullDate" 
             class="day-cell"
             :class="{ 
               'other-month': date.isOtherMonth, 
               'selected': date.fullDate === modelValue,
               'today': date.fullDate === today 
             }"
             @click="selectDate(date.fullDate)"
        >
          {{ date.day }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { IconCalendar, IconChevronLeft, IconChevronRight } from '@tabler/icons-vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const pickerRef = ref<HTMLElement | null>(null)
const viewDate = ref(new Date())

const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const today = formatDateLocal(new Date())

function handleClickOutside(event: MouseEvent) {
  if (pickerRef.value && !pickerRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function formatDateLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const formattedDate = computed(() => {
  if (!props.modelValue) return ''
  return new Date(props.modelValue + 'T00:00').toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long'
  })
})

const monthYear = computed(() => {
  return viewDate.value.toLocaleDateString('ru-RU', {
    month: 'long', year: 'numeric'
  })
})

const calendarDays = computed(() => {
  const days = []
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth()
  
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  
  // Находим начало недели (Понедельник)
  const startOffset = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1
  const startDate = new Date(firstDayOfMonth)
  startDate.setDate(1 - startOffset)

  for (let i = 0; i < 42; i++) {
    const current = new Date(startDate)
    current.setDate(startDate.getDate() + i)
    days.push({
      day: current.getDate(),
      fullDate: formatDateLocal(current),
      isOtherMonth: current.getMonth() !== month
    })
  }
  return days
})

function toggleCalendar() {
  isOpen.value = !isOpen.value
}

function prevMonth() {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, 1)
}

function nextMonth() {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1)
}

function selectDate(date: string) {
  emit('update:modelValue', date)
  isOpen.value = false
}
</script>

<style scoped>
.date-picker {
  position: relative;
  width: 100%;
  cursor: pointer;
}
.input-wrapper {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 12px; border-radius: 10px;
  border: 1px solid var(--border); background: var(--bg-card);
  transition: border-color 0.15s;
}
.input-wrapper:hover { border-color: var(--accent); }
.input-content {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; color: var(--text-primary);
}
.placeholder { color: var(--text-muted); }
.arrow { font-size: 10px; color: var(--border); pointer-events: none; }

.calendar-popover {
  position: absolute; top: calc(100% + 8px); left: 0;
  background: var(--bg-card); border-radius: 16px;
  box-shadow: 0 12px 30px rgba(10,30,53,0.15);
  border: 0.5px solid var(--border); z-index: 100;
  width: 280px; padding: 16px;
  animation: slideUp 0.2s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.calendar-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
}
.calendar-header .current-month {
  font-size: 14px; font-weight: 600; color: var(--text-primary);
}
.calendar-header button {
  background: none; border: none; cursor: pointer;
  color: var(--text-muted); padding: 4px; border-radius: 8px;
  transition: background 0.15s;
}
.calendar-header button:hover { background: var(--accent-light); color: var(--accent); }

.calendar-grid {
  display: grid; grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.weekday {
  text-align: center; font-size: 11px; font-weight: 600;
  color: var(--text-muted); margin-bottom: 8px;
}
.day-cell {
  aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
  font-size: 13px; cursor: pointer; border-radius: 8px;
  color: var(--text-primary); transition: all 0.1s;
}
.day-cell:hover:not(.other-month) { background: var(--accent-light); color: var(--accent); }
.day-cell.other-month { color: var(--border); }
.day-cell.today { 
  box-shadow: inset 0 0 0 1.5px var(--accent); 
  font-weight: 600;
}
.day-cell.selected {
  background: var(--accent) !important;
  color: #fff !important;
  border-radius: 8px;
}
</style>
