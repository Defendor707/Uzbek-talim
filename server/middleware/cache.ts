import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  keyGenerator?: (req: Request) => string;
}

class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }

  private evictOldest(): void {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  set(key: string, data: any, ttl: number): void {
    this.evictOldest();
    
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    };
    
    this.cache.set(key, entry);
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Cache invalidation by pattern
  invalidatePattern(pattern: string): number {
    let count = 0;
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }
}

// Global cache instance
const globalCache = new MemoryCache(2000);

// Cache middleware factory
export function createCacheMiddleware(options: CacheOptions) {
  const { ttl, keyGenerator } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator ? keyGenerator(req) : `${req.originalUrl}:${req.user?.userId || 'anonymous'}`;
    
    // Try to get from cache
    const cachedData = globalCache.get(cacheKey);
    if (cachedData) {
      res.set('X-Cache', 'HIT');
      return res.json(cachedData);
    }

    // If not in cache, intercept response
    const originalSend = res.send;
    res.send = function(body: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const data = typeof body === 'string' ? JSON.parse(body) : body;
          globalCache.set(cacheKey, data, ttl);
          res.set('X-Cache', 'MISS');
        } catch (error) {
          console.error('Cache serialization error:', error);
        }
      }
      
      return originalSend.call(this, body);
    };

    next();
  };
}

// Pre-configured cache middleware for different endpoints
export const testsCache = createCacheMiddleware({
  ttl: 5 * 60 * 1000, // 5 minutes
  keyGenerator: (req) => `tests:${req.originalUrl}:${req.user?.userId}`
});

export const lessonsCache = createCacheMiddleware({
  ttl: 10 * 60 * 1000, // 10 minutes
  keyGenerator: (req) => `lessons:${req.originalUrl}:${req.user?.userId}`
});

export const profileCache = createCacheMiddleware({
  ttl: 15 * 60 * 1000, // 15 minutes
  keyGenerator: (req) => `profile:${req.originalUrl}:${req.user?.userId}`
});

export const statisticsCache = createCacheMiddleware({
  ttl: 30 * 60 * 1000, // 30 minutes
  keyGenerator: (req) => `stats:${req.originalUrl}:${req.user?.userId}`
});

// Cache invalidation helpers
export function invalidateUserCache(userId: number): void {
  globalCache.invalidatePattern(`${userId}`);
}

export function invalidateTestsCache(): void {
  globalCache.invalidatePattern('tests:');
}

export function invalidateLessonsCache(): void {
  globalCache.invalidatePattern('lessons:');
}

export function invalidateProfileCache(userId: number): void {
  globalCache.invalidatePattern(`profile:${userId}`);
}

export { globalCache };
export default MemoryCache;