// src/components/annotation/AnnotationList.tsx

import React from 'react'
import { Annotation } from '../../types'

interface AnnotationListProps {
  annotations: Annotation[]
  /** renaming to match what AnnotationPage passes in */
  selectedId: string | null
  onSelect: (id: string) => void
}

const AnnotationList: React.FC<AnnotationListProps> = ({
  annotations,
  selectedId,
  onSelect,
}) => {
  if (annotations.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-500 italic">No annotations yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700">
          Annotations ({annotations.length})
        </h3>
      </div>
      <ul className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
        {annotations.map(annotation => (
          <li
            key={annotation.id}
            className={`p-3 cursor-pointer hover:bg-gray-50 ${
              selectedId === annotation.id ? 'bg-blue-50' : ''
            }`}
            onClick={() => onSelect(annotation.id)}
          >
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: annotation.color }}
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{annotation.type}</p>
                <p className="text-xs text-gray-500">Stade: {annotation.stage}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default AnnotationList
