import React from 'react';
import { useLocation } from 'wouter';
import useAuth from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoadingUser } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Yuklanmoqda...</div>
      </div>
    );
  }

  if (!user) {
    setLocation('/login');
    return null;
  }

  if (!allowedRoles.includes(user.role)) {
    setLocation('/login');
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;