<template>
  <div class="profile-page">
    <div class="topbar">
      <span class="page-title">Профиль</span>
      <div class="topbar-actions">
        <button class="recalc-btn" @click="showResetConfirm = true" :disabled="loading">
          Сброс
        </button>
        <button class="recalc-btn" @click="handleRecalculate" :disabled="loading">
          {{ loading ? 'Пересчёт...' : '↻ Пересчитать' }}
        </button>
      </div>
    </div>

    <div v-if="loading && !profile" class="loading">Загружаем профиль...</div>

    <div v-else-if="profile" class="body">

      <!-- ── Индикатор пересчёта ── -->
      <div v-if="loading" class="loading-bar">Пересчитываем...</div>

      <!-- ── Карточка персонажа ── -->
      <div class="hero-card">
        <div class="hero-top">
          <div class="avatar-circle">
            <span class="avatar-level">{{ profile.level }}</span>
          </div>
          <div class="hero-info">
            <div class="hero-title">Уровень {{ profile.level }}</div>
            <div class="hero-subtitle">{{ heroTitle }}</div>
          </div>
          <div class="hero-xp-num">
            <span class="xp-value">{{ profile.total_xp }}</span>
            <span class="xp-label">XP</span>
          </div>
        </div>

        <div class="xp-bar-wrap">
          <div class="xp-bar">
            <div class="xp-fill" :style="{ width: xpProgressPct + '%' }"></div>
          </div>
          <div class="xp-bar-text">
            Ещё {{ profile.xp_to_next }} XP до уровня {{ profile.level + 1 }}
          </div>
        </div>
      </div>

      <!-- ── Характеристики ── -->
      <div class="section-label">Характеристики</div>
      <div class="stats-grid">
        <div
          v-for="stat in profile.stats"
          :key="stat.stat_key"
          class="stat-card"
        >
          <div class="stat-header">
            <span class="stat-icon">{{ statIcon(stat.stat_key) }}</span>
            <span class="stat-name">{{ statLabel(stat.stat_key) }}</span>
            <span class="stat-level" :style="{ color: statColor(stat.stat_key) }">
              Lv.{{ stat.level }}
            </span>
          </div>
          <div class="stat-bar">
            <div
              class="stat-fill"
              :style="{ width: statProgressPct(stat) + '%', background: statColor(stat.stat_key) }"
            ></div>
          </div>
          <div class="stat-xp-text">{{ stat.xp }} XP</div>
        </div>
      </div>

      <!-- ── Достижения ── -->
      <div class="section-label">
        Достижения
        <span class="ach-count">{{ achievements.length }}</span>
      </div>

      <div v-if="achievements.length === 0" class="empty-ach">
        Пока нет достижений. Выполняйте задачи, привычки и тренировки!
      </div>

      <div v-else class="ach-grid">
        <div
          v-for="ach in achievements"
          :key="ach.code"
          class="ach-card"
        >
          <span class="ach-icon">{{ ach.icon }}</span>
          <div class="ach-info">
            <div class="ach-title">{{ ach.title }}</div>
            <div class="ach-desc">{{ ach.description }}</div>
            <div class="ach-reward">+{{ ach.xp_reward }} XP</div>
          </div>
        </div>
      </div>

      <!-- ── Уведомление о новых достижениях ── -->
      <Transition name="fade">
        <div v-if="newUnlocks.length > 0" class="unlock-overlay" @click="dismissUnlocks">
          <div class="unlock-toast">
            <div class="unlock-label">🎉 Новое достижение!</div>
            <div v-for="ev in newUnlocks" :key="ev.achievement.code" class="unlock-item">
              <span class="unlock-icon">{{ ev.achievement.icon }}</span>
              <div class="unlock-text">
                <div class="unlock-title">{{ ev.achievement.title }}</div>
                <span class="unlock-xp">+{{ ev.xp_gained }} XP</span>
              </div>
            </div>
            <div class="unlock-hint">Нажмите, чтобы закрыть</div>
          </div>
        </div>
      </Transition>

      <!-- ── Подтверждение сброса ── -->
      <Teleport to="body" v-if="showResetConfirm">
        <div class="overlay" @click.self="showResetConfirm = false">
          <div class="confirm-modal">
            <h3>Сбросить прогресс?</h3>
            <p>Все уровни, XP и достижения будут обнулены. Это действие нельзя отменить.</p>
            <div class="confirm-actions">
              <button class="btn-cancel" @click="showResetConfirm = false">Отмена</button>
              <button class="btn-danger" @click="handleReset" :disabled="loading">
                {{ loading ? 'Сброс...' : 'Сбросить' }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/stores/profile'
import { STAT_LABELS, STAT_ICONS, STAT_COLORS } from '@/types/profile'
import type { Stat } from '@/types/profile'

const store = useProfileStore()
const { profile, achievements, loading, newUnlocks } = storeToRefs(store)

const showResetConfirm = ref(false)

const TITLES = [
  [1, 'Новичок'],
  [5, 'Ученик'],
  [10, 'Знающий'],
  [20, 'Опытный'],
  [35, 'Мастер'],
  [50, 'Гуру'],
  [75, 'Легенда'],
  [100, 'Божество'],
] as const

const heroTitle = computed(() => {
  const lvl = profile.value?.level ?? 1
  let title = 'Новичок'
  for (const [minLvl, t] of TITLES) {
    if (lvl >= minLvl) title = t
  }
  return title
})

const xpProgressPct = computed(() => {
  if (!profile.value) return 0
  const lvl = profile.value.level
  const xpForCurrent = (lvl * (lvl + 1) / 2) * 100
  const xpForNext = ((lvl + 1) * (lvl + 2) / 2) * 100
  const range = xpForNext - xpForCurrent
  if (range <= 0) return 100
  return Math.min(100, ((profile.value.total_xp - xpForCurrent) / range) * 100)
})

function statProgressPct(stat: Stat): number {
  const lvl = stat.level
  const xpForCurrent = (lvl * (lvl + 1) / 2) * 100
  const xpForNext = ((lvl + 1) * (lvl + 2) / 2) * 100
  const range = xpForNext - xpForCurrent
  if (range <= 0) return 100
  return Math.min(100, ((stat.xp - xpForCurrent) / range) * 100)
}

function statLabel(key: string) { return STAT_LABELS[key] ?? key }
function statIcon(key: string) { return STAT_ICONS[key] ?? '⭐' }
function statColor(key: string) { return STAT_COLORS[key] ?? '#1A7AE8' }

async function handleRecalculate() {
  loading.value = true
  try {
    await store.recalculate()
    await store.checkAchievements()
  } catch (err) {
    console.error('Ошибка пересчёта:', err)
  } finally {
    loading.value = false
  }
}

async function handleReset() {
  showResetConfirm.value = false
  try {
    await store.resetProfile()
  } catch (err) {
    console.error('Ошибка сброса:', err)
  }
}

function dismissUnlocks() {
  store.clearNewUnlocks()
}
</script>

<style scoped>
.profile-page {
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
.topbar-actions { display: flex; gap: 8px; }
.recalc-btn {
  padding: 6px 13px; border-radius: 980px; border: 1px solid var(--border);
  background: var(--bg-card); color: var(--text-secondary); font-size: 12px;
  font-weight: 500; cursor: pointer; transition: all 0.15s;
}
.recalc-btn:hover { border-color: var(--accent); color: var(--accent); }
.recalc-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.loading { color: var(--text-muted); font-size: 14px; padding: 40px 20px; }
.loading-bar {
  text-align: center; color: var(--text-secondary); font-size: 12px;
  padding: 8px; background: var(--accent-light); border-radius: 8px;
  margin-bottom: 12px;
}

.body {
  flex: 1; overflow-y: auto; padding: 20px;
  display: flex; flex-direction: column; gap: 16px;
  max-width: 640px; margin: 0 auto; width: 100%;
}

/* Hero Card */
.hero-card {
  background: var(--bg-card); border-radius: 20px;
  padding: 24px; box-shadow: 0 2px 12px rgba(26,122,232,0.08);
}
.hero-top {
  display: flex; align-items: center; gap: 16px;
  margin-bottom: 18px;
}
.avatar-circle {
  width: 64px; height: 64px; border-radius: 50%;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-gradient-end) 100%);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(26,122,232,0.3);
}
.avatar-level {
  color: #fff; font-size: 22px; font-weight: 700;
}
.hero-info { flex: 1; }
.hero-title { font-size: 18px; font-weight: 600; color: var(--text-primary); }
.hero-subtitle { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
.hero-xp-num { text-align: right; }
.xp-value { font-size: 22px; font-weight: 700; color: var(--accent); display: block; }
.xp-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

.xp-bar-wrap { margin-top: 2px; }
.xp-bar {
  height: 10px; background: var(--accent-light); border-radius: 6px;
  overflow: hidden;
}
.xp-fill {
  height: 100%; background: linear-gradient(90deg, var(--accent) 0%, var(--accent-gradient-end) 100%);
  border-radius: 6px; transition: width 0.4s ease;
}
.xp-bar-text {
  font-size: 11px; color: var(--text-muted); margin-top: 6px;
  text-align: center;
}

/* Section label */
.section-label {
  font-size: 12px; font-weight: 600; color: var(--text-secondary);
  text-transform: uppercase; letter-spacing: 0.06em;
  display: flex; align-items: center; gap: 8px;
  padding: 0 4px;
}
.ach-count {
  font-size: 11px; font-weight: 400; color: var(--text-muted);
}

/* Stats Grid */
.stats-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.stat-card {
  background: var(--bg-card); border-radius: 16px;
  padding: 14px 16px;
  box-shadow: 0 1px 6px rgba(26,122,232,0.06);
}
.stat-header {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 10px;
}
.stat-icon { font-size: 16px; }
.stat-name { font-size: 12px; font-weight: 500; color: var(--text-primary); flex: 1; }
.stat-level { font-size: 12px; font-weight: 700; }
.stat-bar {
  height: 7px; background: var(--accent-light); border-radius: 5px;
  overflow: hidden;
}
.stat-fill {
  height: 100%; border-radius: 5px;
  transition: width 0.4s ease;
}
.stat-xp-text {
  font-size: 10px; color: var(--text-muted); margin-top: 5px;
  text-align: right;
}

/* Achievements */
.ach-grid {
  display: flex; flex-direction: column; gap: 8px;
}
.ach-card {
  background: var(--bg-card); border-radius: 14px;
  padding: 12px 16px; display: flex; align-items: flex-start; gap: 12px;
  box-shadow: 0 1px 6px rgba(26,122,232,0.06);
}
.ach-icon { font-size: 28px; flex-shrink: 0; line-height: 1; margin-top: 2px; }
.ach-info { flex: 1; min-width: 0; }
.ach-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.ach-desc { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.ach-reward {
  font-size: 10px; color: var(--accent); font-weight: 600;
  margin-top: 4px; display: inline-block;
  background: var(--accent-light); padding: 2px 7px; border-radius: 6px;
}

.empty-ach {
  font-size: 13px; color: var(--text-muted); text-align: center;
  padding: 32px 20px;
  border: 0.5px dashed var(--border); border-radius: 16px;
  background: var(--bg-card);
}

/* Unlock overlay */
.unlock-overlay {
  position: fixed; inset: 0;
  background: rgba(10,30,53,0.55);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; cursor: pointer;
}
.unlock-toast {
  background: var(--bg-card); border-radius: 24px;
  padding: 28px 36px; max-width: 320px; width: 90%;
  text-align: center;
  box-shadow: 0 8px 40px rgba(26,122,232,0.25);
}
.unlock-label {
  font-size: 14px; font-weight: 600; color: var(--accent);
  margin-bottom: 16px;
}
.unlock-item {
  display: flex; align-items: flex-start; gap: 10px;
  text-align: left; margin-bottom: 12px;
}
.unlock-icon { font-size: 28px; flex-shrink: 0; line-height: 1.3; }
.unlock-text { flex: 1; min-width: 0; }
.unlock-title { font-size: 14px; font-weight: 600; color: var(--text-primary); line-height: 1.3; }
.unlock-xp { font-size: 11px; color: var(--success); font-weight: 600; display: inline-block; margin-top: 3px; }
.unlock-hint {
  font-size: 11px; color: var(--text-muted); margin-top: 14px;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Confirm modal */
.overlay {
  position: fixed; inset: 0; background: rgba(10,30,53,0.35);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; backdrop-filter: blur(4px);
}
.confirm-modal {
  background: var(--bg-card); border-radius: 20px; padding: 24px;
  width: 300px; box-shadow: 0 20px 60px rgba(10,30,53,0.15);
}
.confirm-modal h3 { font-size: 15px; font-weight: 500; color: var(--text-primary); margin-bottom: 8px; }
.confirm-modal p { font-size: 13px; color: var(--text-secondary); margin-bottom: 18px; }
.confirm-actions { display: flex; gap: 8px; justify-content: flex-end; }
.btn-cancel {
  padding: 7px 14px; border-radius: 980px; border: 1px solid var(--border);
  background: none; font-size: 12px; color: var(--text-secondary); cursor: pointer;
}
.btn-danger {
  padding: 7px 14px; border-radius: 980px; border: none;
  background: var(--danger); color: #fff; font-size: 12px; font-weight: 500; cursor: pointer;
}
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Mobile ── */
@media (max-width: 768px) {
  .profile-page {
    height: auto;
    overflow-y: auto;
  }
  .body {
    padding: 12px;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
