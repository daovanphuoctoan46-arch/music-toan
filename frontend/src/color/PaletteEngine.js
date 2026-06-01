import ColorThief from 'colorthief';
import gsap from 'gsap';

export class PaletteEngine {
  constructor() {
    this.colorThief = new ColorThief();
    this.currentPalette = {
      base: '#00f2ff',
      accent: '#ff00ff',
      bgGlow: 'rgba(0, 242, 255, 0.4)',
      text: '#ffffff'
    };
    this._applyTween = null;
  }

  async extractPalette(coverUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      const cleanup = () => {
        img.onload = null;
        img.onerror = null;
        img.src = '';
      };

      img.onload = () => {
        try {
          const rgbPalette = this.colorThief.getPalette(img, 5);
          if (!rgbPalette || rgbPalette.length === 0) {
            throw new Error('Empty palette returned');
          }
          const normalized = this.normalizePalette(rgbPalette);
          resolve(normalized);
        } catch (err) {
          console.error('PaletteEngine: Failed to extract palette', err);
          resolve(this.currentPalette);
        } finally {
          cleanup();
        }
      };
      img.onerror = () => {
        console.error(`PaletteEngine: Failed to load cover image: ${coverUrl}`);
        resolve(this.currentPalette);
        cleanup();
      };
      img.src = coverUrl;
    });
  }

  normalizePalette(rgbPalette) {
    if (!rgbPalette || rgbPalette.length === 0) return this.currentPalette;

    const topColors = rgbPalette.slice(0, 5).map(c => this.rgbToOklch(c[0], c[1], c[2]));
    
    // Normalize colors as per PRD C-02
    const normalized = topColors.map(color => {
      return {
        l: Math.max(0.45, Math.min(0.65, color.l)), // Lightness [0.45, 0.65]
        c: Math.max(0.08, Math.min(0.20, color.c)), // Chroma [0.08, 0.20]
        h: color.h
      };
    });

    const base = normalized[0];
    const accent = normalized[1] || { ...base, h: (base.h + 30) % 360 };

    return {
      base: `oklch(${base.l.toFixed(3)} ${base.c.toFixed(3)} ${base.h.toFixed(1)})`,
      accent: `oklch(${accent.l.toFixed(3)} ${accent.c.toFixed(3)} ${accent.h.toFixed(1)})`,
      bgGlow: `oklch(${(base.l * 0.6).toFixed(3)} ${base.c.toFixed(3)} ${base.h.toFixed(1)} / 0.4)`,
      text: `oklch(0.95 0.02 ${base.h.toFixed(1)})`
    };
  }

  // Simplified RGB to OKLCH math with clamping (Bug #15)
  rgbToOklch(r, g, b) {
    r = Math.max(0, Math.min(255, r)) / 255;
    g = Math.max(0, Math.min(255, g)) / 255;
    b = Math.max(0, Math.min(255, b)) / 255;
    
    // RGB to Linear
    const lr = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    const lg = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    const lb = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    // Linear to LMS
    const l = 0.4122214708 * lr + 0.5363320363 * lg + 0.0514459929 * lb;
    const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073970037 * lb;
    const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

    const l_ = Math.cbrt(l);
    const m_ = Math.cbrt(m);
    const s_ = Math.cbrt(s);

    // LMS to OKLAB
    const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720403 * s_;
    const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
    const b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

    // OKLAB to OKLCH
    const C = Math.sqrt(a * a + b_ * b_);
    const h = (Math.atan2(b_, a) * 180) / Math.PI;

    return { l: L, c: C, h: h < 0 ? h + 360 : h };
  }

  applyPalette(palette, duration = 0.8) {
    const root = document.documentElement;
    
    if (this._applyTween) this._applyTween.kill();

    this._applyTween = gsap.to(root, {
      '--color-base': palette.base,
      '--color-accent': palette.accent,
      '--color-glow': palette.bgGlow,
      duration: duration,
      ease: 'power2.inOut',
      onComplete: () => { this._applyTween = null; }
    });

    this.currentPalette = palette;
  }
}

export const paletteEngine = new PaletteEngine();
