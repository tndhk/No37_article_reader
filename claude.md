# English News Reader

English language learners向けのPWAアプリケーション。英語ニュース記事を読みながら、単語の意味や文章の翻訳をAIで取得できる。

## Tech Stack

- **Frontend**: TypeScript + Vanilla JS (Vite 7.x)
- **Backend**: Cloudflare Pages Functions (serverless)
- **AI**: Google Gemini API (v2.0-flash)
- **Storage**: Cloudflare KV (rate limiting用)
- **Testing**: Vitest + jsdom + MSW
- **Linting**: ESLint + TypeScript ESLint

## Directory Structure

```
functions/           # Backend (Cloudflare Pages Functions)
├── api/            # API endpoints (article, word, translate)
├── lib/            # Shared libraries (gemini, rate-limiter, validation)
└── _middleware.ts  # CORS middleware

src/                # Frontend
├── components/     # UI components (url-input, article-reader, bottom-panel)
├── services/       # API client, cache service
├── utils/          # Text processor, stop words
├── main.ts         # App entry point
└── styles.css      # Design system (Literary Journal aesthetic)

test/               # Test files mirroring src/ and functions/ structure
```

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:5173)
npm run preview      # Preview with Cloudflare Functions
npm run build        # Production build to /dist
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
```

## Environment Variables

- `GEMINI_API_KEY` - Google Gemini API key (required)
- `RATE_LIMIT_KV` - Cloudflare KV namespace binding

## Key Architecture Patterns

### Frontend
- Web Components pattern (custom classes, not Custom Elements)
- Session cache with 24h TTL for API responses
- Stop word filtering (100+ common words excluded from highlighting)
- Long-press detection (500ms) for sentence translation

### Backend
- Mozilla Readability for article content extraction
- IP-based rate limiting (30 req/hr for articles, 100 req/hr for translations)
- Context-aware AI translations using Gemini

## Testing

- 15 test files covering components, services, utilities, APIs
- Uses jsdom for DOM simulation
- Uses MSW for HTTP mocking
- Test files mirror source structure in `test/` directory

## CI/CD

GitHub Actions pipeline:
1. Lint (ESLint)
2. Test (Vitest)
3. Build (requires lint & test passing)

## Code Style

- TypeScript strict mode enabled
- ES2022 target
- No framework dependencies (vanilla JS)
- Serif typography (Playfair Display, Crimson Pro)
- Warm parchment color palette (#FBF9F3, #1C1917, #B45309)
