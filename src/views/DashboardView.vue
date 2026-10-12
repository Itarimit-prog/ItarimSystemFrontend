<template>
  <div class="dashboard-page">
    <div class="topbar">
      <span class="page-title">Дашборд</span>
      <div class="top-actions">
        <template v-if="editing">
          <button class="btn-ghost" @click="showAdd = true" :disabled="store.missingTypes.length === 0">+ Виджет</button>
          <button class="btn-ghost" @click="store.reset()">Сбросить</button>
          <button class="btn-primary" @click="editing = false">Готово</button>
        </template>
        <button v-else class="btn-ghost" @click="editing = true">✎ Изменить</button>
      </div>
    </div>

    <div class="body">
      <div v-if="store.layout.length === 0" class="empty-board">
        Дашборд пуст.<br>
        <button class="btn-primary" @click="startAdding">+ Добавить виджет</button>
      </div>

      <div class="board" v-else>
        <div
          v-for="(w, i) in store.layout" :key="w.id"
          class="widget"
          :class="{ editing, dragging: dragIndex === i, 'drag-over': editing && overIndex === i && dragIndex !== i }"
          :style="{ '--span': w.span }"
          :draggable="editing"
          @dragstart="onDragStart(i)"
          @dragover.prevent="onDragOver(i)"
          @drop.prevent="onDrop(i)"
          @dragend="onDragEnd"
        >
          <div class="widget-head">
            <span class="widget-title">
              <span v-if="editing" class="grip" title="Перетащить">⠿</span>
              {{ WIDGETS[w.type].title }}
            </span>
            <div v-if="editing" class="widget-ctl">
              <button
                v-for="s in SPANS" :key="s.value"
                class="span-btn" :class="{ active: w.span === s.value }"
                :title="'Ширина: ' + s.label"
                @click="store.setSpan(w.id, s.value)"
              >{{ s.label }}</button>
              <button class="remove-btn" title="Убрать с дашборда" @click="store.remove(w.id)">×</button>
            </div>
          </div>
          <div class="widget-body" :class="{ inert: editing }">
            <component :is="WIDGETS[w.type].component" />
          </div>
        </div>
      </div>
    </div>

    <!-- Каталог виджетов -->
    <Teleport to="body" v-if="showAdd">
      <div class="overlay" @click.self="showAdd = false">
        <div class="mini-modal">
          <h3>Добавить виджет</h3>
          <button
            v-for="t in store.missingTypes" :key="t"
            class="catalog-item" @click="addWidget(t)"
          >
            <span class="cat-title">{{ WIDGETS[t].title }}</span>
            <span class="cat-desc">{{ WIDGETS[t].description }}</span>
          </button>
          <div v-if="store.missingTypes.length === 0" class="cat-empty">Все виджеты уже на дашборде</div>
          <div class="mini-footer">
            <button class="btn-cancel" @click="showAdd = false">Закрыть</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { WIDGETS, SPANS, type WidgetType } from '@/components/dashboard/registry'

const store = useDashboardStore()
const editing = ref(false)
const showAdd = ref(false)

function startAdding() {
  editing.value = true
  showAdd.value = true
}

function addWidget(type: WidgetType) {
  store.add(type)
  if (store.missingTypes.length === 0) showAdd.value = false
}

const dragIndex = ref<number | null>(null)
const overIndex = ref<number | null>(null)

function onDragStart(i: number) { if (editing.value) dragIndex.value = i }
function onDragOver(i: number) { if (editing.value) overIndex.value = i }
function onDrop(i: number) {
  if (editing.value && dragIndex.value !== null) store.move(dragIndex.value, i)
  onDragEnd()
}
function onDragEnd() {
  dragIndex.value = null
  overIndex.value = null
}
</script>

