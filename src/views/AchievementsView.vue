<template>
  <div class="ach-page">
    <div class="topbar">
      <span class="page-title">
        Достижения
        <span v-if="achievements.length" class="count">{{ doneCount }} / {{ achievements.length }}</span>
      </span>
      <button class="btn-primary" @click="openCreate">+ Достижение</button>
    </div>

    <div class="body">
      <div v-if="achievements.length === 0" class="empty">
        Пока нет достижений.<br>
        <span class="empty-hint">Создайте достижение, задайте награду за него — и отмечайте, когда добьётесь</span>
      </div>

      <div
        v-for="a in sorted" :key="a.id"
        class="ach-card" :class="{ done: a.done }"
      >
        <div class="ach-head">
          <div class="ach-title">
            <span v-if="a.done" class="ach-mark">✓</span>{{ a.title }}
          </div>
          <div class="ach-menu">
            <button class="icon-btn" title="Редактировать" @click="openEdit(a)">✎</button>
            <button class="icon-btn danger" title="Удалить" @click="deleting = a">×</button>
          </div>
        </div>

        <div v-if="a.description" class="ach-desc">{{ a.description }}</div>

        <div v-if="a.reward_name || a.reward_photo" class="reward">
          <img v-if="a.reward_photo" :src="a.reward_photo" class="reward-photo" alt="" />
          <div class="reward-info">
            <div class="reward-label">Награда</div>
            <div class="reward-name">{{ a.reward_name || 'Без названия' }}</div>
          </div>
        </div>

        <div class="ach-foot">
          <template v-if="a.done">
            <span class="done-at">Достигнуто {{ formatDate(a.done_at) }}</span>
            <button class="undo-btn" @click="setDone(a, false)">Вернуть</button>
          </template>
          <button v-else class="reach-btn" @click="setDone(a, true)">Достиг</button>
        </div>
      </div>
    </div>

    <!-- Создание / редактирование -->
    <Teleport to="body" v-if="showForm">
      <div class="overlay" @click.self="showForm = false">
        <div class="mini-modal">
          <h3>{{ editingId ? 'Редактировать достижение' : 'Новое достижение' }}</h3>

          <label>Название</label>
          <input v-model="form.title" placeholder="Например: Пробежать марафон" />

          <label>Описание</label>
          <textarea v-model="form.description" rows="3" placeholder="Что нужно сделать"></textarea>

          <label>Награда</label>
          <input v-model="form.reward_name" placeholder="Название награды, например: Новые кроссовки" />

          <div class="photo-row">
            <img v-if="form.reward_photo" :src="form.reward_photo" class="photo-preview" alt="" />
            <div v-else class="photo-placeholder">Фото</div>
            <div class="photo-actions">
              <button class="tb-btn" type="button" @click="fileInput?.click()">
                {{ form.reward_photo ? 'Заменить фото' : 'Загрузить фото' }}
              </button>
              <button v-if="form.reward_photo" class="tb-btn danger" type="button" @click="form.reward_photo = ''">Убрать</button>
            </div>
            <input ref="fileInput" type="file" accept="image/*" class="file-hidden" @change="onPickPhoto" />
          </div>
          <p v-if="photoError" class="photo-error">{{ photoError }}</p>

          <div class="mini-footer">
            <button class="btn-cancel" @click="showForm = false">Отмена</button>
            <button class="btn-save" :disabled="!form.title.trim() || busy" @click="submitForm">
              {{ editingId ? 'Сохранить' : 'Создать' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Подтверждение удаления -->
    <Teleport to="body" v-if="deleting">
      <div class="overlay" @click.self="deleting = null">
        <div class="mini-modal">
          <h3>Удалить достижение?</h3>
          <p class="confirm-text">«{{ deleting.title }}» будет удалено без возможности восстановления.</p>
          <div class="mini-footer">
            <button class="btn-cancel" @click="deleting = null">Отмена</button>
            <button class="btn-danger" @click="confirmDelete">Удалить</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAchievementsStore } from '@/stores/achievements'
import type { Achievement } from '@/types/achievements'

const store = useAchievementsStore()
const { achievements } = storeToRefs(store)

const doneCount = computed(() => achievements.value.filter(a => a.done).length)
// Невыполненные сверху, выполненные — ниже (внутри групп порядок создания)
const sorted = computed(() =>
  [...achievements.value].sort((a, b) => Number(a.done) - Number(b.done) || a.position - b.position)
)

function formatDate(iso?: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

async function setDone(a: Achievement, done: boolean) {
  try {
    await store.update(a.id, { done })
  } catch (err) {
    console.error('Ошибка обновления достижения:', err)
  }
}

const showForm = ref(false)
const editingId = ref<string | null>(null)
const busy = ref(false)
const photoError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const form = reactive({ title: '', description: '', reward_name: '', reward_photo: '' })

function openCreate() {
  editingId.value = null
  Object.assign(form, { title: '', description: '', reward_name: '', reward_photo: '' })
  photoError.value = ''
  showForm.value = true
}

function openEdit(a: Achievement) {
  editingId.value = a.id
  Object.assign(form, {
    title: a.title, description: a.description ?? '',
    reward_name: a.reward_name ?? '', reward_photo: a.reward_photo ?? '',
  })
  photoError.value = ''
  showForm.value = true
}

// Фото уменьшаем до 640px и пережимаем в JPEG — в базе хранится маленькая картинка
function resizeImage(file: File, maxSize = 640): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, maxSize / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * k)
      canvas.height = Math.round(img.height * k)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Не удалось прочитать файл')) }
    img.src = url
  })
}

