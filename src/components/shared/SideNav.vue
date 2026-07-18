<template>
  <nav class="sidenav">
    <div class="nav-logo">
      <span class="logo-text">IS</span>
    </div>

    <RouterLink
        v-for="item in navItems" :key="item.to"
        :to="item.to"
        class="nav-item"
        :title="item.label"
        active-class="active"
    >
      <component :is="item.icon" size="22" stroke="1.5" />
      <span class="nav-tooltip">{{ item.label }}</span>
    </RouterLink>

    <div class="nav-spacer"></div>
    <div class="nav-divider"></div>

    <RouterLink
        to="/settings"
        class="nav-item"
        title="Настройки"
        active-class="active"
    >
      <IconSettings size="22" stroke="1.5" />
      <span class="nav-tooltip">Настройки</span>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import {
  IconCalendarWeek,
  IconRepeat,
  IconLayoutKanban,
  IconBarbell,
  IconWallet,
  IconSettings,
  IconUser,
} from '@tabler/icons-vue'

const navItems = [
  { to: '/planner',  icon: IconCalendarWeek, label: 'Планировщик' },
  { to: '/habits',   icon: IconRepeat,        label: 'Привычки' },
  { to: '/kanban',   icon: IconLayoutKanban,  label: 'Канбан' },
  { to: '/workouts', icon: IconBarbell,       label: 'Тренировки' },
  { to: '/finance',  icon: IconWallet,        label: 'Финансы' },
  { to: '/profile',  icon: IconUser,          label: 'Профиль' },
]
</script>

<style scoped>
.sidenav {
  width: 56px;
  min-width: 56px;
  height: 100vh;
  height: 100dvh; /* ← ДОБАВИТЬ ЭТУ СТРОКУ */
  background: var(--bg-sidebar);
  border-right: 0.5px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  padding-top: env(safe-area-inset-top, 12px); /* ← ДОБАВИТЬ ЭТУ СТРОКУ */
  gap: 2px;
  flex-shrink: 0;
}

.nav-logo {
  width: 34px; height: 34px; border-radius: 10px;
  background: var(--accent);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 12px; flex-shrink: 0;
}
.logo-text { color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }

.nav-item {
  width: 40px; height: 40px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--text-muted);
  border: none; background: none;
  text-decoration: none;
  position: relative;
  transition: background 0.15s, color 0.15s;
}
.nav-item:hover { background: var(--accent-light); color: var(--accent); }
.nav-item.active { background: var(--accent-light); color: var(--accent); }
.nav-item.active::before {
  content: '';
  position: absolute; left: -1px; top: 50%;
  transform: translateY(-50%);
  width: 3px; height: 20px;
  background: var(--accent); border-radius: 0 3px 3px 0;
}

.nav-tooltip {
  position: absolute;
  left: 52px;
  background: var(--text-primary);
  color: #fff;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 8px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;
  z-index: 100;
}
.nav-item:hover .nav-tooltip { opacity: 1; }

.nav-spacer { flex: 1; }
.nav-divider { width: 28px; height: 0.5px; background: var(--border); margin: 4px 0; }

/* ── Mobile bottom nav ── */
@media (max-width: 768px) {
  .sidenav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: auto;
    flex-direction: row;
    justify-content: space-around;
    align-items: flex-end;
    padding: 6px 8px env(safe-area-inset-bottom, 4px);
    border-right: none;
    border-top: 0.5px solid var(--border);
    z-index: 50;
    gap: 0;
    background: var(--bg-sidebar);
    /* Небольшой запас на случай долей пикселя расхождения safe-area,
       не 40px как было — просто перестраховка на пару пикселей */
    box-shadow: 0 4px 0 0 var(--bg-sidebar);
  }

  .nav-logo,
  .nav-spacer,
  .nav-divider {
    display: none;
  }

  .nav-item {
    width: 44px;
    height: 34px;
    border-radius: 10px;
    flex-direction: column;
  }

  .nav-item.active::before {
    display: none;
  }

  .nav-tooltip {
    display: none;
  }
}
</style>