import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import useAuth from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoadingUser } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoadingUser && !user) {
      setLocation('/login');
    } else if (!isLoadingUser && user && !allowedRoles.includes(user.role)) {
      setLocation('/login');
    }
  }, [user, isLoadingUser, allowedRoles, setLocation]);

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Yuklanmoqda...</div>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;