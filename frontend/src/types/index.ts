// src/types/index.ts

export type User = {
  id: string
  name: string
  email: string
  role: 'doctor' | 'admin'
}

export type Annotation = {
  id: string
  x: number
  y: number
  width: number
  height: number
  type: string
  severity: 'mild' | 'moderate' | 'severe'
  color: string
  createdAt: string
  created_by: string
  other_diseases?: string
}

export type AIAnnotation = {
  id: string
  x: number
  y: number
  width: number
  height: number
  type: string
  severity: 'mild' | 'moderate' | 'severe'
  confidence: number
  color: string
}

/** NEW: global prediction type */
export type AIPrediction = {
  label: string
  confidence: number
}

export type RetinalImage = {
  id: string
  url: string
  patientId: string
  patientName: string
  uploadedAt: string
  uploadedBy: string
  annotations: Annotation[]
  aiAnnotations: AIAnnotation[]
  similarityScore?: number
  aiPrediction: AIPrediction
}

export type Patient = {
  id: string
  name: string
  age: number
  gender: string
  medicalHistory: string
}
