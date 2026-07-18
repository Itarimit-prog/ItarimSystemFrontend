<template>
  <div class="finances-page">
    <div class="topbar">
      <span class="page-title">Финансы</span>
      <button class="add-btn" @click="openAddTransaction" :disabled="isSavingTransaction">+ Транзакция</button>
    </div>

    <div v-if="loading" class="loading">Загружаем...</div>

    <div v-else class="body">
      <!-- Левая часть: баланс + график + транзакции -->
      <div class="main">

        <!-- 3 карточки баланса -->
        <div class="balance-cards">
          <div class="bal-card">
            <div class="bal-label">Доходы</div>
            <div class="bal-val income">{{ formatAmount(balance.total_income) }}</div>
          </div>
          <div class="bal-card">
            <div class="bal-label">Расходы</div>
            <div class="bal-val expense">−{{ formatAmount(balance.total_expense) }}</div>
          </div>
          <div class="bal-card">
            <div class="bal-label">Баланс</div>
            <div class="bal-val" :class="balance.balance >= 0 ? 'pos' : 'neg'">
              {{ formatAmount(balance.balance) }}
            </div>
          </div>
        </div>

        <!-- График -->
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">Доходы и расходы</span>
            <div class="chart-tabs">
              <button
                v-for="tab in (['week', 'month'] as const)"
                :key="tab"
                class="ctab"
                :class="{ active: chartTab === tab }"
                @click="chartTab = tab"
              >{{ tab === 'week' ? 'Неделя' : 'Месяц' }}</button>
            </div>
          </div>
          <div class="chart-area">
            <div class="bar-wrap" v-for="(item, i) in chartData" :key="i">
              <div class="bar inc" :style="{ height: item.incH + 'px' }"></div>
              <div class="bar exp" :style="{ height: item.expH + 'px' }"></div>
            </div>
          </div>
          <div class="chart-months">
            <span class="month-lbl" v-for="(item, i) in chartData" :key="i">{{ item.label }}</span>
          </div>
          <div class="chart-legend">
            <div class="legend-item"><div class="legend-dot inc"></div> Доходы</div>
            <div class="legend-item"><div class="legend-dot exp"></div> Расходы</div>
          </div>
        </div>

        <!-- Список транзакций -->
        <div>
          <div class="txn-header">
            <span class="section-label">Транзакции</span>
            <div class="filter-tabs">
              <button
                v-for="f in filters"
                :key="f.key"
                class="ftab"
                :class="{ active: activeFilter === f.key }"
                @click="activeFilter = f.key"
              >{{ f.label }}</button>
            </div>
          </div>
          <div class="txn-list">
            <div class="txn-item" v-for="t in filteredTransactions" :key="t.id">
              <div class="txn-icon" :style="{ background: CATEGORY_META[t.category].bg }">
                {{ CATEGORY_META[t.category].icon }}
              </div>
              <div class="txn-info">
                <div class="txn-name">{{ t.description }}</div>
                <div class="txn-cat">{{ CATEGORY_META[t.category].label }} · {{ formatDate(t.date) }}</div>
              </div>
              <span class="txn-amount" :class="t.transaction_type === 'income' ? 'plus' : 'minus'">
                {{ t.transaction_type === 'income' ? '+' : '−' }}{{ formatAmount(t.amount) }}
              </span>
              <div class="txn-actions">
                <button class="icon-btn" @click="openEditTransaction(t)" title="Редактировать">
                  <IconPencil size="13" />
                </button>
                <button class="icon-btn del" @click="confirmDeleteTransaction(t.id)" title="Удалить">
                  <IconTrash size="13" />
                </button>
              </div>
            </div>
            <div v-if="filteredTransactions.length === 0" class="empty-state">Нет транзакций</div>
          </div>
        </div>
      </div>

      <!-- Правая часть: долги + категории -->
      <div class="right">
        <div class="section-label" style="margin-bottom:10px;">Долги</div>
        <div class="debt-tabs">
          <button class="dtab" :class="{ active: debtTab === 'owe' }" @click="debtTab = 'owe'">Я должен</button>
          <button class="dtab" :class="{ active: debtTab === 'owed' }" @click="debtTab = 'owed'">Мне должны</button>
        </div>

        <div class="debt-item" v-for="d in filteredDebts" :key="d.id">
          <div class="debt-top">
            <span class="debt-name">{{ d.name }}</span>
            <span class="debt-amount" :class="d.direction">
              {{ d.direction === 'owe' ? '−' : '+' }}{{ formatAmount(d.amount) }}
            </span>
          </div>
          <div class="debt-note" v-if="d.note">{{ d.note }}</div>
          <div class="debt-note" v-if="d.due_date">До {{ formatDate(d.due_date) }}</div>
          <div class="debt-actions">
            <button class="icon-btn" @click="openEditDebt(d)"><IconPencil size="11" /></button>
            <button class="icon-btn del" @click="confirmDeleteDebt(d.id)"><IconTrash size="11" /></button>
          </div>
        </div>
        <div v-if="filteredDebts.length === 0" class="debt-empty">Нет долгов</div>

        <button class="add-debt-btn" @click="openAddDebt" :disabled="isSavingDebt">
          <IconPlus size="12" /> Добавить долг
        </button>

        <div class="divider"></div>
        <div class="section-label" style="margin-bottom:10px;">Категории расходов</div>
        <div class="cat-list">
          <div class="cat-item" v-for="(meta, key) in expenseCategories" :key="key">
            <div class="cat-left">
              <span class="cat-icon">{{ CATEGORY_META[key as TransactionCategory].icon }}</span>
              <span class="cat-name">{{ CATEGORY_META[key as TransactionCategory].label }}</span>
            </div>
            <span class="cat-val">{{ formatAmount(meta.total) }}</span>
          </div>
          <div v-if="Object.keys(expenseCategories).length === 0" class="debt-empty">Нет расходов</div>
        </div>
      </div>
    </div>

    <!-- Модалки -->
    <TransactionModal
      v-if="showTransactionModal"
      :transaction="editingTransaction"
      @close="closeAll"
      @save="saveTransaction"
    />
    <DebtModal
      v-if="showDebtModal"
      :debt="editingDebt"
      @close="closeAll"
      @save="saveDebt"
    />

    <!-- Подтверждение удаления -->
    <Teleport to="body" v-if="showDeleteConfirm">
      <div class="overlay" @click.self="showDeleteConfirm = false">
        <div class="confirm-modal">
          <h3>Удалить?</h3>
          <p>Это действие нельзя отменить.</p>
          <div class="confirm-actions">
            <button class="btn-cancel" @click="showDeleteConfirm = false">Отмена</button>
            <button class="btn-danger" @click="runDelete">Удалить</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useFinancesStore } from '@/stores/finances'
