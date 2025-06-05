import React, { useState } from 'react';
import { Annotation, AIAnnotation } from '../../types';
import { useImageStore } from '../../store/imageStore';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { Trash2 } from 'lucide-react';

interface AnnotationDetailsProps {
  annotation: Annotation | null;
  aiAnnotations: AIAnnotation[];
  showAI: boolean;
}

const AnnotationDetails: React.FC<AnnotationDetailsProps> = ({
  annotation,
  aiAnnotations,
  showAI,
}) => {
  const { updateAnnotation, deleteAnnotation } = useImageStore();
  const [type, setType] = useState(annotation?.type || '');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>(
    (annotation?.severity as 'mild' | 'moderate' | 'severe') || 'mild'
  );

  React.useEffect(() => {
    if (annotation) {
      setType(annotation.type);
      setSeverity(annotation.severity);
    }
  }, [annotation]);

  if (!annotation) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-500 italic">Select an annotation to view details</p>
      </div>
    );
  }

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setType(e.target.value);
    updateAnnotation(annotation.id, { type: e.target.value });
  };

  const handleSeverityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSeverity = e.target.value as 'mild' | 'moderate' | 'severe';
    setSeverity(newSeverity);
    
    // Update color based on severity
    const color = getSeverityColor(newSeverity);
    updateAnnotation(annotation.id, { 
      severity: newSeverity,
      color
    });
  };

  const handleDelete = () => {
    deleteAnnotation(annotation.id);
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'mild':
        return '#FFC107'; // Yellow
      case 'moderate':
        return '#FF9800'; // Orange
      case 'severe':
        return '#F44336'; // Red
      default:
        return '#FFC107';
    }
  };

  // Find matching AI annotation if available
  const matchingAIAnnotation = showAI
    ? aiAnnotations.find(ai => ai.type === annotation.type)
    : null;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-medium">Annotation Details</h3>
        <Button 
          variant="danger" 
          size="sm"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Anomaly Type"
            value={type}
            onChange={handleTypeChange}
            options={[
              { value: 'hemorrhage', label: 'Hemorrhage' },
              { value: 'microaneurysm', label: 'Microaneurysm' },
              { value: 'exudate', label: 'Exudate' },
              { value: 'neovascularization', label: 'Neovascularization' },
            ]}
          />
          
          <Select
            label="Severity"
            value={severity}
            onChange={handleSeverityChange}
            options={[
              { value: 'mild', label: 'Mild' },
              { value: 'moderate', label: 'Moderate' },
              { value: 'severe', label: 'Severe' },
            ]}
          />
        </div>
        
        <div className="mt-2">
          <p className="text-sm text-gray-500">
            Position: x={annotation.x.toFixed(0)}, y={annotation.y.toFixed(0)}
          </p>
          <p className="text-sm text-gray-500">
            Size: {annotation.width.toFixed(0)} × {annotation.height.toFixed(0)}
          </p>
          <p className="text-sm text-gray-500">
            Created: {new Date(annotation.createdAt).toLocaleString()}
          </p>
        </div>
        
        {showAI && matchingAIAnnotation && (
          <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
            <h4 className="text-sm font-medium text-green-800 mb-2">AI Prediction</h4>
            <p className="text-sm text-green-700">
              Type: {matchingAIAnnotation.type}
            </p>
            <p className="text-sm text-green-700">
              Severity: {matchingAIAnnotation.severity}
            </p>
            <p className="text-sm text-green-700">
              Confidence: {(matchingAIAnnotation.confidence * 100).toFixed(1)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnotationDetails;