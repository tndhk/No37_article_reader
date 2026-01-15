/**
 * Unit tests for stop-words.ts
 * Testing framework: Vitest
 *
 * Tests cover:
 * - STOP_WORDS constant validation
 * - isStopWord function with various inputs
 * - Case insensitivity verification
 * - Boundary and edge cases
 */

import { describe, it, expect } from 'vitest';
import { STOP_WORDS, isStopWord } from '../../../src/utils/stop-words';

describe('STOP_WORDS', () => {
  // Validates that the STOP_WORDS set contains expected word categories
  it('contains common articles', () => {
    expect(STOP_WORDS.has('a')).toBe(true);
    expect(STOP_WORDS.has('an')).toBe(true);
    expect(STOP_WORDS.has('the')).toBe(true);
  });

  it('contains common pronouns', () => {
    expect(STOP_WORDS.has('i')).toBe(true);
    expect(STOP_WORDS.has('you')).toBe(true);
    expect(STOP_WORDS.has('he')).toBe(true);
    expect(STOP_WORDS.has('she')).toBe(true);
    expect(STOP_WORDS.has('it')).toBe(true);
    expect(STOP_WORDS.has('we')).toBe(true);
    expect(STOP_WORDS.has('they')).toBe(true);
  });

  it('contains common prepositions', () => {
    expect(STOP_WORDS.has('in')).toBe(true);
    expect(STOP_WORDS.has('on')).toBe(true);
    expect(STOP_WORDS.has('at')).toBe(true);
    expect(STOP_WORDS.has('to')).toBe(true);
    expect(STOP_WORDS.has('for')).toBe(true);
  });

  it('contains be verbs', () => {
    expect(STOP_WORDS.has('be')).toBe(true);
    expect(STOP_WORDS.has('is')).toBe(true);
    expect(STOP_WORDS.has('am')).toBe(true);
    expect(STOP_WORDS.has('are')).toBe(true);
    expect(STOP_WORDS.has('was')).toBe(true);
    expect(STOP_WORDS.has('were')).toBe(true);
    expect(STOP_WORDS.has('been')).toBe(true);
    expect(STOP_WORDS.has('being')).toBe(true);
  });

  it('contains modal verbs', () => {
    expect(STOP_WORDS.has('can')).toBe(true);
    expect(STOP_WORDS.has('could')).toBe(true);
    expect(STOP_WORDS.has('will')).toBe(true);
    expect(STOP_WORDS.has('would')).toBe(true);
    expect(STOP_WORDS.has('shall')).toBe(true);
    expect(STOP_WORDS.has('should')).toBe(true);
    expect(STOP_WORDS.has('may')).toBe(true);
    expect(STOP_WORDS.has('might')).toBe(true);
    expect(STOP_WORDS.has('must')).toBe(true);
  });

  // Validates the set does not contain meaningful content words
  it('does not contain content words that users might want to look up', () => {
    expect(STOP_WORDS.has('economy')).toBe(false);
    expect(STOP_WORDS.has('politics')).toBe(false);
    expect(STOP_WORDS.has('technology')).toBe(false);
    expect(STOP_WORDS.has('beautiful')).toBe(false);
  });

  it('is a Set data structure', () => {
    expect(STOP_WORDS).toBeInstanceOf(Set);
  });

  // Boundary: verify total count is reasonable
  it('contains a reasonable number of stop words (not empty, not too large)', () => {
    expect(STOP_WORDS.size).toBeGreaterThan(50);
    expect(STOP_WORDS.size).toBeLessThan(200);
  });
});

describe('isStopWord', () => {
  // Normal case: lowercase stop words
  it('returns true for lowercase stop words', () => {
    expect(isStopWord('the')).toBe(true);
    expect(isStopWord('and')).toBe(true);
    expect(isStopWord('is')).toBe(true);
    expect(isStopWord('of')).toBe(true);
  });

  // Case insensitivity: uppercase input
  it('returns true for uppercase stop words (case insensitive)', () => {
    expect(isStopWord('THE')).toBe(true);
    expect(isStopWord('AND')).toBe(true);
    expect(isStopWord('IS')).toBe(true);
    expect(isStopWord('OF')).toBe(true);
  });

  // Case insensitivity: mixed case input
  it('returns true for mixed case stop words (case insensitive)', () => {
    expect(isStopWord('The')).toBe(true);
    expect(isStopWord('AnD')).toBe(true);
    expect(isStopWord('iS')).toBe(true);
    expect(isStopWord('Of')).toBe(true);
  });

  // Normal case: non-stop words
  it('returns false for non-stop words', () => {
    expect(isStopWord('economy')).toBe(false);
    expect(isStopWord('article')).toBe(false);
    expect(isStopWord('technology')).toBe(false);
    expect(isStopWord('government')).toBe(false);
  });

  // Edge case: empty string
  it('returns false for empty string', () => {
    expect(isStopWord('')).toBe(false);
  });

  // Edge case: whitespace only
  it('returns false for whitespace-only string', () => {
    expect(isStopWord(' ')).toBe(false);
    expect(isStopWord('  ')).toBe(false);
    expect(isStopWord('\t')).toBe(false);
    expect(isStopWord('\n')).toBe(false);
  });

  // Edge case: single character stop words
  it('handles single character stop words', () => {
    expect(isStopWord('a')).toBe(true);
    expect(isStopWord('i')).toBe(true);
    expect(isStopWord('x')).toBe(false);
    expect(isStopWord('z')).toBe(false);
  });

  // Boundary: words that look similar to stop words
  it('returns false for words similar to stop words but not in the list', () => {
    expect(isStopWord('thee')).toBe(false);  // Similar to 'the'
    expect(isStopWord('andy')).toBe(false);  // Similar to 'and'
    expect(isStopWord('isis')).toBe(false);  // Contains 'is'
  });

  // Edge case: numeric strings
  it('returns false for numeric strings', () => {
    expect(isStopWord('123')).toBe(false);
    expect(isStopWord('0')).toBe(false);
    expect(isStopWord('999')).toBe(false);
  });

  // Edge case: special characters
  it('returns false for strings with special characters', () => {
    expect(isStopWord('the!')).toBe(false);
    expect(isStopWord('and,')).toBe(false);
    expect(isStopWord('.is')).toBe(false);
  });
});
