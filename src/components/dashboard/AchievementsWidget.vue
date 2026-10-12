<template>
  <div class="w-card">
    <div class="head">Достигнуто {{ doneCount }} из {{ achievements.length }}</div>
    <div class="row" v-for="a in pending" :key="a.id">
      <img v-if="a.reward_photo" :src="a.reward_photo" class="photo" alt="" />
      <div class="info">
        <div class="name">{{ a.title }}</div>
        <div v-if="a.reward_name" class="reward">🎁 {{ a.reward_name }}</div>
      </div>
      <button class="reach" @click="store.update(a.id, { done: true })">Достиг</button>
    </div>
    <div v-if="pending.length === 0" class="empty">
      {{ achievements.length ? 'Все достижения получены 🏆' : 'Нет достижений' }}
    </div>
    <RouterLink class="more" to="/achievements">Все достижения →</RouterLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import { useAchievementsStore } from '@/stores/achievements'

const store = useAchievementsStore()
const { achievements } = storeToRefs(store)
const doneCount = computed(() => achievements.value.filter(a => a.done).length)
const pending = computed(() => achievements.value.filter(a => !a.done).slice(0, 4))
</script>

<style scoped>
.w-card { background: var(--bg-card); border: 0.5px solid var(--border); border-radius: 16px; padding: 15px 17px; height: 100%; box-sizing: border-box; }
.head { font-size: 11px; color: var(--text-muted); margin-bottom: 10px; }
.row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-top: 0.5px solid var(--border); }
.row:first-of-type { border-top: none; padding-top: 0; }
.photo { width: 34px; height: 34px; border-radius: 9px; object-fit: cover; flex-shrink: 0; }
.info { flex: 1; min-width: 0; }
.name { font-size: 12.5px; color: var(--text-primary); }
.reward { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.reach { padding: 4px 11px; border-radius: 980px; border: none; cursor: pointer; background: var(--accent); color: #fff; font-size: 11.5px; font-weight: 600; }
.empty { font-size: 12px; color: var(--text-muted); padding: 10px 0; text-align: center; }
.more { display: block; margin-top: 10px; font-size: 11.5px; color: var(--accent); text-decoration: none; }
</style>
