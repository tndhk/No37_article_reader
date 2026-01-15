import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiClient } from '../../../functions/lib/gemini';

describe('GeminiClient', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('throws error when API key is not provided', () => {
    expect(() => new GeminiClient('')).toThrow('API key is required');
  });

  it('creates instance with valid API key', () => {
    const client = new GeminiClient('test-api-key');
    expect(client).toBeDefined();
  });
});

describe('getWordMeaning', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns word meaning with pos and example', async () => {
    const mockResponse = {
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              meaning: '統合する',
              pos: '動詞',
              example: 'They consolidated their resources.'
            })
          }]
        }
      }]
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const client = new GeminiClient('test-api-key');
    const result = await client.getWordMeaning('consolidate', 'The company will consolidate its operations.');

    expect(result).toEqual({
      meaning: '統合する',
      pos: '動詞',
      example: 'They consolidated their resources.'
    });
  });

  it('throws error when API request fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500
    });

    const client = new GeminiClient('test-api-key');
    await expect(client.getWordMeaning('test', 'context')).rejects.toThrow('Gemini API request failed');
  });
});

describe('translateSentence', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns Japanese translation', async () => {
    const mockResponse = {
      candidates: [{
        content: {
          parts: [{
            text: 'その会社は事業を統合する予定だ。'
          }]
        }
      }]
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const client = new GeminiClient('test-api-key');
    const result = await client.translateSentence('The company will consolidate its operations.');

    expect(result).toBe('その会社は事業を統合する予定だ。');
  });
});
