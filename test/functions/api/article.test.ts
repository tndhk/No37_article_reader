import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules before importing handler
vi.mock('../../../functions/lib/article-parser', () => ({
  parseArticle: vi.fn().mockReturnValue({
    title: 'Test Article',
    source: 'example.com',
    paragraphs: [{ sentences: [{ text: 'Test.', words: ['Test'] }] }]
  })
}));

vi.mock('../../../functions/lib/rate-limiter', () => ({
  RateLimiter: vi.fn().mockImplementation(() => ({
    checkLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 29 }),
    increment: vi.fn().mockResolvedValue(undefined)
  })),
  RATE_LIMITS: { article: { maxRequests: 30, windowMs: 3600000 } }
}));

describe('GET /api/article', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 400 for missing URL parameter', async () => {
    const { onRequestGet } = await import('../../../functions/api/article');

    const mockContext = {
      request: {
        url: 'https://example.com/api/article',
        headers: new Headers({ 'CF-Connecting-IP': '127.0.0.1' })
      },
      env: { RATE_LIMIT_KV: {} }
    };

    const response = await onRequestGet(mockContext as any);

    expect(response.status).toBe(400);
    const data = await response.json() as { error?: string };
    expect(data.error).toBeDefined();
  });

  it('returns 400 for invalid URL', async () => {
    const { onRequestGet } = await import('../../../functions/api/article');

    const mockContext = {
      request: {
        url: 'https://example.com/api/article?url=not-a-valid-url',
        headers: new Headers({ 'CF-Connecting-IP': '127.0.0.1' })
      },
      env: { RATE_LIMIT_KV: {} }
    };

    const response = await onRequestGet(mockContext as any);

    expect(response.status).toBe(400);
  });
});