import {
  CATEGORY_META, TRANSACTION_TYPE_META, DEBT_STATUS_META,
  type Transaction, type Debt, type TransactionCategory
} from '@/types/finances'
import TransactionModal from '@/components/finances/TransactionModal.vue'
import DebtModal from '@/components/finances/DebtModal.vue'
import { IconPencil, IconTrash, IconPlus } from '@tabler/icons-vue'

const store = useFinancesStore()
const { transactions, debts, balance, loading } = storeToRefs(store)

// Модалки
const showTransactionModal = ref(false)
const showDebtModal = ref(false)
const showDeleteConfirm = ref(false)
const editingTransaction = ref<Transaction | null>(null)
const editingDebt = ref<Debt | null>(null)
const deleteAction = ref<(() => Promise<void>) | null>(null)
const isSavingTransaction = ref(false)
const isSavingDebt = ref(false)

// Фильтры
const activeFilter = ref<'all' | 'income' | 'expense'>('all')
const filters = [
  { key: 'all' as const, label: 'Все' },
  { key: 'income' as const, label: 'Доходы' },
  { key: 'expense' as const, label: 'Расходы' },
]

const debtTab = ref<'owe' | 'owed'>('owe')
const chartTab = ref<'week' | 'month'>('week')

// ── Computed ──

