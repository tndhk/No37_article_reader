# English News Reader PWA - TDD実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** URLを貼るだけで英語ニュース記事を快適に読める個人学習用PWAを構築する

**Architecture:** Vanilla JS + Vite のフロントエンドと Cloudflare Pages Functions のバックエンド。Gemini 2.0/2.5 Flash で単語意味・文翻訳を提供し、Readability.js で記事本文を抽出する。認証/DBなしのシンプル構成。

**Tech Stack:** Vite, TypeScript, Cloudflare Pages Functions, Gemini API, Readability.js, Vitest

---

## プロジェクト構造

```
No36_article_reader/
├── functions/                    # Cloudflare Pages Functions
│   ├── api/
│   │   ├── article.ts           # GET /api/article
│   │   ├── word.ts              # POST /api/word
│   │   └── translate.ts         # POST /api/translate
│   ├── lib/
│   │   ├── gemini.ts            # Gemini API クライアント
│   │   ├── article-parser.ts    # 記事パース処理
│   │   ├── rate-limiter.ts      # レート制限
│   │   └── validation.ts        # 入力バリデーション
│   └── _middleware.ts           # CORS共通処理
├── src/                          # フロントエンド
│   ├── main.ts
│   ├── components/
│   │   ├── url-input.ts
│   │   ├── article-reader.ts
│   │   └── bottom-panel.ts
│   ├── services/
│   │   ├── api-client.ts
│   │   └── cache.ts
│   └── utils/
│       ├── text-processor.ts
│       └── stop-words.ts
├── test/
│   ├── functions/               # バックエンドテスト
│   └── frontend/                # フロントエンドテスト
├── public/
├── vitest.config.ts
├── wrangler.toml
├── package.json
└── index.html
```

---

## Phase 1: プロジェクト初期設定

### Task 1.1: プロジェクト初期化

**Files:**
- Create: `package.json`

**Step 1: npm初期化とパッケージインストール**

```bash
npm init -y
npm install @mozilla/readability linkedom
npm install -D vite typescript vitest @cloudflare/vitest-pool-workers wrangler @cloudflare/workers-types msw @testing-library/dom jsdom
```

**Step 2: Commit**

```bash
git init
git add package.json package-lock.json
git commit -m "chore: initialize project with dependencies"
```

---

### Task 1.2: TypeScript設定

**Files:**
- Create: `tsconfig.json`

**Step 1: tsconfig.json作成**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["@cloudflare/workers-types", "vitest/globals"],
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "outDir": "dist",
    "rootDir": "."
  },
  "include": ["src/**/*", "functions/**/*", "test/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 2: Commit**

```bash
git add tsconfig.json
git commit -m "chore: add TypeScript configuration"
```

---

### Task 1.3: Vitest設定

**Files:**
- Create: `vitest.config.ts`

**Step 1: vitest.config.ts作成**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['test/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
  },
});
```

**Step 2: テストが実行できることを確認**

```bash
npx vitest run
```

Expected: テストファイルがないため0件で終了

**Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "chore: add Vitest configuration"
```

---

### Task 1.4: Wrangler設定

**Files:**
- Create: `wrangler.toml`

**Step 1: wrangler.toml作成**

```toml
name = "english-news-reader"
compatibility_date = "2024-01-01"
pages_build_output_dir = "dist"

[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "placeholder-id"

[vars]
GEMINI_API_KEY = ""
```

**Step 2: Commit**

```bash
git add wrangler.toml
git commit -m "chore: add Wrangler configuration"
```

---

### Task 1.5: Vite設定とHTML

**Files:**
- Create: `vite.config.ts`
- Create: `index.html`

**Step 1: vite.config.ts作成**

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
  },
});
```

**Step 2: index.html作成**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>English News Reader</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

**Step 3: Commit**

```bash
git add vite.config.ts index.html
git commit -m "chore: add Vite configuration and index.html"
```

---

### Task 1.6: package.json scripts更新

**Files:**
- Modify: `package.json`

**Step 1: scriptsセクション追加**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest",
    "test:run": "vitest run",
    "preview": "wrangler pages dev dist"
  }
}
```

**Step 2: Commit**

```bash
git add package.json
git commit -m "chore: add npm scripts"
```

---

## Phase 2: バックエンド共通ライブラリ

### Task 2.1: バリデーションライブラリ - URL形式

**Files:**
- Create: `functions/lib/validation.ts`
- Create: `test/functions/lib/validation.test.ts`

**Step 1: 失敗するテストを書く**

