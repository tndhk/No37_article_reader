/**
 * Unit tests for cache.ts
 * Testing framework: Vitest
 *
 * Tests cover:
 * - Word meaning cache operations (get/set)
 * - Translation cache operations (get/set)
 * - Cache expiration (24-hour TTL)
 * - Cache clearing
 * - Edge cases and boundary conditions
 *
 * Note: Uses vi.useFakeTimers to test TTL expiration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WordMeaning } from '../../../src/services/api-client';

// Re-import fresh module for each test to reset singleton state
const importCache = async () => {
  vi.resetModules();
  const module = await import('../../../src/services/cache');
  return module.cacheService;
};

describe('CacheService', () => {
  const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getWordMeaning / setWordMeaning', () => {
    const mockMeaning: WordMeaning = {
      meaning: 'the state of a country in terms of trade and money',
      pos: 'noun',
      example: 'The economy is growing rapidly.'
    };

    // Normal case: get after set
    it('returns cached word meaning after setting', async () => {
      const cacheService = await importCache();
      cacheService.setWordMeaning('economy', 'context sentence', mockMeaning);

      const result = cacheService.getWordMeaning('economy', 'context sentence');
      expect(result).toEqual(mockMeaning);
    });

    // Normal case: different words stored separately
    it('stores different words separately', async () => {
      const cacheService = await importCache();
      const meaning1: WordMeaning = { meaning: 'meaning1', pos: 'noun', example: 'ex1' };
      const meaning2: WordMeaning = { meaning: 'meaning2', pos: 'verb', example: 'ex2' };

      cacheService.setWordMeaning('word1', 'context1', meaning1);
      cacheService.setWordMeaning('word2', 'context2', meaning2);

      expect(cacheService.getWordMeaning('word1', 'context1')).toEqual(meaning1);
      expect(cacheService.getWordMeaning('word2', 'context2')).toEqual(meaning2);
    });

    // Key generation: same word with different contexts stored separately
    it('stores same word with different contexts separately', async () => {
      const cacheService = await importCache();
      const meaning1: WordMeaning = { meaning: 'financial definition', pos: 'noun', example: 'ex1' };
      const meaning2: WordMeaning = { meaning: 'savings definition', pos: 'noun', example: 'ex2' };

      cacheService.setWordMeaning('bank', 'The bank approved the loan.', meaning1);
      cacheService.setWordMeaning('bank', 'The river bank was flooded.', meaning2);

      expect(cacheService.getWordMeaning('bank', 'The bank approved the loan.')).toEqual(meaning1);
      expect(cacheService.getWordMeaning('bank', 'The river bank was flooded.')).toEqual(meaning2);
    });

    // Edge case: get non-existent entry
    it('returns null for non-existent cache entry', async () => {
      const cacheService = await importCache();
      const result = cacheService.getWordMeaning('nonexistent', 'any context');
      expect(result).toBeNull();
    });

    // TTL: not expired (boundary - just before expiration)
    it('returns cached value just before TTL expiration', async () => {
      const cacheService = await importCache();
      cacheService.setWordMeaning('economy', 'context', mockMeaning);

      // Advance time to just before TTL
      vi.advanceTimersByTime(CACHE_TTL - 1);

      const result = cacheService.getWordMeaning('economy', 'context');
      expect(result).toEqual(mockMeaning);
    });

    // TTL: expired (boundary - exactly at expiration)
    it('returns null at exactly TTL expiration', async () => {
      const cacheService = await importCache();
      cacheService.setWordMeaning('economy', 'context', mockMeaning);

      // Advance time to exactly TTL + 1ms (expired)
      vi.advanceTimersByTime(CACHE_TTL + 1);

      const result = cacheService.getWordMeaning('economy', 'context');
      expect(result).toBeNull();
    });

    // TTL: well past expiration
    it('returns null for expired cache entry', async () => {
      const cacheService = await importCache();
      cacheService.setWordMeaning('economy', 'context', mockMeaning);

      // Advance time beyond TTL
      vi.advanceTimersByTime(CACHE_TTL + 1000);

      const result = cacheService.getWordMeaning('economy', 'context');
      expect(result).toBeNull();
    });

    // Update: overwriting existing entry resets TTL
    it('updates existing entry and resets TTL', async () => {
      const cacheService = await importCache();
      const updatedMeaning: WordMeaning = { meaning: 'updated', pos: 'adj', example: 'new ex' };

      cacheService.setWordMeaning('economy', 'context', mockMeaning);
      vi.advanceTimersByTime(CACHE_TTL - 1000); // Almost expired

      // Update the entry
      cacheService.setWordMeaning('economy', 'context', updatedMeaning);
      vi.advanceTimersByTime(CACHE_TTL - 1000); // Would be expired if not reset

      const result = cacheService.getWordMeaning('economy', 'context');
      expect(result).toEqual(updatedMeaning);
    });

    // Edge case: empty string word and context
    it('handles empty string word and context', async () => {
      const cacheService = await importCache();
      cacheService.setWordMeaning('', '', mockMeaning);

      const result = cacheService.getWordMeaning('', '');
      expect(result).toEqual(mockMeaning);
    });

    // Edge case: special characters in word/context
    it('handles special characters in word and context', async () => {
      const cacheService = await importCache();
      const word = "don't";
      const context = 'He said: "Don\'t go!"';

      cacheService.setWordMeaning(word, context, mockMeaning);

      const result = cacheService.getWordMeaning(word, context);
      expect(result).toEqual(mockMeaning);
    });
  });

  describe('getTranslation / setTranslation', () => {
    const testSentence = 'The economy is growing.';
    const testTranslation = '経済は成長しています。';

    // Normal case: get after set
    it('returns cached translation after setting', async () => {
      const cacheService = await importCache();
      cacheService.setTranslation(testSentence, testTranslation);

      const result = cacheService.getTranslation(testSentence);
      expect(result).toBe(testTranslation);
    });

    // Normal case: different sentences stored separately
    it('stores different sentences separately', async () => {
      const cacheService = await importCache();
      const sentence1 = 'Hello world.';
      const translation1 = 'こんにちは世界。';
      const sentence2 = 'Goodbye world.';
      const translation2 = 'さようなら世界。';

      cacheService.setTranslation(sentence1, translation1);
      cacheService.setTranslation(sentence2, translation2);

      expect(cacheService.getTranslation(sentence1)).toBe(translation1);
      expect(cacheService.getTranslation(sentence2)).toBe(translation2);
    });

    // Edge case: get non-existent entry
    it('returns null for non-existent cache entry', async () => {
      const cacheService = await importCache();
      const result = cacheService.getTranslation('nonexistent sentence');
      expect(result).toBeNull();
    });

    // TTL: not expired (boundary - just before expiration)
    it('returns cached value just before TTL expiration', async () => {
      const cacheService = await importCache();
      cacheService.setTranslation(testSentence, testTranslation);

      vi.advanceTimersByTime(CACHE_TTL - 1);

      const result = cacheService.getTranslation(testSentence);
      expect(result).toBe(testTranslation);
    });

    // TTL: expired
    it('returns null for expired cache entry', async () => {
      const cacheService = await importCache();
      cacheService.setTranslation(testSentence, testTranslation);

      vi.advanceTimersByTime(CACHE_TTL + 1);

      const result = cacheService.getTranslation(testSentence);
      expect(result).toBeNull();
    });

    // Edge case: empty string sentence and translation
    it('handles empty string sentence and translation', async () => {
      const cacheService = await importCache();
      cacheService.setTranslation('', '');

      const result = cacheService.getTranslation('');
      expect(result).toBe('');
    });

    // Edge case: long sentence
    it('handles long sentences', async () => {
      const cacheService = await importCache();
      const longSentence = 'This is a very long sentence. '.repeat(100);
      const longTranslation = 'これは非常に長い文です。'.repeat(100);

      cacheService.setTranslation(longSentence, longTranslation);

      const result = cacheService.getTranslation(longSentence);
      expect(result).toBe(longTranslation);
    });
  });

  describe('clear', () => {
    // Verifies both caches are cleared
    it('clears all word meaning and translation caches', async () => {
      const cacheService = await importCache();
      const meaning: WordMeaning = { meaning: 'test', pos: 'noun', example: 'test' };

      cacheService.setWordMeaning('word', 'context', meaning);
      cacheService.setTranslation('sentence', 'translation');

      cacheService.clear();

      expect(cacheService.getWordMeaning('word', 'context')).toBeNull();
      expect(cacheService.getTranslation('sentence')).toBeNull();
    });

    // Clearing empty cache should not throw
    it('does not throw when clearing empty cache', async () => {
      const cacheService = await importCache();
      expect(() => cacheService.clear()).not.toThrow();
    });

    // Can add new entries after clearing
    it('allows adding new entries after clearing', async () => {
      const cacheService = await importCache();
      const meaning: WordMeaning = { meaning: 'test', pos: 'noun', example: 'test' };

      cacheService.setWordMeaning('old', 'context', meaning);
      cacheService.clear();

      cacheService.setWordMeaning('new', 'context', meaning);
      cacheService.setTranslation('new sentence', 'new translation');

      expect(cacheService.getWordMeaning('new', 'context')).toEqual(meaning);
      expect(cacheService.getTranslation('new sentence')).toBe('new translation');
    });
  });

  describe('cache isolation', () => {
    // Word cache and translation cache are independent
    it('word cache and translation cache are independent', async () => {
      const cacheService = await importCache();
      const meaning: WordMeaning = { meaning: 'test', pos: 'noun', example: 'test' };

      // Use same key for both caches
      cacheService.setWordMeaning('key', '', meaning);
      cacheService.setTranslation('key', 'translation');

      // Both should exist independently
      expect(cacheService.getWordMeaning('key', '')).toEqual(meaning);
      expect(cacheService.getTranslation('key')).toBe('translation');
    });
  });
});
