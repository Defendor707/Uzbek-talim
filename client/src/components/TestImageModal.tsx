import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TestImageModalProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const TestImageModal: React.FC<TestImageModalProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrev,
}) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  if (!isOpen) return null;

  const currentImage = images[currentIndex];

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.3, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center text-white z-10">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium">Test rasmlari</h3>
          <span className="text-sm text-gray-300">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetZoom}
            className="text-white hover:bg-white hover:bg-opacity-20 text-xs"
          >
            {Math.round(zoom * 100)}%
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Image */}
      <div className="relative max-w-6xl max-h-full p-16 overflow-hidden">
        <img
          src={`/uploads/${currentImage}`}
          alt={`Test rasmi ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain transition-transform duration-200 cursor-move"
          style={{
            transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
          }}
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            if (img.src.includes('/uploads/')) {
              img.src = `/${currentImage}`;
            }
          }}
          onMouseDown={(e) => {
            if (zoom <= 1) return;
            
            const startX = e.clientX - position.x;
            const startY = e.clientY - position.y;
            
            const handleMouseMove = (e: MouseEvent) => {
              setPosition({
                x: e.clientX - startX,
                y: e.clientY - startY,
              });
            };
            
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />
      </div>

      {/* Navigation */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            onClick={onPrev}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all disabled:opacity-30"
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            onClick={onNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all disabled:opacity-30"
            disabled={currentIndex === images.length - 1}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </>
      )}

      {/* Bottom indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-40'
              }`}
              onClick={() => {
                // Handle direct navigation to specific image
                const diff = index - currentIndex;
                if (diff > 0) {
                  for (let i = 0; i < diff; i++) onNext();
                } else if (diff < 0) {
                  for (let i = 0; i < Math.abs(diff); i++) onPrev();
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TestImageModal;