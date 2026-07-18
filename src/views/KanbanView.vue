<template>
  <div class="kanban-page">
    <div class="topbar">
      <div class="board-tabs">
        <button
          v-for="board in boards" :key="board.id"
          class="tab"
          :class="{ active: activeBoardId === board.id }"
          @click="selectBoard(board.id)"
        >
          {{ board.name }}
          <span v-if="activeBoardId === board.id"
            class="tab-del" @click.stop="deleteBoard(board.id)">×</span>
        </button>
        <button class="tab-add" @click="showBoardModal = true" :disabled="isSavingBoard">
          + Доска
        </button>
      </div>
    </div>

    <div class="board-area">
      <div v-if="loading" class="loading">Загружаем...</div>

      <template v-else>
        <KanbanColumn
          v-for="col in store.activeColumns" :key="col.id"
          :column="col"
          :cards="store.cards[col.id] ?? []"
          :drop-target="dropTargetColumnId"
          :drop-index="dropTargetIndex"
          @delete="deleteColumn"
          @update="updateColumn"
          @add-card="createCard"
          @edit-card="editingCard = $event"
          @delete-card="deleteCard"
          @drag-start="onMouseDragStart"
        />
        <button class="add-col-btn" @click="showColModal = true">
          + Новая колонка
        </button>
      </template>
    </div>

    <CardModal
      v-if="editingCard"
      :card="editingCard"
      @close="editingCard = null"
      @saving="isSavingCard = $event"
      @saved="onCardSaved"
    />

    <Teleport to="body" v-if="showBoardModal">
      <div class="overlay" @click.self="showBoardModal = false">
        <div class="mini-modal">
          <h3>Новая доска</h3>
          <input v-model="newBoardName" placeholder="Название доски" @keyup.enter="submitBoard" />
          <div class="mini-footer">
            <button class="btn-cancel" @click="showBoardModal = false">Отмена</button>
            <button class="btn-save" @click="submitBoard" :disabled="!newBoardName || isSavingBoard">Создать</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body" v-if="showColModal">
      <div class="overlay" @click.self="showColModal = false">
        <div class="mini-modal">
          <h3>Новая колонка</h3>
          <input v-model="newColName" placeholder="Название колонки" @keyup.enter="submitColumn" />
          <div class="color-row">
            <button v-for="c in COLORS" :key="c"
              class="color-swatch"
              :style="{ background: c }"
              :class="{ active: newColColor === c }"
              @click="newColColor = c"
            ></button>
          </div>
          <div class="mini-footer">
            <button class="btn-cancel" @click="showColModal = false">Отмена</button>
            <button class="btn-save" @click="submitColumn" :disabled="!newColName || isSavingColumn">Создать</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Confirm delete column -->
    <Teleport to="body" v-if="confirmDeleteColId">
      <div class="overlay" @click.self="confirmDeleteColId = null">
        <div class="mini-modal">
          <h3>Удалить колонку?</h3>
          <p class="confirm-text">Все карточки в этой колонке будут удалены.</p>
          <div class="mini-footer">
            <button class="btn-cancel" @click="confirmDeleteColId = null">Отмена</button>
            <button class="btn-danger" @click="confirmDeleteColumn">Удалить</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onActivated } from 'vue'
import { storeToRefs } from 'pinia'
import { useKanbanStore } from '@/stores/kanban'
import KanbanColumn from '@/components/kanban/KanbanColumn.vue'
import CardModal from '@/components/kanban/CardModal.vue'
import type { KanbanCard, KanbanColumn as KanbanColumnType } from '@/types/kanban'

const COLORS = ['#7AADD4','#1A7AE8','#EF9F27','#5A9C1A','#E24B4A','#9B59B6','#16A085','#E67E22']

const store = useKanbanStore()
const { boards, activeBoardId, loading } = storeToRefs(store)

const editingCard = ref<KanbanCard | null>(null)
const showBoardModal = ref(false)
const showColModal = ref(false)
const newBoardName = ref('')
const newColName = ref('')
const newColColor = ref('#1A7AE8')
const draggingCard = ref<KanbanCard | null>(null)
const draggingFromColumn = ref<string | null>(null)
const dropTargetColumnId = ref<string | null>(null)
const dropTargetIndex = ref<number | null>(null)
const confirmDeleteColId = ref<string | null>(null)
const isSavingCard = ref(false)
const isSavingBoard = ref(false)
const isSavingColumn = ref(false)

