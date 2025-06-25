import { lazy } from 'react';

// Lazy load heavy components for better performance
export const LazyTakeTestPage = lazy(() => import('../pages/TakeTestPage'));
export const LazyTestResult = lazy(() => import('../components/TestResult'));
export const LazyCreateTest = lazy(() => import('../pages/teacher/CreateTest'));
export const LazyEditTest = lazy(() => import('../pages/teacher/EditTest'));
export const LazyProfile = lazy(() => import('../pages/Profile'));
export const LazyImageGallery = lazy(() => import('../components/TestImageGallery'));

// Loading component for lazy imports
export const LazyLoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-sm text-gray-600">Yuklanmoqda...</span>
  </div>
);

// Error boundary for lazy loading errors
export const LazyErrorBoundary = ({ error, retry }: { error: Error; retry: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
    <div className="text-red-600 mb-2">⚠️ Yuklashda xatolik</div>
    <p className="text-sm text-gray-600 mb-4">{error.message}</p>
    <button 
      onClick={retry}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Qayta urinish
    </button>
  </div>
);