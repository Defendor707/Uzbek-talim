import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import useAuth from '@/hooks/useAuth';

interface User {
  id: number;
  username: string;
  role: 'teacher' | 'student' | 'parent' | 'center';
  fullName: string;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoadingUser, token } = useAuth();
  const [, setLocation] = useLocation();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  
  console.log('🛡️ ProtectedRoute state:', {
    hasToken: !!token,
    hasUser: !!user,
    isLoading: isLoadingUser,
    userRole: (user as User)?.role,
    allowedRoles,
    hasCheckedAuth
  });

  useEffect(() => {
    // ULTRA CONSERVATIVE APPROACH - never redirect unless absolutely certain
    console.log('🔍 ProtectedRoute useEffect triggered');
    
    // Wait a bit before making any decisions
    const timer = setTimeout(() => {
      // Only redirect if we're 100% sure there's no token
      if (!token) {
        console.log('❌ No token found, redirecting to login');
        setLocation('/');
      } else if (!isLoadingUser) {
        setHasCheckedAuth(true);
        
        // If user is loaded and role doesn't match, redirect to their dashboard
        if (user && !allowedRoles.includes((user as User).role)) {
          console.log('🔄 Wrong role, redirecting to user dashboard:', (user as User).role);
          setLocation(`/dashboard/${(user as User).role}`);
        }
      }
    }, 100); // Small delay to prevent race conditions
    
    return () => clearTimeout(timer);
  }, [user, isLoadingUser, token, allowedRoles, setLocation]);

  // Show loading for a reasonable time
  if (!hasCheckedAuth && (isLoadingUser || (token && !user))) {
    console.log('⏳ Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Yuklanmoqda...</div>
        </div>
      </div>
    );
  }

  // If no token, don't render (will redirect)
  if (!token) {
    console.log('🚫 No token, not rendering');
    return null;
  }
  
  // If wrong role, don't render (will redirect)
  if (user && !allowedRoles.includes((user as User).role)) {
    console.log('🚫 Wrong role, not rendering');
    return null;
  }
  
  // If we have token but no user yet, keep showing loading
  if (token && !user && isLoadingUser) {
    console.log('⏳ Has token but loading user');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Foydalanuvchi ma'lumotlari yuklanmoqda...</div>
        </div>
      </div>
    );
  }
  
  // At this point, we should have user and correct role
  if (!user) {
    console.log('❓ Strange state - has token but no user, showing loading');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Kirish jarayoni...</div>
        </div>
      </div>
    );
  }

  console.log('✅ All checks passed, rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;