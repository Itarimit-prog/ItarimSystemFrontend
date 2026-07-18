import { createRouter, createWebHistory } from 'vue-router'
import PlannerView from '@/views/PlannerView.vue'
import KanbanView from '@/views/KanbanView.vue'
import HabitsView from '@/views/HabitsView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/planner' },
    { path: '/planner',  name: 'planner',  component: PlannerView },
    { path: '/kanban',   name: 'kanban',   component: KanbanView },
    { path: '/habits',   name: 'habits',   component: HabitsView },
    { path: '/workouts', name: 'workouts', component: () => import('@/views/WorkoutsView.vue') },
    { path: '/finance',  name: 'finance',  component: () => import('@/views/FinancesView.vue') },
    { path: '/profile',  name: 'profile',  component: () => import('@/views/ProfileView.vue') },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
  ]
})

export default router
