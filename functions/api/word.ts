import { GeminiClient } from '../lib/gemini';
import { validateWord, validateSentence } from '../lib/validation';

interface Env {
  GEMINI_API_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { word, context: wordContext } = await context.request.json() as {
    word?: string;
    context?: string;
  };

  if (!word || !validateWord(word) || !wordContext || !validateSentence(wordContext)) {
    return new Response(JSON.stringify({ error: '入力が無効です' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const client = new GeminiClient(context.env.GEMINI_API_KEY);
    const meaning = await client.getWordMeaning(word, wordContext);

    return new Response(JSON.stringify(meaning), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch {
    return new Response(JSON.stringify({ error: '翻訳を取得できませんでした。再度タップしてください' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
