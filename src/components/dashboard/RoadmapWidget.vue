<template>
  <div class="roadmap-widget">
    <div class="roadmap-head">
      <div class="roadmap-switch">
        <button
          v-for="r in roadmaps" :key="r.id"
          class="rm-pill"
          :class="{ active: r.id === activeRoadmapId }"
          @click="store.selectRoadmap(r.id)"
        >{{ r.name }}</button>
        <button class="rm-pill new" @click="createNewRoadmap">+</button>
      </div>
      <button v-if="activeRoadmap" class="rm-edit-btn" :class="{ active: editing }" @click="editing = !editing" title="Редактировать этапы">
        <IconPencil size="14" stroke="1.5" />
      </button>
    </div>

    <div v-if="!activeRoadmap" class="rm-empty">
      Нет ни одного roadmap. Создайте первый, чтобы отслеживать прогресс.
    </div>

    <template v-else>
      <div class="roadmap-meta">
        <span class="roadmap-name">{{ activeRoadmap.name }}</span>
        <span class="roadmap-pct" v-if="activeRoadmap.steps.length > 0">
          {{ doneCount }} / {{ activeRoadmap.steps.length }}
        </span>
      </div>

      <div class="rm-steps-v">
        <div
          class="rm-step-v"
          v-for="(step, i) in activeRoadmap.steps" :key="step.id"
          :class="{ done: i < currentIndex, current: step.id === activeRoadmap.current_step_id }"
        >
          <div class="rm-dot-col">
            <div class="rm-dot-v" @click="!editing && setCurrent(step.id)"></div>
            <div class="rm-connector" v-if="i < activeRoadmap.steps.length - 1"></div>
          </div>
          <div class="rm-step-content">
            <span class="rm-you" v-if="step.id === activeRoadmap.current_step_id">Ты тут</span>
            <input
              v-if="editing"
              class="rm-step-input"
              :value="step.label"
              @change="renameStep(step.id, $event)"
            />
            <span v-else class="rm-label-v" @click="setCurrent(step.id)">{{ step.label }}</span>
            <button v-if="editing" class="rm-step-del" @click="deleteStep(step.id)">×</button>
          </div>
        </div>
      </div>

      <div v-if="editing" class="rm-add-step">
        <input v-model="newStepLabel" placeholder="Новый этап" @keyup.enter="submitNewStep" />
        <button @click="submitNewStep" :disabled="!newStepLabel.trim()">+</button>
      </div>
      <button v-if="editing" class="rm-delete-roadmap" @click="showDeleteConfirm = true">Удалить этот roadmap</button>
    </template>

    <!-- Модалка: новый roadmap -->
    <Teleport to="body" v-if="showNewRoadmapModal">
      <div class="overlay" @click.self="showNewRoadmapModal = false">
        <div class="mini-modal">
          <h3>Новый roadmap</h3>
          <input
            v-model="newRoadmapName" placeholder="Название (напр. Веб-разработка)"
            @keyup.enter="submitNewRoadmap"
          />
          <div class="mini-footer">
            <button class="btn-cancel" @click="showNewRoadmapModal = false">Отмена</button>
            <button class="btn-save" @click="submitNewRoadmap" :disabled="!newRoadmapName.trim() || isSavingRoadmap">Создать</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Модалка: подтверждение удаления roadmap -->
    <Teleport to="body" v-if="showDeleteConfirm">
      <div class="overlay" @click.self="showDeleteConfirm = false">
        <div class="mini-modal">
          <h3>Удалить roadmap?</h3>
          <p class="confirm-text">«{{ activeRoadmap?.name }}» будет удалён вместе со всеми этапами. Это действие нельзя отменить.</p>
          <div class="mini-footer">
            <button class="btn-cancel" @click="showDeleteConfirm = false">Отмена</button>
            <button class="btn-danger" @click="deleteActiveRoadmap">Удалить</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoadmapStore } from '@/stores/roadmap'
import { IconPencil } from '@tabler/icons-vue'

