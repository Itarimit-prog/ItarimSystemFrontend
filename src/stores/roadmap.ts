import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Roadmap } from '@/types/roadmap'
import { roadmapApi } from '@/api/roadmap'

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

  async function setCurrentStep(roadmapId: string, stepId: string) {
    const updated = await roadmapApi.update(roadmapId, { current_step_id: stepId })
    roadmaps.value = roadmaps.value.map(r => r.id === roadmapId ? updated : r)
  }

  async function addStep(roadmapId: string, label: string) {
    const updated = await roadmapApi.addStep(roadmapId, label)
    roadmaps.value = roadmaps.value.map(r => r.id === roadmapId ? updated : r)
  }

  async function renameStep(roadmapId: string, stepId: string, label: string) {
    await roadmapApi.updateStep(stepId, { label })
    const roadmap = roadmaps.value.find(r => r.id === roadmapId)
    if (roadmap) {
      const step = roadmap.steps.find(s => s.id === stepId)
      if (step) step.label = label
    }
  }

  async function deleteStep(roadmapId: string, stepId: string) {
    await roadmapApi.deleteStep(stepId)
    const roadmap = roadmaps.value.find(r => r.id === roadmapId)
    if (roadmap) {
      roadmap.steps = roadmap.steps.filter(s => s.id !== stepId)
      if (roadmap.current_step_id === stepId) roadmap.current_step_id = null
    }
  }

  return {
    roadmaps, activeRoadmapId, loading,
    loadAll, selectRoadmap, createRoadmap, renameRoadmap, deleteRoadmap,
    setCurrentStep, addStep, renameStep, deleteStep,
  }
})
