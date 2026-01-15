/**
 * Unit tests for article-reader.ts
 * Testing framework: Vitest with jsdom
 *
 * Tests cover:
 * - DOM structure creation (header, content, paragraphs, sentences, words)
 * - Word click handling with shouldShowWordMeaning filtering
 * - Sentence long-press handling (touch events)
 * - HTML escaping for XSS prevention
 * - Edge cases (empty articles, special characters)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createArticleReader, ArticleReaderOptions } from '../../../src/components/article-reader';
import { ParsedArticle } from '../../../src/services/api-client';

describe('createArticleReader', () => {
  let container: HTMLElement;
  let onWordClickMock: ReturnType<typeof vi.fn>;
  let onSentenceLongPressMock: ReturnType<typeof vi.fn>;
  let options: ArticleReaderOptions;

  const mockArticle: ParsedArticle = {
    title: 'Test Article Title',
    source: 'https://example.com/article',
    paragraphs: [
      {
        sentences: [
          { text: 'The economy is growing rapidly.', words: ['The', 'economy', 'is', 'growing', 'rapidly.'] },
          { text: 'Experts predict continued growth.', words: ['Experts', 'predict', 'continued', 'growth.'] }
        ]
      },
      {
        sentences: [
          { text: 'Technology drives innovation.', words: ['Technology', 'drives', 'innovation.'] }
        ]
      }
    ]
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    onWordClickMock = vi.fn();
    onSentenceLongPressMock = vi.fn();
    options = {
      onWordClick: onWordClickMock,
      onSentenceLongPress: onSentenceLongPressMock
    };
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('DOM structure', () => {
    // Verifies container class
    it('creates container with correct class name', () => {
      const element = createArticleReader(mockArticle, options);
      expect(element.className).toBe('article-reader');
    });

    // Verifies header structure
    it('creates header with title and source', () => {
      const element = createArticleReader(mockArticle, options);
      container.appendChild(element);

      const header = element.querySelector('.article-header');
      expect(header).toBeInstanceOf(HTMLElement);

      const title = element.querySelector('.article-title');
      expect(title?.textContent).toBe('Test Article Title');

      const source = element.querySelector('.article-source');
      expect(source?.textContent).toBe('https://example.com/article');
    });

    // Verifies content container
    it('creates content container', () => {
      const element = createArticleReader(mockArticle, options);
      const content = element.querySelector('.article-content');
      expect(content).toBeInstanceOf(HTMLElement);
    });

    // Verifies paragraph creation
    it('creates correct number of paragraphs', () => {
      const element = createArticleReader(mockArticle, options);
      const paragraphs = element.querySelectorAll('.paragraph');
      expect(paragraphs.length).toBe(2);
    });

    // Verifies sentence creation
    it('creates correct number of sentences', () => {
      const element = createArticleReader(mockArticle, options);
      const sentences = element.querySelectorAll('.sentence');
      expect(sentences.length).toBe(3);
    });

    // Verifies sentence data-text attribute
    it('sets data-text attribute on sentences', () => {
      const element = createArticleReader(mockArticle, options);
      const sentences = element.querySelectorAll('.sentence');

      expect((sentences[0] as HTMLElement).dataset.text).toBe('The economy is growing rapidly.');
      expect((sentences[1] as HTMLElement).dataset.text).toBe('Experts predict continued growth.');
      expect((sentences[2] as HTMLElement).dataset.text).toBe('Technology drives innovation.');
    });

    // Verifies word spans creation
    it('creates word spans for each word', () => {
      const element = createArticleReader(mockArticle, options);
      const words = element.querySelectorAll('.word');
      // Total words: 5 + 4 + 3 = 12
      expect(words.length).toBe(12);
    });

    // Verifies spaces between words
    it('adds spaces between words', () => {
      const element = createArticleReader(mockArticle, options);
      const firstSentence = element.querySelector('.sentence');
      // Check that text content has proper spacing
      expect(firstSentence?.textContent).toBe('The economy is growing rapidly.');
    });
  });

  describe('word click handling', () => {
    // Clickable words have correct class
    it('adds clickable class to content words', () => {
      const element = createArticleReader(mockArticle, options);
      container.appendChild(element);

      // "economy" should be clickable (content word)
      const economyWord = Array.from(element.querySelectorAll('.word'))
        .find(w => w.textContent === 'economy');
      expect(economyWord?.classList.contains('clickable')).toBe(true);
    });

    // Stop words are not clickable
    it('does not add clickable class to stop words', () => {
      const element = createArticleReader(mockArticle, options);
      container.appendChild(element);

      // "The" should not be clickable (stop word)
      const theWord = Array.from(element.querySelectorAll('.word'))
        .find(w => w.textContent === 'The');
      expect(theWord?.classList.contains('clickable')).toBe(false);

      // "is" should not be clickable (stop word)
      const isWord = Array.from(element.querySelectorAll('.word'))
        .find(w => w.textContent === 'is');
      expect(isWord?.classList.contains('clickable')).toBe(false);
    });

    // Click on clickable word triggers callback
    it('calls onWordClick when clicking on a clickable word', () => {
      const element = createArticleReader(mockArticle, options);
      container.appendChild(element);

      const economyWord = Array.from(element.querySelectorAll('.word'))
        .find(w => w.textContent === 'economy') as HTMLElement;

      economyWord.click();

      expect(onWordClickMock).toHaveBeenCalledTimes(1);
      expect(onWordClickMock).toHaveBeenCalledWith('economy', 'The economy is growing rapidly.');
    });

    // Click passes cleaned word (punctuation removed)
    it('passes cleaned word to callback (removes punctuation)', () => {
      const element = createArticleReader(mockArticle, options);
      container.appendChild(element);

      // "rapidly." has punctuation
      const rapidlyWord = Array.from(element.querySelectorAll('.word'))
        .find(w => w.textContent === 'rapidly.') as HTMLElement;

      rapidlyWord.click();

      expect(onWordClickMock).toHaveBeenCalledWith('rapidly', 'The economy is growing rapidly.');
    });

    // Click on non-clickable word does not trigger callback
    it('does not call onWordClick when clicking on stop words', () => {
      const element = createArticleReader(mockArticle, options);
      container.appendChild(element);

      const theWord = Array.from(element.querySelectorAll('.word'))
        .find(w => w.textContent === 'The') as HTMLElement;

      theWord.click();

      expect(onWordClickMock).not.toHaveBeenCalled();
    });

    // Click propagation is stopped
    it('stops click event propagation', () => {
      const element = createArticleReader(mockArticle, options);
      container.appendChild(element);

      const parentClickHandler = vi.fn();
      element.addEventListener('click', parentClickHandler);

      const economyWord = Array.from(element.querySelectorAll('.word'))
        .find(w => w.textContent === 'economy') as HTMLElement;

      economyWord.click();

      expect(parentClickHandler).not.toHaveBeenCalled();
    });
  });

  describe('sentence long-press handling', () => {
    // Long press (500ms) triggers callback
    it('calls onSentenceLongPress after 500ms touch', () => {
      const element = createArticleReader(mockArticle, options);
      container.appendChild(element);

      const sentence = element.querySelector('.sentence') as HTMLElement;

      // Simulate touch start
      sentence.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));

      // Advance timer by 500ms
      vi.advanceTimersByTime(500);

      expect(onSentenceLongPressMock).toHaveBeenCalledTimes(1);
      expect(onSentenceLongPressMock).toHaveBeenCalledWith('The economy is growing rapidly.');
    });

    // Touch end before 500ms cancels callback
    it('cancels callback if touch ends before 500ms', () => {
      const element = createArticleReader(mockArticle, options);
      container.appendChild(element);

      const sentence = element.querySelector('.sentence') as HTMLElement;

      sentence.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
      vi.advanceTimersByTime(400);
      sentence.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
      vi.advanceTimersByTime(200);

      expect(onSentenceLongPressMock).not.toHaveBeenCalled();
    });

    // Touch move cancels callback
    it('cancels callback if touch moves', () => {
      const element = createArticleReader(mockArticle, options);
      container.appendChild(element);

      const sentence = element.querySelector('.sentence') as HTMLElement;

      sentence.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
      vi.advanceTimersByTime(200);
      sentence.dispatchEvent(new TouchEvent('touchmove', { bubbles: true }));
      vi.advanceTimersByTime(400);

      expect(onSentenceLongPressMock).not.toHaveBeenCalled();
    });

    // Boundary: exactly 500ms
    it('triggers at exactly 500ms', () => {
      const element = createArticleReader(mockArticle, options);
      container.appendChild(element);

      const sentence = element.querySelector('.sentence') as HTMLElement;

      sentence.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
      vi.advanceTimersByTime(499);
      expect(onSentenceLongPressMock).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(onSentenceLongPressMock).toHaveBeenCalledTimes(1);
    });

    // Multiple long presses on different sentences
    it('handles long press on different sentences', () => {
      const element = createArticleReader(mockArticle, options);
      container.appendChild(element);

      const sentences = element.querySelectorAll('.sentence');

      // Long press on first sentence
      (sentences[0] as HTMLElement).dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
      vi.advanceTimersByTime(500);
      (sentences[0] as HTMLElement).dispatchEvent(new TouchEvent('touchend', { bubbles: true }));

      expect(onSentenceLongPressMock).toHaveBeenCalledWith('The economy is growing rapidly.');

      // Long press on second sentence
      (sentences[1] as HTMLElement).dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
      vi.advanceTimersByTime(500);

      expect(onSentenceLongPressMock).toHaveBeenCalledTimes(2);
      expect(onSentenceLongPressMock).toHaveBeenLastCalledWith('Experts predict continued growth.');
    });
  });

  describe('HTML escaping (XSS prevention)', () => {
    // Title escapes HTML
    it('escapes HTML in title', () => {
      const xssArticle: ParsedArticle = {
        title: '<script>alert("xss")</script>',
        source: 'https://example.com',
        paragraphs: []
      };

      const element = createArticleReader(xssArticle, options);
      const title = element.querySelector('.article-title');

      expect(title?.innerHTML).not.toContain('<script>');
      expect(title?.textContent).toContain('<script>');
    });

    // Source escapes HTML
    it('escapes HTML in source', () => {
      const xssArticle: ParsedArticle = {
        title: 'Test',
        source: '<img src=x onerror=alert("xss")>',
        paragraphs: []
      };

      const element = createArticleReader(xssArticle, options);
      const source = element.querySelector('.article-source');

      expect(source?.innerHTML).not.toContain('<img');
      expect(source?.textContent).toContain('<img');
    });
  });

  describe('edge cases', () => {
    // Empty article
    it('handles article with no paragraphs', () => {
      const emptyArticle: ParsedArticle = {
        title: 'Empty Article',
        source: 'https://example.com',
        paragraphs: []
      };

      const element = createArticleReader(emptyArticle, options);
      const content = element.querySelector('.article-content');

      expect(content?.children.length).toBe(0);
    });

    // Paragraph with no sentences
    it('handles paragraph with no sentences', () => {
      const noSentenceArticle: ParsedArticle = {
        title: 'Test',
        source: 'https://example.com',
        paragraphs: [{ sentences: [] }]
      };

      const element = createArticleReader(noSentenceArticle, options);
      const paragraphs = element.querySelectorAll('.paragraph');

      expect(paragraphs.length).toBe(1);
      // Only text node space remains
      expect(paragraphs[0].querySelectorAll('.sentence').length).toBe(0);
    });

    // Sentence with single word
    it('handles sentence with single word', () => {
      const singleWordArticle: ParsedArticle = {
        title: 'Test',
        source: 'https://example.com',
        paragraphs: [{
          sentences: [{ text: 'Word.', words: ['Word.'] }]
        }]
      };

      const element = createArticleReader(singleWordArticle, options);
      const words = element.querySelectorAll('.word');

      expect(words.length).toBe(1);
      expect(words[0].textContent).toBe('Word.');
    });

    // Very long sentence
    it('handles very long sentence', () => {
      const longWord = 'word '.repeat(100).trim();
      const longSentenceArticle: ParsedArticle = {
        title: 'Test',
        source: 'https://example.com',
        paragraphs: [{
          sentences: [{ text: longWord, words: longWord.split(' ') }]
        }]
      };

      const element = createArticleReader(longSentenceArticle, options);
      const words = element.querySelectorAll('.word');

      expect(words.length).toBe(100);
    });

    // Unicode characters in text
    it('handles unicode characters', () => {
      const unicodeArticle: ParsedArticle = {
        title: 'Article with émojis 🎉',
        source: 'https://example.com',
        paragraphs: [{
          sentences: [{ text: 'Café résumé naïve.', words: ['Café', 'résumé', 'naïve.'] }]
        }]
      };

      const element = createArticleReader(unicodeArticle, options);

      const title = element.querySelector('.article-title');
      expect(title?.textContent).toBe('Article with émojis 🎉');

      const words = element.querySelectorAll('.word');
      expect(words[0].textContent).toBe('Café');
    });
  });

  describe('return value', () => {
    it('returns an HTMLElement that can be appended to DOM', () => {
      const element = createArticleReader(mockArticle, options);
      expect(element).toBeInstanceOf(HTMLElement);
      expect(() => container.appendChild(element)).not.toThrow();
    });
  });
});