function onCardSaved() {
  editingCard.value = null
  isSavingCard.value = false
}

async function selectBoard(id: string) { await store.selectBoard(id) }
async function deleteBoard(id: string) { await store.deleteBoard(id) }

function deleteColumn(id: string) { confirmDeleteColId.value = id }
async function confirmDeleteColumn() {
  if (confirmDeleteColId.value) {
    await store.deleteColumn(confirmDeleteColId.value)
    confirmDeleteColId.value = null
  }
}

async function updateColumn(id: string, payload: Partial<KanbanColumnType>) {
  await store.updateColumn(id, payload)
}
async function createCard(columnId: string, title: string, deadline?: string) {
  await store.createCard(columnId, title, deadline)
}
async function deleteCard(cardId: string, columnId: string) {
  await store.deleteCard(cardId, columnId)
}

async function submitBoard() {
  if (!newBoardName.value.trim() || isSavingBoard.value) return
  isSavingBoard.value = true
  try {
    await store.createBoard(newBoardName.value.trim())
    newBoardName.value = ''
    showBoardModal.value = false
  } catch (e: any) {
    console.error('Ошибка создания доски:', e)
    alert('Ошибка создания доски: ' + (e?.message || e))
  } finally {
    isSavingBoard.value = false
  }
}

async function submitColumn() {
  if (!newColName.value.trim() || isSavingColumn.value) return
  isSavingColumn.value = true
  try {
    await store.createColumn(newColName.value.trim(), newColColor.value)
    newColName.value = ''
    newColColor.value = '#1A7AE8'
    showColModal.value = false
  } catch (e: any) {
    console.error('Ошибка создания колонки:', e)
    alert('Ошибка создания колонки: ' + (e?.message || e))
  } finally {
    isSavingColumn.value = false
  }
}

function onMouseDragStart(card: KanbanCard, event: MouseEvent, columnId: string) {
  draggingCard.value = card
  draggingFromColumn.value = columnId

  const cardEl = (event.target as HTMLElement).closest('.card') as HTMLElement
  if (cardEl) {
    cardEl.classList.add('dragging')
  }

  const getEventPoint = (e: MouseEvent | TouchEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }
    }
    if ('changedTouches' in e && e.changedTouches.length > 0) {
      return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY }
    }
    return { clientX: (e as MouseEvent).clientX, clientY: (e as MouseEvent).clientY }
  }

  const onMove = (e: MouseEvent | TouchEvent) => {
    const point = getEventPoint(e)
    const target = document.elementFromPoint(point.clientX, point.clientY)
    const columnEl = target?.closest('[data-column-id]') as HTMLElement
    if (columnEl) {
      dropTargetColumnId.value = columnEl.getAttribute('data-column-id')
      const cardEls = columnEl.querySelectorAll('.card:not(.dragging)')
      let idx: number | null = null
      for (let i = 0; i < cardEls.length; i++) {
        const rect = cardEls[i].getBoundingClientRect()
        if (point.clientY < rect.top + rect.height / 2) {
          idx = i
          break
        }
      }
      dropTargetIndex.value = idx !== null ? idx : (cardEls.length || 0)
    } else {
      dropTargetColumnId.value = null
      dropTargetIndex.value = null
    }
  }

  const onUp = (e: MouseEvent | TouchEvent) => {
    window.removeEventListener('mousemove', onMove as any)
    window.removeEventListener('mouseup', onUp as any)
    window.removeEventListener('touchmove', onMove as any)
    window.removeEventListener('touchend', onUp as any)

    dropTargetColumnId.value = null
    dropTargetIndex.value = null

    if (cardEl) {
      cardEl.classList.remove('dragging')
    }

    const point = getEventPoint(e)
    const target = document.elementFromPoint(point.clientX, point.clientY)
    const columnEl = target?.closest('[data-column-id]') as HTMLElement
    if (!columnEl || !draggingCard.value || !draggingFromColumn.value) {
      draggingCard.value = null
      draggingFromColumn.value = null
      return
    }

    const targetColumnId = columnEl.getAttribute('data-column-id')!
    const cardEls = columnEl.querySelectorAll('.card:not(.dragging)')
    let position = cardEls.length
    for (let i = 0; i < cardEls.length; i++) {
      const rect = cardEls[i].getBoundingClientRect()
      if (point.clientY < rect.top + rect.height / 2) {
        position = i
        break
      }
    }

    store.moveCard(draggingCard.value.id, draggingFromColumn.value, targetColumnId, position)
    draggingCard.value = null
    draggingFromColumn.value = null
  }

  window.addEventListener('mousemove', onMove as any)
  window.addEventListener('mouseup', onUp as any)
  window.addEventListener('touchmove', onMove as any, { passive: false })
  window.addEventListener('touchend', onUp as any)
}

