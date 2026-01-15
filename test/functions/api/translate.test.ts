import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../functions/lib/gemini', () => ({
  GeminiClient: vi.fn().mockImplementation(() => ({
    translateSentence: vi.fn().mockResolvedValue('その会社は事業を統合する予定だ。')
  }))
}));

vi.mock('../../../functions/lib/rate-limiter', () => ({
  RateLimiter: vi.fn().mockImplementation(() => ({
    checkLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 99 }),
    increment: vi.fn().mockResolvedValue(undefined)
  })),
  RATE_LIMITS: { translate: { maxRequests: 100, windowMs: 3600000 } }
}));

describe('POST /api/translate', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 400 for missing sentence', async () => {
    const { onRequestPost } = await import('../../../functions/api/translate');

    const mockContext = {
      request: {
        json: () => Promise.resolve({}),
        headers: new Headers({ 'CF-Connecting-IP': '127.0.0.1' })
      },
      env: { GEMINI_API_KEY: 'test-key', RATE_LIMIT_KV: {} }
    };

    const response = await onRequestPost(mockContext as any);

    expect(response.status).toBe(400);
  });

  it('returns 400 for empty sentence', async () => {
    const { onRequestPost } = await import('../../../functions/api/translate');

    const mockContext = {
      request: {
        json: () => Promise.resolve({ sentence: '' }),
        headers: new Headers({ 'CF-Connecting-IP': '127.0.0.1' })
      },
      env: { GEMINI_API_KEY: 'test-key', RATE_LIMIT_KV: {} }
    };

    const response = await onRequestPost(mockContext as any);

    expect(response.status).toBe(400);
  });
});
