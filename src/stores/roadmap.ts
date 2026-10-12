import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Roadmap } from '@/types/roadmap'
import { roadmapApi, type StepUpdate } from '@/api/roadmap'

export const useRoadmapStore = defineStore('roadmap', () => {
  const roadmaps = ref<Roadmap[]>([])
  const activeRoadmapId = ref<string | null>(null)
  const loading = ref(false)

  async function loadAll() {
    loading.value = true
    try {
      roadmaps.value = await roadmapApi.getAll()
      if (!activeRoadmapId.value && roadmaps.value.length > 0) {
        activeRoadmapId.value = roadmaps.value[0].id
      }
    } finally {
      loading.value = false
    }
  }

  function selectRoadmap(id: string) {
    activeRoadmapId.value = id
  }

  async function createRoadmap(name: string) {
    const created = await roadmapApi.create(name)
    roadmaps.value = [...roadmaps.value, created]
    activeRoadmapId.value = created.id
    return created
  }

  async function renameRoadmap(id: string, name: string) {
    const updated = await roadmapApi.update(id, { name })
    roadmaps.value = roadmaps.value.map(r => r.id === id ? updated : r)
  }

  async function deleteRoadmap(id: string) {
    await roadmapApi.delete(id)
    roadmaps.value = roadmaps.value.filter(r => r.id !== id)
    if (activeRoadmapId.value === id) {
      activeRoadmapId.value = roadmaps.value[0]?.id ?? null
    }
  }

  async function addStep(
    roadmapId: string, label: string,
    opts: { parent_step_id?: string | null; x?: number; y?: number } = {},
  ) {
    const updated = await roadmapApi.addStep(roadmapId, label, opts)
    roadmaps.value = roadmaps.value.map(r => r.id === roadmapId ? updated : r)
    return updated
  }

  function findStep(roadmapId: string, stepId: string) {
    return roadmaps.value.find(r => r.id === roadmapId)?.steps.find(s => s.id === stepId)
  }

  async function updateStep(roadmapId: string, stepId: string, payload: StepUpdate) {
    // Оптимистично двигаем/переименовываем сразу, чтобы холст не дёргался
    const step = findStep(roadmapId, stepId)
    const before = step ? { ...step } : null
    if (step) Object.assign(step, payload)
    try {
      await roadmapApi.updateStep(stepId, payload)
    } catch (e) {
      if (step && before) Object.assign(step, before)
      throw e
    }
  }

  const renameStep = (roadmapId: string, stepId: string, label: string) =>
    updateStep(roadmapId, stepId, { label })

  async function setCurrentStep(roadmapId: string, stepId: string | null) {
    const updated = await roadmapApi.update(roadmapId, { current_step_id: stepId })
    roadmaps.value = roadmaps.value.map(r => r.id === roadmapId ? updated : r)
  }

  async function deleteStep(roadmapId: string, stepId: string) {
    await roadmapApi.deleteStep(stepId)
    const roadmap = roadmaps.value.find(r => r.id === roadmapId)
    if (roadmap) {
      const removed = roadmap.steps.find(s => s.id === stepId)
      // Бэкенд переподвешивает детей к родителю удалённого узла — повторяем локально
      for (const s of roadmap.steps) {
        if (s.parent_step_id === stepId) s.parent_step_id = removed?.parent_step_id ?? null
      }
      roadmap.steps = roadmap.steps.filter(s => s.id !== stepId)
      if (roadmap.current_step_id === stepId) roadmap.current_step_id = null
    }
  }

  return {
    roadmaps, activeRoadmapId, loading,
    loadAll, selectRoadmap, createRoadmap, renameRoadmap, deleteRoadmap,
    setCurrentStep, addStep, updateStep, renameStep, deleteStep,
  }
})
