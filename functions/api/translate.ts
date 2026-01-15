import { GeminiClient } from '../lib/gemini';
import { validateSentence } from '../lib/validation';
import { RateLimiter, RATE_LIMITS } from '../lib/rate-limiter';

interface Env {
  GEMINI_API_KEY: string;
  RATE_LIMIT_KV: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { sentence } = await context.request.json() as { sentence?: string };

  if (!sentence || !validateSentence(sentence)) {
    return new Response(JSON.stringify({ error: '入力が無効です' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown';
  const limiter = new RateLimiter(context.env.RATE_LIMIT_KV, RATE_LIMITS.translate);
  const limitResult = await limiter.checkLimit(ip, 'translate');

  if (!limitResult.allowed) {
    return new Response(JSON.stringify({ error: '利用上限に達しました。しばらくお待ちください' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const client = new GeminiClient(context.env.GEMINI_API_KEY);
    const translation = await client.translateSentence(sentence);

    await limiter.increment(ip, 'translate');

    return new Response(JSON.stringify({ translation }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch {
    return new Response(JSON.stringify({ error: '翻訳を取得できませんでした。再度タップしてください' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