const store = useRoadmapStore()
const { roadmaps, activeRoadmapId } = storeToRefs(store)

const editing = ref(false)
const newStepLabel = ref('')

const showNewRoadmapModal = ref(false)
const newRoadmapName = ref('')
const isSavingRoadmap = ref(false)
const showDeleteConfirm = ref(false)

const activeRoadmap = computed(() => roadmaps.value.find(r => r.id === activeRoadmapId.value) ?? null)

const currentIndex = computed(() => {
  if (!activeRoadmap.value?.current_step_id) return -1
  return activeRoadmap.value.steps.findIndex(s => s.id === activeRoadmap.value!.current_step_id)
})

const doneCount = computed(() => currentIndex.value >= 0 ? currentIndex.value + 1 : 0)

function createNewRoadmap() {
  newRoadmapName.value = ''
  showNewRoadmapModal.value = true
}

async function submitNewRoadmap() {
  if (!newRoadmapName.value.trim() || isSavingRoadmap.value) return
  isSavingRoadmap.value = true
  try {
    await store.createRoadmap(newRoadmapName.value.trim())
    showNewRoadmapModal.value = false
  } catch (e) {
    console.error('Ошибка создания roadmap:', e)
  } finally {
    isSavingRoadmap.value = false
  }
}

async function deleteActiveRoadmap() {
  if (!activeRoadmap.value) return
  try {
    await store.deleteRoadmap(activeRoadmap.value.id)
    editing.value = false
    showDeleteConfirm.value = false
  } catch (e) {
    console.error('Ошибка удаления roadmap:', e)
  }
}

async function setCurrent(stepId: string) {
  if (!activeRoadmap.value) return
  try {
    await store.setCurrentStep(activeRoadmap.value.id, stepId)
  } catch (e) {
    console.error('Ошибка обновления текущего этапа:', e)
  }
}

async function renameStep(stepId: string, event: Event) {
  if (!activeRoadmap.value) return
  const label = (event.target as HTMLInputElement).value.trim()
  if (!label) return
  try {
    await store.renameStep(activeRoadmap.value.id, stepId, label)
  } catch (e) {
    console.error('Ошибка переименования этапа:', e)
  }
}

async function deleteStep(stepId: string) {
  if (!activeRoadmap.value) return
  try {
    await store.deleteStep(activeRoadmap.value.id, stepId)
  } catch (e) {
    console.error('Ошибка удаления этапа:', e)
  }
}

async function submitNewStep() {
  if (!activeRoadmap.value || !newStepLabel.value.trim()) return
  try {
    await store.addStep(activeRoadmap.value.id, newStepLabel.value.trim())
    newStepLabel.value = ''
  } catch (e) {
    console.error('Ошибка добавления этапа:', e)
  }
}
</script>

<style scoped>
.roadmap-widget {
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px;
  padding: 16px 18px; height: 100%; box-sizing: border-box;
}

