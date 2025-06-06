import { useState, useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export type User = {
  id: number;
  username: string;
  email: string;
  role: 'teacher' | 'student' | 'parent' | 'center';
  fullName: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
};

export type LoginCredentials = {
  username: string;
  password: string;
};

export type RegisterData = {
  username: string;
  password: string;
  confirmPassword: string;
  role: 'teacher' | 'student' | 'parent' | 'center';
  fullName: string;
};

const useAuth = () => {
  const [token, setToken] = useState<string | null>(() => {
    // Check if running in browser before accessing localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  });
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Query to fetch current user data
  const { data: user, isLoading: isLoadingUser, error: userError, refetch: refetchUser } = useQuery<User>({
    queryKey: ['/api/auth/me'],
    enabled: !!token,
    retry: false,
    staleTime: 0, // Always refetch to ensure fresh data
  });

  // Login mutation
  const { mutate: login, isPending: isLoggingIn } = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      return await response.json();
    },
    onSuccess: (data) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', data.token);
      }
      setToken(data.token);
      
      // Force refresh of user data with new token
      queryClient.setQueryData(['/api/auth/me'], data.user);
      
      // Redirect based on user role
      const redirectPath = `/dashboard/${data.user.role}`;
      setLocation(redirectPath);
      
      toast({
        title: 'Muvaffaqiyatli',
        description: 'Tizimga muvaffaqiyatli kirdingiz',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      // Clear invalid token on error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      setToken(null);
      
      toast({
        title: 'Xatolik',
        description: error.message || 'Login xatosi yuz berdi',
        variant: 'destructive',
      });
    },
  });

  // Register mutation
  const { mutate: register, isPending: isRegistering } = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiRequest('POST', '/api/auth/register', data);
      return await response.json();
    },
    onSuccess: (data) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', data.token);
      }
      setToken(data.token);
      
      // Force refresh of user data with new token
      queryClient.setQueryData(['/api/auth/me'], data.user);
      
      // Redirect based on user role
      const redirectPath = `/dashboard/${data.user.role}`;
      setLocation(redirectPath);
      
      toast({
        title: 'Muvaffaqiyatli',
        description: "Ro'yxatdan o'tish muvaffaqiyatli yakunlandi",
        variant: 'default',
      });
    },
    onError: (error: any) => {
      // Clear invalid token on error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      setToken(null);
      
      toast({
        title: 'Xatolik',
        description: error.message || "Ro'yxatdan o'tishda xatolik yuz berdi",
        variant: 'destructive',
      });
    },
  });

  // Logout function
  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setToken(null);
    queryClient.clear();
    setLocation('/login');
    
    toast({
      title: 'Chiqish',
      description: 'Tizimdan chiqish muvaffaqiyatli amalga oshirildi',
      variant: 'default',
    });
  };

  // Handle token validation errors
  useEffect(() => {
    if (userError && token) {
      // If user query fails with token present, likely invalid token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      setToken(null);
      queryClient.clear();
      setLocation('/login');
    }
  }, [userError, token, setLocation]);

  // Auto-login effect for persistent sessions
  useEffect(() => {
    if (token && !user && !isLoadingUser && !userError) {
      // If we have a token but no user data, try to refetch
      refetchUser();
    }
  }, [token, user, isLoadingUser, userError, refetchUser]);

  return {
    user,
    token,
    isAuthenticated: !!token,
    isLoadingUser,
    userError,
    login,
    register,
    logout,
    isLoggingIn,
    isRegistering,
  };
};

export default useAuth;
