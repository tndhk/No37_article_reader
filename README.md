# English News Reader

英語学習者向けのニュースリーダー PWA（Progressive Web App）です。英語ニュース記事を読みながら、単語の意味や文の翻訳をその場で確認できます。

## 主な機能

- **記事読み込み**: 英語ニュースサイト（BBC、CNN、Guardian など）の URL を入力して記事を表示
- **単語の意味表示**: 単語をタップすると、日本語の意味・品詞・例文を表示（AI による文脈を考慮した解説）
- **文の翻訳**: 文をロングプレス（500ms）すると日本語訳を表示
- **セッションキャッシュ**: 一度調べた単語や翻訳はキャッシュされ、即座に再表示

## 技術スタック

### フロントエンド

- **TypeScript** + Vanilla JS（フレームワークなし）
- **Vite** - ビルドツール
- **CSS** - カスタムプロパティによるデザインシステム

### バックエンド

- **Cloudflare Pages Functions** - サーバーレス API
- **Google Gemini API** - AI による単語解説・翻訳
- **Readability.js** - 記事本文の抽出
- **Cloudflare KV** - レート制限用ストレージ

### テスト・CI/CD

- **Vitest** - ユニットテスト
- **ESLint** - コード品質チェック
- **GitHub Actions** - 自動テスト・ビルド

## プロジェクト構成

```
├── functions/              # バックエンド API
│   ├── api/
│   │   ├── article.ts     # 記事取得 API
│   │   ├── word.ts        # 単語意味取得 API
│   │   └── translate.ts   # 翻訳 API
│   └── lib/               # 共通ライブラリ
├── src/                    # フロントエンド
│   ├── components/        # UI コンポーネント
│   ├── services/          # API クライアント・キャッシュ
│   └── utils/             # ユーティリティ
├── test/                   # テストファイル
└── index.html             # エントリーポイント
```

## セットアップ

### 必要条件

- Node.js 18 以上
- npm または yarn
- Cloudflare アカウント（デプロイ用）
- Google Gemini API キー

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/tndhk/No37_article_reader.git
cd No37_article_reader

# 依存パッケージをインストール
npm install
```

### 環境変数

Cloudflare Pages のダッシュボードまたは `.dev.vars` ファイルで以下を設定:

```
GEMINI_API_KEY=your_gemini_api_key
```

### 開発サーバー起動

```bash
# フロントエンド開発サーバー
npm run dev

# Cloudflare Functions を含めたプレビュー
npm run preview
```

## スクリプト

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run preview` | ビルド結果のプレビュー（Wrangler） |
| `npm run test` | テスト実行（watch モード） |
| `npm run test:run` | テスト実行（1回のみ） |
| `npm run lint` | ESLint チェック |
| `npm run lint:fix` | ESLint 自動修正 |

## API エンドポイント

### GET /api/article

記事を取得してパースします。

**クエリパラメータ:**
- `url` - 記事の URL（必須）

**レスポンス:**
```json
{
  "title": "記事タイトル",
  "source": "bbc.com",
  "paragraphs": [
    {
      "sentences": [
        { "text": "...", "words": ["word1", "word2"] }
      ]
    }
  ]
}
```

### POST /api/word

単語の意味を取得します。

**リクエストボディ:**
```json
{
  "word": "consolidate",
  "context": "The company will consolidate its operations."
}
```

**レスポンス:**
```json
{
  "meaning": "統合する、強化する",
  "pos": "動詞",
  "example": "We need to consolidate our resources."
}
```

### POST /api/translate

文を日本語に翻訳します。

**リクエストボディ:**
```json
{
  "sentence": "The quick brown fox jumps over the lazy dog."
}
```

**レスポンス:**
```json
{
  "translation": "素早い茶色の狐が怠惰な犬を飛び越える。"
}
```

## デプロイ

Cloudflare Pages にデプロイします:

```bash
# Wrangler でデプロイ
npx wrangler pages deploy dist
```

または GitHub と連携して自動デプロイを設定できます。

## ライセンス

MIT License