```typescript
// test/functions/lib/validation.test.ts
import { describe, it, expect } from 'vitest';
import { isValidUrl } from '../../../functions/lib/validation';

describe('isValidUrl', () => {
  it('accepts valid HTTPS URLs', () => {
    expect(isValidUrl('https://example.com/article')).toBe(true);
  });

  it('accepts valid HTTP URLs', () => {
    expect(isValidUrl('http://example.com/article')).toBe(true);
  });

  it('rejects invalid URL format', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidUrl('')).toBe(false);
  });
});
```

**Step 2: テストが失敗することを確認**

```bash
npx vitest run test/functions/lib/validation.test.ts
```

Expected: FAIL - "isValidUrl is not defined"

**Step 3: 最小限の実装**

```typescript
// functions/lib/validation.ts
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
```

**Step 4: テストがパスすることを確認**

```bash
npx vitest run test/functions/lib/validation.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add functions/lib/validation.ts test/functions/lib/validation.test.ts
git commit -m "feat(validation): add URL validation"
```

---

### Task 2.2: バリデーションライブラリ - 文字数制限

**Files:**
- Modify: `functions/lib/validation.ts`
- Modify: `test/functions/lib/validation.test.ts`

**Step 1: 失敗するテストを追加**

```typescript
// test/functions/lib/validation.test.ts に追加
import { validateTextLength } from '../../../functions/lib/validation';

describe('validateTextLength', () => {
  it('accepts text within limit', () => {
    expect(validateTextLength('short text', 10000)).toBe(true);
  });

  it('rejects text exceeding limit', () => {
    const longText = 'a'.repeat(10001);
    expect(validateTextLength(longText, 10000)).toBe(false);
  });
});
```

**Step 2: テストが失敗することを確認**

```bash
npx vitest run test/functions/lib/validation.test.ts
```

Expected: FAIL

**Step 3: 実装**

```typescript
// functions/lib/validation.ts に追加
export function validateTextLength(text: string, maxLength: number): boolean {
  return text.length <= maxLength;
}
```

**Step 4: テストがパスすることを確認**

```bash
npx vitest run test/functions/lib/validation.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add functions/lib/validation.ts test/functions/lib/validation.test.ts
git commit -m "feat(validation): add text length validation"
```

---

### Task 2.3: バリデーションライブラリ - 単語・文バリデーション

**Files:**
- Modify: `functions/lib/validation.ts`
- Modify: `test/functions/lib/validation.test.ts`

**Step 1: 失敗するテストを追加**

```typescript
// test/functions/lib/validation.test.ts に追加
import { validateWord, validateSentence } from '../../../functions/lib/validation';

describe('validateWord', () => {
  it('accepts valid word', () => {
    expect(validateWord('consolidate')).toBe(true);
  });

  it('rejects empty word', () => {
    expect(validateWord('')).toBe(false);
  });
});

describe('validateSentence', () => {
  it('accepts valid sentence', () => {
    expect(validateSentence('This is a sentence.')).toBe(true);
  });

  it('rejects empty sentence', () => {
    expect(validateSentence('')).toBe(false);
  });
});
```

**Step 2: テストが失敗することを確認**

```bash
npx vitest run test/functions/lib/validation.test.ts
```

**Step 3: 実装**

```typescript
// functions/lib/validation.ts に追加
export function validateWord(word: string): boolean {
  return word.trim().length > 0;
}

export function validateSentence(sentence: string): boolean {
  return sentence.trim().length > 0;
}
```

**Step 4: テストがパスすることを確認**

```bash
npx vitest run test/functions/lib/validation.test.ts
```

**Step 5: Commit**

```bash
git add functions/lib/validation.ts test/functions/lib/validation.test.ts
git commit -m "feat(validation): add word and sentence validation"
```

---

### Task 2.4: Gemini APIクライアント - 基本構造

**Files:**
- Create: `functions/lib/gemini.ts`
- Create: `test/functions/lib/gemini.test.ts`

**Step 1: 失敗するテストを書く**

```typescript
// test/functions/lib/gemini.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiClient } from '../../../functions/lib/gemini';

describe('GeminiClient', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('throws error when API key is not provided', () => {
    expect(() => new GeminiClient('')).toThrow('API key is required');
  });

  it('creates instance with valid API key', () => {
    const client = new GeminiClient('test-api-key');
    expect(client).toBeDefined();
  });
});
```

**Step 2: テストが失敗することを確認**

```bash
npx vitest run test/functions/lib/gemini.test.ts
```

