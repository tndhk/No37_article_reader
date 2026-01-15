import { ParsedArticle, ParsedParagraph, ParsedSentence } from '../services/api-client';
import { shouldShowWordMeaning, cleanWord } from '../utils/text-processor';

export interface ArticleReaderOptions {
  onWordClick: (word: string, sentence: string) => void;
  onSentenceLongPress: (sentence: string) => void;
}

export function createArticleReader(
  article: ParsedArticle,
  options: ArticleReaderOptions
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'article-reader';

  // Header
  const header = document.createElement('header');
  header.className = 'article-header';
  header.innerHTML = `
    <h1 class="article-title">${escapeHtml(article.title)}</h1>
    <p class="article-source">${escapeHtml(article.source)}</p>
  `;
  container.appendChild(header);

  // Content
  const content = document.createElement('div');
  content.className = 'article-content';

  article.paragraphs.forEach((paragraph) => {
    const paragraphEl = createParagraph(paragraph, options);
    content.appendChild(paragraphEl);
  });

  container.appendChild(content);

  return container;
}

function createParagraph(
  paragraph: ParsedParagraph,
  options: ArticleReaderOptions
): HTMLElement {
  const paragraphEl = document.createElement('p');
  paragraphEl.className = 'paragraph';

  paragraph.sentences.forEach((sentence) => {
    const sentenceEl = createSentence(sentence, options);
    paragraphEl.appendChild(sentenceEl);
    paragraphEl.appendChild(document.createTextNode(' '));
  });

  return paragraphEl;
}

function createSentence(
  sentence: ParsedSentence,
  options: ArticleReaderOptions
): HTMLElement {
  const sentenceEl = document.createElement('span');
  sentenceEl.className = 'sentence';
  sentenceEl.dataset.text = sentence.text;

  // Create word spans
  const words = sentence.text.split(/\s+/);
  words.forEach((word, index) => {
    const wordEl = document.createElement('span');
    wordEl.className = 'word';
    wordEl.textContent = word;

    if (shouldShowWordMeaning(word)) {
      wordEl.classList.add('clickable');
      wordEl.addEventListener('click', (e) => {
        e.stopPropagation();
        options.onWordClick(cleanWord(word), sentence.text);
      });
    }

    sentenceEl.appendChild(wordEl);
    if (index < words.length - 1) {
      sentenceEl.appendChild(document.createTextNode(' '));
    }
  });

  // Long press handling for sentence translation
  let longPressTimer: ReturnType<typeof setTimeout> | null = null;

  sentenceEl.addEventListener('touchstart', () => {
    longPressTimer = setTimeout(() => {
      options.onSentenceLongPress(sentence.text);
    }, 500);
  });

  sentenceEl.addEventListener('touchend', () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  });

  sentenceEl.addEventListener('touchmove', () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  });

  return sentenceEl;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
