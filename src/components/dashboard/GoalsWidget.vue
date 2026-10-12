<template>
  <div class="w-card">
    <div class="row" v-for="g in activeGoals" :key="g.id">
      <div class="info">
        <div class="name">{{ g.name }}</div>
        <div class="bar"><div class="fill" :style="{ width: pct(g) + '%' }"></div></div>
      </div>
      <span class="num">{{ g.current_count }}/{{ g.target_count }}</span>
      <button class="plus" title="Засчитать" @click="store.addProgress(g.id, 1)">+1</button>
    </div>
    <div v-if="activeGoals.length === 0" class="empty">
      {{ goals.length ? 'Все цели достигнуты 🏆' : 'Нет целей' }}
    </div>
    <RouterLink class="more" to="/goals">Все цели →</RouterLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import { useGoalsStore } from '@/stores/goals'
import type { Goal } from '@/types/goals'

const store = useGoalsStore()
const { goals } = storeToRefs(store)
const activeGoals = computed(() => goals.value.filter(g => !g.completed_at))
const pct = (g: Goal) => Math.min(100, Math.round((g.current_count / g.target_count) * 100))
</script>

<style scoped>
.w-card { background: var(--bg-card); border: 0.5px solid var(--border); border-radius: 16px; padding: 15px 17px; height: 100%; box-sizing: border-box; }
.row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-top: 0.5px solid var(--border); }
.row:first-of-type { border-top: none; padding-top: 0; }
.info { flex: 1; min-width: 0; }
.name { font-size: 12.5px; color: var(--text-primary); margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bar { height: 5px; border-radius: 980px; background: var(--border); overflow: hidden; }
.fill { height: 100%; background: var(--accent); border-radius: 980px; transition: width 0.2s; }
.num { font-size: 11px; color: var(--text-muted); }
.plus {
  padding: 4px 10px; border-radius: 980px; border: none; cursor: pointer;
  background: var(--accent-light); color: var(--accent); font-size: 12px; font-weight: 600;
}
.plus:hover { filter: brightness(0.95); }
.empty { font-size: 12px; color: var(--text-muted); padding: 10px 0; text-align: center; }
.more { display: block; margin-top: 10px; font-size: 11.5px; color: var(--accent); text-decoration: none; }
</style>
