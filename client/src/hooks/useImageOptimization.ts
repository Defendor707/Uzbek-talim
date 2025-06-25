import { useState, useEffect, useRef } from 'react';

interface ImageOptimizationOptions {
  lazy?: boolean;
  quality?: 'low' | 'medium' | 'high';
  placeholder?: string;
  fallback?: string;
}

export function useImageOptimization(src: string, options: ImageOptimizationOptions = {}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState(options.placeholder || '');
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!src) return;

    // Lazy loading with Intersection Observer
    if (options.lazy && imgRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadImage();
              observerRef.current?.disconnect();
            }
          });
        },
        { threshold: 0.1 }
      );

      observerRef.current.observe(imgRef.current);
    } else {
      loadImage();
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src, options.lazy]);

  const loadImage = () => {
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(getOptimizedImageUrl(src, options.quality));
      setLoading(false);
      setError(false);
    };

    img.onerror = () => {
      setImageSrc(options.fallback || '');
      setLoading(false);
      setError(true);
    };

    img.src = getOptimizedImageUrl(src, options.quality);
  };

  const getOptimizedImageUrl = (url: string, quality: string = 'medium'): string => {
    // Check if the image is already optimized (WebP)
    if (url.includes('.webp') || url.includes('optimized/')) {
      return url;
    }

    // Try to use optimized version if available
    const optimizedUrl = url.replace(/\.(jpg|jpeg|png)$/i, '.webp').replace('uploads/', 'uploads/optimized/');
    
    // Add quality parameter for further optimization
    const qualityMap = {
      low: 60,
      medium: 80,
      high: 95
    };

    return optimizedUrl;
  };

  return {
    src: imageSrc,
    loading,
    error,
    ref: imgRef
  };
}

// Component for optimized image display
interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  lazy?: boolean;
  quality?: 'low' | 'medium' | 'high';
  placeholder?: string;
  fallback?: string;
  [key: string]: any;
}

export function OptimizedImage({ 
  src, 
  alt, 
  className = '', 
  lazy = true,
  quality = 'medium',
  placeholder,
  fallback = '/images/placeholder.png',
  ...props 
}: OptimizedImageProps) {
  const { src: optimizedSrc, loading, error, ref } = useImageOptimization(src, {
    lazy,
    quality,
    placeholder,
    fallback
  });

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded flex items-center justify-center">
          <div className="text-gray-400 text-sm">Yuklanmoqda...</div>
        </div>
      )}
      
      <img
        ref={ref}
        src={optimizedSrc}
        alt={alt}
        className={`${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 ${className}`}
        {...props}
      />
      
      {error && (
        <div className="absolute inset-0 bg-gray-100 rounded flex items-center justify-center">
          <div className="text-gray-500 text-sm">Rasm yuklanmadi</div>
        </div>
      )}
    </div>
  );
}