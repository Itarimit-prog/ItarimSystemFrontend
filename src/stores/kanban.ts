import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { boardsApi, columnsApi, cardsApi } from '@/api/kanban'
import type { Board, KanbanColumn, KanbanCard } from '@/types/kanban'

export const useKanbanStore = defineStore('kanban', () => {
  const boards = ref<Board[]>([])
  const columns = ref<KanbanColumn[]>([])
  const cards = ref<Record<string, KanbanCard[]>>({}) // column_id -> cards
  const activeBoardId = ref<string | null>(null)
  const loading = ref(false)

  // Колонки текущей доски (отсортированы по position)
  const activeColumns = computed(() =>
    columns.value
      .filter(c => c.board_id === activeBoardId.value)
      .sort((a, b) => a.position - b.position)
  )

  async function loadAll() {
    loading.value = true
    try {
      boards.value = await boardsApi.getAll()

      const allColumns: KanbanColumn[] = []
      const cardPromises: Promise<void>[] = []
      const newCards: Record<string, KanbanCard[]> = { ...cards.value }

      for (const board of boards.value) {
        const cols = await columnsApi.getByBoard(board.id)
        for (const col of cols) {
          allColumns.push(col)
          cardPromises.push(
            cardsApi.getByColumn(col.id).then(list => {
              newCards[col.id] = list
            })
          )
        }
      }

      await Promise.all(cardPromises)

      // Мерж колонок: обновляем существующие, добавляем новые, не удаляем остальные
      const merged = mergeColumns(columns.value, allColumns)
      columns.value = merged
      cards.value = newCards

      if (!activeBoardId.value && boards.value.length > 0) {
        activeBoardId.value = boards.value[0].id
      }
    } finally {
      loading.value = false
    }
  }

  async function loadBoards() {
    if (boards.value.length > 0 && activeBoardId.value) return
    boards.value = await boardsApi.getAll()
    if (boards.value.length && !activeBoardId.value) {
      activeBoardId.value = boards.value[0].id
    }
  }

  function selectBoard(boardId: string) {
    // Если данные уже загружены — просто переключаем, без запроса к API
    if (activeBoardId.value === boardId) return
    activeBoardId.value = boardId
  }

  async function createBoard(name: string) {
    const tempId = 'temp-board-' + Date.now()
    const optimisticBoard: Board = { id: tempId, name }

    // Optimistic: сразу добавляем и делаем активной
    boards.value = [...boards.value, optimisticBoard]
    const previousBoardId = activeBoardId.value
    activeBoardId.value = tempId

    try {
      const board = await boardsApi.create(name)
      // Заменяем временную доску на реальную
      boards.value = boards.value.map(b => b.id === tempId ? board : b)
      activeBoardId.value = board.id
    } catch (e) {
      // Rollback
      boards.value = boards.value.filter(b => b.id !== tempId)
      activeBoardId.value = previousBoardId
      throw e
    }
  }

  async function deleteBoard(id: string) {
    const oldBoards = [...boards.value]
    const oldColumns = [...columns.value]
    const oldCards = { ...cards.value }
    const oldActiveBoardId = activeBoardId.value

    const removedColIds = columns.value.filter(c => c.board_id === id).map(c => c.id)

    // Optimistic: сразу удаляем из UI
    boards.value = boards.value.filter(b => b.id !== id)
    columns.value = columns.value.filter(c => c.board_id !== id)
    const newCards = { ...cards.value }
    for (const colId of removedColIds) {
      delete newCards[colId]
    }
    cards.value = newCards

    if (activeBoardId.value === id) {
      activeBoardId.value = boards.value[0]?.id ?? null
    }

    try {
      await boardsApi.delete(id)
    } catch (e) {
      // Rollback
      boards.value = oldBoards
      columns.value = oldColumns
      cards.value = oldCards
      activeBoardId.value = oldActiveBoardId
      throw e
    }
  }

  async function createColumn(title: string, color: string, isCompleted: boolean = false) {
    if (!activeBoardId.value) throw new Error('Нет активной доски — выберите доску перед созданием колонки')
    const position = activeColumns.value.length
    const tempId = 'temp-col-' + Date.now()

    const optimisticColumn: KanbanColumn = {
      id: tempId,
      board_id: activeBoardId.value,
      title,
      color,
      position,
      is_completed_column: isCompleted
    }

    // Optimistic: сразу добавляем колонку и пустой массив карточек
    columns.value = [...columns.value, optimisticColumn]
    cards.value = { ...cards.value, [tempId]: [] }

    try {
      const col = await columnsApi.create({
        board_id: activeBoardId.value,
        title, color, position,
        is_completed_column: isCompleted
      })
      // Заменяем временную колонку на реальную
      columns.value = columns.value.map(c => c.id === tempId ? col : c)
      // Переносим карточки (пустой массив) под новый id
      const newCards = { ...cards.value }
      newCards[col.id] = newCards[tempId] ?? []
      delete newCards[tempId]
      cards.value = newCards
    } catch (e) {
      // Rollback
      columns.value = columns.value.filter(c => c.id !== tempId)
      const rollbackCards = { ...cards.value }
      delete rollbackCards[tempId]
      cards.value = rollbackCards
      throw e
    }
  }

  async function updateColumn(id: string, payload: Partial<KanbanColumn>) {
    const idx = columns.value.findIndex(c => c.id === id)
    if (idx === -1) return
    const oldColumn = { ...columns.value[idx] }
    const optimisticColumn = { ...oldColumn, ...payload }

    // Optimistic
    columns.value = columns.value.map(c => c.id === id ? optimisticColumn : c)

    try {
      const updated = await columnsApi.update(id, payload)
      columns.value = columns.value.map(c => c.id === id ? updated : c)
    } catch (e) {
      // Rollback
      columns.value = columns.value.map(c => c.id === id ? oldColumn : c)
      throw e
    }
  }

  async function deleteColumn(id: string) {
    const oldColumns = [...columns.value]
    const oldCards = { ...cards.value }

    // Optimistic: сразу удаляем
    columns.value = columns.value.filter(c => c.id !== id)
    const newCards = { ...cards.value }
    delete newCards[id]
    cards.value = newCards

    try {
      await columnsApi.delete(id)
    } catch (e) {
      // Rollback
      columns.value = oldColumns
      cards.value = oldCards
      throw e
    }
  }

  async function createCard(columnId: string, title: string, deadline?: string) {
    const list = cards.value[columnId] ?? []
    const position = list.length
    const tempId = 'temp-card-' + Date.now()

    const optimisticCard: KanbanCard = {
      id: tempId,
      column_id: columnId,
      title,
      deadline: deadline ?? null,
      position,
      completed: false,
      completed_at: null,
      task_id: null
    }

    // Optimistic update
    cards.value = { ...cards.value, [columnId]: [...list, optimisticCard] }

    try {
      const card = await cardsApi.create({
        column_id: columnId, title,
        deadline: deadline ?? null,
        position,
        completed: false,
        completed_at: null,
        task_id: null
      })
      // Replace temp card with real one
      const updatedList = cards.value[columnId].map(c => c.id === tempId ? card : c)
      cards.value = { ...cards.value, [columnId]: updatedList }
    } catch (e) {
      // Rollback
      cards.value = { ...cards.value, [columnId]: list }
      throw e
    }
  }

  async function updateCard(id: string, columnId: string, payload: Partial<KanbanCard>) {
    const list = cards.value[columnId] ?? []
    const idx = list.findIndex(c => c.id === id)
    if (idx === -1) return
    const oldCard = { ...list[idx] }
    const optimisticCard = { ...oldCard, ...payload }

    // Optimistic update
    cards.value = { ...cards.value, [columnId]: list.map(c => c.id === id ? optimisticCard : c) }

    try {
      const updated = await cardsApi.update(id, payload)
      cards.value = { ...cards.value, [columnId]: list.map(c => c.id === id ? updated : c) }
    } catch (e) {
      // Rollback
      cards.value = { ...cards.value, [columnId]: list.map(c => c.id === id ? oldCard : c) }
      throw e
    }
  }

  async function moveCard(cardId: string, fromColumnId: string, toColumnId: string, position: number) {
    const fromList = cards.value[fromColumnId] ?? []
    const cardIdx = fromList.findIndex(c => c.id === cardId)
    if (cardIdx === -1) return

    const originalToList = cards.value[toColumnId] ?? []
    const card = { ...fromList[cardIdx] }
    const newFromList = fromList.filter(c => c.id !== cardId)
    // Если колонка та же — базируемся на уже отфильтрованном списке,
    // иначе исходный toList не содержит перетаскиваемую карточку и её не нужно вычищать
    const toList = fromColumnId === toColumnId ? newFromList : originalToList
    const newToList = [...toList]
    newToList.splice(position, 0, card)

    // Оптимистично обновляем completed при переходе в/из завершающей колонки
    const toColumn = columns.value.find(c => c.id === toColumnId)
    const fromColumn = columns.value.find(c => c.id === fromColumnId)
    if (toColumn?.is_completed_column && !fromColumn?.is_completed_column) {
      card.completed = true
      card.completed_at = new Date().toISOString()
    } else if (fromColumn?.is_completed_column && !toColumn?.is_completed_column) {
      card.completed = false
      card.completed_at = null
    }

    cards.value = fromColumnId === toColumnId
      ? { ...cards.value, [toColumnId]: newToList }
      : { ...cards.value, [fromColumnId]: newFromList, [toColumnId]: newToList }

    try {
      const updated = await cardsApi.move(cardId, toColumnId, position)
      // Обновляем карточку из ответа API (completed, completed_at, position)
      const finalList = cards.value[toColumnId] ?? []
      const idx = finalList.findIndex(c => c.id === cardId)
      if (idx !== -1) {
        finalList[idx] = updated
        cards.value = { ...cards.value, [toColumnId]: [...finalList] }
      }
    } catch (e) {
      console.error('Failed to move card:', e)
      // Rollback
      cards.value = fromColumnId === toColumnId
        ? { ...cards.value, [toColumnId]: fromList }
        : { ...cards.value, [fromColumnId]: fromList, [toColumnId]: originalToList }
    }
  }

  async function deleteCard(id: string, columnId: string) {
    const list = cards.value[columnId] ?? []
    const newList = list.filter(c => c.id !== id)

    // Optimistic update
    cards.value = { ...cards.value, [columnId]: newList }

    try {
      await cardsApi.delete(id)
    } catch (e) {
      // Rollback
      cards.value = { ...cards.value, [columnId]: list }
      throw e
    }
  }

  return {
    boards, columns, cards, activeBoardId, loading, activeColumns,
    loadAll, loadBoards, selectBoard, createBoard, deleteBoard,
    createColumn, updateColumn, deleteColumn,
    createCard, updateCard, moveCard, deleteCard,
  }
})

// Хелпер: мерж двух массивов колонок (обновляем существующие, добавляем новые)
function mergeColumns(existing: KanbanColumn[], incoming: KanbanColumn[]): KanbanColumn[] {
  const map = new Map(existing.map(c => [c.id, c]))
  for (const col of incoming) {
    map.set(col.id, col)
  }
  return Array.from(map.values())
}
