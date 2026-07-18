import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Transaction, Debt, Balance } from '@/types/finances'
import { financesApi } from '@/api'

export const useFinancesStore = defineStore('finances', () => {
  const transactions = ref<Transaction[]>([])
  const debts = ref<Debt[]>([])
  const balance = ref<Balance>({ total_income: 0, total_expense: 0, balance: 0 })
  const loading = ref(false)

  async function loadAll() {
    loading.value = true
    try {
      const [txns, dbs, bal] = await Promise.all([
        financesApi.getTransactions(),
        financesApi.getDebts(),
        financesApi.getBalance(),
      ])
      transactions.value = txns
      debts.value = dbs
      balance.value = bal
    } finally {
      loading.value = false
    }
  }

  // ── Транзакции (optimistic) ──

  async function createTransaction(payload: Omit<Transaction, 'id'>) {
    const tempId = 'temp-tx-' + Date.now()
    const optimistic: Transaction = { ...payload, id: tempId }

    transactions.value = [optimistic, ...transactions.value]
    // Оптимистично обновляем баланс
    if (payload.transaction_type === 'income') {
      balance.value = {
        ...balance.value,
        total_income: balance.value.total_income + payload.amount,
        balance: balance.value.balance + payload.amount,
      }
    } else {
      balance.value = {
        ...balance.value,
        total_expense: balance.value.total_expense + payload.amount,
        balance: balance.value.balance - payload.amount,
      }
    }

    try {
      const created = await financesApi.createTransaction(payload)
      transactions.value = transactions.value.map(t => t.id === tempId ? created : t)
      // Пересчитываем баланс точно
      balance.value = await financesApi.getBalance()
      return created
    } catch (e) {
      transactions.value = transactions.value.filter(t => t.id !== tempId)
      balance.value = await financesApi.getBalance()
      throw e
    }
  }

  async function updateTransaction(id: string, payload: Partial<Transaction>) {
    const idx = transactions.value.findIndex(t => t.id === id)
    if (idx === -1) return
    const oldTx = { ...transactions.value[idx] }
    const optimistic = { ...oldTx, ...payload }

    transactions.value = transactions.value.map(t => t.id === id ? optimistic : t)

    try {
      const updated = await financesApi.updateTransaction(id, payload)
      transactions.value = transactions.value.map(t => t.id === id ? updated : t)
      balance.value = await financesApi.getBalance()
      return updated
    } catch (e) {
      transactions.value = transactions.value.map(t => t.id === id ? oldTx : t)
      balance.value = await financesApi.getBalance()
      throw e
    }
  }

  async function deleteTransaction(id: string) {
    const idx = transactions.value.findIndex(t => t.id === id)
    if (idx === -1) return
    const oldTx = { ...transactions.value[idx] }
    const oldList = [...transactions.value]

    transactions.value = transactions.value.filter(t => t.id !== id)
    // Оптимистично обновляем баланс
    if (oldTx.transaction_type === 'income') {
      balance.value = {
        ...balance.value,
        total_income: balance.value.total_income - oldTx.amount,
        balance: balance.value.balance - oldTx.amount,
      }
    } else {
      balance.value = {
        ...balance.value,
        total_expense: balance.value.total_expense - oldTx.amount,
        balance: balance.value.balance + oldTx.amount,
      }
    }

    try {
      await financesApi.deleteTransaction(id)
    } catch (e) {
      transactions.value = oldList
      balance.value = await financesApi.getBalance()
      throw e
    }
  }

  // ── Долги (optimistic) ──

  async function createDebt(payload: Omit<Debt, 'id'>) {
    const tempId = 'temp-debt-' + Date.now()
    const optimistic: Debt = { ...payload, id: tempId }

    debts.value = [...debts.value, optimistic]

    try {
      const created = await financesApi.createDebt(payload)
      debts.value = debts.value.map(d => d.id === tempId ? created : d)
      return created
    } catch (e) {
      debts.value = debts.value.filter(d => d.id !== tempId)
      throw e
    }
  }

  async function updateDebt(id: string, payload: Partial<Debt>) {
    const idx = debts.value.findIndex(d => d.id === id)
    if (idx === -1) return
    const oldDebt = { ...debts.value[idx] }
    const optimistic = { ...oldDebt, ...payload }

    debts.value = debts.value.map(d => d.id === id ? optimistic : d)

    try {
      const updated = await financesApi.updateDebt(id, payload)
      debts.value = debts.value.map(d => d.id === id ? updated : d)
      return updated
    } catch (e) {
      debts.value = debts.value.map(d => d.id === id ? oldDebt : d)
      throw e
    }
  }

  async function deleteDebt(id: string) {
    const oldList = [...debts.value]
    debts.value = debts.value.filter(d => d.id !== id)

    try {
      await financesApi.deleteDebt(id)
    } catch (e) {
      debts.value = oldList
      throw e
    }
  }

  return {
    transactions, debts, balance, loading,
    loadAll, createTransaction, updateTransaction, deleteTransaction,
    createDebt, updateDebt, deleteDebt,
  }
})