import gsap from 'gsap';

export class ThemeManager {
  constructor(container) {
    this.container = container;
    this.themes = new Map();
    this.currentTheme = null;
    this.currentThemeId = null;
    this.isSwitching = false; 
    this._fadeTween = null;
  }

  registerTheme(id, ThemeClass) {
    this.themes.set(id, ThemeClass);
  }

  async mount(themeId) {
    if (!this.themes.has(themeId) || this.isSwitching) return;
    this.isSwitching = true;

    const ThemeClass = this.themes.get(themeId);
    this.currentTheme = new ThemeClass();
    this.currentThemeId = themeId;

    // Inject CSS if it exists
    await this.injectThemeCSS(themeId);

    await this.currentTheme.mount(this.container);

    // Fade in
    if (this._fadeTween) this._fadeTween.kill();
    this._fadeTween = gsap.fromTo(this.container, { opacity: 0 }, { 
      opacity: 1, 
      duration: 0.6,
      onComplete: () => { 
        this.isSwitching = false; 
        this._fadeTween = null;
      }
    });
  }

  async switch(themeId) {
    if (this.currentThemeId === themeId || this.isSwitching) return;
    this.isSwitching = true;

    const canvas = document.getElementById('pixi-canvas');
    if (canvas) {
      if (this._fadeTween) this._fadeTween.kill();
      this._fadeTween = gsap.to(canvas, { opacity: 0, duration: 0.3 });
      await this._fadeTween;
    }

    // Cleanup current theme
    if (this.currentTheme) {
      this.currentTheme.destroy();
      this.removeThemeCSS(this.currentThemeId);
    }

    // Mount new theme
    await this.mount(themeId);

    // Fade in new theme 
    if (canvas) {
      if (this._fadeTween) this._fadeTween.kill();
      this._fadeTween = gsap.to(canvas, { 
        opacity: 1, 
        duration: 0.3,
        onComplete: () => { this._fadeTween = null; }
      });
    }

    this.isSwitching = false;
  }

  injectThemeCSS(themeId) {
    return new Promise((resolve) => {
      const linkId = `theme-css-${themeId}`;
      if (document.getElementById(linkId)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      const cssUrl = new URL(`../themes/${themeId}/layout.css`, import.meta.url).href;
      link.href = cssUrl;
      
      link.onload = () => resolve();
      link.onerror = () => {
        console.warn(`ThemeManager: CSS not found for theme ${themeId}. Falling back to default styling.`);
        resolve();
      };
      document.head.appendChild(link);
    });
  }

  removeThemeCSS(themeId) {
    const link = document.getElementById(`theme-css-${themeId}`);
    if (link) link.remove();
  }

  getCurrent() {
    return this.currentTheme;
  }

  destroy() {
    if (this._fadeTween) this._fadeTween.kill();
    if (this.currentTheme) {
      this.currentTheme.destroy();
      this.removeThemeCSS(this.currentThemeId);
    }
  }
}
