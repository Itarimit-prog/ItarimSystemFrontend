<template>
  <div class="w-card">
    <div class="big">{{ fmt(balance.balance) }}</div>
    <div class="label">Баланс</div>
    <div class="split">
      <div><span class="plus">+{{ fmt(balance.total_income) }}</span><span class="label">доходы за месяц</span></div>
      <div><span class="minus">−{{ fmt(balance.total_expense) }}</span><span class="label">расходы за месяц</span></div>
    </div>
    <RouterLink class="more" to="/finance">Финансы →</RouterLink>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import { useFinancesStore } from '@/stores/finances'

const { balance } = storeToRefs(useFinancesStore())
const fmt = (n: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(n)
</script>

<style scoped>
.w-card { background: var(--bg-card); border: 0.5px solid var(--border); border-radius: 16px; padding: 15px 17px; height: 100%; box-sizing: border-box; }
.big { font-size: 28px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.5px; }
.label { font-size: 11px; color: var(--text-muted); display: block; }
.split { display: flex; gap: 22px; margin-top: 14px; }
.split > div { display: flex; flex-direction: column; gap: 2px; }
.plus { font-size: 14px; font-weight: 600; color: var(--success); }
.minus { font-size: 14px; font-weight: 600; color: var(--danger); }
.more { display: block; margin-top: 12px; font-size: 11.5px; color: var(--accent); text-decoration: none; }
</style>
