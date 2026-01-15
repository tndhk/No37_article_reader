export function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function validateTextLength(text: string, maxLength: number): boolean {
  return text.length <= maxLength;
}

export function validateWord(word: string): boolean {
  return word.trim().length > 0;
}

export function validateSentence(sentence: string): boolean {
  return sentence.trim().length > 0;
}
