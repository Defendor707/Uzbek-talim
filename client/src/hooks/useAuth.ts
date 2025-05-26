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
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Query to fetch current user data
  const { data: user, isLoading: isLoadingUser, error: userError } = useQuery<User>({
    queryKey: ['/api/auth/me'],
    enabled: !!token,
    retry: false,
  });

  // Login mutation
  const { mutate: login, isPending: isLoggingIn } = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      return await response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      
      // Invalidate auth queries to refetch user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Redirect based on user role
      setTimeout(() => {
        if (data.user.role === 'teacher') {
          navigate('/dashboard/teacher');
        } else if (data.user.role === 'student') {
          navigate('/dashboard/student');
        } else if (data.user.role === 'parent') {
          navigate('/dashboard/parent');
        } else if (data.user.role === 'center') {
          navigate('/dashboard/center');
        }
      }, 100);
      
      toast({
        title: 'Muvaffaqiyatli',
        description: 'Tizimga muvaffaqiyatli kirdingiz',
        variant: 'default',
      });
    },
    onError: (error: any) => {
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
      localStorage.setItem('token', data.token);
      setToken(data.token);
      
      // Invalidate auth queries to refetch user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Redirect based on user role
      setTimeout(() => {
        if (data.user.role === 'teacher') {
          navigate('/dashboard/teacher');
        } else if (data.user.role === 'student') {
          navigate('/dashboard/student');
        } else if (data.user.role === 'parent') {
          navigate('/dashboard/parent');
        } else if (data.user.role === 'center') {
          navigate('/dashboard/center');
        }
      }, 100);
      
      toast({
        title: 'Muvaffaqiyatli',
        description: "Ro'yxatdan o'tish muvaffaqiyatli yakunlandi",
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Xatolik',
        description: error.message || "Ro'yxatdan o'tishda xatolik yuz berdi",
        variant: 'destructive',
      });
    },
  });

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    queryClient.clear();
    navigate('/login');
    
    toast({
      title: 'Chiqish',
      description: 'Tizimdan chiqish muvaffaqiyatli amalga oshirildi',
      variant: 'default',
    });
  };

  // Update axios headers when token changes
  useEffect(() => {
    if (token) {
      // Update any global headers here if needed
    }
  }, [token]);

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
