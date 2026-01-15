export interface UrlInputOptions {
  onSubmit: (url: string) => void;
}

export function createUrlInput(options: UrlInputOptions): HTMLElement {
  const container = document.createElement('div');
  container.className = 'url-input-container';

  container.innerHTML = `
    <form class="url-form">
      <input
        type="url"
        class="url-input"
        placeholder="英語ニュース記事のURLを貼り付け"
        required
      />
      <button type="submit" class="submit-btn">読む</button>
    </form>
    <p class="url-hint">例: https://www.bbc.com/news/... や https://edition.cnn.com/...</p>
  `;

  const form = container.querySelector('.url-form') as HTMLFormElement;
  const input = container.querySelector('.url-input') as HTMLInputElement;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = input.value.trim();
    if (url) {
      options.onSubmit(url);
    }
  });

  return container;
}
