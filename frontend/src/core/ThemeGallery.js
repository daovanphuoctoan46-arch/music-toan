export class ThemeGallery {
  constructor(themeManager) {
    this.themeManager = themeManager;
    this.container = document.createElement('div');
    this.container.id = 'theme-gallery-container';
    document.body.appendChild(this.container);
    this.render();
    this.initEvents();
  }

  render() {
    this.container.innerHTML = `
      <button id="open-gallery-btn" class="floating-btn">🎨</button>
      <div id="theme-gallery-overlay" class="overlay" style="display: none;">
        <div class="gallery-modal">
          <button class="close-btn">&times;</button>
          <h2>Choose Theme</h2>
          <div id="gallery-grid" class="gallery-grid">
            <!-- Theme cards will be injected here -->
          </div>
        </div>
      </div>
    `;
    this.overlay = this.container.querySelector('#theme-gallery-overlay');
    this.grid = this.container.querySelector('#gallery-grid');
    this.openBtn = this.container.querySelector('#open-gallery-btn');
    this.closeBtn = this.container.querySelector('.close-btn');
  }

  initEvents() {
    this._openHandler = () => this.open();
    this._closeHandler = () => this.close();
    this._overlayHandler = (e) => {
      if (e.target === this.overlay) this.close();
    };
    this._keydownHandler = (e) => {
      if (e.key === 'Escape') this.close();
    };

    this.openBtn.addEventListener('click', this._openHandler);
    this.closeBtn.addEventListener('click', this._closeHandler);
    this.overlay.addEventListener('click', this._overlayHandler);
    window.addEventListener('keydown', this._keydownHandler);
    
    // Bug #99 fix: restore selection once during init
    setTimeout(() => this.restoreSelection(), 100);
  }

  open() {
    this.renderCards();
    this.overlay.style.display = 'flex';
  }

  close() {
    this.overlay.style.display = 'none';
  }

  renderCards() {
    this.grid.innerHTML = '';
    this.themeManager.themes.forEach((ThemeClass, id) => {
      const card = document.createElement('div');
      card.className = `theme-card ${this.themeManager.currentThemeId === id ? 'active' : ''}`;
      card.innerHTML = `
        <div class="card-preview" style="background: #222;"></div>
        <div class="card-info">
          <h3>${id}</h3>
          <button class="select-btn">Select</button>
        </div>
      `;
      card.querySelector('.select-btn').addEventListener('click', () => {
        this.themeManager.switch(id);
        try {
          localStorage.setItem('selectedTheme', id);
        } catch (e) {
          console.warn('ThemeGallery: LocalStorage quota exceeded', e);
        }
        this.close();
      });
      this.grid.appendChild(card);
    });
  }

  restoreSelection() {
    const saved = localStorage.getItem('selectedTheme');
    if (saved && this.themeManager.themes.has(saved)) {
      this.themeManager.switch(saved);
    }
  }

  destroy() {
    this.openBtn.removeEventListener('click', this._openHandler);
    this.closeBtn.removeEventListener('click', this._closeHandler);
    this.overlay.removeEventListener('click', this._overlayHandler);
    window.removeEventListener('keydown', this._keydownHandler);
    this.container.remove();
  }
}
