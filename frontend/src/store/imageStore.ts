// src/store/imageStore.ts

import { create } from 'zustand'
import { RetinalImage, Annotation, AIAnnotation, AIPrediction } from '../types'
import { useAuthStore } from './authStore'

interface ImageState {
  images: RetinalImage[]
  currentImage: RetinalImage | null
  isLoading: boolean

  fetchImages: () => Promise<void>
  uploadImage: (file: File, patientId: string, patientName: string) => Promise<void>
  setCurrentImage: (imageId: string) => void

  /** REPLACES the entire annotation array on the current image */
  updateCurrentAnnotations: (anns: Annotation[]) => void

  /** generate and store a global AI prediction */
  generateAIPrediction: () => Promise<void>
}

const API_BASE = 'http://localhost:8000'

export const useImageStore = create<ImageState>((set, get) => ({
  images: [],
  currentImage: null,
  isLoading: false,

  fetchImages: async () => {
    set({ isLoading: true })
    try {
      const res = await fetch(`${API_BASE}/api/images`)
      const data: any[] = await res.json()
      const images = data.map(doc => ({
        id: doc.id,
        url: API_BASE + doc.url,
        patientId: doc.patientId,
        patientName: doc.patientName,
        uploadedAt: doc.uploadedAt,
        uploadedBy: doc.uploadedBy ?? '',
        annotations: [],
        aiAnnotations: [],
        similarityScore: doc.similarityScore,
        aiPrediction: { label: '', confidence: 0 },
      }))
      set({ images })
    } catch (err) {
      console.error('fetchImages failed:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  uploadImage: async (file, patientId, patientName) => {
    set({ isLoading: true })
    try {
      const form = new FormData()
      form.append('image', file)
      form.append('patientId', patientId)
      form.append('patientName', patientName)
      const { user } = useAuthStore.getState()
      if (user) {
        form.append('uploadedBy', user.name)
      }
      const res = await fetch(`${API_BASE}/api/images`, {
        method: 'POST',
        body: form,
      })
      const doc = await res.json()
      const newImage: RetinalImage = {
        id: doc.id,
        url: API_BASE + doc.url,
        patientId: doc.patientId,
        patientName: doc.patientName,
        uploadedAt: doc.uploadedAt,
        uploadedBy: doc.uploadedBy ?? user?.name ?? '',
        annotations: [],
        aiAnnotations: [],
        similarityScore: doc.similarityScore,
        aiPrediction: { label: '', confidence: 0 },
      }
      set(state => ({
        images: [newImage, ...state.images],
        currentImage: newImage,
      }))
    } catch (err) {
      console.error('uploadImage failed:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  setCurrentImage: imageId => {
    const img = get().images.find(i => i.id === imageId) || null
    set({ currentImage: img })
  },

  updateCurrentAnnotations: anns => {
    const cur = get().currentImage
    if (!cur) return
    const updated: RetinalImage = { ...cur, annotations: anns }
    set(state => ({
      currentImage: updated,
      images: state.images.map(i => (i.id === updated.id ? updated : i)),
    }))
  },

  generateAIPrediction: async () => {
    const cur = get().currentImage
    if (!cur) return
    set({ isLoading: true })
    try {
      // re-upload the image blob to /api/predict
      const respImg = await fetch(cur.url)
      const blob = await respImg.blob()
      const form = new FormData()
      form.append('file', blob, 'image.jpg')
      const res = await fetch(`${API_BASE}/api/predict`, {
        method: 'POST',
        body: form,
      })
      if (!res.ok) throw new Error(`IA error (${res.status})`)
      const data: AIPrediction = await res.json()
      const updated: RetinalImage = {
        ...cur,
        aiPrediction: data,
      }
      set(state => ({
        currentImage: updated,
        images: state.images.map(i => (i.id === updated.id ? updated : i)),
      }))
    } catch (err) {
      console.error('generateAIPrediction failed:', err)
    } finally {
      set({ isLoading: false })
    }
  },
}))
