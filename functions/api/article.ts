import { parseArticle } from '../lib/article-parser';
import { isValidUrl } from '../lib/validation';
import { RateLimiter, RATE_LIMITS } from '../lib/rate-limiter';

interface Env {
  RATE_LIMIT_KV: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const articleUrl = url.searchParams.get('url');

  if (!articleUrl || !isValidUrl(articleUrl)) {
    return new Response(JSON.stringify({ error: '正しいURLを入力してください' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown';
  const limiter = new RateLimiter(context.env.RATE_LIMIT_KV, RATE_LIMITS.article);
  const limitResult = await limiter.checkLimit(ip, 'article');

  if (!limitResult.allowed) {
    return new Response(JSON.stringify({ error: '利用上限に達しました。しばらくお待ちください' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const response = await fetch(articleUrl);
    const html = await response.text();
    const article = parseArticle(html, articleUrl);

    await limiter.increment(ip, 'article');

    return new Response(JSON.stringify(article), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch {
    return new Response(JSON.stringify({ error: '記事を取得できませんでした' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
