/**
 * Unit tests for api-client.ts
 * Testing framework: Vitest
 *
 * Tests cover:
 * - ApiClient.fetchArticle: GET request, success/error handling
 * - ApiClient.getWordMeaning: POST request, success/error handling
 * - ApiClient.translateSentence: POST request, success/error handling
 * - Error handling for network failures and API errors
 *
 * Note: Uses vi.fn() to mock global fetch
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ApiClient,
  ParsedArticle,
  WordMeaning,
  TranslationResult
} from '../../../src/services/api-client';

describe('ApiClient', () => {
  let apiClient: ApiClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    apiClient = new ApiClient();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchArticle', () => {
    const mockArticle: ParsedArticle = {
      title: 'Test Article',
      source: 'https://example.com',
      paragraphs: [
        {
          sentences: [
            { text: 'This is a test sentence.', words: ['This', 'is', 'a', 'test', 'sentence.'] }
          ]
        }
      ]
    };

    // Normal case: successful fetch
    it('returns parsed article on successful response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockArticle)
      });

      const result = await apiClient.fetchArticle('https://example.com/article');

      expect(result).toEqual(mockArticle);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/article?url=https%3A%2F%2Fexample.com%2Farticle'
      );
    });

    // URL encoding: special characters in URL
    it('properly encodes URL with special characters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockArticle)
      });

      await apiClient.fetchArticle('https://example.com/article?id=123&lang=en');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/article?url=https%3A%2F%2Fexample.com%2Farticle%3Fid%3D123%26lang%3Den'
      );
    });

    // Error case: API returns error response
    it('throws error with API error message on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Article not found' })
      });

      await expect(apiClient.fetchArticle('https://example.com/missing'))
        .rejects.toThrow('Article not found');
    });

    // Error case: API returns error without message
    it('throws default error message when API error has no message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({})
      });

      await expect(apiClient.fetchArticle('https://example.com/error'))
        .rejects.toThrow('Failed to fetch article');
    });

    // Error case: network failure
    it('propagates network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.fetchArticle('https://example.com'))
        .rejects.toThrow('Network error');
    });

    // Error case: JSON parse error
    it('propagates JSON parse errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      await expect(apiClient.fetchArticle('https://example.com'))
        .rejects.toThrow('Invalid JSON');
    });
  });

  describe('getWordMeaning', () => {
    const mockMeaning: WordMeaning = {
      meaning: 'a system of trade and money',
      pos: 'noun',
      example: 'The economy is improving.'
    };

    // Normal case: successful response
    it('returns word meaning on successful response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMeaning)
      });

      const result = await apiClient.getWordMeaning('economy', 'The economy is growing.');

      expect(result).toEqual(mockMeaning);
    });

    // Request format: correct POST request
    it('sends correct POST request with JSON body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMeaning)
      });

      await apiClient.getWordMeaning('economy', 'The economy is growing.');

      expect(mockFetch).toHaveBeenCalledWith('/api/word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: 'economy',
          context: 'The economy is growing.'
        })
      });
    });

    // Error case: API returns error response
    it('throws error with API error message on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Rate limit exceeded' })
      });

      await expect(apiClient.getWordMeaning('word', 'context'))
        .rejects.toThrow('Rate limit exceeded');
    });

    // Error case: API returns error without message
    it('throws default error message when API error has no message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({})
      });

      await expect(apiClient.getWordMeaning('word', 'context'))
        .rejects.toThrow('Failed to get word meaning');
    });

    // Error case: network failure
    it('propagates network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.getWordMeaning('word', 'context'))
        .rejects.toThrow('Network error');
    });

    // Edge case: empty word
    it('handles empty word', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMeaning)
      });

      await apiClient.getWordMeaning('', 'context');

      expect(mockFetch).toHaveBeenCalledWith('/api/word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: '', context: 'context' })
      });
    });

    // Edge case: special characters
    it('handles special characters in word and context', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMeaning)
      });

      const word = "don't";
      const context = 'He said: "Don\'t go!"';

      await apiClient.getWordMeaning(word, context);

      expect(mockFetch).toHaveBeenCalledWith('/api/word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, context })
      });
    });
  });

  describe('translateSentence', () => {
    const mockTranslation: TranslationResult = {
      translation: '経済は成長しています。'
    };

    // Normal case: successful response
    it('returns translation on successful response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTranslation)
      });

      const result = await apiClient.translateSentence('The economy is growing.');

      expect(result).toEqual(mockTranslation);
    });

    // Request format: correct POST request
    it('sends correct POST request with JSON body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTranslation)
      });

      await apiClient.translateSentence('The economy is growing.');

      expect(mockFetch).toHaveBeenCalledWith('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentence: 'The economy is growing.'
        })
      });
    });

    // Error case: API returns error response
    it('throws error with API error message on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Translation service unavailable' })
      });

      await expect(apiClient.translateSentence('test'))
        .rejects.toThrow('Translation service unavailable');
    });

    // Error case: API returns error without message
    it('throws default error message when API error has no message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({})
      });

      await expect(apiClient.translateSentence('test'))
        .rejects.toThrow('Failed to translate sentence');
    });

    // Error case: network failure
    it('propagates network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.translateSentence('test'))
        .rejects.toThrow('Network error');
    });

    // Edge case: empty sentence
    it('handles empty sentence', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ translation: '' })
      });

      const result = await apiClient.translateSentence('');

      expect(result).toEqual({ translation: '' });
    });

    // Edge case: long sentence
    it('handles long sentences', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTranslation)
      });

      const longSentence = 'This is a very long sentence. '.repeat(50);

      await apiClient.translateSentence(longSentence);

      expect(mockFetch).toHaveBeenCalledWith('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence: longSentence })
      });
    });

    // Edge case: unicode characters
    it('handles unicode characters in sentence', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTranslation)
      });

      const sentence = 'This has émojis 🎉 and ünïcödé characters.';

      await apiClient.translateSentence(sentence);

      expect(mockFetch).toHaveBeenCalledWith('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence })
      });
    });
  });

  describe('singleton export', () => {
    it('exports a pre-instantiated apiClient', async () => {
      const module = await import('../../../src/services/api-client');
      expect(module.apiClient).toBeInstanceOf(ApiClient);
    });
  });
});
