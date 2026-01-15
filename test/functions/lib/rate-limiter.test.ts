import { describe, it, expect, vi } from 'vitest';
import { RateLimiter, RateLimitConfig } from '../../../functions/lib/rate-limiter';

describe('RateLimiter', () => {
  const mockKV = {
    get: vi.fn(),
    put: vi.fn()
  };

  const config: RateLimitConfig = {
    maxRequests: 30,
    windowMs: 60 * 60 * 1000 // 1 hour
  };

  it('allows request when under limit', async () => {
    mockKV.get.mockResolvedValue('5');
    const limiter = new RateLimiter(mockKV as unknown as KVNamespace, config);

    const result = await limiter.checkLimit('127.0.0.1', 'article');
    expect(result.allowed).toBe(true);
  });

  it('blocks request when over limit', async () => {
    mockKV.get.mockResolvedValue('30');
    const limiter = new RateLimiter(mockKV as unknown as KVNamespace, config);

    const result = await limiter.checkLimit('127.0.0.1', 'article');
    expect(result.allowed).toBe(false);
  });

  it('allows first request when no previous count', async () => {
    mockKV.get.mockResolvedValue(null);
    const limiter = new RateLimiter(mockKV as unknown as KVNamespace, config);

    const result = await limiter.checkLimit('127.0.0.1', 'article');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(30);
  });

  it('increments request count', async () => {
    mockKV.get.mockResolvedValue('5');
    mockKV.put.mockResolvedValue(undefined);
    const limiter = new RateLimiter(mockKV as unknown as KVNamespace, config);

    await limiter.increment('127.0.0.1', 'article');

    expect(mockKV.put).toHaveBeenCalledWith(
      'rate:article:127.0.0.1',
      '6',
      { expirationTtl: 3600 }
    );
  });
});