onActivated(() => store.loadBoards())
</script>

<style scoped>
.kanban-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-primary);
}

.topbar {
  background: var(--bg-card);
  border-bottom: 0.5px solid var(--border);
  padding: 11px 16px;
  flex-shrink: 0;
}
.board-tabs { display: flex; gap: 5px; align-items: center; flex-wrap: wrap; }

.tab {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 13px; border-radius: 980px;
  font-size: 13px; font-weight: 500;
  cursor: pointer; border: 0.5px solid transparent;
  color: var(--text-secondary); background: none; transition: all 0.15s;
}
.tab.active { background: var(--accent); color: #fff; }
.tab:not(.active):hover { background: var(--accent-light); border-color: var(--text-muted); color: var(--accent); }
.tab-del { font-size: 16px; line-height: 1; opacity: 0.7; cursor: pointer; }
.tab-del:hover { opacity: 1; }

.tab-add {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 11px; border-radius: 980px;
  font-size: 13px; cursor: pointer;
  border: 0.5px dashed var(--text-muted); color: var(--text-muted); background: none;
}
.tab-add:hover { background: var(--accent-light); color: var(--accent); }

.board-area {
  display: flex;
  gap: 10px;
  padding: 16px;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  align-items: flex-start;
  width: 100%;
}

.loading { color: var(--text-muted); font-size: 14px; padding: 40px; }

.add-col-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 16px; border-radius: 14px;
  border: 0.5px dashed var(--text-muted);
  background: rgba(255,255,255,0.7);
  color: var(--text-muted); font-size: 13px; cursor: pointer;
  white-space: nowrap; height: fit-content; flex-shrink: 0;
  transition: all 0.15s;
}
.add-col-btn:hover { background: var(--bg-card); color: var(--accent); border-color: var(--accent); }

.add-col-btn:hover { background: var(--bg-card); color: var(--accent); border-color: var(--accent); }

/* ── Mobile ── */
@media (max-width: 768px) {
  .kanban-page {
    height: auto;
    overflow-y: auto;
  }
  .topbar {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .board-tabs {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .tab, .tab-add {
    font-size: 12px;
    padding: 5px 10px;
    flex-shrink: 0;
  }
  .board-area {
    padding: 12px;
    padding-bottom: 24px;
  }
}

.overlay {
  position: fixed; inset: 0; background: rgba(10,30,53,0.35);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; backdrop-filter: blur(4px);
}
.mini-modal {
  background: var(--bg-card); border-radius: 20px; padding: 22px;
  width: 320px; box-shadow: 0 20px 60px rgba(10,30,53,0.15);
}
.mini-modal h3 { font-size: 15px; font-weight: 500; color: var(--text-primary); margin-bottom: 14px; }
.confirm-text { font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; margin-top: -8px; }
.mini-modal input {
  width: 100%; padding: 9px 12px; border-radius: 10px;
  border: 1px solid var(--border); font-size: 14px; color: var(--text-primary);
  outline: none; box-sizing: border-box; margin-bottom: 12px;
  background: var(--bg-card);
}
.mini-modal input:focus { border-color: var(--accent); }
.color-row { display: flex; gap: 7px; margin-bottom: 14px; flex-wrap: wrap; }
.color-swatch {
  width: 22px; height: 22px; border-radius: 50%;
  border: 2px solid transparent; cursor: pointer; transition: transform 0.1s;
}
.color-swatch:hover { transform: scale(1.2); }
.color-swatch.active { border-color: var(--text-primary); }
.mini-footer { display: flex; gap: 8px; justify-content: flex-end; }
.btn-cancel {
  padding: 8px 16px; border-radius: 980px;
  border: 1px solid var(--border); background: none;
  font-size: 13px; color: var(--text-secondary); cursor: pointer;
}
.btn-save {
  padding: 8px 18px; border-radius: 980px; border: none;
  background: var(--accent); color: #fff; font-size: 13px; font-weight: 500; cursor: pointer;
}
.btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-danger {
  padding: 8px 18px; border-radius: 980px; border: none;
  background: var(--danger); color: #fff; font-size: 13px; font-weight: 500; cursor: pointer;
}
</style>
