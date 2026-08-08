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
      <button v-if="editing" class="rm-delete-roadmap" @click="deleteActiveRoadmap">Удалить этот roadmap</button>
    </template>
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

const activeRoadmap = computed(() => roadmaps.value.find(r => r.id === activeRoadmapId.value) ?? null)

const currentIndex = computed(() => {
  if (!activeRoadmap.value?.current_step_id) return -1
  return activeRoadmap.value.steps.findIndex(s => s.id === activeRoadmap.value!.current_step_id)
})

const doneCount = computed(() => currentIndex.value >= 0 ? currentIndex.value + 1 : 0)

async function createNewRoadmap() {
  const name = prompt('Название нового roadmap')
  if (!name || !name.trim()) return
  try {
    await store.createRoadmap(name.trim())
  } catch (e) {
    console.error('Ошибка создания roadmap:', e)
  }
}

async function deleteActiveRoadmap() {
  if (!activeRoadmap.value) return
  if (!confirm(`Удалить roadmap «${activeRoadmap.value.name}»?`)) return
  try {
    await store.deleteRoadmap(activeRoadmap.value.id)
    editing.value = false
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
</style>
