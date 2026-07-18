<template>
  <Transition name="xp-toast">
    <div v-if="current" class="xp-toast" @click="dismiss">
      <div class="xp-toast-inner">
        <div class="xp-icon">✨</div>
        <div class="xp-content">
          <div class="xp-main">
            +{{ current.xp }} XP
            <span v-if="current.statLabel" class="xp-stat">
              → {{ current.statLabel }}
            </span>
          </div>
          <div v-if="current.levelUp" class="xp-levelup">
            🎉 Уровень {{ current.level }}!
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useXpToastStore } from '@/stores/xpToast'

const store = useXpToastStore()
const { current } = storeToRefs(store)

function dismiss() {
  store.dismiss()
}
</script>

<style scoped>
.xp-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  cursor: pointer;
}

@media (max-width: 768px) {
  .xp-toast {
    top: 0;
    right: 12px;
    padding-top: env(safe-area-inset-top, 20px);
  }
}

.xp-toast-inner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-card);
  border-radius: 14px;
  padding: 12px 20px;
  box-shadow: 0 4px 20px rgba(26, 122, 232, 0.2),
              0 0 0 1px rgba(26, 122, 232, 0.1);
  min-width: 180px;
}

.xp-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.xp-content {
  flex: 1;
}

.xp-main {
  font-size: 15px;
  font-weight: 700;
  color: var(--accent);
}

.xp-stat {
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 13px;
}

.xp-levelup {
  font-size: 12px;
  font-weight: 600;
  color: #E2A84B;
  margin-top: 3px;
}

/* Transition */
.xp-toast-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.xp-toast-leave-active {
  transition: all 0.25s ease-in;
}
.xp-toast-enter-from {
  opacity: 0;
  transform: translateX(60px) scale(0.8);
}
.xp-toast-leave-to {
  opacity: 0;
  transform: translateX(60px) scale(0.8);
}
</style>
