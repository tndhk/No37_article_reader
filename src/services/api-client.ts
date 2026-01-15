export interface ParsedArticle {
  title: string;
  source: string;
  paragraphs: ParsedParagraph[];
}

export interface ParsedParagraph {
  sentences: ParsedSentence[];
}

export interface ParsedSentence {
  text: string;
  words: string[];
}

export interface WordMeaning {
  meaning: string;
  pos: string;
  example: string;
}

export interface TranslationResult {
  translation: string;
}

const API_BASE = '/api';

export class ApiClient {
  async fetchArticle(url: string): Promise<ParsedArticle> {
    const response = await fetch(`${API_BASE}/article?url=${encodeURIComponent(url)}`);

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to fetch article');
    }

    return response.json();
  }

  async getWordMeaning(word: string, context: string): Promise<WordMeaning> {
    const response = await fetch(`${API_BASE}/word`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, context })
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to get word meaning');
    }

    return response.json();
  }

  async translateSentence(sentence: string): Promise<TranslationResult> {
    const response = await fetch(`${API_BASE}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence })
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to translate sentence');
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
