<template>
  <div id="app">
    <div v-if="initialLoading" class="splash-screen">
      <div class="splash-content">
        <div class="splash-logo">Itarim System</div>
        <div class="splash-spinner"></div>
        <div class="splash-text">Загрузка данных...</div>
      </div>
    </div>
    <template v-else>
      <div class="safe-area-bar"></div>
      <SideNav />
      <main class="main-content">
        <RouterView v-slot="{ Component }">
          <KeepAlive>
            <component :is="Component" />
          </KeepAlive>
        </RouterView>
      </main>
      <XpToast />

      <!-- Toast обновления PWA -->
      <Transition name="update-fade">
        <div v-if="updateReady" class="update-toast" @click="applyUpdate">
          <span class="update-text">🔄 Доступно обновление</span>
          <span class="update-hint">Нажмите, чтобы перезагрузить</span>
        </div>
      </Transition>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import SideNav from '@/components/shared/SideNav.vue'
import XpToast from '@/components/shared/XpToast.vue'
import { usePlannerStore } from '@/stores/planner'
import { useKanbanStore } from '@/stores/kanban'
import { useHabitsStore } from '@/stores/habits'
import { useWorkoutsStore } from '@/stores/workouts'
import { useFinancesStore } from '@/stores/finances'
import { useProfileStore } from '@/stores/profile'
import { useXpToastStore } from '@/stores/xpToast'
import { STAT_LABELS } from '@/types/profile'

const initialLoading = ref(true)
const updateReady = ref(false)
let waitingWorker: ServiceWorker | null = null

// Регистрация Service Worker + отслеживание обновлений
onMounted(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Новый SW ждёт активации
            updateReady.value = true
            waitingWorker = newWorker
          }
        })
      })
    }).catch((err) => {
      console.log('SW registration failed:', err)
    })

    // Также слушаем сообщения от SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'UPDATE_READY') {
        updateReady.value = true
      }
    })
  }
})

function applyUpdate() {
  if (waitingWorker) {
    waitingWorker.postMessage({ type: 'SKIP_WAITING' })
  }
  updateReady.value = false
  // Перезагружаем после небольшой задержки
  setTimeout(() => {
    window.location.reload()
  }, 100)
}

onMounted(async () => {
  const plannerStore = usePlannerStore()
  const kanbanStore = useKanbanStore()
  const habitsStore = useHabitsStore()
  const workoutsStore = useWorkoutsStore()
  const financesStore = useFinancesStore()
  const profileStore = useProfileStore()
  const xpToast = useXpToastStore()

  try {
    await Promise.all([
      plannerStore.loadWeekTasks(),
      plannerStore.loadDatesWithTasks(),
      plannerStore.loadTemplates(),
      kanbanStore.loadAll(),
      habitsStore.loadAll(),
      workoutsStore.loadAll(),
      financesStore.loadAll(),
      profileStore.loadAll(),
    ])
  } catch (e) {
    console.error('Ошибка начальной загрузки:', e)
  } finally {
    initialLoading.value = false
  }

  // Проверяем достижения в фоне после загрузки UI
  profileStore.checkAchievements().then(events => {
    if (events && events.length > 0) {
      for (const ev of events) {
        xpToast.show({
          xp: ev.xp_gained,
          statKey: ev.stat_gained ?? undefined,
          statLabel: ev.stat_gained ? (STAT_LABELS as any)[ev.stat_gained] : undefined,
        })
      }
    }
  }).catch(err => {
    console.error('Ошибка автопроверки достижений:', err)
  })
})
</script>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg-primary: #F2F7FC;
  --bg-card: #fff;
  --bg-sidebar: #fff;
  --text-primary: #0A1E35;
  --text-secondary: #5B8DB8;
  --text-muted: #7AADD4;
  --accent: #1A7AE8;
  --accent-light: #E0EEF9;
  --accent-hover: #1564C0;
  --border: #D6E8F7;
  --danger: #E24B4A;
  --danger-light: #FCDCDC;
  --danger-border: #F09595;
  --danger-hover: #F8E8E8;
  --success: #5A9C1A;
  --success-light: #EAF3DE;
  --success-border: #C0DD97;
  --warning: #FFB347;
  --calendar-days: #2B6CB0;
  --accent-gradient-end: #4A9DF8;
}

.dark {
  --bg-primary: #0A0E1A;
  --bg-card: #141824;
  --bg-sidebar: #141824;
  --text-primary: #E0E6F0;
  --text-secondary: #8B95B8;
  --text-muted: #6B7490;
  --accent: #7B61FF;
  --accent-light: #2A2050;
  --accent-hover: #9A85FF;
  --border: #2A3050;
  --danger: #FF5A5A;
  --danger-light: #3A1515;
  --danger-border: #5A2A2A;
  --danger-hover: #2A1010;
  --success: #7BCA3D;
  --success-light: #1A2E10;
  --success-border: #3A5A20;
  --warning: #FFB347;
  --calendar-days: #7B4FB0;
  --accent-gradient-end: #9A85FF;
}

html, body {
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: var(--bg-primary);
}

body {
  background: var(--bg-primary);
  font-family: -apple-system, 'SF Pro Display', sans-serif;
}

#app {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
  background: var(--bg-primary);
}

.main-content {
  flex: 1;
  min-width: 0;
  height: 100vh;
  height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--bg-primary);
}

@supports (padding-top: env(safe-area-inset-top)) {
  .main-content {
    padding-top: env(safe-area-inset-top);
  }
}

@media (max-width: 768px) {
  #app {
    flex-direction: column;
    height: 100vh;
    height: 100dvh;
  }

  .main-content {
    height: auto;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    order: 1;
    padding-bottom: calc(40px + env(safe-area-inset-bottom, 4px));
  }
}

/* Страховка специально для PWA-режима (открыто с иконки на домашнем экране):
   фон html/body в самом низу совпадает с цветом навбара,
   чтобы никакой синий фон не мог просвечивать в зоне safe-area */
@media (display-mode: standalone) and (max-width: 768px) {
  html, body {
    background: var(--bg-sidebar);
  }
}

.safe-area-bar {
  display: none;
}

@media (max-width: 768px) {
  .safe-area-bar {
    display: block;
    position: fixed;
    top: 0; left: 0; right: 0;
    height: env(safe-area-inset-top, 0px);
    background: var(--bg-primary);
    z-index: 999;
    flex-shrink: 0;
  }
}

.splash-screen {
  position: fixed;
  inset: 0;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.splash-logo {
  font-size: 32px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: -0.5px;
}

.splash-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--accent-light);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.splash-text {
  font-size: 14px;
  color: var(--text-secondary);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
.update-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9998;
  background: var(--accent);
  color: #fff;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: opacity 0.3s, transform 0.3s;
}

.update-hint {
  font-size: 11px;
  font-weight: 400;
  opacity: 0.8;
}

.update-fade-enter-active,
.update-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.update-fade-enter-from,
.update-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

@media (max-width: 768px) {
  .update-toast {
    top: env(safe-area-inset-top, 20px);
  }
}

</style>