/**
 * Unit tests for text-processor.ts
 * Testing framework: Vitest
 *
 * Tests cover:
 * - cleanWord: Punctuation removal and trimming
 * - shouldShowWordMeaning: Complex logic with multiple conditions
 * - getSentenceFromWord: DOM traversal to find parent sentence
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cleanWord, shouldShowWordMeaning, getSentenceFromWord } from '../../../src/utils/text-processor';

describe('cleanWord', () => {
  // Normal case: word with trailing punctuation
  it('removes trailing punctuation marks', () => {
    expect(cleanWord('hello.')).toBe('hello');
    expect(cleanWord('world!')).toBe('world');
    expect(cleanWord('test?')).toBe('test');
    expect(cleanWord('item,')).toBe('item');
    expect(cleanWord('end;')).toBe('end');
    expect(cleanWord('stop:')).toBe('stop');
  });

  // Normal case: word with leading punctuation
  it('removes leading punctuation marks', () => {
    expect(cleanWord('"hello')).toBe('hello');
    expect(cleanWord("'world")).toBe('world');
    expect(cleanWord('(test')).toBe('test');
    expect(cleanWord('[item')).toBe('item');
  });

  // Normal case: word surrounded by punctuation
  it('removes surrounding punctuation marks', () => {
    expect(cleanWord('"hello"')).toBe('hello');
    expect(cleanWord("'world'")).toBe('world');
    expect(cleanWord('(test)')).toBe('test');
    expect(cleanWord('[item]')).toBe('item');
    expect(cleanWord('{data}')).toBe('data');
  });

  // Normal case: word with multiple punctuation marks
  it('removes multiple punctuation marks', () => {
    expect(cleanWord('hello!!')).toBe('hello');
    expect(cleanWord('what?!')).toBe('what');
    expect(cleanWord('"test,"')).toBe('test');
    expect(cleanWord("'end.'"  )).toBe('end');
  });

  // Normal case: clean word (no punctuation)
  it('returns the word unchanged when no punctuation present', () => {
    expect(cleanWord('hello')).toBe('hello');
    expect(cleanWord('world')).toBe('world');
    expect(cleanWord('technology')).toBe('technology');
  });

  // Edge case: empty string
  it('returns empty string for empty input', () => {
    expect(cleanWord('')).toBe('');
  });

  // Edge case: whitespace only
  it('trims whitespace', () => {
    expect(cleanWord('  hello  ')).toBe('hello');
    expect(cleanWord('\tworld\t')).toBe('world');
    expect(cleanWord('  ')).toBe('');
  });

  // Edge case: whitespace with punctuation
  it('handles whitespace and punctuation together', () => {
    expect(cleanWord('  hello.  ')).toBe('hello');
    expect(cleanWord('  "world"  ')).toBe('world');
  });

  // Edge case: only punctuation
  it('returns empty string for punctuation-only input', () => {
    expect(cleanWord('...')).toBe('');
    expect(cleanWord('!!!')).toBe('');
    expect(cleanWord('???')).toBe('');
    expect(cleanWord('.,!?;:\'"()[]{}' )).toBe('');
  });

  // Edge case: hyphenated words (hyphen not in removal list)
  it('preserves hyphens and other non-listed characters', () => {
    expect(cleanWord('well-known')).toBe('well-known');
    expect(cleanWord('self-driving')).toBe('self-driving');
    expect(cleanWord('e-mail')).toBe('e-mail');
  });

  // Edge case: numbers
  it('preserves numbers', () => {
    expect(cleanWord('2023')).toBe('2023');
    expect(cleanWord('100.')).toBe('100');
    expect(cleanWord('$50')).toBe('$50'); // $ not in removal list
  });

  // Edge case: apostrophes in contractions
  it('removes apostrophes from words', () => {
    expect(cleanWord("don't")).toBe('dont');
    expect(cleanWord("won't")).toBe('wont');
    expect(cleanWord("it's")).toBe('its');
  });
});

describe('shouldShowWordMeaning', () => {
  // Branch: Returns false if cleaned word length < 2
  describe('length validation (< 2 characters)', () => {
    it('returns false for single character words', () => {
      expect(shouldShowWordMeaning('a')).toBe(false);
      expect(shouldShowWordMeaning('I')).toBe(false);
      expect(shouldShowWordMeaning('x')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(shouldShowWordMeaning('')).toBe(false);
    });

    it('returns false for punctuation-only (becomes empty after cleaning)', () => {
      expect(shouldShowWordMeaning('.')).toBe(false);
      expect(shouldShowWordMeaning('!!')).toBe(false);
      expect(shouldShowWordMeaning('...')).toBe(false);
    });

    // Boundary: exactly 2 characters
    it('returns true for exactly 2 character words (if not stop word)', () => {
      expect(shouldShowWordMeaning('ox')).toBe(true);
      expect(shouldShowWordMeaning('AI')).toBe(true);
    });
  });

  // Branch: Returns false if word is a stop word
  describe('stop word filtering', () => {
    it('returns false for common stop words', () => {
      expect(shouldShowWordMeaning('the')).toBe(false);
      expect(shouldShowWordMeaning('and')).toBe(false);
      expect(shouldShowWordMeaning('but')).toBe(false);
      expect(shouldShowWordMeaning('with')).toBe(false);
    });

    it('returns false for stop words with punctuation', () => {
      expect(shouldShowWordMeaning('the.')).toBe(false);
      expect(shouldShowWordMeaning('"and"')).toBe(false);
      expect(shouldShowWordMeaning('but,')).toBe(false);
    });

    it('returns false for stop words regardless of case', () => {
      expect(shouldShowWordMeaning('THE')).toBe(false);
      expect(shouldShowWordMeaning('And')).toBe(false);
      expect(shouldShowWordMeaning('BUT')).toBe(false);
    });
  });

  // Branch: Returns false if word is numeric only
  describe('numeric filtering', () => {
    it('returns false for pure numeric strings', () => {
      expect(shouldShowWordMeaning('123')).toBe(false);
      expect(shouldShowWordMeaning('2023')).toBe(false);
      expect(shouldShowWordMeaning('0')).toBe(false);
      expect(shouldShowWordMeaning('999999')).toBe(false);
    });

    it('returns false for numbers with punctuation', () => {
      expect(shouldShowWordMeaning('123.')).toBe(false);
      expect(shouldShowWordMeaning('(456)')).toBe(false);
      expect(shouldShowWordMeaning('"789"')).toBe(false);
    });

    // Boundary: mixed alphanumeric
    it('returns true for alphanumeric words', () => {
      expect(shouldShowWordMeaning('covid19')).toBe(true);
      expect(shouldShowWordMeaning('G7')).toBe(true);
      expect(shouldShowWordMeaning('5G')).toBe(true);
    });
  });

  // Normal case: valid content words
  describe('valid content words', () => {
    it('returns true for common content words', () => {
      expect(shouldShowWordMeaning('economy')).toBe(true);
      expect(shouldShowWordMeaning('government')).toBe(true);
      expect(shouldShowWordMeaning('technology')).toBe(true);
      expect(shouldShowWordMeaning('environment')).toBe(true);
    });

    it('returns true for content words with punctuation', () => {
      expect(shouldShowWordMeaning('economy.')).toBe(true);
      expect(shouldShowWordMeaning('"technology"')).toBe(true);
      expect(shouldShowWordMeaning('environment,')).toBe(true);
    });

    it('returns true for uppercase content words', () => {
      expect(shouldShowWordMeaning('ECONOMY')).toBe(true);
      expect(shouldShowWordMeaning('Technology')).toBe(true);
    });
  });
});

describe('getSentenceFromWord', () => {
  let container: HTMLElement;

  beforeEach(() => {
    // Setup DOM structure
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Cleanup DOM
    document.body.removeChild(container);
  });

  // Normal case: word element inside sentence
  it('returns sentence text when word is inside a sentence element', () => {
    container.innerHTML = `
      <span class="sentence">This is a test sentence.</span>
    `;
    const sentence = container.querySelector('.sentence') as HTMLElement;
    const wordEl = document.createElement('span');
    wordEl.className = 'word';
    wordEl.textContent = 'test';
    sentence.appendChild(wordEl);

    expect(getSentenceFromWord(wordEl)).toBe('This is a test sentence.test');
  });

  // Normal case: deeply nested word element
  it('returns sentence text when word is deeply nested', () => {
    container.innerHTML = `
      <div class="article">
        <p class="paragraph">
          <span class="sentence">The economy is growing.</span>
        </p>
      </div>
    `;
    const sentence = container.querySelector('.sentence') as HTMLElement;
    const wrapper = document.createElement('span');
    const wordEl = document.createElement('span');
    wordEl.className = 'word';
    wordEl.textContent = 'economy';
    wrapper.appendChild(wordEl);
    sentence.appendChild(wrapper);

    const result = getSentenceFromWord(wordEl);
    expect(result).toContain('economy');
  });

  // Edge case: word element is the sentence itself
  it('returns text when the element itself has sentence class', () => {
    container.innerHTML = '';
    const sentenceEl = document.createElement('span');
    sentenceEl.className = 'sentence word';
    sentenceEl.textContent = 'Single word sentence.';
    container.appendChild(sentenceEl);

    expect(getSentenceFromWord(sentenceEl)).toBe('Single word sentence.');
  });

  // Edge case: no parent sentence element
  it('returns empty string when no sentence parent exists', () => {
    container.innerHTML = `
      <div class="article">
        <span class="word">orphan</span>
      </div>
    `;
    const wordEl = container.querySelector('.word') as HTMLElement;

    expect(getSentenceFromWord(wordEl)).toBe('');
  });

  // Edge case: sentence element with no text content
  it('returns empty string for sentence with no text content', () => {
    container.innerHTML = `
      <span class="sentence"></span>
    `;
    const sentence = container.querySelector('.sentence') as HTMLElement;
    const wordEl = document.createElement('span');
    wordEl.className = 'word';
    sentence.appendChild(wordEl);

    expect(getSentenceFromWord(wordEl)).toBe('');
  });

  // Edge case: sentence with whitespace only
  it('returns trimmed content for sentence with whitespace', () => {
    container.innerHTML = `
      <span class="sentence">   Test content   </span>
    `;
    const sentence = container.querySelector('.sentence') as HTMLElement;
    const wordEl = document.createElement('span');
    wordEl.className = 'word';
    sentence.appendChild(wordEl);

    expect(getSentenceFromWord(wordEl)).toBe('Test content');
  });

  // Edge case: multiple nested sentence classes
  it('returns nearest ancestor sentence content', () => {
    container.innerHTML = `
      <span class="sentence outer">
        Outer sentence
        <span class="sentence inner">Inner sentence</span>
      </span>
    `;
    const inner = container.querySelector('.inner') as HTMLElement;
    const wordEl = document.createElement('span');
    wordEl.className = 'word';
    inner.appendChild(wordEl);

    expect(getSentenceFromWord(wordEl)).toBe('Inner sentence');
  });
});
