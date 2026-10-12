import type { Component } from 'vue'
import RoadmapWidget from './RoadmapWidget.vue'
import HabitsWidget from './HabitsWidget.vue'
import TasksWidget from './TasksWidget.vue'
import GoalsWidget from './GoalsWidget.vue'
import BalanceWidget from './BalanceWidget.vue'
import AchievementsWidget from './AchievementsWidget.vue'

export type WidgetType = 'roadmap' | 'habits' | 'tasks' | 'goals' | 'balance' | 'achievements'

export interface WidgetDef {
  title: string
  description: string
  defaultSpan: number
  component: Component
}

export const WIDGETS: Record<WidgetType, WidgetDef> = {
  roadmap:      { title: 'Роадмап',           description: 'Прогресс по этапам', defaultSpan: 2, component: RoadmapWidget },
  habits:       { title: 'Привычки сегодня',  description: 'Отметки хороших привычек', defaultSpan: 2, component: HabitsWidget },
  tasks:        { title: 'Дела и тренировки', description: 'Задачи на сегодня из планера', defaultSpan: 2, component: TasksWidget },
  goals:        { title: 'Цели',              description: 'Счётчики целей с кнопкой +1', defaultSpan: 3, component: GoalsWidget },
  balance:      { title: 'Финансы',           description: 'Баланс и итоги месяца', defaultSpan: 2, component: BalanceWidget },
  achievements: { title: 'Достижения',        description: 'Ближайшие достижения и награды', defaultSpan: 3, component: AchievementsWidget },
}

export const SPANS = [
  { value: 2, label: '⅓' },
  { value: 3, label: '½' },
  { value: 4, label: '⅔' },
  { value: 6, label: 'Вся' },
]
