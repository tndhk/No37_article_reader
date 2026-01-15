/**
 * Unit tests for main.ts (App class)
 * Testing framework: Vitest with jsdom
 *
 * Tests cover:
 * - App initialization
 * - URL input flow
 * - Article loading (success/error)
 * - Word meaning display (cached/API/error)
 * - Translation display (cached/API/error)
 * - Error screen handling
 * - Navigation (back button)
 *
 * Note: Uses mocks for apiClient and cacheService dependencies
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ParsedArticle, WordMeaning, TranslationResult } from '../../src/services/api-client';

// Mock modules before importing
vi.mock('../../src/services/api-client', () => ({
  apiClient: {
    fetchArticle: vi.fn(),
    getWordMeaning: vi.fn(),
    translateSentence: vi.fn()
  },
  ParsedArticle: {},
  WordMeaning: {},
  TranslationResult: {}
}));

vi.mock('../../src/services/cache', () => ({
  cacheService: {
    getWordMeaning: vi.fn(),
    setWordMeaning: vi.fn(),
    getTranslation: vi.fn(),
    setTranslation: vi.fn(),
    clear: vi.fn()
  }
}));

describe('App', () => {
  let appElement: HTMLElement;

  const mockArticle: ParsedArticle = {
    title: 'Test Article',
    source: 'https://example.com',
    paragraphs: [
      {
        sentences: [
          { text: 'The economy is growing.', words: ['The', 'economy', 'is', 'growing.'] }
        ]
      }
    ]
  };

  const mockWordMeaning: WordMeaning = {
    meaning: 'a system of trade and money',
    pos: 'noun',
    example: 'The economy is improving.'
  };

  const mockTranslation: TranslationResult = {
    translation: '経済は成長しています。'
  };

  beforeEach(async () => {
    // Reset DOM
    document.body.innerHTML = '<div id="app"></div>';
    appElement = document.getElementById('app')!;

    // Reset all mocks
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('initializes with URL input view', async () => {
      // Re-mock after resetModules
      vi.doMock('../../src/services/api-client', () => ({
        apiClient: {
          fetchArticle: vi.fn(),
          getWordMeaning: vi.fn(),
          translateSentence: vi.fn()
        }
      }));
      vi.doMock('../../src/services/cache', () => ({
        cacheService: {
          getWordMeaning: vi.fn(),
          setWordMeaning: vi.fn(),
          getTranslation: vi.fn(),
          setTranslation: vi.fn(),
          clear: vi.fn()
        }
      }));

      // Import App fresh
      await import('../../src/main');

      // Verify URL input container exists
      const urlInputContainer = appElement.querySelector('.url-input-container');
      expect(urlInputContainer).toBeInstanceOf(HTMLElement);
    });

    it('creates bottom panel on initialization', async () => {
      vi.doMock('../../src/services/api-client', () => ({
        apiClient: {
          fetchArticle: vi.fn(),
          getWordMeaning: vi.fn(),
          translateSentence: vi.fn()
        }
      }));
      vi.doMock('../../src/services/cache', () => ({
        cacheService: {
          getWordMeaning: vi.fn(),
          setWordMeaning: vi.fn(),
          getTranslation: vi.fn(),
          setTranslation: vi.fn(),
          clear: vi.fn()
        }
      }));

      await import('../../src/main');

      const bottomPanel = appElement.querySelector('.bottom-panel');
      expect(bottomPanel).toBeInstanceOf(HTMLElement);
    });
  });

  describe('article loading', () => {
    it('shows loading screen when fetching article', async () => {
      // Create a promise that won't resolve immediately
      let resolveArticle: (value: ParsedArticle) => void;
      const articlePromise = new Promise<ParsedArticle>((resolve) => {
        resolveArticle = resolve;
      });

      vi.doMock('../../src/services/api-client', () => ({
        apiClient: {
          fetchArticle: vi.fn().mockReturnValue(articlePromise),
          getWordMeaning: vi.fn(),
          translateSentence: vi.fn()
        }
      }));
      vi.doMock('../../src/services/cache', () => ({
        cacheService: {
          getWordMeaning: vi.fn(),
          setWordMeaning: vi.fn(),
          getTranslation: vi.fn(),
          setTranslation: vi.fn(),
          clear: vi.fn()
        }
      }));

      await import('../../src/main');

      // Submit URL
      const form = appElement.querySelector('.url-form') as HTMLFormElement;
      const input = appElement.querySelector('.url-input') as HTMLInputElement;
      input.value = 'https://example.com/article';
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      // Check loading screen
      const loadingScreen = appElement.querySelector('.loading-screen');
      expect(loadingScreen).toBeInstanceOf(HTMLElement);
      expect(loadingScreen?.textContent).toContain('記事を読み込んでいます');

      // Resolve and cleanup
      resolveArticle!(mockArticle);
    });

    it('shows article after successful load', async () => {
      vi.doMock('../../src/services/api-client', () => ({
        apiClient: {
          fetchArticle: vi.fn().mockResolvedValue(mockArticle),
          getWordMeaning: vi.fn(),
          translateSentence: vi.fn()
        }
      }));
      vi.doMock('../../src/services/cache', () => ({
        cacheService: {
          getWordMeaning: vi.fn(),
          setWordMeaning: vi.fn(),
          getTranslation: vi.fn(),
          setTranslation: vi.fn(),
          clear: vi.fn()
        }
      }));

      await import('../../src/main');

      const form = appElement.querySelector('.url-form') as HTMLFormElement;
      const input = appElement.querySelector('.url-input') as HTMLInputElement;
      input.value = 'https://example.com/article';
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      // Wait for async operations
      await vi.waitFor(() => {
        const articleReader = appElement.querySelector('.article-reader');
        expect(articleReader).toBeInstanceOf(HTMLElement);
      });

      // Verify article content
      const title = appElement.querySelector('.article-title');
      expect(title?.textContent).toBe('Test Article');
    });

    it('shows error screen on fetch failure', async () => {
      vi.doMock('../../src/services/api-client', () => ({
        apiClient: {
          fetchArticle: vi.fn().mockRejectedValue(new Error('Network error')),
          getWordMeaning: vi.fn(),
          translateSentence: vi.fn()
        }
      }));
      vi.doMock('../../src/services/cache', () => ({
        cacheService: {
          getWordMeaning: vi.fn(),
          setWordMeaning: vi.fn(),
          getTranslation: vi.fn(),
          setTranslation: vi.fn(),
          clear: vi.fn()
        }
      }));

      await import('../../src/main');

      const form = appElement.querySelector('.url-form') as HTMLFormElement;
      const input = appElement.querySelector('.url-input') as HTMLInputElement;
      input.value = 'https://example.com/article';
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      await vi.waitFor(() => {
        const errorScreen = appElement.querySelector('.error-screen');
        expect(errorScreen).toBeInstanceOf(HTMLElement);
      });

      const errorMessage = appElement.querySelector('.error-message');
      expect(errorMessage?.textContent).toBe('Network error');
    });

    it('shows default error message for non-Error exceptions', async () => {
      vi.doMock('../../src/services/api-client', () => ({
        apiClient: {
          fetchArticle: vi.fn().mockRejectedValue('String error'),
          getWordMeaning: vi.fn(),
          translateSentence: vi.fn()
        }
      }));
      vi.doMock('../../src/services/cache', () => ({
        cacheService: {
          getWordMeaning: vi.fn(),
          setWordMeaning: vi.fn(),
          getTranslation: vi.fn(),
          setTranslation: vi.fn(),
          clear: vi.fn()
        }
      }));

      await import('../../src/main');

      const form = appElement.querySelector('.url-form') as HTMLFormElement;
      const input = appElement.querySelector('.url-input') as HTMLInputElement;
      input.value = 'https://example.com/article';
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      await vi.waitFor(() => {
        const errorMessage = appElement.querySelector('.error-message');
        expect(errorMessage?.textContent).toBe('記事を読み込めませんでした');
      });
    });
  });

  describe('navigation', () => {
    it('shows back button when viewing article', async () => {
      vi.doMock('../../src/services/api-client', () => ({
        apiClient: {
          fetchArticle: vi.fn().mockResolvedValue(mockArticle),
          getWordMeaning: vi.fn(),
          translateSentence: vi.fn()
        }
      }));
      vi.doMock('../../src/services/cache', () => ({
        cacheService: {
          getWordMeaning: vi.fn(),
          setWordMeaning: vi.fn(),
          getTranslation: vi.fn(),
          setTranslation: vi.fn(),
          clear: vi.fn()
        }
      }));

      await import('../../src/main');

      const form = appElement.querySelector('.url-form') as HTMLFormElement;
      const input = appElement.querySelector('.url-input') as HTMLInputElement;
      input.value = 'https://example.com/article';
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      await vi.waitFor(() => {
        const backBtn = appElement.querySelector('.back-btn');
        expect(backBtn).toBeInstanceOf(HTMLButtonElement);
        expect(backBtn?.textContent).toBe('← 戻る');
      });
    });

    it('returns to URL input when clicking back button', async () => {
      vi.doMock('../../src/services/api-client', () => ({
        apiClient: {
          fetchArticle: vi.fn().mockResolvedValue(mockArticle),
          getWordMeaning: vi.fn(),
          translateSentence: vi.fn()
        }
      }));
      vi.doMock('../../src/services/cache', () => ({
        cacheService: {
          getWordMeaning: vi.fn(),
          setWordMeaning: vi.fn(),
          getTranslation: vi.fn(),
          setTranslation: vi.fn(),
          clear: vi.fn()
        }
      }));

      await import('../../src/main');

      // Load article
      const form = appElement.querySelector('.url-form') as HTMLFormElement;
      const input = appElement.querySelector('.url-input') as HTMLInputElement;
      input.value = 'https://example.com/article';
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      await vi.waitFor(() => {
        expect(appElement.querySelector('.article-reader')).toBeInstanceOf(HTMLElement);
      });

      // Click back button
      const backBtn = appElement.querySelector('.back-btn') as HTMLButtonElement;
      backBtn.click();

      // Should show URL input again
      const urlInputContainer = appElement.querySelector('.url-input-container');
      expect(urlInputContainer).toBeInstanceOf(HTMLElement);
    });

    it('returns to URL input when clicking retry button on error screen', async () => {
      vi.doMock('../../src/services/api-client', () => ({
        apiClient: {
          fetchArticle: vi.fn().mockRejectedValue(new Error('Network error')),
          getWordMeaning: vi.fn(),
          translateSentence: vi.fn()
        }
      }));
      vi.doMock('../../src/services/cache', () => ({
        cacheService: {
          getWordMeaning: vi.fn(),
          setWordMeaning: vi.fn(),
          getTranslation: vi.fn(),
          setTranslation: vi.fn(),
          clear: vi.fn()
        }
      }));

      await import('../../src/main');

      // Trigger error
      const form = appElement.querySelector('.url-form') as HTMLFormElement;
      const input = appElement.querySelector('.url-input') as HTMLInputElement;
      input.value = 'https://example.com/article';
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      await vi.waitFor(() => {
        expect(appElement.querySelector('.error-screen')).toBeInstanceOf(HTMLElement);
      });

      // Click retry button
      const retryBtn = appElement.querySelector('.retry-btn') as HTMLButtonElement;
      retryBtn.click();

      // Should show URL input again
      const urlInputContainer = appElement.querySelector('.url-input-container');
      expect(urlInputContainer).toBeInstanceOf(HTMLElement);
    });
  });

  describe('word meaning', () => {
    it('shows cached word meaning without API call', async () => {
      const mockGetWordMeaning = vi.fn();

      vi.doMock('../../src/services/api-client', () => ({
        apiClient: {
          fetchArticle: vi.fn().mockResolvedValue(mockArticle),
          getWordMeaning: mockGetWordMeaning,
          translateSentence: vi.fn()
        }
      }));
      vi.doMock('../../src/services/cache', () => ({
        cacheService: {
          getWordMeaning: vi.fn().mockReturnValue(mockWordMeaning),
          setWordMeaning: vi.fn(),
          getTranslation: vi.fn(),
          setTranslation: vi.fn(),
          clear: vi.fn()
        }
      }));

      await import('../../src/main');

      // Load article
      const form = appElement.querySelector('.url-form') as HTMLFormElement;
      const input = appElement.querySelector('.url-input') as HTMLInputElement;
      input.value = 'https://example.com/article';
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      await vi.waitFor(() => {
        expect(appElement.querySelector('.article-reader')).toBeInstanceOf(HTMLElement);
      });

      // Click on a word
      const economyWord = Array.from(appElement.querySelectorAll('.word'))
        .find(w => w.textContent === 'economy') as HTMLElement;
      economyWord.click();

      // Should show word meaning from cache
      await vi.waitFor(() => {
        const wordMeaning = appElement.querySelector('.word-meaning');
        expect(wordMeaning).toBeInstanceOf(HTMLElement);
      });

      // API should not be called
      expect(mockGetWordMeaning).not.toHaveBeenCalled();
    });

    it('fetches and caches word meaning when not in cache', async () => {
      const mockGetWordMeaning = vi.fn().mockResolvedValue(mockWordMeaning);
      const mockSetWordMeaning = vi.fn();
      const mockCacheGetWordMeaning = vi.fn().mockReturnValue(null);

      vi.doMock('../../src/services/api-client', () => ({
        apiClient: {
          fetchArticle: vi.fn().mockResolvedValue(mockArticle),
          getWordMeaning: mockGetWordMeaning,
          translateSentence: vi.fn()
        }
      }));
      vi.doMock('../../src/services/cache', () => ({
        cacheService: {
          getWordMeaning: mockCacheGetWordMeaning,
          setWordMeaning: mockSetWordMeaning,
          getTranslation: vi.fn(),
          setTranslation: vi.fn(),
          clear: vi.fn()
        }
      }));

      await import('../../src/main');

      // Load article
      const form = appElement.querySelector('.url-form') as HTMLFormElement;
      const input = appElement.querySelector('.url-input') as HTMLInputElement;
      input.value = 'https://example.com/article';
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      await vi.waitFor(() => {
        expect(appElement.querySelector('.article-reader')).toBeInstanceOf(HTMLElement);
      });

      // Click on a word
      const economyWord = Array.from(appElement.querySelectorAll('.word'))
        .find(w => w.textContent === 'economy') as HTMLElement;
      economyWord.click();

      // Should fetch from API and show result
      await vi.waitFor(() => {
        expect(mockGetWordMeaning).toHaveBeenCalled();
        expect(mockSetWordMeaning).toHaveBeenCalled();
      });
    });

    it('shows error when word meaning API fails', async () => {
      vi.doMock('../../src/services/api-client', () => ({
        apiClient: {
          fetchArticle: vi.fn().mockResolvedValue(mockArticle),
          getWordMeaning: vi.fn().mockRejectedValue(new Error('API error')),
          translateSentence: vi.fn()
        }
      }));
      vi.doMock('../../src/services/cache', () => ({
        cacheService: {
          getWordMeaning: vi.fn().mockReturnValue(null),
          setWordMeaning: vi.fn(),
          getTranslation: vi.fn(),
          setTranslation: vi.fn(),
          clear: vi.fn()
        }
      }));

      await import('../../src/main');

      // Load article
      const form = appElement.querySelector('.url-form') as HTMLFormElement;
      const input = appElement.querySelector('.url-input') as HTMLInputElement;
      input.value = 'https://example.com/article';
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      await vi.waitFor(() => {
        expect(appElement.querySelector('.article-reader')).toBeInstanceOf(HTMLElement);
      });

      // Click on a word
      const economyWord = Array.from(appElement.querySelectorAll('.word'))
        .find(w => w.textContent === 'economy') as HTMLElement;
      economyWord.click();

      // Should show error in bottom panel
      await vi.waitFor(() => {
        const error = appElement.querySelector('.bottom-panel .error');
        expect(error).toBeInstanceOf(HTMLElement);
        expect(error?.textContent).toBe('API error');
      });
    });
  });

  describe('translation', () => {
    it('shows cached translation without API call', async () => {
      const mockTranslateSentence = vi.fn();

      vi.doMock('../../src/services/api-client', () => ({
        apiClient: {
          fetchArticle: vi.fn().mockResolvedValue(mockArticle),
          getWordMeaning: vi.fn(),
          translateSentence: mockTranslateSentence
        }
      }));
      vi.doMock('../../src/services/cache', () => ({
        cacheService: {
          getWordMeaning: vi.fn(),
          setWordMeaning: vi.fn(),
          getTranslation: vi.fn().mockReturnValue('キャッシュされた翻訳'),
          setTranslation: vi.fn(),
          clear: vi.fn()
        }
      }));

      vi.useFakeTimers();

      await import('../../src/main');

      // Load article
      const form = appElement.querySelector('.url-form') as HTMLFormElement;
      const input = appElement.querySelector('.url-input') as HTMLInputElement;
      input.value = 'https://example.com/article';
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      await vi.runAllTimersAsync();

      // Long press on sentence
      const sentence = appElement.querySelector('.sentence') as HTMLElement;
      sentence.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
      vi.advanceTimersByTime(500);

      await vi.runAllTimersAsync();

      // API should not be called
      expect(mockTranslateSentence).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('fetches and caches translation when not in cache', async () => {
      const mockTranslateSentence = vi.fn().mockResolvedValue(mockTranslation);
      const mockSetTranslation = vi.fn();

      vi.doMock('../../src/services/api-client', () => ({
        apiClient: {
          fetchArticle: vi.fn().mockResolvedValue(mockArticle),
          getWordMeaning: vi.fn(),
          translateSentence: mockTranslateSentence
        }
      }));
      vi.doMock('../../src/services/cache', () => ({
        cacheService: {
          getWordMeaning: vi.fn(),
          setWordMeaning: vi.fn(),
          getTranslation: vi.fn().mockReturnValue(null),
          setTranslation: mockSetTranslation,
          clear: vi.fn()
        }
      }));

      vi.useFakeTimers();

      await import('../../src/main');

      // Load article
      const form = appElement.querySelector('.url-form') as HTMLFormElement;
      const input = appElement.querySelector('.url-input') as HTMLInputElement;
      input.value = 'https://example.com/article';
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      await vi.runAllTimersAsync();

      // Long press on sentence
      const sentence = appElement.querySelector('.sentence') as HTMLElement;
      sentence.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
      vi.advanceTimersByTime(500);

      await vi.runAllTimersAsync();

      expect(mockTranslateSentence).toHaveBeenCalled();
      expect(mockSetTranslation).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('shows error when translation API fails', async () => {
      vi.doMock('../../src/services/api-client', () => ({
        apiClient: {
          fetchArticle: vi.fn().mockResolvedValue(mockArticle),
          getWordMeaning: vi.fn(),
          translateSentence: vi.fn().mockRejectedValue(new Error('Translation failed'))
        }
      }));
      vi.doMock('../../src/services/cache', () => ({
        cacheService: {
          getWordMeaning: vi.fn(),
          setWordMeaning: vi.fn(),
          getTranslation: vi.fn().mockReturnValue(null),
          setTranslation: vi.fn(),
          clear: vi.fn()
        }
      }));

      vi.useFakeTimers();

      await import('../../src/main');

      // Load article
      const form = appElement.querySelector('.url-form') as HTMLFormElement;
      const input = appElement.querySelector('.url-input') as HTMLInputElement;
      input.value = 'https://example.com/article';
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      await vi.runAllTimersAsync();

      // Long press on sentence
      const sentence = appElement.querySelector('.sentence') as HTMLElement;
      sentence.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
      vi.advanceTimersByTime(500);

      await vi.runAllTimersAsync();

      // Should show error
      const error = appElement.querySelector('.bottom-panel .error');
      expect(error).toBeInstanceOf(HTMLElement);
      expect(error?.textContent).toBe('Translation failed');

      vi.useRealTimers();
    });
  });
});
