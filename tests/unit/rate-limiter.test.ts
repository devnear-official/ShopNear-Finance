import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimiter } from '@/server/security/rate-limiter';

describe('Rate Limiter System', () => {
  beforeEach(() => {
    rateLimiter.clear();
  });

  it('allows requests within limit', () => {
    const key = 'test:ip:1';
    const limit = 3;
    const windowMs = 5000;

    const res1 = rateLimiter.check(key, limit, windowMs);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = rateLimiter.check(key, limit, windowMs);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = rateLimiter.check(key, limit, windowMs);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it('blocks requests exceeding limit and computes retry-after', () => {
    const key = 'test:ip:2';
    const limit = 2;
    const windowMs = 5000;

    rateLimiter.check(key, limit, windowMs);
    rateLimiter.check(key, limit, windowMs);

    const blocked = rateLimiter.check(key, limit, windowMs);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
    expect(blocked.retryAfterSec).toBeLessThanOrEqual(5);
  });

  it('resets rate limit upon reset call', () => {
    const key = 'test:login:admin';
    const limit = 2;
    const windowMs = 10000;

    rateLimiter.check(key, limit, windowMs);
    rateLimiter.check(key, limit, windowMs);

    const blocked = rateLimiter.check(key, limit, windowMs);
    expect(blocked.allowed).toBe(false);

    rateLimiter.reset(key);

    const allowed = rateLimiter.check(key, limit, windowMs);
    expect(allowed.allowed).toBe(true);
    expect(allowed.remaining).toBe(1);
  });
});
