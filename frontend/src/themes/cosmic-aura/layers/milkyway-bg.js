/**
 * milkyway-bg.js
 * High-fidelity, organic 'Galactic River' background.
 * Orchestrates sub-modules for easier management.
 */
import { createStars } from './milkyway/Stars.js';
import { createClouds, drawBackground, drawMilkyWay } from './milkyway/Galaxy.js';
import { drawStar } from './milkyway/Stars.js';
import { handleShootingStars } from './milkyway/ShootingStars.js';

export function initMilkyWay() {
  const canvas = document.createElement('canvas');
  canvas.id = 'milkyway-canvas';
  const ctx = canvas.getContext('2d');

  // Canvas Setup
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.zIndex = '-5';
  canvas.style.pointerEvents = 'none';
  canvas.style.opacity = '0';
  canvas.style.transition = 'opacity 2.5s ease-in-out';
  
  document.body.appendChild(canvas);

  requestAnimationFrame(() => {
    canvas.style.opacity = '1';
  });

  let W, H;
  let stars = [];
  let galacticClouds = [];
  let shootingStars = []; // Phục hồi mảng sao băng
  let currentAudioData = null;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    stars = createStars(W, H);
  }

  function draw(time) {
    if (document.hidden) { requestAnimationFrame(draw); return; }
    
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 1.0; 
    
    drawBackground(ctx, W, H);
    
    // Đã loại bỏ drawMilkyWay theo yêu cầu
    
    // Pass currentAudioData to drawStar
    stars.forEach(s => drawStar(ctx, s, time, currentAudioData));
    handleShootingStars(ctx, shootingStars, W, H, time);
    
    requestAnimationFrame(draw);
  }

  let resizeTimeout;
  const onResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 250);
  };

  window.addEventListener('resize', onResize);

  resize();
  requestAnimationFrame(draw);

  return {
    update: (audioData) => {
      currentAudioData = audioData;
    },
    resize: () => {
      resize();
    },
    destroy: () => {
      window.removeEventListener('resize', onResize);
      if (canvas.parentElement) canvas.remove();
    }
  };
}
