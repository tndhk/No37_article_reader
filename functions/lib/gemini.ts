export interface WordMeaning {
  meaning: string;
  pos: string;
  example: string;
}

export class GeminiClient {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey;
  }

  async getWordMeaning(word: string, context: string): Promise<WordMeaning> {
    const prompt = `
You are an English-Japanese dictionary assistant.
Given the word "${word}" in the context: "${context}"

Return a JSON object with:
- meaning: Japanese meaning appropriate for this context
- pos: Part of speech in Japanese (名詞, 動詞, 形容詞, etc.)
- example: A simple example sentence using the word

Return ONLY valid JSON, no other text.
`;

    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error('Gemini API request failed');
    }

    const data = await response.json() as {
      candidates: Array<{
        content: {
          parts: Array<{ text: string }>;
        };
      }>;
    };
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text);
  }

  async translateSentence(sentence: string): Promise<string> {
    const prompt = `
Translate the following English sentence to natural Japanese.
Return ONLY the translation, no other text.

"${sentence}"
`;

    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error('Gemini API request failed');
    }

    const data = await response.json() as {
      candidates: Array<{
        content: {
          parts: Array<{ text: string }>;
        };
      }>;
    };
    return data.candidates[0].content.parts[0].text.trim();
  }
}
