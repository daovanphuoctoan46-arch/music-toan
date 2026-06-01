import { BaseTheme } from '../../core/ThemeContract.js';

/**
 * @class TemplateTheme
 * Boilerplate theme class. Copy this folder to start a new theme.
 */
export default class TemplateTheme extends BaseTheme {
  constructor() {
    super();
    this.container = null;
    this.el = null;
  }

  /**
   * Mount the theme to the DOM.
   * @param {HTMLElement} container 
   */
  async mount(container) {
    this.container = container;
    
    // Create your DOM elements or initialize your renderer (PixiJS, Three.js, etc.)
    this.el = document.createElement('div');
    this.el.className = 'template-theme-root';
    this.el.innerHTML = '<h2>New Theme Template</h2>';
    
    this.container.appendChild(this.el);
    
    console.log('Template Theme mounted');
  }

  /**
   * Handle real-time audio data (60fps).
   * @param {Object} audioData {fft, rms, spectralCentroid, chroma, energy}
   */
  onAudioFrame(audioData) {
    // console.log('Audio Data:', audioData.rms);
    // Update your visuals here
  }

  /**
   * Handle beat event.
   */
  onBeat() {
    console.log('Beat detected in Template Theme!');
    // Trigger animations or effects
  }

  /**
   * Handle palette change from album art.
   * @param {Object} palette {base, accent, bgGlow, text}
   */
  onPaletteChange(palette) {
    console.log('Palette changed:', palette);
    // Update theme colors
  }

  /**
   * Cleanup resources.
   */
  destroy() {
    if (this.el) {
      this.el.remove();
    }
    console.log('Template Theme destroyed');
  }
}
