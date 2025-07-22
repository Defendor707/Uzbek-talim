import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;

    // Handle authentication errors but don't clear token here - let useAuth handle it
    if (res.status === 401) {
      throw new Error('401: Avtorizatsiya talab qilinadi');
    }

    // Try to parse error message from response
    try {
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || `${res.status}: ${res.statusText}`);
    } catch {
      throw new Error(text || `${res.status}: ${res.statusText}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {};

  if (data) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      // Clear invalid token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000, // 15 minutes - increased from 10
      gcTime: 45 * 60 * 1000, // 45 minutes - increased from 30 (renamed from cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 429
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
          return false;
        }
        return failureCount < 2; // Reduced from 3 to 2
      },
      retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 30000), // Increased base delay
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      refetchOnMount: false, // Changed to false to reduce unnecessary requests
      refetchInterval: false, // Disable automatic refetching
      networkMode: 'offlineFirst'
    },
    mutations: {
      retry: false,
      // Mutation error larni global handle qilish
      onError: (error: any) => {
        console.error('Mutation error:', error);
      },
    },
  },
});