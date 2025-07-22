import { useState, useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useAuthDebug } from './useAuthDebug';

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
  // Enable debug logging
  useAuthDebug();
  
  // Token state with persistence - never clear on page refresh
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('token');
      console.log('🚀 useAuth initialized - token:', stored ? 'found' : 'not found');
      return stored;
    }
    return null;
  });

  // Custom setToken that always saves to localStorage
  const setTokenAndPersist = (newToken: string | null) => {
    console.log('Setting new token:', newToken ? 'token set' : 'token cleared');
    setToken(newToken);
    
    if (typeof window !== 'undefined') {
      if (newToken) {
        localStorage.setItem('token', newToken);
        console.log('Token saved to localStorage');
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('userSession');
        console.log('Token removed from localStorage');
      }
    }
  };
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Query to fetch current user data - be very forgiving with retries
  const { data: user, isLoading: isLoadingUser, error: userError, refetch: refetchUser } = useQuery<User>({
    queryKey: ['/api/auth/me'],
    enabled: !!token,
    retry: (failureCount, error: any) => {
      const errorMessage = error?.message?.toLowerCase() || '';
      
      // Only stop retrying on definitive server token rejection
      if (errorMessage.includes('invalid or expired token') ||
          errorMessage.includes('jwt expired')) {
        return false;
      }
      
      // Retry everything else - network errors, 401s during refresh, etc.
      return failureCount < 3; // More retries for robustness
    },
    retryDelay: attemptIndex => Math.min(1000 * (attemptIndex + 1), 5000), // Progressive delay
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    refetchOnMount: true, 
    refetchOnWindowFocus: false,
    refetchOnReconnect: true, // Always refetch when network reconnects
  });

  // Login mutation
  const { mutate: login, isPending: isLoggingIn } = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      return await response.json();
    },
    onSuccess: (data) => {
      setTokenAndPersist(data.token);
      
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
      setTokenAndPersist(null);
      
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
      setTokenAndPersist(data.token);
      
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
      setTokenAndPersist(null);
      
      toast({
        title: 'Xatolik',
        description: error.message || "Ro'yxatdan o'tishda xatolik yuz berdi",
        variant: 'destructive',
      });
    },
  });

  // Logout function
  const logout = () => {
    setTokenAndPersist(null);
    queryClient.clear();
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('afterLogout', 'true'); // Flag to show login form directly after logout
    }
    
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

  // Handle token validation errors - EXTREMELY conservative approach
  useEffect(() => {
    if (userError && token) {
      const errorMessage = userError.message?.toLowerCase() || '';
      console.log('⚠️ Auth error detected:', errorMessage);
      
      // ABSOLUTELY NO LOGOUT unless server explicitly says token is dead
      // This prevents logout on refresh, network issues, server restarts, etc.
      const isServerConfirmedTokenDead = errorMessage === 'invalid or expired token' ||
                                        errorMessage === 'jwt expired' ||
                                        errorMessage === 'token has expired';
      
      if (isServerConfirmedTokenDead) {
        console.log('🔒 Server explicitly confirmed token is dead, logging out');
        setTokenAndPersist(null);
        queryClient.clear();
        
        toast({
          title: 'Session tugadi',
          description: 'Iltimos, qaytadan kiring',
          variant: 'destructive',
        });
        
        setLocation('/');
      } else {
        // KEEP SESSION - all network errors, temporary 401s, server unavailable, etc.
        console.log('✅ Ignoring error, keeping session active:', errorMessage);
      }
    }
  }, [userError, token, setLocation, toast]);

  // Enhanced session recovery
  useEffect(() => {
    if (token && !user && !isLoadingUser && !userError) {
      console.log('🔄 Auto-refetching user data for session recovery...');
      refetchUser();
    }
  }, [token, user, isLoadingUser, userError, refetchUser]);
  
  // Prevent token loss on page events
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentToken = localStorage.getItem('token');
      if (currentToken && token) {
        console.log('📌 Preserving token before page unload');
        localStorage.setItem('token', currentToken);
      }
    };
    
    const handlePageShow = () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken && storedToken !== token) {
        console.log('🔄 Restoring token after page show');
        setToken(storedToken);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pageshow', handlePageShow);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [token]);

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
