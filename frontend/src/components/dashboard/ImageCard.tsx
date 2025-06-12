import React from 'react';
import { Eye, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RetinalImage } from '../../types';

interface ImageCardProps {
  image: RetinalImage;
  /** Nombre d'annotations calculé côté client ou backend */
  annotationCount?: number;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, annotationCount }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/annotate/${image.id}`)}
      className="bg-white rounded-lg shadow-sm hover:shadow-md cursor-pointer overflow-hidden"
    >
      <img
        src={image.url}
        alt={image.patientName}
        className="w-full h-48 object-cover"
      />

      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {image.patientName}
          </h3>
          {image.uploadedBy && (
            <span className="bg-gray-200 text-xs px-2 py-0.5 rounded">
              Dr. {image.uploadedBy}
            </span>
          )}
        </div>
        <p className="text-gray-600">Patient ID: {image.patientId}</p>

        <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{new Date(image.uploadedAt).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center">
            <Eye className="h-4 w-4 mr-1" />
            <span>
              {annotationCount ?? image.annotations.length} annotation{(annotationCount ?? image.annotations.length) > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCard;
