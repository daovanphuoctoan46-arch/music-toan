export class PerformanceMonitor {
  constructor() {
    this.fps = 60;
    this.frames = 0;
    this.lastTime = performance.now();
    this.qualityLevel = 1.0; 
    this.onQualityChange = null;
    this.stableFrames = 0;
  }

  update() {
    this.frames++;
    const now = performance.now();
    const delta = now - this.lastTime;

    if (delta >= 1000) {
      this.fps = (this.frames * 1000) / delta;
      this.frames = 0;
      this.lastTime = now;

      this.checkPerformance();
    }
  }

  checkPerformance() {
    // Aggressive downscale if FPS is very low
    if (this.fps < 30) {
      this.qualityLevel = Math.max(0.2, this.qualityLevel - 0.2);
      this.stableFrames = 0;
      console.warn(`Critical performance drop: FPS ${this.fps.toFixed(1)}. Quality: ${this.qualityLevel.toFixed(1)}`);
      if (this.onQualityChange) this.onQualityChange(this.qualityLevel);
    } else if (this.fps < 48) {
      this.qualityLevel = Math.max(0.4, this.qualityLevel - 0.05);
      this.stableFrames = 0;
      console.warn(`Performance drop: FPS ${this.fps.toFixed(1)}. Quality: ${this.qualityLevel.toFixed(1)}`);
      if (this.onQualityChange) this.onQualityChange(this.qualityLevel);
    } else if (this.fps > 58) {
      this.stableFrames++;
      // Require 5 consecutive seconds of high FPS to recover quality
      if (this.stableFrames > 5 && this.qualityLevel < 1.0) {
        this.qualityLevel = Math.min(1.0, this.qualityLevel + 0.05);
        this.stableFrames = 0;
        console.log(`Performance recovered: FPS ${this.fps.toFixed(1)}. Quality: ${this.qualityLevel.toFixed(1)}`);
        if (this.onQualityChange) this.onQualityChange(this.qualityLevel);
      }
    } else {
      this.stableFrames = 0;
    }
  }

  reset() {
    this.qualityLevel = 1.0;
    this.stableFrames = 0;
    this.fps = 60;
  }

  getQuality() {
    return this.qualityLevel;
  }
}

export const performanceMonitor = new PerformanceMonitor();
