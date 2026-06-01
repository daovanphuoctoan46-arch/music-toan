/**
 * Galaxy.js
 * Logic for initializing and drawing the Milky Way background and clouds.
 */
import { getAxisX, getBulgeFactor } from './GalaxyUtils.js';

export function createClouds(W, H) {
  const galacticClouds = [];
  const baseHue = 250; 
  
  const clusterCount = 18; 
  for (let i = 0; i < clusterCount; i++) {
    const t = Math.random();
    const bf = getBulgeFactor(t);
    const cx = getAxisX(t * H, W, H);
    const cy = t * H;
    
    for (let j = 0; j < 4; j++) {
      galacticClouds.push({
        x: cx + (Math.random() - 0.5) * W * 0.2 * bf,
        y: cy + (Math.random() - 0.5) * H * 0.1,
        rx: W * (0.04 + Math.random() * 0.08) * bf,
        ry: W * (0.03 + Math.random() * 0.06) * bf,
        hue: baseHue + (Math.random() - 0.5) * 50, 
        opacity: 0.02 + Math.random() * 0.04,
        rot: Math.random() * Math.PI
      });
    }
  }
  return galacticClouds;
}

export function drawBackground(ctx, W, H) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#000005');
  grad.addColorStop(0.25, '#010210');
  grad.addColorStop(0.55, '#030118');
  grad.addColorStop(0.80, '#050215');
  grad.addColorStop(1, '#080010');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

export function drawMilkyWay(ctx, galacticClouds, W, H) {
  const baseHue = 250; 
  const steps = 140; 

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const bf = getBulgeFactor(t);
    const cx = getAxisX(t * H, W, H);
    const cy = t * H;
    const r = W * 0.15 * bf;
    
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `hsla(${baseHue + 20}, 80%, 35%, 0.015)`);
    g.addColorStop(0.5, `hsla(${baseHue + 20}, 70%, 25%, 0.005)`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  }

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const bf = getBulgeFactor(t);
    const cx = getAxisX(t * H, W, H);
    const cy = t * H;
    const r = W * 0.08 * bf;
    
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `hsla(${baseHue}, 90%, 65%, 0.035)`);
    g.addColorStop(0.7, `hsla(${baseHue - 15}, 80%, 50%, 0.005)`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  }

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const bf = getBulgeFactor(t);
    const cx = getAxisX(t * H, W, H);
    const cy = t * H;
    const r = W * 0.035 * bf;
    
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    const coreL = 92 + (bf - 1.0) * 8;
    g.addColorStop(0, `hsla(${baseHue + 25}, 100%, ${coreL}%, 0.05)`);
    g.addColorStop(0.3, `hsla(${baseHue + 25}, 90%, 80%, 0.05)`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  }

  galacticClouds.forEach(c => {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    ctx.scale(1, c.ry / c.rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, c.rx * 0.5);
    g.addColorStop(0, `hsla(${c.hue}, 90%, 75%, ${c.opacity})`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, c.rx * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });

  const maskRadius = Math.max(W * 0.5, H * 0.7);
  const mGrad = ctx.createRadialGradient(W, H, 0, W, H, maskRadius);
  mGrad.addColorStop(0, 'rgba(10, 0, 20, 0.4)');
  mGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = mGrad;
  ctx.fillRect(W - maskRadius, H - maskRadius, maskRadius, maskRadius);
}
