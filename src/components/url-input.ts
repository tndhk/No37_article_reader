export interface UrlInputOptions {
  onSubmit: (url: string) => void;
}

export function createUrlInput(options: UrlInputOptions): HTMLElement {
  const container = document.createElement('div');
  container.className = 'url-input-container';

  container.innerHTML = `
    <div class="app-branding">
      <h1 class="app-title">English News Reader</h1>
      <p class="app-tagline">Immersive reading for language learners</p>
    </div>
    <form class="url-form">
      <input
        type="url"
        class="url-input"
        placeholder="Paste an English news article URL..."
        required
        autocomplete="off"
        spellcheck="false"
      />
      <button type="submit" class="submit-btn"><span>Read</span></button>
    </form>
    <p class="url-hint">BBC News, CNN, The Guardian, and more</p>
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
