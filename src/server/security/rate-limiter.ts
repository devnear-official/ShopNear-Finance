import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/server/utils/api-response';

interface RateLimitRecord {
  timestamps: number[];
}

class MemoryRateLimiter {
  private store: Map<string, RateLimitRecord> = new Map();
  private lastCleanup = Date.now();

  /**
   * Check if a request is allowed under rate limits
   * @param key Unique key (e.g., "login:127.0.0.1:admin@shopnear.test")
   * @param limit Max allowed attempts in window
   * @param windowMs Time window in milliseconds
   */
  public check(
    key: string,
    limit: number,
    windowMs: number
  ): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfterSec: number;
  } {
    const now = Date.now();

    // Perform periodic inline garbage collection every 60 seconds
    if (now - this.lastCleanup > 60000) {
      this.cleanup();
      this.lastCleanup = now;
    }

    const windowStart = now - windowMs;

    let record = this.store.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.store.set(key, record);
    }

    // Filter out timestamps outside the sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= limit) {
      const oldestInWindow = record.timestamps[0];
      const resetTime = oldestInWindow + windowMs;
      const retryAfterSec = Math.max(1, Math.ceil((resetTime - now) / 1000));

      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfterSec,
      };
    }

    // Record this attempt
    record.timestamps.push(now);
    const remaining = Math.max(0, limit - record.timestamps.length);
    const resetTime = now + windowMs;

    return {
      allowed: true,
      remaining,
      resetTime,
      retryAfterSec: 0,
    };
  }

  /**
   * Reset rate limit key (e.g., upon successful login)
   */
  public reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Remove expired keys to free memory
   */
  private cleanup(): void {
    const now = Date.now();
    const maxWindow = 60 * 60 * 1000; // 1 hour max
    for (const [key, record] of this.store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < maxWindow);
      if (record.timestamps.length === 0) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all records (useful for test isolation)
   */
  public clear(): void {
    this.store.clear();
  }
}

// Global singleton rate limiter instance
export const rateLimiter = new MemoryRateLimiter();

/**
 * Extract client IP address from standard proxy/CDN headers
 */
export function getClientIp(req: Request | NextRequest): string {
  if ('headers' in req) {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    const realIp = req.headers.get('x-real-ip');
    if (realIp) {
      return realIp.trim();
    }
    const cfIp = req.headers.get('cf-connecting-ip');
    if (cfIp) {
      return cfIp.trim();
    }
  }
  return '127.0.0.1';
}

/**
 * Standard 429 Too Many Requests response with RFC 6585 and X-RateLimit headers
 */
export function createRateLimitResponse(
  message = 'Too many requests. Please try again later.',
  limit: number,
  resetTime: number,
  retryAfterSec: number
): NextResponse {
  const res = ApiResponse.error(message, 429, 'RATE_LIMIT_EXCEEDED');
  res.headers.set('Retry-After', retryAfterSec.toString());
  res.headers.set('X-RateLimit-Limit', limit.toString());
  res.headers.set('X-RateLimit-Remaining', '0');
  res.headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
  return res;
}
