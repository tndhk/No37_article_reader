import { describe, it, expect } from 'vitest';
import {
  extractArticle,
  splitIntoSentences,
  splitIntoWords,
  parseArticle
} from '../../../functions/lib/article-parser';

describe('extractArticle', () => {
  it('extracts title and content from HTML', () => {
    const html = `
      <html>
        <head><title>Test Article</title></head>
        <body>
          <article>
            <h1>Test Article</h1>
            <p>This is the first paragraph.</p>
            <p>This is the second paragraph.</p>
          </article>
        </body>
      </html>
    `;

    const result = extractArticle(html, 'https://example.com/article');

    expect(result.title).toBe('Test Article');
    expect(result.content).toContain('first paragraph');
  });

  it('throws error for invalid HTML', () => {
    expect(() => extractArticle('', 'https://example.com')).toThrow();
  });
});

describe('splitIntoSentences', () => {
  it('splits text by periods', () => {
    const text = 'This is first. This is second.';
    const result = splitIntoSentences(text);
    expect(result).toEqual(['This is first.', 'This is second.']);
  });

  it('handles abbreviations correctly', () => {
    const text = 'Mr. Smith went home. He was tired.';
    const result = splitIntoSentences(text);
    expect(result).toEqual(['Mr. Smith went home.', 'He was tired.']);
  });
});

describe('splitIntoWords', () => {
  it('splits sentence into words', () => {
    const sentence = 'This is a sentence.';
    const result = splitIntoWords(sentence);
    expect(result).toEqual(['This', 'is', 'a', 'sentence']);
  });

  it('removes punctuation', () => {
    const sentence = 'Hello, world!';
    const result = splitIntoWords(sentence);
    expect(result).toEqual(['Hello', 'world']);
  });
});

describe('parseArticle', () => {
  it('returns structured article with paragraphs, sentences, and words', () => {
    const html = `
      <html>
        <head><title>Test</title></head>
        <body>
          <article>
            <h1>Test</h1>
            <p>First sentence. Second sentence.</p>
            <p>Third sentence.</p>
          </article>
        </body>
      </html>
    `;

    const result = parseArticle(html, 'https://example.com/article');

    expect(result.title).toBe('Test');
    expect(result.source).toBe('example.com');
    expect(result.paragraphs.length).toBeGreaterThan(0);
    expect(result.paragraphs[0].sentences.length).toBeGreaterThan(0);
    expect(result.paragraphs[0].sentences[0].words).toContain('First');
  });
});
