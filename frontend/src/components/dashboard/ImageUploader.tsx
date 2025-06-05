import React, { useState } from 'react'
import { Upload } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'

interface Props {
  onUpload: (file: File, patientId: string, patientName: string) => Promise<void>
}

const ImageUploader: React.FC<Props> = ({ onUpload }) => {
  const [file, setFile] = useState<File | null>(null)
  const [patientId, setPatientId] = useState('')
  const [patientName, setPatientName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    if (f && !f.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    setFile(f)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return setError('Please select a file')
    if (!patientId.trim()) return setError('Patient ID is required')
    if (!patientName.trim()) return setError('Patient name is required')

    setIsUploading(true)
    try {
      await onUpload(file, patientId, patientName)
      setFile(null)
      setPatientId('')
      setPatientName('')
      setError('')
      ;(document.getElementById('file-upload') as HTMLInputElement).value = ''
    } catch {
      setError('Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-medium mb-4">Upload New Image</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Patient ID"
          value={patientId}
          onChange={e => setPatientId(e.target.value)}
          required
        />
        <Input
          label="Patient Name"
          value={patientName}
          onChange={e => setPatientName(e.target.value)}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Retinal Image</label>
          <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
              >
                <span>Upload a file</span>
                <input
                  id="file-upload"
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              {file && <p className="mt-2 text-sm">{file.name}</p>}
            </div>
          </div>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>

        <Button type="submit" isLoading={isUploading} className="w-full">
          Upload Image
        </Button>
      </form>
    </div>
  )
}

export default ImageUploader
