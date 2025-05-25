import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import useAuth from '@/hooks/useAuth';

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles: string[];
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoadingUser } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoadingUser) {
      if (!isAuthenticated) {
        // Not authenticated, redirect to login
        navigate('/login');
      } else if (user && !allowedRoles.includes(user.role)) {
        // Authenticated but not authorized for this route, redirect to their dashboard
        switch (user.role) {
          case 'teacher':
            navigate('/dashboard/teacher');
            break;
          case 'student':
            navigate('/dashboard/student');
            break;
          case 'parent':
            navigate('/dashboard/parent');
            break;
          case 'center':
            navigate('/dashboard/center');
            break;
          default:
            navigate('/login');
        }
      }
    }
  }, [isAuthenticated, isLoadingUser, user, allowedRoles, navigate]);

  // Show loading state while checking authentication
  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 border-4 border-t-primary border-neutral-ultralight rounded-full animate-spin"></div>
        <span className="ml-3 text-lg font-medium text-neutral-dark">Yuklanmoqda...</span>
      </div>
    );
  }

  // If authenticated and authorized, render the children
  if (isAuthenticated && user && allowedRoles.includes(user.role)) {
    return <>{children}</>;
  }

  // Otherwise return null (will be redirected by the useEffect)
  return null;
};

export default ProtectedRoute;
