import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import useAuth from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoadingUser, token } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!token) {
      // No token means user is not authenticated
      setLocation('/');
    } else if (!isLoadingUser && !user) {
      // Token exists but user data couldn't be loaded (invalid token)
      setLocation('/');
    } else if (!isLoadingUser && user && !allowedRoles.includes(user.role)) {
      // User authenticated but doesn't have required role
      setLocation(`/dashboard/${user.role}`);
    }
  }, [user, isLoadingUser, allowedRoles, setLocation, token]);

  // Show loading while checking authentication
  if (isLoadingUser || (token && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Yuklanmoqda...</div>
        </div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;