import { WordMeaning } from './api-client';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

class CacheService {
  private wordCache = new Map<string, CacheEntry<WordMeaning>>();
  private translationCache = new Map<string, CacheEntry<string>>();

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > CACHE_TTL;
  }

  getWordMeaning(word: string, context: string): WordMeaning | null {
    const key = `${word}:${context}`;
    const entry = this.wordCache.get(key);

    if (entry && !this.isExpired(entry.timestamp)) {
      return entry.data;
    }

    return null;
  }

  setWordMeaning(word: string, context: string, meaning: WordMeaning): void {
    const key = `${word}:${context}`;
    this.wordCache.set(key, {
      data: meaning,
      timestamp: Date.now()
    });
  }

  getTranslation(sentence: string): string | null {
    const entry = this.translationCache.get(sentence);

    if (entry && !this.isExpired(entry.timestamp)) {
      return entry.data;
    }

    return null;
  }

  setTranslation(sentence: string, translation: string): void {
    this.translationCache.set(sentence, {
      data: translation,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.wordCache.clear();
    this.translationCache.clear();
  }
}

export const cacheService = new CacheService();
