import { isStopWord } from './stop-words';

export function cleanWord(word: string): string {
  return word.replace(/[.,!?;:'"()[\]{}]/g, '').trim();
}

export function shouldShowWordMeaning(word: string): boolean {
  const cleaned = cleanWord(word);
  if (cleaned.length < 2) return false;
  if (isStopWord(cleaned)) return false;
  if (/^\d+$/.test(cleaned)) return false;
  return true;
}

export function getSentenceFromWord(element: HTMLElement): string {
  // Find the parent sentence element
  let current: HTMLElement | null = element;
  while (current && !current.classList.contains('sentence')) {
    current = current.parentElement;
  }
  return current?.textContent?.trim() || '';
}
