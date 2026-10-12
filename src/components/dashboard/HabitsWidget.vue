<template>
  <div class="w-card">
    <div class="w-head">
      <span class="w-title">🔥 Сегодня</span>
      <span class="w-count">{{ checkedCount }} из {{ goodHabits.length }}</span>
    </div>
    <div class="row" v-for="h in goodHabits" :key="h.id">
      <button class="check" :class="{ on: isChecked(h.id) }" @click="toggle(h.id)">
        <IconCheck v-if="isChecked(h.id)" size="12" stroke="2.5" />
      </button>
      <span class="name" :class="{ done: isChecked(h.id) }">{{ h.name }}</span>
      <span class="pct" v-if="stats[h.id]">{{ stats[h.id].completion_percent }}%</span>
    </div>
    <div v-if="goodHabits.length === 0" class="empty">Нет хороших привычек</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { IconCheck } from '@tabler/icons-vue'
import { useHabitsStore } from '@/stores/habits'

const store = useHabitsStore()
const { habits, stats } = storeToRefs(store)
const goodHabits = computed(() => habits.value.filter(h => h.kind === 'good'))
const isChecked = (id: string) => store.isChecked(id)
const toggle = (id: string) => store.toggleCheck(id)
const checkedCount = computed(() => goodHabits.value.filter(h => isChecked(h.id)).length)
</script>

<style scoped>
.w-card { background: var(--bg-card); border: 0.5px solid var(--border); border-radius: 16px; padding: 15px 17px; height: 100%; box-sizing: border-box; }
.w-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.w-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.w-count { font-size: 11px; color: var(--text-muted); }
.row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-top: 0.5px solid var(--border); }
.row:first-of-type { border-top: none; padding-top: 0; }
.check {
  width: 22px; height: 22px; border-radius: 7px; border: 1.5px solid var(--border); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; background: none; color: #fff; cursor: pointer; padding: 0;
}
.check.on { background: var(--success); border-color: var(--success); }
.name { flex: 1; font-size: 12.5px; color: var(--text-primary); }
.name.done { color: var(--text-muted); text-decoration: line-through; }
.pct { font-size: 10.5px; color: var(--text-muted); font-weight: 500; }
.empty { font-size: 12px; color: var(--text-muted); padding: 10px 0; text-align: center; }
</style>