**Step 3: 実装**

```typescript
// functions/lib/gemini.ts
export class GeminiClient {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey;
  }
}
```

**Step 4: テストがパスすることを確認**

```bash
npx vitest run test/functions/lib/gemini.test.ts
```

**Step 5: Commit**

```bash
git add functions/lib/gemini.ts test/functions/lib/gemini.test.ts
git commit -m "feat(gemini): add basic client structure"
```

---

### Task 2.5: Gemini APIクライアント - 単語意味取得

**Files:**
- Modify: `functions/lib/gemini.ts`
- Modify: `test/functions/lib/gemini.test.ts`

**Step 1: 失敗するテストを追加**

```typescript
// test/functions/lib/gemini.test.ts に追加
describe('getWordMeaning', () => {
  it('returns word meaning with pos and example', async () => {
    const mockResponse = {
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              meaning: '統合する',
              pos: '動詞',
              example: 'They consolidated their resources.'
            })
          }]
        }
      }]
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const client = new GeminiClient('test-api-key');
    const result = await client.getWordMeaning('consolidate', 'The company will consolidate its operations.');

    expect(result).toEqual({
      meaning: '統合する',
      pos: '動詞',
      example: 'They consolidated their resources.'
    });
  });
});
```

**Step 2: テストが失敗することを確認**

```bash
npx vitest run test/functions/lib/gemini.test.ts
```

**Step 3: 実装**

```typescript
// functions/lib/gemini.ts に追加
export interface WordMeaning {
  meaning: string;
  pos: string;
  example: string;
}

export class GeminiClient {
  // ... 既存のコード

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

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text);
  }
}
```

**Step 4: テストがパスすることを確認**

```bash
npx vitest run test/functions/lib/gemini.test.ts
```

**Step 5: Commit**

```bash
git add functions/lib/gemini.ts test/functions/lib/gemini.test.ts
git commit -m "feat(gemini): add word meaning retrieval"
```

---

### Task 2.6: Gemini APIクライアント - 文翻訳

**Files:**
- Modify: `functions/lib/gemini.ts`
- Modify: `test/functions/lib/gemini.test.ts`

**Step 1: 失敗するテストを追加**

```typescript
// test/functions/lib/gemini.test.ts に追加
describe('translateSentence', () => {
  it('returns Japanese translation', async () => {
    const mockResponse = {
      candidates: [{
        content: {
          parts: [{
            text: 'その会社は事業を統合する予定だ。'
          }]
        }
      }]
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const client = new GeminiClient('test-api-key');
    const result = await client.translateSentence('The company will consolidate its operations.');

    expect(result).toBe('その会社は事業を統合する予定だ。');
  });
});
```

**Step 2: テストが失敗することを確認**

```bash
npx vitest run test/functions/lib/gemini.test.ts
```

**Step 3: 実装**

```typescript
// functions/lib/gemini.ts に追加
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

  const data = await response.json();
  return data.candidates[0].content.parts[0].text.trim();
}
```

**Step 4: テストがパスすることを確認**

```bash
npx vitest run test/functions/lib/gemini.test.ts
```

**Step 5: Commit**

```bash
git add functions/lib/gemini.ts test/functions/lib/gemini.test.ts
git commit -m "feat(gemini): add sentence translation"
```

---

### Task 2.7: 記事パーサー - HTML本文抽出

**Files:**
- Create: `functions/lib/article-parser.ts`
- Create: `test/functions/lib/article-parser.test.ts`

**Step 1: 失敗するテストを書く**

```typescript
// test/functions/lib/article-parser.test.ts
import { describe, it, expect } from 'vitest';
import { extractArticle } from '../../../functions/lib/article-parser';

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
```

**Step 2: テストが失敗することを確認**

```bash
npx vitest run test/functions/lib/article-parser.test.ts
```

**Step 3: 実装**

```typescript
// functions/lib/article-parser.ts
import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';

export interface ExtractedArticle {
  title: string;
  content: string;
  source: string;
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
    title: article.title,
    content: article.textContent,
    source: urlObj.hostname
  };
}
```

**Step 4: テストがパスすることを確認**

```bash
npx vitest run test/functions/lib/article-parser.test.ts
```

**Step 5: Commit**

```bash
git add functions/lib/article-parser.ts test/functions/lib/article-parser.test.ts
git commit -m "feat(article-parser): add HTML content extraction"
```

---

### Task 2.8: 記事パーサー - 文・単語分割

