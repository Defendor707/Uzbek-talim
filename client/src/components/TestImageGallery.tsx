import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import TestImageModal from './TestImageModal';

interface TestImageGalleryProps {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
}

const TestImageGallery: React.FC<TestImageGalleryProps> = ({
  images,
  isOpen,
  onClose,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  
  const imagesPerPage = 5;
  const totalPages = Math.ceil(images.length / imagesPerPage);
  
  if (!isOpen) return null;

  const getCurrentPageImages = () => {
    const start = currentPage * imagesPerPage;
    const end = start + imagesPerPage;
    return images.slice(start, end);
  };

  const handleImageClick = (imageIndex: number) => {
    setSelectedImageIndex(currentPage * imagesPerPage + imageIndex);
    setShowImageModal(true);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
        <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <div>
              <h3 className="text-lg font-semibold">Test rasmlari</h3>
              <p className="text-sm text-gray-500">
                Sahifa {currentPage + 1} / {totalPages} • Jami {images.length} ta rasm
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Images Grid */}
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getCurrentPageImages().map((image, index) => (
                <div
                  key={index}
                  className="relative bg-gray-50 rounded-lg overflow-hidden aspect-square group cursor-pointer"
                  onClick={() => handleImageClick(index)}
                >
                  <img
                    src={`/uploads/${image}`}
                    alt={`Test rasmi ${currentPage * imagesPerPage + index + 1}`}
                    className="w-full h-full object-contain transition-transform group-hover:scale-105"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (img.src.includes('/uploads/')) {
                        img.src = `/${image}`;
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 bg-white bg-opacity-90 p-2 rounded-full">
                      <ZoomIn className="w-5 h-5 text-gray-700" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {currentPage * imagesPerPage + index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t bg-gray-50">
              <Button
                variant="outline"
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Oldingi
              </Button>

              <div className="flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i}
                    variant={i === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(i)}
                    className="w-8 h-8 p-0"
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={currentPage === totalPages - 1}
                className="flex items-center"
              >
                Keyingi
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Full-screen Image Modal */}
      <TestImageModal
        images={images}
        currentIndex={selectedImageIndex}
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onNext={() => setSelectedImageIndex(prev => Math.min(prev + 1, images.length - 1))}
        onPrev={() => setSelectedImageIndex(prev => Math.max(prev - 1, 0))}
      />
    </>
  );
};

export default TestImageGallery;