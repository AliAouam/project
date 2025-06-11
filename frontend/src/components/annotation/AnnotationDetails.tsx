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
  const [stage, setStage] = useState<'1' | '2' | '3' | '4'>(
    (annotation?.severity as '1' | '2' | '3' | '4') || '1'
  );

  React.useEffect(() => {
    if (annotation) {
      setType(annotation.type);
      setStage(annotation.severity as '1' | '2' | '3' | '4');
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

  const handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStage = e.target.value as '1' | '2' | '3' | '4';
    setStage(newStage);

    // Update color based on stage
    const color = getStageColor(newStage);
    updateAnnotation(annotation.id, {
      severity: newStage,
      color
    });
  };

  const handleDelete = () => {
    deleteAnnotation(annotation.id);
  };

  const getStageColor = (stage: string): string => {
    switch (stage) {
      case '1':
        return '#FFC107';
      case '2':
        return '#FF9800';
      case '3':
        return '#F44336';
      case '4':
        return '#B71C1C';
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
            label="Stage"
            value={stage}
            onChange={handleStageChange}
            options={[
              { value: '1', label: '1' },
              { value: '2', label: '2' },
              { value: '3', label: '3' },
              { value: '4', label: '4' },
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