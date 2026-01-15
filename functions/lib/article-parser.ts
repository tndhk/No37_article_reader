import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';

export interface ExtractedArticle {
  title: string;
  content: string;
  source: string;
}

export interface ParsedSentence {
  text: string;
  words: string[];
}

export interface ParsedParagraph {
  sentences: ParsedSentence[];
}

export interface ParsedArticle {
  title: string;
  source: string;
  paragraphs: ParsedParagraph[];
}

export function extractArticle(html: string, url: string): ExtractedArticle {
  if (!html) {
    throw new Error('HTML content is required');
  }

  const { document } = parseHTML(html);
  const reader = new Readability(document);
  const article = reader.parse();

  if (!article) {
    throw new Error('Failed to parse article');
  }

  const urlObj = new URL(url);

  return {
    title: article.title || '',
    content: article.textContent || '',
    source: urlObj.hostname
  };
}

const ABBREVIATIONS = ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Sr', 'Jr'];

export function splitIntoSentences(text: string): string[] {
  // 略語のピリオドを一時的に置換
  let processed = text;
  for (const abbr of ABBREVIATIONS) {
    processed = processed.replace(new RegExp(`${abbr}\\.`, 'g'), `${abbr}<<<DOT>>>`);
  }

  // 文末で分割
  const sentences = processed
    .split(/(?<=[.!?])\s+/)
    .map(s => s.replace(/<<<DOT>>>/g, '.').trim())
    .filter(s => s.length > 0);

  return sentences;
}

export function splitIntoWords(sentence: string): string[] {
  return sentence
    .replace(/[.,!?;:'"()]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0);
}

export function parseArticle(html: string, url: string): ParsedArticle {
  const extracted = extractArticle(html, url);

  // 段落に分割（空行で区切る）
  const paragraphTexts = extracted.content
    .split(/\n\n+/)
    .filter(p => p.trim().length > 0);

  const paragraphs: ParsedParagraph[] = paragraphTexts.map(paragraphText => {
    const sentences = splitIntoSentences(paragraphText).map(sentenceText => ({
      text: sentenceText,
      words: splitIntoWords(sentenceText)
    }));
    return { sentences };
  });

  return {
    title: extracted.title,
    source: extracted.source,
    paragraphs
  };
}
