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
  work:          { label: 'Работа',        icon: '💼', bg: 'var(--success-light)' },
  food:          { label: 'Еда',           icon: '🛒', bg: 'var(--danger-light)' },
  housing:       { label: 'Жильё',         icon: '🏠', bg: 'var(--accent-light)' },
  transport:     { label: 'Транспорт',     icon: '🚗', bg: 'var(--danger-light)' },
  health:        { label: 'Здоровье',      icon: '💊', bg: 'var(--tag-amber-bg)' },
  education:     { label: 'Образование',   icon: '🎓', bg: 'var(--tag-amber-bg)' },
  entertainment: { label: 'Развлечения',   icon: '🎮', bg: 'var(--tag-purple-bg)' },
  other:         { label: 'Другое',        icon: '📦', bg: 'var(--tag-gray-bg)' },
}

export const TRANSACTION_TYPE_META: Record<TransactionType, { label: string; color: string; bg: string }> = {
  income:  { label: 'Доход',   color: 'var(--success)', bg: 'var(--success-light)' },
  expense: { label: 'Расход',  color: 'var(--danger)',  bg: 'var(--danger-light)' },
}

export const DEBT_STATUS_META: Record<DebtStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Активен', color: 'var(--tag-amber-text)', bg: 'var(--tag-amber-bg)' },
  paid:   { label: 'Погашен', color: 'var(--success)',        bg: 'var(--success-light)' },
}
