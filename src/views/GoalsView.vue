<template>
  <div class="goals-page">
    <div class="topbar">
      <span class="page-title">Цели</span>
      <button class="btn-primary" @click="openCreate">+ Цель</button>
    </div>

    <div class="body">
      <div v-if="goals.length === 0" class="empty">
        Пока нет целей.<br>
        <span class="empty-hint">Создайте цель, задайте счётчик — например 100 — и кликайте при каждом выполнении</span>
      </div>

      <div v-for="g in goals" :key="g.id" class="goal-card" :class="{ done: !!g.completed_at }">
        <div class="goal-top">
          <div class="goal-info">
            <div class="goal-name">
              <span v-if="g.completed_at">🏆 </span>{{ g.name }}
            </div>
            <div v-if="g.description" class="goal-desc">{{ g.description }}</div>
          </div>
          <div class="goal-menu">
            <button class="icon-btn" title="Редактировать" @click="openEdit(g)">✎</button>
            <button class="icon-btn danger" title="Удалить" @click="askDelete(g)">×</button>
          </div>
        </div>

        <div class="counter-row">
          <button class="step-btn" :disabled="g.current_count === 0" @click="change(g, -1)" title="Минус один">−</button>
          <button class="click-btn" :disabled="!!g.completed_at" @click="change(g, 1)">
            <span class="click-count">{{ g.current_count }}</span>
            <span class="click-target">из {{ g.target_count }}</span>
            <span class="click-hint">{{ g.completed_at ? 'Цель достигнута!' : 'нажми, чтобы засчитать' }}</span>
          </button>
        </div>

        <div class="bar"><div class="bar-fill" :style="{ width: pct(g) + '%' }"></div></div>

        <div class="goal-bottom">
          <span class="pct">{{ pct(g) }}%</span>
          <RouterLink v-if="g.roadmap_id" class="road-link" :to="{ path: '/roadmaps', query: { id: g.roadmap_id } }">
            Роадмап цели · {{ stepsInfo(g.roadmap_id) }} →
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Создание / редактирование -->
    <Teleport to="body" v-if="showForm">
      <div class="overlay" @click.self="showForm = false">
        <div class="mini-modal">
          <h3>{{ editingId ? 'Редактировать цель' : 'Новая цель' }}</h3>
          <label>Название</label>
          <input v-model="form.name" placeholder="Например: Пробежать 100 км" />
          <label>Сколько раз нужно выполнить</label>
          <input v-model.number="form.target" type="number" min="1" placeholder="100" />
          <label>Описание (необязательно)</label>
          <input v-model="form.description" placeholder="Коротко о цели" @keyup.enter="submitForm" />
          <div class="mini-footer">
            <button class="btn-cancel" @click="showForm = false">Отмена</button>
            <button class="btn-save" :disabled="!canSubmit || busy" @click="submitForm">
              {{ editingId ? 'Сохранить' : 'Создать' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Подтверждение удаления -->
    <Teleport to="body" v-if="deleting">
      <div class="overlay" @click.self="deleting = null">
        <div class="mini-modal">
          <h3>Удалить цель?</h3>
          <p class="confirm-text">«{{ deleting.name }}» и её роадмап будут удалены без возможности восстановления.</p>
          <div class="mini-footer">
            <button class="btn-cancel" @click="deleting = null">Отмена</button>
            <button class="btn-danger" @click="confirmDelete">Удалить</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import { useGoalsStore } from '@/stores/goals'
import { useRoadmapStore } from '@/stores/roadmap'
import type { Goal } from '@/types/goals'

const store = useGoalsStore()
const { goals } = storeToRefs(store)
const { roadmaps } = storeToRefs(useRoadmapStore())

function pct(g: Goal) {
  return Math.min(100, Math.round((g.current_count / g.target_count) * 100))
}

function stepsInfo(roadmapId: string) {
  const r = roadmaps.value.find(x => x.id === roadmapId)
  if (!r) return '—'
  return `${r.steps.filter(s => s.done).length}/${r.steps.length} этапов`
}

async function change(g: Goal, delta: number) {
  try {
    await store.addProgress(g.id, delta)
  } catch (err) {
    console.error('Ошибка обновления счётчика цели:', err)
  }
}

const showForm = ref(false)
const editingId = ref<string | null>(null)
const busy = ref(false)
const form = reactive({ name: '', target: 100, description: '' })

const canSubmit = computed(() => form.name.trim().length > 0 && Number.isInteger(form.target) && form.target >= 1)

function openCreate() {
  editingId.value = null
  Object.assign(form, { name: '', target: 100, description: '' })
  showForm.value = true
}

function openEdit(g: Goal) {
  editingId.value = g.id
  Object.assign(form, { name: g.name, target: g.target_count, description: g.description ?? '' })
  showForm.value = true
}

async function submitForm() {
  if (!canSubmit.value || busy.value) return
  busy.value = true
  try {
    if (editingId.value) {
      await store.updateGoal(editingId.value, {
        name: form.name.trim(),
        target_count: form.target,
        description: form.description.trim() || null,
      })
    } else {
      await store.createGoal(form.name.trim(), form.target, form.description.trim())
    }
    showForm.value = false
  } catch (err) {
    console.error('Ошибка сохранения цели:', err)
  } finally {
    busy.value = false
  }
}

const deleting = ref<Goal | null>(null)
function askDelete(g: Goal) { deleting.value = g }
async function confirmDelete() {
  if (!deleting.value) return
  try {
    await store.deleteGoal(deleting.value.id)
    deleting.value = null
  } catch (err) {
    console.error('Ошибка удаления цели:', err)
  }
}
</script>

<style scoped>
.goals-page {
  display: flex; flex-direction: column;
  width: 100%; height: 100vh; overflow: hidden; background: var(--bg-primary);
}
.topbar {
  background: var(--bg-card); border-bottom: 0.5px solid var(--border);
  padding: 13px 20px; display: flex; align-items: center;
  justify-content: space-between; flex-shrink: 0;
}
.page-title { font-size: 15px; font-weight: 500; color: var(--text-primary); letter-spacing: -0.2px; }
.btn-primary {
  padding: 7px 14px; border-radius: 980px; border: none;
  background: var(--accent); color: #fff; font-size: 13px; font-weight: 500; cursor: pointer;
}
.btn-primary:hover { background: var(--accent-hover); }

.body {
  flex: 1; overflow-y: auto; padding: 20px;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px; align-content: start;
}
.empty {
  grid-column: 1 / -1; text-align: center; color: var(--text-muted);
  font-size: 14px; padding: 60px 0; line-height: 1.6;
}
.empty-hint { font-size: 12px; }

.goal-card {
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 18px;
  padding: 16px 18px; display: flex; flex-direction: column; gap: 14px;
  box-shadow: 0 1px 6px rgba(26,122,232,0.06);
}
.goal-card.done { border-color: var(--success-border); }
.goal-top { display: flex; justify-content: space-between; gap: 10px; }
.goal-info { min-width: 0; }
.goal-name { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.goal-desc { font-size: 12px; color: var(--text-muted); margin-top: 3px; }
.goal-menu { display: flex; gap: 2px; flex-shrink: 0; }
.icon-btn {
  width: 26px; height: 26px; border-radius: 8px; border: none; background: none;
  color: var(--text-muted); font-size: 16px; cursor: pointer; line-height: 1;
}
.icon-btn:hover { background: var(--accent-light); color: var(--accent); }
.icon-btn.danger:hover { background: var(--danger-light); color: var(--danger); }

.counter-row { display: flex; align-items: stretch; gap: 10px; }
.step-btn {
  width: 44px; border-radius: 14px; border: 1px solid var(--border);
  background: var(--bg-primary); color: var(--text-secondary); font-size: 20px; cursor: pointer;
}
.step-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.step-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.click-btn {
  flex: 1; border-radius: 14px; border: none; cursor: pointer;
  background: var(--accent-light); color: var(--accent);
  padding: 12px 10px; display: flex; flex-direction: column; align-items: center; gap: 2px;
  transition: transform 0.08s, filter 0.15s; user-select: none; -webkit-user-select: none;
}
.click-btn:hover:not(:disabled) { filter: brightness(0.96); }
.click-btn:active:not(:disabled) { transform: scale(0.97); }
.click-btn:disabled { cursor: default; background: var(--success-light); color: var(--success); }
.click-count { font-size: 34px; font-weight: 700; line-height: 1; }
.click-target { font-size: 12px; opacity: 0.8; }
.click-hint { font-size: 10.5px; opacity: 0.7; margin-top: 2px; }

.bar { height: 7px; border-radius: 980px; background: var(--border); overflow: hidden; }
.bar-fill { height: 100%; background: var(--accent); border-radius: 980px; transition: width 0.2s; }
.goal-card.done .bar-fill { background: var(--success); }

.goal-bottom { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.pct { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
.road-link { font-size: 12px; color: var(--accent); text-decoration: none; }
.road-link:hover { text-decoration: underline; }

.overlay {
  position: fixed; inset: 0; background: rgba(10,30,53,0.35);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; backdrop-filter: blur(4px);
}
.mini-modal {
  background: var(--bg-card); border-radius: 20px; padding: 22px;
  width: 340px; max-width: 90vw; box-shadow: 0 20px 60px rgba(10,30,53,0.15);
}
.mini-modal h3 { font-size: 15px; font-weight: 500; color: var(--text-primary); margin-bottom: 14px; }
.mini-modal label { display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 5px; font-weight: 500; }
.confirm-text { font-size: 13px; color: var(--text-secondary); margin-bottom: 18px; margin-top: -6px; }
.mini-modal input {
  width: 100%; padding: 9px 12px; border-radius: 10px;
  border: 1px solid var(--border); font-size: 14px; color: var(--text-primary);
  outline: none; box-sizing: border-box; margin-bottom: 14px; background: var(--bg-card);
}
.mini-modal input:focus { border-color: var(--accent); }
.mini-footer { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
.btn-cancel {
  padding: 8px 16px; border-radius: 980px; border: 1px solid var(--border);
  background: none; font-size: 13px; color: var(--text-secondary); cursor: pointer;
}
.btn-save {
  padding: 8px 18px; border-radius: 980px; border: none;
  background: var(--accent); color: #fff; font-size: 13px; font-weight: 500; cursor: pointer;
}
.btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-danger {
  padding: 8px 18px; border-radius: 980px; border: none;
  background: var(--danger); color: #fff; font-size: 13px; font-weight: 500; cursor: pointer;
}

@media (max-width: 768px) {
  .goals-page { height: auto; min-height: 100vh; overflow: visible; }
  .body { padding: 14px; grid-template-columns: 1fr; }
}
</style>