<style scoped>
.dashboard-page {
  display: flex; flex-direction: column;
  width: 100%; height: 100vh; overflow: hidden;
  background: var(--bg-primary);
}
.topbar {
  background: var(--bg-card); border-bottom: 0.5px solid var(--border);
  padding: 13px 20px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: space-between;
}
.page-title { font-size: 15px; font-weight: 500; color: var(--text-primary); letter-spacing: -0.2px; }
.top-actions { display: flex; gap: 8px; }
.btn-primary {
  padding: 7px 14px; border-radius: 980px; border: none;
  background: var(--accent); color: #fff; font-size: 13px; font-weight: 500; cursor: pointer;
}
.btn-ghost {
  padding: 7px 14px; border-radius: 980px; border: 0.5px solid var(--text-muted);
  background: var(--accent-light); color: var(--accent); font-size: 13px; font-weight: 500; cursor: pointer;
}
.btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }

.body { flex: 1; overflow-y: auto; padding: 20px; }

.board {
  display: grid; grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 16px; max-width: 1200px; margin: 0 auto; align-items: stretch;
}
.widget {
  grid-column: span var(--span);
  display: flex; flex-direction: column; min-width: 0;
  border-radius: 18px; transition: opacity 0.15s, background 0.15s;
}
.widget.editing { outline: 1.5px dashed var(--border); outline-offset: 4px; cursor: grab; }
.widget.dragging { opacity: 0.4; }
.widget.drag-over { background: var(--accent-light); }

.widget-head {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  margin-bottom: 10px; min-height: 22px;
}
.widget-title {
  font-size: 11px; font-weight: 600; color: var(--text-secondary);
  text-transform: uppercase; letter-spacing: .06em;
}
.grip { color: var(--text-muted); margin-right: 4px; font-size: 13px; }
.widget-ctl { display: flex; align-items: center; gap: 4px; }
.span-btn {
  min-width: 28px; padding: 3px 7px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--bg-card); color: var(--text-secondary); font-size: 11px; cursor: pointer;
}
.span-btn:hover { border-color: var(--accent); color: var(--accent); }
.span-btn.active { background: var(--accent-light); border-color: var(--accent); color: var(--accent); font-weight: 600; }
.remove-btn {
  width: 22px; height: 22px; border-radius: 8px; border: none; background: none;
  color: var(--text-muted); font-size: 16px; line-height: 1; cursor: pointer; margin-left: 2px;
}
.remove-btn:hover { background: var(--danger-light); color: var(--danger); }

.widget-body { flex: 1; min-height: 0; }
/* В режиме редактирования клики внутри виджета не срабатывают — виджет только перетаскивается */
.widget-body.inert { pointer-events: none; }

.empty-board {
  text-align: center; color: var(--text-muted); font-size: 14px; padding: 80px 0; line-height: 2.2;
}

.overlay {
  position: fixed; inset: 0; background: rgba(10,30,53,0.35);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; backdrop-filter: blur(4px);
}
.mini-modal {
  background: var(--bg-card); border-radius: 20px; padding: 22px;
  width: 360px; max-width: 92vw; box-shadow: 0 20px 60px rgba(10,30,53,0.15);
  display: flex; flex-direction: column; gap: 8px;
}
.mini-modal h3 { font-size: 15px; font-weight: 500; color: var(--text-primary); margin-bottom: 6px; }
.catalog-item {
  display: flex; flex-direction: column; align-items: flex-start; gap: 2px; text-align: left;
  padding: 10px 14px; border-radius: 12px; border: 1px solid var(--border);
  background: var(--bg-primary); cursor: pointer;
}
.catalog-item:hover { border-color: var(--accent); background: var(--accent-light); }
.cat-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.cat-desc { font-size: 11.5px; color: var(--text-muted); }
.cat-empty { font-size: 13px; color: var(--text-muted); padding: 10px 0; text-align: center; }
.mini-footer { display: flex; justify-content: flex-end; margin-top: 8px; }
.btn-cancel {
  padding: 8px 16px; border-radius: 980px; border: 1px solid var(--border);
  background: none; font-size: 13px; color: var(--text-secondary); cursor: pointer;
}

/* ── Mobile ── */
@media (max-width: 900px) {
  .board { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .widget { grid-column: span 2; }
}
@media (max-width: 768px) {
  .dashboard-page { height: auto; overflow-y: auto; }
  .body { padding: 12px; }
  .board { grid-template-columns: 1fr; }
  .widget { grid-column: auto; }
}
</style>
