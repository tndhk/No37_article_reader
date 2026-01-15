/**
 * Unit tests for bottom-panel.ts
 * Testing framework: Vitest with jsdom
 *
 * Tests cover:
 * - DOM structure creation
 * - All state types: hidden, loading, error, word, translation
 * - State transitions and UI updates
 * - Click-to-close functionality
 * - HTML escaping for XSS prevention
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createBottomPanel, BottomPanelState } from '../../../src/components/bottom-panel';
import { WordMeaning } from '../../../src/services/api-client';

describe('createBottomPanel', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('initial creation', () => {
    // Verifies correct container structure
    it('creates element with correct class name', () => {
      const { element } = createBottomPanel();
      expect(element.className).toBe('bottom-panel');
    });

    // Verifies content container exists
    it('contains a panel-content element', () => {
      const { element } = createBottomPanel();
      const content = element.querySelector('.panel-content');
      expect(content).toBeInstanceOf(HTMLElement);
    });

    // Verifies return object shape
    it('returns element and update function', () => {
      const result = createBottomPanel();
      expect(result.element).toBeInstanceOf(HTMLElement);
      expect(typeof result.update).toBe('function');
    });
  });

  describe('update function - hidden state', () => {
    // Hidden state: removes visible class
    it('removes visible class when type is hidden', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      // First make it visible
      update({ type: 'loading' });
      expect(element.classList.contains('visible')).toBe(true);

      // Then hide it
      update({ type: 'hidden' });
      expect(element.classList.contains('visible')).toBe(false);
    });

    // Hidden state: clears content
    it('clears content when type is hidden', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      update({ type: 'loading' });
      update({ type: 'hidden' });

      const content = element.querySelector('.panel-content') as HTMLElement;
      expect(content.innerHTML).toBe('');
    });
  });

  describe('update function - loading state', () => {
    // Loading state: adds visible class
    it('adds visible class when type is loading', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      update({ type: 'loading' });
      expect(element.classList.contains('visible')).toBe(true);
    });

    // Loading state: shows loading message
    it('shows loading message', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      update({ type: 'loading' });

      const loading = element.querySelector('.loading');
      expect(loading).toBeInstanceOf(HTMLElement);
      expect(loading?.textContent).toBe('読み込み中...');
    });
  });

  describe('update function - error state', () => {
    // Error state: adds visible class
    it('adds visible class when type is error', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      update({ type: 'error', error: 'Test error' });
      expect(element.classList.contains('visible')).toBe(true);
    });

    // Error state: shows error message
    it('shows custom error message', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      update({ type: 'error', error: 'Network error occurred' });

      const error = element.querySelector('.error');
      expect(error).toBeInstanceOf(HTMLElement);
      expect(error?.textContent).toBe('Network error occurred');
    });

    // Error state: shows default message when error is undefined
    it('shows default error message when error is undefined', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      update({ type: 'error' });

      const error = element.querySelector('.error');
      expect(error?.textContent).toBe('エラーが発生しました');
    });

    // Error state: escapes HTML in error message (XSS prevention)
    it('escapes HTML in error message to prevent XSS', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      update({ type: 'error', error: '<script>alert("xss")</script>' });

      const error = element.querySelector('.error');
      expect(error?.innerHTML).not.toContain('<script>');
      expect(error?.textContent).toContain('<script>');
    });
  });

  describe('update function - word state', () => {
    const mockMeaning: WordMeaning = {
      meaning: 'a system of trade and money',
      pos: 'noun',
      example: 'The economy is improving.'
    };

    // Word state: adds visible class
    it('adds visible class when type is word', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      update({ type: 'word', word: 'economy', meaning: mockMeaning });
      expect(element.classList.contains('visible')).toBe(true);
    });

    // Word state: displays word
    it('displays the word', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      update({ type: 'word', word: 'economy', meaning: mockMeaning });

      const wordText = element.querySelector('.word-text');
      expect(wordText?.textContent).toBe('economy');
    });

    // Word state: displays part of speech
    it('displays the part of speech', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      update({ type: 'word', word: 'economy', meaning: mockMeaning });

      const pos = element.querySelector('.word-pos');
      expect(pos?.textContent).toBe('noun');
    });

    // Word state: displays meaning
    it('displays the meaning', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      update({ type: 'word', word: 'economy', meaning: mockMeaning });

      const definition = element.querySelector('.word-definition');
      expect(definition?.textContent).toBe('a system of trade and money');
    });

    // Word state: displays example
    it('displays the example', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      update({ type: 'word', word: 'economy', meaning: mockMeaning });

      const example = element.querySelector('.word-example');
      expect(example?.textContent).toBe('The economy is improving.');
    });

    // Word state: escapes HTML in word fields (XSS prevention)
    it('escapes HTML in word fields to prevent XSS', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      const xssMeaning: WordMeaning = {
        meaning: '<img src=x onerror=alert("xss")>',
        pos: '<script>alert(1)</script>',
        example: '<a href="javascript:alert(1)">click</a>'
      };

      update({ type: 'word', word: '<b>test</b>', meaning: xssMeaning });

      const wordText = element.querySelector('.word-text');
      const pos = element.querySelector('.word-pos');
      const definition = element.querySelector('.word-definition');
      const example = element.querySelector('.word-example');

      // HTML entities should be escaped (< becomes &lt;, etc.)
      expect(wordText?.innerHTML).not.toContain('<b>');
      expect(wordText?.innerHTML).toContain('&lt;b&gt;');
      expect(pos?.innerHTML).not.toContain('<script>');
      expect(pos?.innerHTML).toContain('&lt;script&gt;');
      expect(definition?.innerHTML).not.toContain('<img');
      expect(definition?.innerHTML).toContain('&lt;img');
      expect(example?.innerHTML).not.toContain('<a ');
      expect(example?.innerHTML).toContain('&lt;a');
    });

    // Word state: handles empty word
    it('handles empty word', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      update({ type: 'word', word: '', meaning: mockMeaning });

      const wordText = element.querySelector('.word-text');
      expect(wordText?.textContent).toBe('');
    });

    // Word state: does nothing when meaning is undefined
    it('does nothing when meaning is undefined', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      update({ type: 'word', word: 'test' });

      const wordMeaning = element.querySelector('.word-meaning');
      expect(wordMeaning).toBeNull();
    });
  });

  describe('update function - translation state', () => {
    // Translation state: adds visible class
    it('adds visible class when type is translation', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      update({ type: 'translation', translation: '翻訳テスト' });
      expect(element.classList.contains('visible')).toBe(true);
    });

    // Translation state: displays translation
    it('displays the translation', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      update({ type: 'translation', translation: '経済は成長しています。' });

      const translationText = element.querySelector('.translation-text');
      expect(translationText?.textContent).toBe('経済は成長しています。');
    });

    // Translation state: escapes HTML (XSS prevention)
    it('escapes HTML in translation to prevent XSS', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      update({ type: 'translation', translation: '<script>alert("xss")</script>' });

      const translationText = element.querySelector('.translation-text');
      expect(translationText?.innerHTML).not.toContain('<script>');
      expect(translationText?.textContent).toContain('<script>');
    });

    // Translation state: handles empty translation
    it('handles empty translation', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      update({ type: 'translation', translation: '' });

      const translationText = element.querySelector('.translation-text');
      expect(translationText?.textContent).toBe('');
    });

    // Translation state: handles undefined translation
    it('handles undefined translation', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      update({ type: 'translation' });

      const translationText = element.querySelector('.translation-text');
      expect(translationText?.textContent).toBe('');
    });
  });

  describe('click to close', () => {
    // Click on container background closes panel
    it('hides panel when clicking on container background', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      update({ type: 'loading' });
      expect(element.classList.contains('visible')).toBe(true);

      // Simulate click directly on container (not on content)
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(element.classList.contains('visible')).toBe(false);
    });

    // Click on content does not close panel
    it('does not hide panel when clicking on content', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      update({ type: 'loading' });

      const content = element.querySelector('.panel-content') as HTMLElement;
      content.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(element.classList.contains('visible')).toBe(true);
    });

    // Click on nested content does not close panel
    it('does not hide panel when clicking on nested content', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      const mockMeaning: WordMeaning = {
        meaning: 'test',
        pos: 'noun',
        example: 'test'
      };
      update({ type: 'word', word: 'test', meaning: mockMeaning });

      const wordText = element.querySelector('.word-text') as HTMLElement;
      wordText.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(element.classList.contains('visible')).toBe(true);
    });
  });

  describe('state transitions', () => {
    // Transition from one state to another
    it('handles transition from loading to word', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      update({ type: 'loading' });
      expect(element.querySelector('.loading')).not.toBeNull();

      const mockMeaning: WordMeaning = {
        meaning: 'test',
        pos: 'noun',
        example: 'test'
      };
      update({ type: 'word', word: 'test', meaning: mockMeaning });

      expect(element.querySelector('.loading')).toBeNull();
      expect(element.querySelector('.word-meaning')).not.toBeNull();
    });

    // Transition from loading to error
    it('handles transition from loading to error', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      update({ type: 'loading' });
      update({ type: 'error', error: 'Something went wrong' });

      expect(element.querySelector('.loading')).toBeNull();
      expect(element.querySelector('.error')).not.toBeNull();
    });

    // Transition from word to translation
    it('handles transition from word to translation', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      const mockMeaning: WordMeaning = {
        meaning: 'test',
        pos: 'noun',
        example: 'test'
      };
      update({ type: 'word', word: 'test', meaning: mockMeaning });
      update({ type: 'translation', translation: '翻訳' });

      expect(element.querySelector('.word-meaning')).toBeNull();
      expect(element.querySelector('.translation')).not.toBeNull();
    });

    // Multiple rapid updates
    it('handles multiple rapid updates', () => {
      const { element, update } = createBottomPanel();
      container.appendChild(element);

      update({ type: 'loading' });
      update({ type: 'hidden' });
      update({ type: 'loading' });
      update({ type: 'error', error: 'Error' });
      update({ type: 'translation', translation: '翻訳' });

      expect(element.classList.contains('visible')).toBe(true);
      expect(element.querySelector('.translation')).not.toBeNull();
    });
  });
});