const filteredTransactions = computed(() => {
  if (activeFilter.value === 'all') return transactions.value
  return transactions.value.filter(t => t.transaction_type === activeFilter.value)
})

const filteredDebts = computed(() =>
  debts.value.filter(d => d.direction === debtTab.value)
)

const expenseCategories = computed(() => {
  const map: Record<string, { total: number }> = {}
  for (const t of transactions.value) {
    if (t.transaction_type === 'expense') {
      if (!map[t.category]) map[t.category] = { total: 0 }
      map[t.category].total += t.amount
    }
  }
  return map
})

// Простой график — последние 7 / 30 дней
const chartData = computed(() => {
  const days = chartTab.value === 'week' ? 7 : 30
  const labels = chartTab.value === 'week'
    ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    : Array.from({ length: 30 }, (_, i) => String(i + 1))

  const buckets: { inc: number; exp: number }[] = Array.from({ length: days }, () => ({ inc: 0, exp: 0 }))
  const now = new Date()

  for (const t of transactions.value) {
    const d = new Date(t.date + 'T00:00')
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
    const idx = days - 1 - diff
    if (idx >= 0 && idx < days) {
      if (t.transaction_type === 'income') buckets[idx].inc += t.amount
      else buckets[idx].exp += t.amount
    }
  }

  const maxVal = Math.max(...buckets.map(b => Math.max(b.inc, b.exp)), 1)
  return buckets.map((b, i) => ({
    label: chartTab.value === 'week' ? labels[i] : (i % 5 === 0 ? labels[i] : ''),
    incH: Math.round((b.inc / maxVal) * 70),
    expH: Math.round((b.exp / maxVal) * 70),
  }))
})

// ── Helpers ──

