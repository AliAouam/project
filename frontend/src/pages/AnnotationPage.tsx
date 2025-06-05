// src/pages/AnnotationPage.tsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Save, RefreshCw, Trash2, FileText,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useImageStore } from '../store/imageStore'
import Layout from '../components/layout/Layout'
import AnnotationCanvas from '../components/annotation/AnnotationCanvas'
import AnnotationList from '../components/annotation/AnnotationList'
import AnnotationDetails from '../components/annotation/AnnotationDetails'
import ClassificationPanel from '../components/annotation/ClassificationPanel'
import Button from '../components/ui/Button'
import { Annotation, AIPrediction } from '../types'

const API = 'http://localhost:8000'

const AnnotationPage: React.FC = () => {
  const { imageId } = useParams<{ imageId: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const {
    images,
    currentImage,
    isLoading: imgLoading,
    setCurrentImage,
  } = useImageStore()

  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loadingAnn, setLoadingAnn] = useState(false)
  const [loadingAI, setLoadingAI] = useState(false)
  const [aiResult, setAIResult] = useState<AIPrediction | null>(null)

  // 1) Auth & load image
  useEffect(() => {
    if (!isAuthenticated) return navigate('/login')
    if (imageId && images.length) setCurrentImage(imageId)
  }, [isAuthenticated, imageId, images, setCurrentImage, navigate])

  // 2) Fetch saved annotations (ONLY current user)
  useEffect(() => {
    if (!currentImage || !user) return
    setLoadingAnn(true)
    // On récupère QUE les annotations créées par cet user pour cette image
    fetch(`${API}/api/annotations/${currentImage.id}?created_by=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then((data: Annotation[]) => setAnnotations(data))
      .catch(console.error)
      .finally(() => setLoadingAnn(false))
  }, [currentImage, user])

  // 3) Draw/update callback from canvas
  const handleDrawChange = (newList: Annotation[]) => {
    setAnnotations(newList)
    setSelectedId(null)
  }

  // 4) Delete one annotation by its ID (from DB)
  const handleDeleteOne = async () => {
    if (!selectedId) return
    await fetch(`${API}/api/annotations/${selectedId}`, { method: 'DELETE' })
    setAnnotations(a => a.filter(x => x.id !== selectedId))
    setSelectedId(null)
  }

  // 5) Reset: re-fetch from DB (for current user)
  const handleReset = () => {
    if (!currentImage || !user) return
    setLoadingAnn(true)
    fetch(`${API}/api/annotations/${currentImage.id}?created_by=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then((data: Annotation[]) => setAnnotations(data))
      .catch(console.error)
      .finally(() => setLoadingAnn(false))
  }

  // 6) Save: delete only this user's, then save
  const handleSave = async () => {
    if (!currentImage || !user) return
    try {
      // fetch existing (for this user only!)
      const existing: Annotation[] = await fetch(
        `${API}/api/annotations/${currentImage.id}?created_by=${encodeURIComponent(user.email)}`
      ).then(r => r.json())
      // delete each
      await Promise.all(
        existing.map(a =>
          fetch(`${API}/api/annotations/${a.id}`, { method: 'DELETE' })
        )
      )
      // post new ones (add created_by)
      await Promise.all(
        annotations.map(a =>
          fetch(`${API}/api/annotations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...a,
              imageId: currentImage.id,
              created_by: user.email,
            }),
          })
        )
      )
      handleReset()
      alert('✅ Annotations saved to DB')
    } catch (err) {
      console.error(err)
      alert('❌ Error saving annotations')
    }
  }

  // 7) AI predict
  const handleAI = async () => {
    if (!currentImage) return
    setLoadingAI(true)
    try {
      const imgBlob = await fetch(currentImage.url).then(r => r.blob())
      const form = new FormData()
      form.append('file', imgBlob, 'image.jpg')
      const res = await fetch(`${API}/api/predict`, { method: 'POST', body: form })
      if (!res.ok) throw new Error(`Status ${res.status}`)
      const data: AIPrediction = await res.json()
      setAIResult(data)
    } catch (e: any) {
      console.error(e)
      alert(`❌ AI prediction failed: ${e.message}`)
    } finally {
      setLoadingAI(false)
    }
  }

  // 8) Export PDF
  const handleExportPDF = async () => {
    if (!currentImage) return
    window.open(`${API}/api/export/pdf/${currentImage.id}`, '_blank')
  }

  if (imgLoading || !currentImage || loadingAnn) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto" />
          <p className="mt-4 text-gray-600">Loading…</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <span className="ml-4 text-2xl font-bold">
            {currentImage.patientName}
          </span>
          <p className="text-gray-600 text-sm">
            ID: {currentImage.patientId} | Uploaded:{' '}
            {new Date(currentImage.uploadedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-1" /> Reset
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-5 w-5 mr-1" /> Save
          </Button>
          <Button onClick={handleAI} disabled={loadingAI}>
            {loadingAI ? 'Running…' : 'Generate AI'}
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <FileText className="h-4 w-4 mr-1" /> Export PDF
          </Button>
        </div>
      </div>
      {/* Main Content */}
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <AnnotationCanvas
            imageUrl={currentImage.url}
            annotations={annotations}
            aiAnnotations={currentImage.aiAnnotations}
            showAI={!!aiResult}
            onAnnotationSelect={setSelectedId}
            onAnnotationsChange={handleDrawChange}
            user={user!}
          />
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">
              Annotations ({annotations.length})
            </h3>
            <Button
              variant="outline"
              onClick={handleDeleteOne}
              disabled={!selectedId}
              className="mb-2"
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete Selected
            </Button>
            <AnnotationList
              annotations={annotations}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
          <AnnotationDetails
            annotation={
              annotations.find(a => a.id === selectedId) ?? null
            }
            aiAnnotations={currentImage.aiAnnotations}
            showAI={!!aiResult}
          />
          <ClassificationPanel
            patientId={currentImage.patientId}
            patientName={currentImage.patientName}
            imagePath={currentImage.url}
            annotations={annotations}
            aiPrediction={aiResult ?? { label: '—', confidence: 0 }}
          />
        </div>
      </div>
    </Layout>
  )
}

export default AnnotationPage
