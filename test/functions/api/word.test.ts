import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../functions/lib/gemini', () => ({
  GeminiClient: vi.fn().mockImplementation(() => ({
    getWordMeaning: vi.fn().mockResolvedValue({
      meaning: '統合する',
      pos: '動詞',
      example: 'They consolidated their resources.'
    })
  }))
}));

describe('POST /api/word', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 400 for missing word', async () => {
    const { onRequestPost } = await import('../../../functions/api/word');

    const mockContext = {
      request: {
        json: () => Promise.resolve({ context: 'some context' })
      },
      env: { GEMINI_API_KEY: 'test-key' }
    };

    const response = await onRequestPost(mockContext as any);

    expect(response.status).toBe(400);
  });

  it('returns 400 for missing context', async () => {
    const { onRequestPost } = await import('../../../functions/api/word');

    const mockContext = {
      request: {
        json: () => Promise.resolve({ word: 'test' })
      },
      env: { GEMINI_API_KEY: 'test-key' }
    };

    const response = await onRequestPost(mockContext as any);

    expect(response.status).toBe(400);
  });
});