function formatAmount(v: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.abs(v))
}
function formatDate(s: string) {
  return new Date(s + 'T00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

// ── Транзакции ──
function openAddTransaction() { editingTransaction.value = null; showTransactionModal.value = true }
function openEditTransaction(t: Transaction) { editingTransaction.value = t; showTransactionModal.value = true }

async function saveTransaction(data: any) {
  if (isSavingTransaction.value) return
  isSavingTransaction.value = true
  try {
    if (data.id) await store.updateTransaction(data.id, data)
    else await store.createTransaction(data)
    closeAll()
  } catch (err) {
    console.error('Ошибка сохранения транзакции:', err)
  } finally {
    isSavingTransaction.value = false
  }
}
function confirmDeleteTransaction(id: string) {
  deleteAction.value = () => store.deleteTransaction(id)
  showDeleteConfirm.value = true
}

// ── Долги ──
function openAddDebt() { editingDebt.value = null; showDebtModal.value = true }
function openEditDebt(d: Debt) { editingDebt.value = d; showDebtModal.value = true }

async function saveDebt(data: any) {
  if (isSavingDebt.value) return
  isSavingDebt.value = true
  try {
    if (data.id) await store.updateDebt(data.id, data)
    else await store.createDebt(data)
    closeAll()
  } catch (err) {
    console.error('Ошибка сохранения долга:', err)
  } finally {
    isSavingDebt.value = false
  }
}
function confirmDeleteDebt(id: string) {
  deleteAction.value = () => store.deleteDebt(id)
  showDeleteConfirm.value = true
}

async function runDelete() {
  if (deleteAction.value) await deleteAction.value()
  showDeleteConfirm.value = false
  deleteAction.value = null
}

function closeAll() {
  showTransactionModal.value = false
  showDebtModal.value = false
  editingTransaction.value = null
  editingDebt.value = null
}
</script>

<style scoped>
.finances-page {
  display: flex; flex-direction: column;
  width: 100%; height: 100vh; overflow: hidden;
  background: var(--bg-primary);
}

.topbar {
  background: var(--bg-card); border-bottom: 0.5px solid var(--border);
  padding: 12px 20px; display: flex; align-items: center;
  justify-content: space-between; flex-shrink: 0;
}
.page-title { font-size: 15px; font-weight: 500; color: var(--text-primary); }
.add-btn {
  padding: 6px 13px; border-radius: 980px; border: none;
  background: var(--accent); color: #fff; font-size: 12px; font-weight: 500; cursor: pointer;
}
.add-btn:hover { background: var(--accent-hover); }

.loading { color: var(--text-muted); font-size: 14px; padding: 40px 20px; }

.body {
  display: grid; grid-template-columns: 1fr 260px;
  flex: 1; overflow: hidden;
}

/* ── Левая часть ── */
.main { padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }

.balance-cards { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
.bal-card {
  background: var(--bg-card); border-radius: 14px; border: 0.5px solid var(--border);
  padding: 12px 14px;
}
.bal-label { font-size: 10px; font-weight: 500; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
.bal-val { font-size: 20px; font-weight: 500; letter-spacing: -0.4px; }
.bal-val.income { color: #3B6D11; }
.bal-val.expense { color: var(--danger); }
.bal-val.pos { color: var(--text-primary); }
.bal-val.neg { color: var(--danger); }

/* График */
.chart-card {
  background: var(--bg-card); border-radius: 14px; border: 0.5px solid var(--border); padding: 14px;
}
.chart-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.chart-title { font-size: 12px; font-weight: 500; color: var(--text-primary); }
.chart-tabs { display: flex; gap: 4px; }
.ctab { padding: 3px 9px; border-radius: 980px; font-size: 11px; cursor: pointer; border: 0.5px solid transparent; color: var(--text-muted); background: none; }
.ctab.active { background: var(--accent-light); color: var(--accent); border-color: var(--accent); }
.chart-area { display: flex; align-items: flex-end; gap: 4px; height: 80px; }
.bar-wrap { display: flex; gap: 2px; align-items: flex-end; flex: 1; }
.bar { border-radius: 4px 4px 0 0; flex: 1; min-height: 2px; }
.bar.inc { background: #C0DD97; }
.bar.exp { background: var(--danger-border); }
.chart-months { display: flex; gap: 4px; margin-top: 4px; }
.month-lbl { flex: 1; text-align: center; font-size: 10px; color: var(--text-muted); }
.chart-legend { display: flex; gap: 10px; margin-top: 8px; }
.legend-item { display: flex; align-items: center; gap: 4px; font-size: 10px; color: var(--text-muted); }
.legend-dot { width: 8px; height: 8px; border-radius: 2px; }
.legend-dot.inc { background: #C0DD97; }
.legend-dot.exp { background: var(--danger-border); }

/* Транзакции */
.section-label { font-size: 11px; font-weight: 500; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em; }
.txn-header { display: flex; align-items: center; justify-content: space-between; }
.filter-tabs { display: flex; gap: 4px; }
.ftab { padding: 3px 9px; border-radius: 980px; font-size: 11px; cursor: pointer; border: 0.5px solid transparent; color: var(--text-muted); background: none; }
.ftab.active { background: var(--accent-light); color: var(--accent); border-color: var(--accent); }

.txn-list { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
.txn-item {
  background: var(--bg-card); border-radius: 12px; border: 0.5px solid var(--border);
  padding: 10px 13px; display: flex; align-items: center; gap: 10px;
  transition: border-color 0.15s;
}
.txn-item:hover { border-color: var(--accent); }
.txn-item:hover .txn-actions { opacity: 1; }
.txn-icon { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 16px; }
.txn-info { flex: 1; min-width: 0; }
.txn-name { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.txn-cat { font-size: 11px; color: var(--text-muted); margin-top: 1px; }
.txn-amount { font-size: 13px; font-weight: 500; flex-shrink: 0; }
.txn-amount.plus { color: #3B6D11; }
.txn-amount.minus { color: var(--danger); }
.txn-actions { display: flex; gap: 2px; opacity: 0; transition: opacity 0.15s; }

.empty-state { font-size: 12px; color: var(--text-muted); padding: 20px; text-align: center; border: 0.5px dashed var(--border); border-radius: 12px; }

/* ── Правая панель ── */
.right {
  background: var(--bg-card); border-left: 0.5px solid var(--border);
  padding: 16px; overflow-y: auto; display: flex; flex-direction: column;
}

.debt-tabs { display: flex; gap: 4px; margin-bottom: 10px; }
.dtab { flex: 1; padding: 5px; border-radius: 9px; font-size: 11px; font-weight: 500; cursor: pointer; border: 0.5px solid var(--border); color: var(--text-muted); background: var(--bg-primary); text-align: center; }
.dtab.active { background: var(--accent-light); color: var(--accent); border-color: var(--accent); }

.debt-item { background: var(--bg-primary); border-radius: 11px; padding: 10px 12px; margin-bottom: 6px; }
.debt-item:hover .debt-actions { opacity: 1; }
.debt-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px; }
.debt-name { font-size: 12px; font-weight: 500; color: var(--text-primary); }
.debt-amount { font-size: 13px; font-weight: 500; }
.debt-amount.owe { color: var(--danger); }
.debt-amount.owed { color: #3B6D11; }
.debt-note { font-size: 10px; color: var(--text-muted); }
.debt-actions { display: flex; gap: 2px; opacity: 0; transition: opacity 0.15s; margin-top: 4px; }
.debt-empty { font-size: 11px; color: var(--text-muted); padding: 12px 0; }

.add-debt-btn {
  display: flex; align-items: center; justify-content: center; gap: 5px;
  width: 100%; padding: 7px; border-radius: 10px;
  border: 0.5px dashed var(--text-muted); background: none; color: var(--text-muted);
  font-size: 11px; cursor: pointer; margin-top: 6px;
}
.add-debt-btn:hover { background: var(--bg-primary); color: var(--accent); border-color: var(--accent); }

.divider { border: none; border-top: 0.5px solid var(--border); margin: 12px 0; }

.cat-list { display: flex; flex-direction: column; gap: 8px; }
.cat-item { display: flex; align-items: center; justify-content: space-between; }
.cat-left { display: flex; align-items: center; gap: 6px; }
.cat-icon { font-size: 14px; }
.cat-name { font-size: 12px; color: var(--text-primary); }
.cat-val { font-size: 12px; font-weight: 500; color: var(--danger); }

/* Кнопки действий */
.icon-btn {
  width: 22px; height: 22px; border-radius: 6px;
  border: none; background: none; color: var(--border);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.icon-btn:hover { background: var(--accent-light); color: var(--accent); }
.icon-btn.del:hover { background: var(--danger-light); color: var(--danger); }

/* Confirm modal */
.overlay {
  position: fixed; inset: 0; background: rgba(10,30,53,0.35);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
  backdrop-filter: blur(4px);
}
.confirm-modal {
  background: var(--bg-card); border-radius: 20px; padding: 24px;
  width: 300px; box-shadow: 0 20px 60px rgba(10,30,53,0.15);
}
.confirm-modal h3 { font-size: 15px; font-weight: 500; color: var(--text-primary); margin-bottom: 8px; }
.confirm-modal p { font-size: 13px; color: var(--text-secondary); margin-bottom: 18px; }
.confirm-actions { display: flex; gap: 8px; justify-content: flex-end; }
.btn-cancel { padding: 7px 14px; border-radius: 980px; border: 1px solid var(--border); background: none; font-size: 12px; color: var(--text-secondary); cursor: pointer; }
.btn-danger { padding: 7px 14px; border-radius: 980px; border: none; background: var(--danger); color: #fff; font-size: 12px; font-weight: 500; cursor: pointer; }

/* ── Mobile ── */
@media (max-width: 768px) {
  .finances-page {
    height: auto;
    overflow-y: auto;
  }
  .body {
    grid-template-columns: 1fr;
    overflow: visible;
  }
  .main { overflow: visible; }
  .right {
    overflow: visible;
    border-left: none;
    border-top: 0.5px solid var(--border);
  }
  .balance-cards {
    grid-template-columns: 1fr;
  }
}
.btn-danger { padding: 7px 14px; border-radius: 980px; border: none; background: var(--danger); color: #fff; font-size: 12px; font-weight: 500; cursor: pointer; }
</style>
