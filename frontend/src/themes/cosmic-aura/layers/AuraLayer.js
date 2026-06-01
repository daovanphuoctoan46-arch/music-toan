import * as PIXI from 'pixi.js';

export class AuraLayer {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.aura = new PIXI.Graphics();
    this.tint = 0x00f2ff;
  }

  mount() {
    // Lớp Aura cũng được vô hiệu hóa visual để tránh vòng tròn mờ che khuất thiên hà
    this.app.stage.addChild(this.container);
  }

  update(audioData, centerX, centerY) {
    // Giữ tĩnh tuyệt đối
  }

  onBeat() {
    // Không phản ứng beat
  }

  resize(centerX, centerY) {}

  setColors(palette) {
    if (palette.base) {
      this.tint = this.cssColorToHex(palette.base);
    }
  }

  cssColorToHex(cssColor) {
    if (cssColor.startsWith('oklch')) {
      const match = cssColor.match(/oklch\(.*?\s+.*?\s+(.*?)\)/);
      if (match) return this.hsvToHex(parseFloat(match[1]), 0.7, 0.9);
    }
    return 0x00f2ff;
  }

  hsvToHex(h, s, v) {
    const normalizedH = ((h % 360) + 360) % 360;
    let r, g, b;
    const i = Math.floor(normalizedH / 60), f = normalizedH / 60 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0: r = v, g = t, b = p; break;
      case 1: r = q, g = v, b = p; break;
      case 2: r = p, g = v, b = t; break;
      case 3: r = p, g = q, b = v; break;
      case 4: r = t, g = p, b = v; break;
      case 5: r = v, g = p, b = q; break;
    }
    const toHex = (c) => Math.round(c * 255).toString(16).padStart(2, '0');
    return parseInt(`0x${toHex(r)}${toHex(g)}${toHex(b)}`, 16);
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