async function onPickPhoto(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  photoError.value = ''
  try {
    form.reward_photo = await resizeImage(file)
  } catch {
    photoError.value = 'Не удалось загрузить фото — выберите другое изображение'
  }
}

async function submitForm() {
  if (!form.title.trim() || busy.value) return
  busy.value = true
  const payload = {
    title: form.title.trim(),
    description: form.description.trim() || null,
    reward_name: form.reward_name.trim() || null,
    reward_photo: form.reward_photo || null,
  }
  try {
    if (editingId.value) await store.update(editingId.value, payload)
    else await store.create(payload)
    showForm.value = false
  } catch (err) {
    console.error('Ошибка сохранения достижения:', err)
  } finally {
    busy.value = false
  }
}

const deleting = ref<Achievement | null>(null)
async function confirmDelete() {
  if (!deleting.value) return
  try {
    await store.remove(deleting.value.id)
    deleting.value = null
  } catch (err) {
    console.error('Ошибка удаления достижения:', err)
  }
}
</script>

<style scoped>
.ach-page {
  display: flex; flex-direction: column;
  width: 100%; height: 100vh; overflow: hidden; background: var(--bg-primary);
}
.topbar {
  background: var(--bg-card); border-bottom: 0.5px solid var(--border);
  padding: 13px 20px; display: flex; align-items: center;
  justify-content: space-between; flex-shrink: 0;
}
.page-title { font-size: 15px; font-weight: 500; color: var(--text-primary); letter-spacing: -0.2px; }
.count { font-size: 12px; color: var(--text-muted); margin-left: 8px; font-weight: 400; }
.btn-primary {
  padding: 7px 14px; border-radius: 980px; border: none;
  background: var(--accent); color: #fff; font-size: 13px; font-weight: 500; cursor: pointer;
}
.btn-primary:hover { background: var(--accent-hover); }

.body {
  flex: 1; overflow-y: auto; padding: 20px;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px; align-content: start;
}
.empty {
  grid-column: 1 / -1; text-align: center; color: var(--text-muted);
  font-size: 14px; padding: 60px 0; line-height: 1.6;
}
.empty-hint { font-size: 12px; }