.roadmap-head { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
.roadmap-switch { display: flex; gap: 5px; flex: 1; flex-wrap: wrap; }
.rm-pill {
  padding: 5px 11px; border-radius: 980px; font-size: 11.5px; font-weight: 500;
  border: 1px solid var(--border); background: none; color: var(--text-secondary); cursor: pointer;
}
.rm-pill:hover { border-color: var(--accent); color: var(--accent); }
.rm-pill.active { background: var(--accent-light); color: var(--accent); border-color: var(--accent); }
.rm-pill.new { border-style: dashed; color: var(--text-muted); }
.rm-edit-btn {
  width: 26px; height: 26px; border-radius: 8px; border: 1px solid var(--border);
  background: none; color: var(--text-muted); cursor: pointer; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.rm-edit-btn:hover, .rm-edit-btn.active { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }

.rm-empty { font-size: 12.5px; color: var(--text-muted); padding: 20px 0; text-align: center; }

.roadmap-meta { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 18px; }
.roadmap-name { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.roadmap-pct { font-size: 12px; font-weight: 600; color: var(--accent); }

.rm-steps-v { display: flex; flex-direction: column; }
.rm-step-v { display: flex; gap: 12px; }
.rm-dot-col { display: flex; flex-direction: column; align-items: center; width: 15px; flex-shrink: 0; }
.rm-dot-v {
  width: 15px; height: 15px; border-radius: 50%; background: var(--bg-card);
  border: 3px solid var(--border); flex-shrink: 0; cursor: pointer;
}
.rm-step-v.done .rm-dot-v { border-color: var(--accent); background: var(--accent); }
.rm-step-v.current .rm-dot-v {
  border-color: var(--accent); background: var(--bg-card);
  box-shadow: 0 0 0 4px var(--accent-light);
}
.rm-connector { width: 3px; flex: 1; min-height: 22px; background: var(--border); margin-top: 2px; }
.rm-step-v.done .rm-connector { background: var(--accent); }
.rm-step-content { padding-bottom: 20px; display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; position: relative; }
.rm-label-v { font-size: 12.5px; color: var(--text-muted); line-height: 1.3; cursor: pointer; }
.rm-step-v.done .rm-label-v, .rm-step-v.current .rm-label-v { color: var(--text-primary); font-weight: 500; }
.rm-you {
  font-size: 9.5px; font-weight: 700; color: #fff; background: var(--accent);
  padding: 1px 7px; border-radius: 980px; text-transform: uppercase; letter-spacing: .04em;
  width: fit-content;
}
.rm-step-input {
  font-size: 12.5px; padding: 4px 8px; border-radius: 7px; border: 1px solid var(--border);
  background: var(--bg-primary); color: var(--text-primary); outline: none; width: 100%; box-sizing: border-box;
}
.rm-step-input:focus { border-color: var(--accent); }
.rm-step-del {
  position: absolute; right: 0; top: -1px; background: none; border: none;
  color: var(--text-muted); font-size: 15px; cursor: pointer; line-height: 1;
}
.rm-step-del:hover { color: var(--danger); }

.rm-add-step { display: flex; gap: 6px; margin-top: 4px; }
.rm-add-step input {
  flex: 1; padding: 6px 10px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--bg-primary); color: var(--text-primary); font-size: 12.5px; outline: none;
}
.rm-add-step input:focus { border-color: var(--accent); }
.rm-add-step button {
  width: 30px; border-radius: 8px; border: none; background: var(--accent); color: #fff;
  cursor: pointer; font-size: 14px;
}
.rm-add-step button:disabled { opacity: .4; cursor: not-allowed; }

.rm-delete-roadmap {
  margin-top: 14px; width: 100%; padding: 7px; border-radius: 9px;
  border: 0.5px dashed var(--danger-border); background: none; color: var(--danger);
  font-size: 11.5px; cursor: pointer;
}
.rm-delete-roadmap:hover { background: var(--danger-light); }

.overlay {
  position: fixed; inset: 0; background: rgba(10,30,53,0.35);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; backdrop-filter: blur(4px);
}
.mini-modal {
  background: var(--bg-card); border-radius: 20px; padding: 22px;
  width: 320px; max-width: 90vw; box-shadow: 0 20px 60px rgba(10,30,53,0.15);
}
.mini-modal h3 { font-size: 15px; font-weight: 500; color: var(--text-primary); margin-bottom: 14px; }
.confirm-text { font-size: 13px; color: var(--text-secondary); margin-bottom: 18px; margin-top: -6px; }
.mini-modal input {
  width: 100%; padding: 9px 12px; border-radius: 10px;
  border: 1px solid var(--border); font-size: 14px; color: var(--text-primary);
  outline: none; box-sizing: border-box; margin-bottom: 16px;
  background: var(--bg-card);
}
.mini-modal input:focus { border-color: var(--accent); }
.mini-footer { display: flex; gap: 8px; justify-content: flex-end; }
.btn-cancel {
  padding: 8px 16px; border-radius: 980px; border: 1px solid var(--border);
  background: none; font-size: 13px; color: var(--text-secondary); cursor: pointer;
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
