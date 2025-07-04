import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.options = {
      message: 'Too many requests, please try again later.',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...options
    };

    // Clean up expired entries every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  private getKey(req: Request): string {
    // Use IP + User ID for authenticated requests, just IP for anonymous
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = req.user?.userId;
    return userId ? `${ip}:${userId}` : ip;
  }

  middleware = (req: Request, res: Response, next: NextFunction): void => {
    const key = this.getKey(req);
    const now = Date.now();

    // Initialize or reset if window has passed
    if (!this.store[key] || this.store[key].resetTime < now) {
      this.store[key] = {
        count: 0,
        resetTime: now + this.options.windowMs
      };
    }

    // Check if limit exceeded
    if (this.store[key].count >= this.options.maxRequests) {
      const remainingTime = Math.ceil((this.store[key].resetTime - now) / 1000);

      res.status(429).json({
        error: this.options.message,
        retryAfter: remainingTime
      });
      return;
    }

    // Increment counter
    this.store[key].count++;

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': this.options.maxRequests.toString(),
      'X-RateLimit-Remaining': (this.options.maxRequests - this.store[key].count).toString(),
      'X-RateLimit-Reset': Math.ceil(this.store[key].resetTime / 1000).toString()
    });

    // Handle response to determine if we should count this request
    const originalSend = res.send;
    const self = this;
    res.send = function(body: any) {
      const statusCode = res.statusCode;

      // Optionally skip counting based on response status
      if (
        (statusCode >= 200 && statusCode < 300 && self.options.skipSuccessfulRequests) ||
        (statusCode >= 400 && self.options.skipFailedRequests)
      ) {
        self.store[key].count--;
      }

      return originalSend.call(this, body);
    };

    next();
  };
}

// General rate limiter for all API routes - more lenient
export const generalLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 500, // increased from 100 to 500 requests per windowMs
  message: 'Juda ko\'p so\'rov yuborildi, keyinroq urinib ko\'ring.',
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Authentication rate limiter - more lenient
export const authLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 25, // increased from 10 to 25 requests per windowMs
  message: 'Juda ko\'p kirish urinishi. 15 daqiqadan so\'ng qayta urinib ko\'ring.',
  skipSuccessfulRequests: true
});

// Upload rate limiter - more lenient
export const uploadLimiter = new RateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 50, // increased from 20 to 50 uploads per windowMs
  message: 'Juda ko\'p fayl yuklash urinishi. Keyinroq urinib ko\'ring.'
});

// Test-specific rate limiter - more lenient
export const testLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // increased from 30 to 60 test requests per minute
  message: 'Test bilan bog\'liq juda ko\'p so\'rov. Biroz kuting.'
});

export default RateLimiter;