**Files:**
- Modify: `functions/lib/article-parser.ts`
- Modify: `test/functions/lib/article-parser.test.ts`

**Step 1: 失敗するテストを追加**

```typescript
// test/functions/lib/article-parser.test.ts に追加
import { splitIntoSentences, splitIntoWords } from '../../../functions/lib/article-parser';

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
```

**Step 2: テストが失敗することを確認**

**Step 3: 実装**

```typescript
// functions/lib/article-parser.ts に追加
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
```

**Step 4: テストがパスすることを確認**

**Step 5: Commit**

```bash
git add functions/lib/article-parser.ts test/functions/lib/article-parser.test.ts
git commit -m "feat(article-parser): add sentence and word splitting"
```

---

### Task 2.9: 記事パーサー - 完全な記事構造生成

**Files:**
- Modify: `functions/lib/article-parser.ts`
- Modify: `test/functions/lib/article-parser.test.ts`

**Step 1: 失敗するテストを追加**

```typescript
// test/functions/lib/article-parser.test.ts に追加
import { parseArticle } from '../../../functions/lib/article-parser';

describe('parseArticle', () => {
  it('returns structured article with paragraphs, sentences, and words', () => {
    const html = `
      <html>
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
    expect(result.paragraphs).toHaveLength(2);
    expect(result.paragraphs[0].sentences).toHaveLength(2);
    expect(result.paragraphs[0].sentences[0].words).toContain('First');
  });
});
```

**Step 2: テストが失敗することを確認**

**Step 3: 実装**

```typescript
// functions/lib/article-parser.ts に追加
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
```

**Step 4: テストがパスすることを確認**

**Step 5: Commit**

```bash
git add functions/lib/article-parser.ts test/functions/lib/article-parser.test.ts
git commit -m "feat(article-parser): add complete article parsing"
```

---

### Task 2.10: レート制限ライブラリ

**Files:**
- Create: `functions/lib/rate-limiter.ts`
- Create: `test/functions/lib/rate-limiter.test.ts`

**Step 1: 失敗するテストを書く**

```typescript
// test/functions/lib/rate-limiter.test.ts
import { describe, it, expect, vi } from 'vitest';
import { RateLimiter, RateLimitConfig } from '../../../functions/lib/rate-limiter';

