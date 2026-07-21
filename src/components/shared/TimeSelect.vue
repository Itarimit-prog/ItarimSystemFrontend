<template>
  <div class="time-select">
    <select :value="hour" @change="onHourChange" aria-label="Часы">
      <option v-for="h in hours" :key="h" :value="h">{{ h }}</option>
    </select>
    <span class="colon">:</span>
    <select :value="minute" @change="onMinuteChange" aria-label="Минуты">
      <option v-for="m in minutes" :key="m" :value="m">{{ m }}</option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

const hour = computed(() => props.modelValue?.split(':')[0] ?? '09')
const minute = computed(() => {
  const m = props.modelValue?.split(':')[1] ?? '00'
  // Округляем до ближайших 5 минут, если значение пришло не кратным
  const rounded = Math.round(Number(m) / 5) * 5
  return String(rounded % 60).padStart(2, '0')
})

function onHourChange(e: Event) {
  const h = (e.target as HTMLSelectElement).value
  emit('update:modelValue', `${h}:${minute.value}`)
}
function onMinuteChange(e: Event) {
  const m = (e.target as HTMLSelectElement).value
  emit('update:modelValue', `${hour.value}:${m}`)
}
</script>

<style scoped>
.time-select {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 9px 10px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  box-sizing: border-box;
}
.time-select select {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
.colon {
  color: var(--text-muted);
  font-weight: 600;
}
</style>
