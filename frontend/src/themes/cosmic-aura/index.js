import { BaseTheme } from '../../core/ThemeContract.js';
import { CosmicAuraRenderer } from './renderer.js';

export default class CosmicAuraTheme extends BaseTheme {
  constructor() {
    super();
    this.renderer = new CosmicAuraRenderer();
  }

  async mount(container) {
    await this.renderer.init(container);
    this._resizeHandler = this.handleResize.bind(this);
    window.addEventListener('resize', this._resizeHandler);
  }

  handleResize() {
    this.renderer.resize();
  }

  destroy() {
    window.removeEventListener('resize', this._resizeHandler);
    this.renderer.destroy();
  }
}
