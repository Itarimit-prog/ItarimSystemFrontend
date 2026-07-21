<template>
  <div class="settings-page">
    <div class="topbar">
      <span class="page-title">Настройки</span>
    </div>

    <div class="body">
      <!-- Внешний вид -->
      <div class="section-label">Внешний вид</div>
      <div class="setting-card">
        <div class="setting-row">
          <span class="setting-name">Тёмная тема</span>
          <button
            class="toggle-btn"
            :class="{ active: settings.isDark }"
            @click="settings.toggle"
            aria-label="Переключить тёмную тему"
          >
            <span class="toggle-knob"></span>
          </button>
        </div>
        <div class="setting-hint">Фиолетовые акценты вместо голубых</div>
      </div>

      <!-- Данные -->
      <div class="section-label">Данные</div>
      <div class="setting-card danger-zone">
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-name">Сброс всего</span>
            <div class="setting-hint">Удалить все данные и сбросить приложение до заводских настроек</div>
          </div>
          <button class="btn-danger" @click="showResetConfirm = true">Сбросить</button>
        </div>
      </div>

      <!-- О приложении -->
      <div class="section-label">О приложении</div>
      <div class="setting-card">
        <div class="setting-row">
          <span class="setting-name">Версия</span>
          <span class="setting-value">1.0.0</span>
        </div>
      </div>
    </div>

    <!-- Модал подтверждения сброса -->
    <Teleport to="body" v-if="showResetConfirm">
      <div class="overlay" @click.self="showResetConfirm = false">
        <div class="confirm-modal">
          <h3>⚠️ Сбросить всё?</h3>
          <p>Все задачи, привычки, финансы, тренировки, доски канбана и прогресс профиля будут безвозвратно удалены.</p>
          <div class="confirm-actions">
            <button class="btn-cancel" @click="showResetConfirm = false">Отмена</button>
            <button class="btn-danger" @click="handleReset" :disabled="isResetting">
              {{ isResetting ? 'Сброс...' : 'Сбросить всё' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { systemApi } from '@/api'

const settings = useSettingsStore()

const showResetConfirm = ref(false)
const isResetting = ref(false)

async function handleReset() {
  isResetting.value = true
  try {
    // Сначала реально удаляем все данные на сервере — иначе диалог
    // обещает безвозвратное удаление, а на деле ничего не стирает
    await systemApi.resetAll()
    localStorage.clear()
    showResetConfirm.value = false
    // Небольшая задержка чтобы пользователь увидел закрытие модала
    setTimeout(() => {
      location.reload()
    }, 200)
  } catch (err) {
    console.error('Ошибка сброса:', err)
    alert('Не удалось выполнить сброс')
  } finally {
    isResetting.value = false
  }
}
</script>

<style scoped>
.settings-page {
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

.body {
  flex: 1; overflow-y: auto; padding: 20px;
  display: flex; flex-direction: column; gap: 16px;
  max-width: 640px; margin: 0 auto; width: 100%;
}

.section-label {
  font-size: 12px; font-weight: 600; color: var(--text-secondary);
  text-transform: uppercase; letter-spacing: 0.06em;
  padding: 0 4px;
}

.setting-card {
  background: var(--bg-card); border-radius: 16px;
  padding: 14px 16px;
  box-shadow: 0 1px 6px rgba(26,122,232,0.06);
}

.setting-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px;
}

.setting-info {
  flex: 1;
}

.setting-name {
  font-size: 14px; font-weight: 500; color: var(--text-primary);
}

.setting-hint {
  font-size: 12px; color: var(--text-muted); margin-top: 4px;
}

.setting-value {
  font-size: 13px; color: var(--text-secondary); font-weight: 500;
}

/* Toggle switch */
.toggle-btn {
  width: 48px; height: 28px; border-radius: 14px;
  border: none; background: var(--border); cursor: pointer;
  position: relative; transition: background 0.2s;
  flex-shrink: 0;
}
.toggle-btn.active { background: var(--accent); }
.toggle-knob {
  position: absolute; top: 3px; left: 3px;
  width: 22px; height: 22px; border-radius: 50%;
  background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  transition: transform 0.2s;
}
.toggle-btn.active .toggle-knob {
  transform: translateX(20px);
}

/* Danger zone */
.danger-zone {
  border: 0.5px solid rgba(226, 75, 74, 0.4);
}

.btn-danger {
  padding: 7px 14px; border-radius: 980px; border: none;
  background: var(--danger); color: #fff; font-size: 12px; font-weight: 500;
  cursor: pointer; flex-shrink: 0; transition: opacity 0.15s;
}
.btn-danger:hover { opacity: 0.85; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

/* Confirm modal */
.overlay {
  position: fixed; inset: 0; background: rgba(10,30,53,0.35);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; backdrop-filter: blur(4px);
}
.confirm-modal {
  background: var(--bg-card); border-radius: 20px; padding: 24px;
  width: 320px; box-shadow: 0 20px 60px rgba(10,30,53,0.15);
}
.confirm-modal h3 { font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; }
.confirm-modal p { font-size: 13px; color: var(--text-secondary); margin-bottom: 18px; line-height: 1.5; }
.confirm-actions { display: flex; gap: 8px; justify-content: flex-end; }
.btn-cancel {
  padding: 7px 14px; border-radius: 980px; border: 1px solid var(--border);
  background: none; font-size: 12px; color: var(--text-secondary); cursor: pointer;
}
.btn-cancel:hover { border-color: var(--accent); color: var(--accent); }

/* Mobile */
@media (max-width: 768px) {
  .settings-page {
    height: auto;
    overflow-y: auto;
  }
  .body {
    padding: 12px;
  }
}
</style>
