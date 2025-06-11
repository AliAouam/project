// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useImageStore } from '../store/imageStore';
import Layout from '../components/layout/Layout';
import ImageCard from '../components/dashboard/ImageCard';
import ImageUploader from '../components/dashboard/ImageUploader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface AnnotationCountMap {
  [imageId: string]: number;
}

const API = "http://localhost:8000";

const DashboardPage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { images, fetchImages, uploadImage, isLoading } = useImageStore();
  const [showUploader, setShowUploader] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [annotationCounts, setAnnotationCounts] = useState<AnnotationCountMap>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  // Load images on mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchImages();
  }, [isAuthenticated, fetchImages, navigate]);

  // Whenever images list changes, fetch annotation counts
  useEffect(() => {
    if (images.length === 0) return;
    images.forEach(img => {
      fetch(`${API}/api/annotations/${img.id}?created_by=${encodeURIComponent(user!.email)}`)
        .then(res => res.json())
        .then((anns: any[]) => {
          setAnnotationCounts(prev => ({
            ...prev,
            [img.id]: anns.length,
          }));
        })
        .catch(() => {
          setAnnotationCounts(prev => ({ ...prev, [img.id]: 0 }));
        });
    });
  }, [images]);

  const handleUpload = async (file: File, patientId: string, patientName: string) => {
    await uploadImage(file, patientId, patientName);
    setShowUploader(false);
    fetchImages();
  };

  // Delete selected images
  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;
    if (!window.confirm("Are you sure you want to delete the selected images? This will also delete all associated annotations.")) return;

    setDeleting(true);
    try {
      await Promise.all(
        selected.map(imgId =>
          fetch(`${API}/api/images/${imgId}`, { method: "DELETE" })
        )
      );
      setSelected([]);
      fetchImages();
    } catch (err) {
      alert("Error deleting images");
    }
    setDeleting(false);
  };

  // Select toggle
  const toggleSelected = (imgId: string) => {
    setSelected(prev => prev.includes(imgId) ? prev.filter(id => id !== imgId) : [...prev, imgId]);
  };

  const filtered = images.filter(img =>
    img.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    img.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const allChecked = filtered.length > 0 && filtered.every(img => selected.includes(img.id));

  // Select all/none
  const handleToggleAll = () => {
    if (allChecked) setSelected(selected => selected.filter(id => !filtered.map(f => f.id).includes(id)));
    else setSelected([...new Set([...selected, ...filtered.map(f => f.id)])]);
  };

  return (
    <Layout>
      <div className="mb-10 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">
          Dashboard
        </h1>
        <p className="text-gray-600 text-lg font-medium">
          Welcome back, <span className="text-blue-600">{user?.name}</span>
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 mb-8 w-full">
        <div className="relative w-full md:w-72">
          <Input
            placeholder="Search patients..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 shadow"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        <Button
          onClick={() => setShowUploader(v => !v)}
          className="flex items-center font-semibold"
        >
          <Plus className="mr-1" />
          {showUploader ? 'Cancel Upload' : 'Upload New Image'}
        </Button>

        <Button
          variant="outline"
          className="ml-2 flex items-center"
          onClick={handleDeleteSelected}
          disabled={selected.length === 0 || deleting}
        >
          <Trash2 className="mr-1" /> {deleting ? "Deleting..." : "Delete Selected"}
        </Button>
      </div>

      {showUploader && (
        <div className="mb-8 max-w-2xl mx-auto">
          <ImageUploader onUpload={handleUpload} />
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-blue-700 mx-auto" />
          <p className="mt-6 text-gray-600 text-lg">Loading images…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-600 text-lg font-medium">No images found</p>
          {searchTerm && <p className="mt-2 text-gray-500">Try adjusting your search or uploading a new image.</p>}
        </div>
      ) : (
        <>
          {/* Header select all */}
          <div className="flex items-center mb-3 px-1">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={handleToggleAll}
              className="mr-2 w-5 h-5 accent-blue-500"
              title="Select all"
            />
            <span className="text-gray-700 text-base font-medium select-none">Select all</span>
          </div>
          {/* Image grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(img => (
              <div key={img.id} className="relative group transition-shadow duration-200 hover:shadow-2xl rounded-2xl">
                <input
                  type="checkbox"
                  checked={selected.includes(img.id)}
                  onChange={() => toggleSelected(img.id)}
                  className="absolute top-3 left-3 z-10 w-5 h-5 accent-blue-500"
                  title="Select"
                />
                <ImageCard
                  image={img}
                  annotationCount={annotationCounts[img.id] ?? 0}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </Layout>
  );
};

export default DashboardPage;
