/**
 * Unit tests for url-input.ts
 * Testing framework: Vitest with jsdom
 *
 * Tests cover:
 * - DOM structure creation
 * - Form submission handling
 * - onSubmit callback invocation
 * - Input validation and edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createUrlInput, UrlInputOptions } from '../../../src/components/url-input';

describe('createUrlInput', () => {
  let container: HTMLElement;
  let onSubmitMock: ReturnType<typeof vi.fn>;
  let options: UrlInputOptions;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    onSubmitMock = vi.fn();
    options = { onSubmit: onSubmitMock };
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  describe('DOM structure', () => {
    // Verifies correct container class
    it('creates a container with correct class name', () => {
      const element = createUrlInput(options);
      expect(element.className).toBe('url-input-container');
    });

    // Verifies form element exists
    it('contains a form element with correct class', () => {
      const element = createUrlInput(options);
      const form = element.querySelector('.url-form');
      expect(form).toBeInstanceOf(HTMLFormElement);
    });

    // Verifies input element attributes
    it('contains an input element with correct attributes', () => {
      const element = createUrlInput(options);
      const input = element.querySelector('.url-input') as HTMLInputElement;

      expect(input).toBeInstanceOf(HTMLInputElement);
      expect(input.type).toBe('url');
      expect(input.required).toBe(true);
      expect(input.placeholder).toBe('Paste an English news article URL...');
    });

    // Verifies submit button exists
    it('contains a submit button', () => {
      const element = createUrlInput(options);
      const button = element.querySelector('.submit-btn') as HTMLButtonElement;

      expect(button).toBeInstanceOf(HTMLButtonElement);
      expect(button.type).toBe('submit');
      expect(button.textContent).toBe('Read');
    });

    // Verifies hint text exists
    it('contains a hint paragraph with example URLs', () => {
      const element = createUrlInput(options);
      const hint = element.querySelector('.url-hint');

      expect(hint).toBeInstanceOf(HTMLParagraphElement);
      expect(hint?.textContent).toContain('BBC News');
      expect(hint?.textContent).toContain('CNN');
      expect(hint?.textContent).toContain('Guardian');
    });
  });

  describe('form submission', () => {
    // Normal case: valid URL submission
    it('calls onSubmit with URL value when form is submitted', () => {
      const element = createUrlInput(options);
      container.appendChild(element);

      const input = element.querySelector('.url-input') as HTMLInputElement;
      const form = element.querySelector('.url-form') as HTMLFormElement;

      input.value = 'https://example.com/article';
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      expect(onSubmitMock).toHaveBeenCalledTimes(1);
      expect(onSubmitMock).toHaveBeenCalledWith('https://example.com/article');
    });

    // Verifies preventDefault is called
    it('prevents default form submission behavior', () => {
      const element = createUrlInput(options);
      container.appendChild(element);

      const input = element.querySelector('.url-input') as HTMLInputElement;
      const form = element.querySelector('.url-form') as HTMLFormElement;

      input.value = 'https://example.com';

      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault');

      form.dispatchEvent(submitEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    // URL trimming: whitespace around URL
    it('trims whitespace from URL before submitting', () => {
      const element = createUrlInput(options);
      container.appendChild(element);

      const input = element.querySelector('.url-input') as HTMLInputElement;
      const form = element.querySelector('.url-form') as HTMLFormElement;

      input.value = '  https://example.com/article  ';
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      expect(onSubmitMock).toHaveBeenCalledWith('https://example.com/article');
    });

    // Edge case: empty input (after trim)
    it('does not call onSubmit when input is empty', () => {
      const element = createUrlInput(options);
      container.appendChild(element);

      const input = element.querySelector('.url-input') as HTMLInputElement;
      const form = element.querySelector('.url-form') as HTMLFormElement;

      input.value = '';
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      expect(onSubmitMock).not.toHaveBeenCalled();
    });

    // Edge case: whitespace only input
    it('does not call onSubmit when input is whitespace only', () => {
      const element = createUrlInput(options);
      container.appendChild(element);

      const input = element.querySelector('.url-input') as HTMLInputElement;
      const form = element.querySelector('.url-form') as HTMLFormElement;

      input.value = '   ';
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      expect(onSubmitMock).not.toHaveBeenCalled();
    });

    // Multiple submissions
    it('handles multiple form submissions correctly', () => {
      const element = createUrlInput(options);
      container.appendChild(element);

      const input = element.querySelector('.url-input') as HTMLInputElement;
      const form = element.querySelector('.url-form') as HTMLFormElement;

      input.value = 'https://example1.com';
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      input.value = 'https://example2.com';
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      expect(onSubmitMock).toHaveBeenCalledTimes(2);
      expect(onSubmitMock).toHaveBeenNthCalledWith(1, 'https://example1.com');
      expect(onSubmitMock).toHaveBeenNthCalledWith(2, 'https://example2.com');
    });
  });

  describe('edge cases', () => {
    // URL with special characters
    it('handles URLs with query parameters', () => {
      const element = createUrlInput(options);
      container.appendChild(element);

      const input = element.querySelector('.url-input') as HTMLInputElement;
      const form = element.querySelector('.url-form') as HTMLFormElement;

      const url = 'https://example.com/article?id=123&lang=en';
      input.value = url;
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      expect(onSubmitMock).toHaveBeenCalledWith(url);
    });

    // URL with fragments
    it('handles URLs with hash fragments', () => {
      const element = createUrlInput(options);
      container.appendChild(element);

      const input = element.querySelector('.url-input') as HTMLInputElement;
      const form = element.querySelector('.url-form') as HTMLFormElement;

      const url = 'https://example.com/article#section-1';
      input.value = url;
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      expect(onSubmitMock).toHaveBeenCalledWith(url);
    });

    // Very long URL
    it('handles very long URLs', () => {
      const element = createUrlInput(options);
      container.appendChild(element);

      const input = element.querySelector('.url-input') as HTMLInputElement;
      const form = element.querySelector('.url-form') as HTMLFormElement;

      const longUrl = 'https://example.com/' + 'a'.repeat(2000);
      input.value = longUrl;
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      expect(onSubmitMock).toHaveBeenCalledWith(longUrl);
    });

    // HTTP URL (not HTTPS)
    it('handles HTTP URLs', () => {
      const element = createUrlInput(options);
      container.appendChild(element);

      const input = element.querySelector('.url-input') as HTMLInputElement;
      const form = element.querySelector('.url-form') as HTMLFormElement;

      const url = 'http://example.com/article';
      input.value = url;
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      expect(onSubmitMock).toHaveBeenCalledWith(url);
    });

    // International domain names
    it('handles international domain URLs', () => {
      const element = createUrlInput(options);
      container.appendChild(element);

      const input = element.querySelector('.url-input') as HTMLInputElement;
      const form = element.querySelector('.url-form') as HTMLFormElement;

      const url = 'https://例え.jp/記事';
      input.value = url;
      form.dispatchEvent(new Event('submit', { bubbles: true }));

      expect(onSubmitMock).toHaveBeenCalledWith(url);
    });
  });

  describe('return value', () => {
    it('returns an HTMLElement that can be appended to DOM', () => {
      const element = createUrlInput(options);
      expect(element).toBeInstanceOf(HTMLElement);
      expect(() => container.appendChild(element)).not.toThrow();
    });
  });
});
