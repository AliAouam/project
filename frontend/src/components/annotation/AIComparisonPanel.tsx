import React from 'react';
import { RetinalImage } from '../../types';
import { useImageStore } from '../../store/imageStore';
import Button from '../ui/Button';
import { Brain, BarChart2 } from 'lucide-react';

interface AIComparisonPanelProps {
  image: RetinalImage;
  showAI: boolean;
  onToggleAI: () => void;
}

const AIComparisonPanel: React.FC<AIComparisonPanelProps> = ({
  image,
  showAI,
  onToggleAI,
}) => {
  const { generateAIPredictions, isLoading } = useImageStore();
  
  const handleGeneratePredictions = async () => {
    await generateAIPredictions();
  };
  
  const hasAIAnnotations = image.aiAnnotations && image.aiAnnotations.length > 0;
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium mb-4">AI Analysis</h3>
      
      {!hasAIAnnotations ? (
        <div className="text-center py-6">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">
            Generate AI predictions to compare with your annotations
          </p>
          <Button
            onClick={handleGeneratePredictions}
            isLoading={isLoading}
            className="w-full"
          >
            Generate AI Predictions
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Button
              variant={showAI ? 'primary' : 'outline'}
              onClick={onToggleAI}
              className="w-full"
            >
              {showAI ? 'Hide AI Annotations' : 'Show AI Annotations'}
            </Button>
          </div>
          
          {showAI && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-100">
              <div className="flex items-center mb-3">
                <BarChart2 className="h-5 w-5 text-blue-500 mr-2" />
                <h4 className="text-sm font-medium text-blue-700">Comparison Results</h4>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-700 mb-1">Similarity Score</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${(image.similarityScore || 0) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-right text-xs text-gray-500 mt-1">
                    {((image.similarityScore || 0) * 100).toFixed(1)}%
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-2 bg-white rounded border border-gray-200">
                    <p className="font-medium text-gray-700">Your Annotations</p>
                    <p className="text-gray-600">{image.annotations.length} anomalies</p>
                  </div>
                  <div className="p-2 bg-white rounded border border-gray-200">
                    <p className="font-medium text-gray-700">AI Predictions</p>
                    <p className="text-gray-600">{image.aiAnnotations.length} anomalies</p>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 mt-2">
                  <p>
                    The AI model has identified {image.aiAnnotations.length} anomalies with an average confidence of {
                      (image.aiAnnotations.reduce((sum, ann) => sum + ann.confidence, 0) / 
                      (image.aiAnnotations.length || 1) * 100).toFixed(1)
                    }%.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIComparisonPanel;