import { WordMeaning } from '../services/api-client';

export interface BottomPanelState {
  type: 'hidden' | 'word' | 'translation' | 'loading' | 'error';
  word?: string;
  meaning?: WordMeaning;
  translation?: string;
  error?: string;
}

export function createBottomPanel(): {
  element: HTMLElement;
  update: (state: BottomPanelState) => void;
} {
  const container = document.createElement('div');
  container.className = 'bottom-panel';
  container.innerHTML = `<div class="panel-content"></div>`;

  const contentEl = container.querySelector('.panel-content') as HTMLElement;

  function update(state: BottomPanelState): void {
    container.classList.toggle('visible', state.type !== 'hidden');

    switch (state.type) {
      case 'hidden':
        contentEl.innerHTML = '';
        break;

      case 'loading':
        contentEl.innerHTML = `<div class="loading">読み込み中...</div>`;
        break;

      case 'error':
        contentEl.innerHTML = `<div class="error">${escapeHtml(state.error || 'エラーが発生しました')}</div>`;
        break;

      case 'word':
        if (state.meaning) {
          contentEl.innerHTML = `
            <div class="word-meaning">
              <div class="word-header">
                <span class="word-text">${escapeHtml(state.word || '')}</span>
                <span class="word-pos">${escapeHtml(state.meaning.pos)}</span>
              </div>
              <div class="word-definition">${escapeHtml(state.meaning.meaning)}</div>
              <div class="word-example">${escapeHtml(state.meaning.example)}</div>
            </div>
          `;
        }
        break;

      case 'translation':
        contentEl.innerHTML = `
          <div class="translation">
            <div class="translation-text">${escapeHtml(state.translation || '')}</div>
          </div>
        `;
        break;
    }
  }

  // Close on tap outside
  container.addEventListener('click', (e) => {
    if (e.target === container) {
      update({ type: 'hidden' });
    }
  });

  return { element: container, update };
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
