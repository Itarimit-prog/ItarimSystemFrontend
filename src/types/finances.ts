export type TransactionType = 'income' | 'expense'

export type TransactionCategory =
  | 'work' | 'food' | 'housing' | 'transport'
  | 'health' | 'education' | 'entertainment' | 'other'

export interface Transaction {
  id: string
  description: string
  amount: number
  transaction_type: TransactionType
  category: TransactionCategory
  date: string
}

export type DebtDirection = 'owe' | 'owed'
export type DebtStatus = 'active' | 'paid'

export interface Debt {
  id: string
  name: string
  amount: number
  direction: DebtDirection
  note?: string
  due_date?: string
  status: DebtStatus
}

export interface Balance {
  total_income: number
  total_expense: number
  balance: number
}

export const CATEGORY_META: Record<TransactionCategory, { label: string; icon: string; bg: string }> = {
  work:          { label: 'Работа',        icon: '💼', bg: '#EAF3DE' },
  food:          { label: 'Еда',           icon: '🛒', bg: '#FFF0F0' },
  housing:       { label: 'Жильё',         icon: '🏠', bg: '#EEF5FF' },
  transport:     { label: 'Транспорт',     icon: '🚗', bg: '#FFF0F0' },
  health:        { label: 'Здоровье',      icon: '💊', bg: '#FEF0D4' },
  education:     { label: 'Образование',   icon: '🎓', bg: '#FEF0D4' },
  entertainment: { label: 'Развлечения',   icon: '🎮', bg: '#F0F0FF' },
  other:         { label: 'Другое',        icon: '📦', bg: '#F5F5F4' },
}

export const TRANSACTION_TYPE_META: Record<TransactionType, { label: string; color: string; bg: string }> = {
  income:  { label: 'Доход',   color: '#3B6D11', bg: '#EAF3DE' },
  expense: { label: 'Расход',  color: '#E24B4A', bg: '#FCDCDC' },
}

export const DEBT_STATUS_META: Record<DebtStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Активен', color: '#9A6200', bg: '#FEF0D4' },
  paid:   { label: 'Погашен', color: '#3B6D11', bg: '#EAF3DE' },
}
