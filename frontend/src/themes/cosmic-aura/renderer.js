import { BackgroundLayer } from './layers/BackgroundLayer.js';
import { performanceMonitor } from '../../core/PerformanceMonitor.js';

export class CosmicAuraRenderer {
  constructor() {
    this.layers = {
      background: null
    };
  }

  async init(container) {
    this.initLayers();
    this._tickerHandler = (time) => this.update(time);
    this._requestAnimationFrame();
  }

  initLayers() {
    this.layers.background = new BackgroundLayer();
    this.layers.background.mount();
  }

  _requestAnimationFrame() {
    const loop = (time) => {
      this.update(time);
      this._rafId = requestAnimationFrame(loop);
    };
    this._rafId = requestAnimationFrame(loop);
  }

  getVisualCenter() {
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }

  update(time) {
    performanceMonitor.update();
    if (this.layers.background) {
      this.layers.background.update();
    }
  }

  onPaletteChange(palette) {
    if (this.layers.background) this.layers.background.setColors(palette);
  }

  resize() {
    if (this.layers.background) this.layers.background.resize();
  }

  destroy() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    if (this.layers.background) this.layers.background.destroy();
  }
}
