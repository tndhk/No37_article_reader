import { describe, it, expect } from 'vitest';
import { isValidUrl, validateTextLength, validateWord, validateSentence } from '../../../functions/lib/validation';

describe('isValidUrl', () => {
  it('accepts valid HTTPS URLs', () => {
    expect(isValidUrl('https://example.com/article')).toBe(true);
  });

  it('accepts valid HTTP URLs', () => {
    expect(isValidUrl('http://example.com/article')).toBe(true);
  });

  it('rejects invalid URL format', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidUrl('')).toBe(false);
  });
});

describe('validateTextLength', () => {
  it('accepts text within limit', () => {
    expect(validateTextLength('short text', 10000)).toBe(true);
  });

  it('rejects text exceeding limit', () => {
    const longText = 'a'.repeat(10001);
    expect(validateTextLength(longText, 10000)).toBe(false);
  });
});

describe('validateWord', () => {
  it('accepts valid word', () => {
    expect(validateWord('consolidate')).toBe(true);
  });

  it('rejects empty word', () => {
    expect(validateWord('')).toBe(false);
  });
});

describe('validateSentence', () => {
  it('accepts valid sentence', () => {
    expect(validateSentence('This is a sentence.')).toBe(true);
  });

  it('rejects empty sentence', () => {
    expect(validateSentence('')).toBe(false);
  });
});
