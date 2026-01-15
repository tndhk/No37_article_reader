import { apiClient, ParsedArticle } from './services/api-client';
import { cacheService } from './services/cache';
import { createUrlInput } from './components/url-input';
import { createArticleReader } from './components/article-reader';
import { createBottomPanel, BottomPanelState } from './components/bottom-panel';
import './styles.css';

class App {
  private app: HTMLElement;
  private bottomPanel: ReturnType<typeof createBottomPanel>;
  private currentArticle: ParsedArticle | null = null;

  constructor() {
    this.app = document.getElementById('app')!;
    this.bottomPanel = createBottomPanel();
    this.app.appendChild(this.bottomPanel.element);

    this.showUrlInput();
  }

  private showUrlInput(): void {
    this.app.innerHTML = '';
    this.app.appendChild(this.bottomPanel.element);

    const urlInput = createUrlInput({
      onSubmit: (url) => this.loadArticle(url)
    });
    this.app.insertBefore(urlInput, this.bottomPanel.element);
  }

  private async loadArticle(url: string): Promise<void> {
    // Show loading state
    this.app.innerHTML = '';
    this.app.appendChild(this.bottomPanel.element);

    const loadingEl = document.createElement('div');
    loadingEl.className = 'loading-screen';
    loadingEl.innerHTML = '<p>記事を読み込んでいます...</p>';
    this.app.insertBefore(loadingEl, this.bottomPanel.element);

    try {
      const article = await apiClient.fetchArticle(url);
      this.currentArticle = article;
      this.showArticle(article);
    } catch (error) {
      this.showError(error instanceof Error ? error.message : '記事を読み込めませんでした');
    }
  }

  private showArticle(article: ParsedArticle): void {
    this.app.innerHTML = '';
    this.app.appendChild(this.bottomPanel.element);

    // Back button
    const backBtn = document.createElement('button');
    backBtn.className = 'back-btn';
    backBtn.textContent = '← 戻る';
    backBtn.addEventListener('click', () => this.showUrlInput());
    this.app.insertBefore(backBtn, this.bottomPanel.element);

    // Article reader
    const reader = createArticleReader(article, {
      onWordClick: (word, sentence) => this.showWordMeaning(word, sentence),
      onSentenceLongPress: (sentence) => this.showTranslation(sentence)
    });
    this.app.insertBefore(reader, this.bottomPanel.element);
  }

  private async showWordMeaning(word: string, sentence: string): Promise<void> {
    // Check cache first
    const cached = cacheService.getWordMeaning(word, sentence);
    if (cached) {
      this.bottomPanel.update({
        type: 'word',
        word,
        meaning: cached
      });
      return;
    }

    // Show loading
    this.bottomPanel.update({ type: 'loading' });

    try {
      const meaning = await apiClient.getWordMeaning(word, sentence);
      cacheService.setWordMeaning(word, sentence, meaning);
      this.bottomPanel.update({
        type: 'word',
        word,
        meaning
      });
    } catch (error) {
      this.bottomPanel.update({
        type: 'error',
        error: error instanceof Error ? error.message : '単語の意味を取得できませんでした'
      });
    }
  }

  private async showTranslation(sentence: string): Promise<void> {
    // Check cache first
    const cached = cacheService.getTranslation(sentence);
    if (cached) {
      this.bottomPanel.update({
        type: 'translation',
        translation: cached
      });
      return;
    }

    // Show loading
    this.bottomPanel.update({ type: 'loading' });

    try {
      const result = await apiClient.translateSentence(sentence);
      cacheService.setTranslation(sentence, result.translation);
      this.bottomPanel.update({
        type: 'translation',
        translation: result.translation
      });
    } catch (error) {
      this.bottomPanel.update({
        type: 'error',
        error: error instanceof Error ? error.message : '翻訳を取得できませんでした'
      });
    }
  }

  private showError(message: string): void {
    this.app.innerHTML = '';
    this.app.appendChild(this.bottomPanel.element);

    const errorEl = document.createElement('div');
    errorEl.className = 'error-screen';
    errorEl.innerHTML = `
      <p class="error-message">${message}</p>
      <button class="retry-btn">もう一度試す</button>
    `;

    const retryBtn = errorEl.querySelector('.retry-btn');
    retryBtn?.addEventListener('click', () => this.showUrlInput());

    this.app.insertBefore(errorEl, this.bottomPanel.element);
  }
}

// Initialize app
new App();
