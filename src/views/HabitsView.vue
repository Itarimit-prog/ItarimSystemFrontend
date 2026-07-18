<template>
  <div class="habits-page">
    <div class="topbar">
      <span class="page-title">Привычки</span>
      <button class="add-btn" @click="openCreate" :disabled="isSaving">
        + Добавить
      </button>
    </div>

    <div v-if="loading" class="loading">Загружаем...</div>

    <div v-else class="body">
      <!-- ХОРОШИЕ -->
      <div>
        <div class="col-label">
          <div class="col-dot" style="background:#5A9C1A;"></div>
          <span class="col-title">Хорошие</span>
          <span class="col-count">{{ goodHabits.length }}</span>
        </div>
        <GoodHabitCard
          v-for="h in goodHabits" :key="h.id"
          :habit="h"
          @edit="openEdit"
        />
        <div v-if="goodHabits.length === 0" class="empty-col">
          Нет хороших привычек
        </div>
      </div>

      <!-- ПЛОХИЕ -->
      <div>
        <div class="col-label">
          <div class="col-dot" style="background:#E24B4A;"></div>
          <span class="col-title">Плохие</span>
          <span class="col-count">{{ badHabits.length }}</span>
        </div>
        <BadHabitCard
          v-for="h in badHabits" :key="h.id"
          :habit="h"
          @edit="openEdit"
        />
        <div v-if="badHabits.length === 0" class="empty-col">
          Нет плохих привычек
        </div>
      </div>
    </div>

    <HabitModal
      v-if="showModal"
      :habit="editingHabit"
      @close="showModal = false"
      @saving="isSaving = $event"
      @saved="onHabitSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useHabitsStore } from '@/stores/habits'
import GoodHabitCard from '@/components/habits/GoodHabitCard.vue'
import BadHabitCard from '@/components/habits/BadHabitCard.vue'
import HabitModal from '@/components/habits/HabitModal.vue'
import type { Habit } from '@/types/habits'

const store = useHabitsStore()
const { habits, loading } = storeToRefs(store)

const showModal = ref(false)
const editingHabit = ref<Habit | null>(null)
const isSaving = ref(false)

function onHabitSaved() {
  showModal.value = false
  isSaving.value = false
}

function openCreate() {
  editingHabit.value = null
  isSaving.value = false
  showModal.value = true
}

const goodHabits = computed(() => habits.value.filter(h => h.kind === 'good'))
const badHabits = computed(() => habits.value.filter(h => h.kind === 'bad'))

function openEdit(habit: Habit) {
  editingHabit.value = habit
  showModal.value = true
}
</script>

<style scoped>
.habits-page {
  display: flex; flex-direction: column;
  width: 100%; height: 100vh; overflow: hidden;
  background: var(--bg-primary);
}

.topbar {
  background: var(--bg-card); border-bottom: 0.5px solid var(--border);
  padding: 13px 20px; display: flex; align-items: center;
  justify-content: space-between; flex-shrink: 0;
}
.page-title { font-size: 15px; font-weight: 500; color: var(--text-primary); letter-spacing: -0.2px; }
.add-btn {
  padding: 6px 13px; border-radius: 980px; border: none;
  background: var(--accent); color: #fff; font-size: 12px;
  font-weight: 500; cursor: pointer;
}
.add-btn:hover { background: var(--accent-hover); }

.loading { color: var(--text-muted); font-size: 14px; padding: 40px 20px; }

.body {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 12px; padding: 16px; flex: 1;
  overflow-y: auto; align-items: start;
}

.col-label {
  display: flex; align-items: center; gap: 7px;
  margin-bottom: 10px; padding: 0 2px;
}
.col-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.col-title {
  font-size: 11px; font-weight: 500; color: var(--text-secondary);
  text-transform: uppercase; letter-spacing: 0.06em;
}
.col-count { font-size: 11px; color: var(--text-muted); margin-left: auto; }

.empty-col {
  font-size: 12px; color: var(--text-muted);
  padding: 20px; text-align: center;
  border: 0.5px dashed var(--border); border-radius: 14px;
}

/* ── Mobile ── */
@media (max-width: 768px) {
  .habits-page {
    height: auto;
    overflow-y: auto;
  }
  .body {
    grid-template-columns: 1fr;
    padding: 12px;
  }
}
</style>