describe('RateLimiter', () => {
  const mockKV = {
    get: vi.fn(),
    put: vi.fn()
  };

  const config: RateLimitConfig = {
    maxRequests: 30,
    windowMs: 60 * 60 * 1000 // 1 hour
  };

  it('allows request when under limit', async () => {
    mockKV.get.mockResolvedValue('5');
    const limiter = new RateLimiter(mockKV as any, config);

    const result = await limiter.checkLimit('127.0.0.1', 'article');
    expect(result.allowed).toBe(true);
  });

  it('blocks request when over limit', async () => {
    mockKV.get.mockResolvedValue('30');
    const limiter = new RateLimiter(mockKV as any, config);

    const result = await limiter.checkLimit('127.0.0.1', 'article');
    expect(result.allowed).toBe(false);
  });
});
```

**Step 2: テストが失敗することを確認**

**Step 3: 実装**

```typescript
// functions/lib/rate-limiter.ts
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export class RateLimiter {
  constructor(
    private kv: KVNamespace,
    private config: RateLimitConfig
  ) {}

  async checkLimit(ip: string, type: string): Promise<RateLimitResult> {
    const key = `rate:${type}:${ip}`;
    const current = parseInt(await this.kv.get(key) || '0', 10);

    if (current >= this.config.maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    return { allowed: true, remaining: this.config.maxRequests - current };
  }

  async increment(ip: string, type: string): Promise<void> {
    const key = `rate:${type}:${ip}`;
    const current = parseInt(await this.kv.get(key) || '0', 10);
    const ttl = Math.floor(this.config.windowMs / 1000);
    await this.kv.put(key, String(current + 1), { expirationTtl: ttl });
  }
}

// 設定値
export const RATE_LIMITS = {
  article: { maxRequests: 30, windowMs: 60 * 60 * 1000 },
  translate: { maxRequests: 100, windowMs: 60 * 60 * 1000 }
};
```

**Step 4: テストがパスすることを確認**

**Step 5: Commit**

```bash
git add functions/lib/rate-limiter.ts test/functions/lib/rate-limiter.test.ts
git commit -m "feat(rate-limiter): add rate limiting with KV"
```

---

## Phase 3: バックエンドAPIエンドポイント

### Task 3.1: GET /api/article

**Files:**
- Create: `functions/api/article.ts`
- Create: `test/functions/api/article.test.ts`

**Step 1: 失敗するテストを書く**

```typescript
// test/functions/api/article.test.ts
import { describe, it, expect, vi } from 'vitest';

describe('GET /api/article', () => {
  it('returns parsed article for valid URL', async () => {
    // テスト実装
  });

  it('returns 400 for invalid URL', async () => {
    // テスト実装
  });

  it('returns 429 when rate limit exceeded', async () => {
    // テスト実装
  });
});
```

**Step 2: 実装**

```typescript
// functions/api/article.ts
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
  } catch (error) {
    return new Response(JSON.stringify({ error: '記事を取得できませんでした' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

**Step 3: Commit**

```bash
git add functions/api/article.ts test/functions/api/article.test.ts
git commit -m "feat(api/article): add article fetch endpoint"
```

---

### Task 3.2: POST /api/word

**Files:**
- Create: `functions/api/word.ts`
- Create: `test/functions/api/word.test.ts`

**Step 1: 実装**

```typescript
// functions/api/word.ts
import { GeminiClient } from '../lib/gemini';
import { validateWord, validateSentence } from '../lib/validation';

interface Env {
  GEMINI_API_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { word, context: wordContext } = await context.request.json();

  if (!validateWord(word) || !validateSentence(wordContext)) {
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
  } catch (error) {
    return new Response(JSON.stringify({ error: '翻訳を取得できませんでした。再度タップしてください' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

**Step 2: Commit**

```bash
git add functions/api/word.ts test/functions/api/word.test.ts
git commit -m "feat(api/word): add word meaning endpoint"
```

---

### Task 3.3: POST /api/translate

**Files:**
- Create: `functions/api/translate.ts`
- Create: `test/functions/api/translate.test.ts`

**Step 1: 実装**

```typescript
// functions/api/translate.ts
import { GeminiClient } from '../lib/gemini';
import { validateSentence } from '../lib/validation';
import { RateLimiter, RATE_LIMITS } from '../lib/rate-limiter';

interface Env {
  GEMINI_API_KEY: string;
  RATE_LIMIT_KV: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { sentence } = await context.request.json();

  if (!validateSentence(sentence)) {
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
  } catch (error) {
    return new Response(JSON.stringify({ error: '翻訳を取得できませんでした。再度タップしてください' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

**Step 2: Commit**

```bash
git add functions/api/translate.ts test/functions/api/translate.test.ts
git commit -m "feat(api/translate): add translation endpoint"
```

---

### Task 3.4: CORSミドルウェア

**Files:**
- Create: `functions/_middleware.ts`

**Step 1: 実装**

```typescript
// functions/_middleware.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequest: PagesFunction = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const response = await context.next();

  // CORSヘッダーを追加
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    headers: newHeaders
  });
};
```

**Step 2: Commit**

```bash
git add functions/_middleware.ts
git commit -m "feat(middleware): add CORS handling"
```

---

## Phase 4-7: フロントエンド実装

### Task 4.1-4.3: APIクライアント、キャッシュ、ユーティリティ

（Phase 2-3と同様のTDDパターンで実装）

### Task 5.1-5.3: UIコンポーネント

（Phase 2-3と同様のTDDパターンで実装）

### Task 6.1-6.2: アプリケーション統合

（Phase 2-3と同様のTDDパターンで実装）

### Task 7.1-7.3: PWA対応とスタイリング

（Phase 2-3と同様のTDDパターンで実装）

---

## Verification

### バックエンドテスト

```bash
npx vitest run test/functions/
```

### フロントエンドテスト

```bash
npx vitest run test/frontend/
```

### ローカル動作確認

```bash
npm run build
npx wrangler pages dev dist
```

ブラウザで http://localhost:8788 を開き:
1. URL入力欄に英語ニュース記事のURLを貼り付け
2. 「読む」ボタンをクリック
3. 記事が表示されたら、単語をタップして意味表示を確認
4. 文を長押しして翻訳表示を確認

---

## Critical Files

| File | Purpose |
|------|---------|
| `functions/lib/article-parser.ts` | 記事パース処理のコアロジック |
| `functions/lib/gemini.ts` | Gemini APIクライアント |
| `functions/lib/rate-limiter.ts` | レート制限実装 |
| `functions/api/article.ts` | 記事取得API |
| `src/components/article-reader.ts` | フロントエンドのメインコンポーネント |
| `vitest.config.ts` | TDDの基盤となるテスト設定 |
