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
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.message?.includes('401') || error?.message?.includes('Avtorizatsiya')) {
        return false;
      }
      return failureCount < 1;
    },
    staleTime: 30000, // 30 seconds cache to reduce unnecessary requests
    refetchOnMount: false,
    refetchOnWindowFocus: false,
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
      localStorage.removeItem('userSession');
      localStorage.setItem('afterLogout', 'true'); // Flag to show login form directly after logout
    }
    setToken(null);
    setCachedUser(null);
    queryClient.clear();
    
    toast({
      title: 'Chiqish',
      description: 'Tizimdan chiqish muvaffaqiyatli amalga oshirildi',
      variant: 'default',
    });
    
    // Force page reload to ensure clean state
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  // Handle token validation errors with better error checking
  useEffect(() => {
    if (userError && token) {
      // Only logout on specific authentication errors, not general network errors
      const errorMessage = userError.message?.toLowerCase() || '';
      
      // Check for actual authentication errors (not network errors)
      const isAuthError = errorMessage.includes('invalid token') || 
                         errorMessage.includes('expired token') ||
                         errorMessage.includes('authentication failed') ||
                         errorMessage.includes('authentication required') ||
                         (errorMessage.includes('401') && errorMessage.includes('avtorizatsiya'));
      
      if (isAuthError) {
        // Authentication error detected, logging out
        console.log('Authentication error detected, logging out user:', errorMessage);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('userSession');
        }
        setToken(null);
        setCachedUser(null);
        queryClient.clear();
        
        toast({
          title: 'Session tugadi',
          description: 'Iltimos, qaytadan kiring',
          variant: 'destructive',
        });
        
        setLocation('/');
      } else {
        // Network or other error, keeping session
        console.log('Network error, keeping session:', errorMessage);
      }
    }
  }, [userError, token, setLocation, toast]);

  // Auto-login effect for persistent sessions with better debugging
  useEffect(() => {
    if (token && !user && !isLoadingUser && !userError) {
      console.log('Auto-refetching user data...');
      refetchUser();
    }
  }, [token, user, isLoadingUser, userError, refetchUser]);

  // Session persistence - save user data locally for offline access
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      localStorage.setItem('userSession', JSON.stringify({
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        timestamp: Date.now()
      }));
    }
  }, [user]);

  // Load cached user data if available while fetching fresh data
  const [cachedUser, setCachedUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('userSession');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // Only use cached data if it's less than 5 minutes old
          if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
            return parsed;
          }
        } catch (e) {
          localStorage.removeItem('userSession');
        }
      }
    }
    return null;
  });

  // Use cached user data while loading if available
  const currentUser = user || (isLoadingUser && token ? cachedUser : null);

  return {
    user: currentUser,
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