.ach-card {
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 18px;
  padding: 16px 18px; display: flex; flex-direction: column; gap: 12px;
  box-shadow: 0 1px 6px rgba(26,122,232,0.06);
}
.ach-card.done { background: var(--success-light); border-color: var(--success-border); }
.ach-head { display: flex; justify-content: space-between; gap: 10px; }
.ach-title { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.ach-card.done .ach-title { color: var(--success); }
.ach-mark { margin-right: 6px; }
.ach-menu { display: flex; gap: 2px; flex-shrink: 0; }
.icon-btn {
  width: 26px; height: 26px; border-radius: 8px; border: none; background: none;
  color: var(--text-muted); font-size: 16px; cursor: pointer; line-height: 1;
}
.icon-btn:hover { background: var(--accent-light); color: var(--accent); }
.icon-btn.danger:hover { background: var(--danger-light); color: var(--danger); }
.ach-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.45; white-space: pre-wrap; }

.reward {
  display: flex; align-items: center; gap: 12px;
  background: var(--bg-primary); border-radius: 14px; padding: 10px;
}
.ach-card.done .reward { background: var(--bg-card); }
.reward-photo { width: 64px; height: 64px; border-radius: 12px; object-fit: cover; flex-shrink: 0; }
.reward-label { font-size: 10.5px; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); }
.reward-name { font-size: 14px; font-weight: 500; color: var(--text-primary); margin-top: 2px; }

.ach-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; }
.reach-btn {
  width: 100%; padding: 10px; border-radius: 12px; border: none; cursor: pointer;
  background: var(--accent); color: #fff; font-size: 14px; font-weight: 600;
}
.reach-btn:hover { background: var(--accent-hover); }
.done-at { font-size: 12px; color: var(--success); font-weight: 500; }
.undo-btn {
  padding: 5px 12px; border-radius: 980px; border: 1px solid var(--success-border);
  background: none; color: var(--success); font-size: 12px; cursor: pointer;
}

.overlay {
  position: fixed; inset: 0; background: rgba(10,30,53,0.35);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; backdrop-filter: blur(4px);
}
.mini-modal {
  background: var(--bg-card); border-radius: 20px; padding: 22px;
  width: 380px; max-width: 92vw; max-height: 92vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(10,30,53,0.15);
}
.mini-modal h3 { font-size: 15px; font-weight: 500; color: var(--text-primary); margin-bottom: 14px; }
.mini-modal label { display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 5px; font-weight: 500; }
.confirm-text { font-size: 13px; color: var(--text-secondary); margin-bottom: 18px; margin-top: -6px; }
.mini-modal input:not(.file-hidden), .mini-modal textarea {
  width: 100%; padding: 9px 12px; border-radius: 10px;
  border: 1px solid var(--border); font-size: 14px; color: var(--text-primary);
  outline: none; box-sizing: border-box; margin-bottom: 14px; background: var(--bg-card);
  font-family: inherit; resize: vertical;
}
.mini-modal input:focus, .mini-modal textarea:focus { border-color: var(--accent); }
.file-hidden { display: none; }

.photo-row { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
.photo-preview { width: 72px; height: 72px; border-radius: 14px; object-fit: cover; }
.photo-placeholder {
  width: 72px; height: 72px; border-radius: 14px; border: 1px dashed var(--border);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: var(--text-muted);
}
.photo-actions { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
.photo-error { font-size: 12px; color: var(--danger); margin-bottom: 8px; }
.tb-btn {
  padding: 6px 12px; border-radius: 980px; border: 1px solid var(--border);
  background: var(--bg-card); color: var(--text-secondary); font-size: 12px; cursor: pointer;
}
.tb-btn:hover { border-color: var(--accent); color: var(--accent); }
.tb-btn.danger:hover { border-color: var(--danger); color: var(--danger); }

.mini-footer { display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px; }
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

@media (max-width: 768px) {
  .ach-page { height: auto; min-height: 100vh; overflow: visible; }
  .body { padding: 14px; grid-template-columns: 1fr; }
}
</style>
