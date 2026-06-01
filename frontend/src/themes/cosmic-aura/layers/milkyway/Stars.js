/**
 * Stars.js
 * Logic for initializing and drawing individual stars.
 */

export function createStars(W, H) {
  const stars = [];
  const starCount = 1300; 
  const bandColors = ['#e8f4ff', '#ffffff', '#d0e0ff', '#fff9e8', '#f8e8ff', '#ffd0f8'];

  for (let i = 0; i < starCount; i++) {
    const px = Math.random() * W;
    const py = Math.random() * H;
    
    let star = { x: px, y: py };
    const rand = Math.random();
    
    if (rand < 0.65) {
      star.r = 0.6 + Math.random() * 0.4;
      star.opacity = 0.2 + Math.random() * 0.3;
    } else if (rand < 0.92) {
      star.r = 0.9 + Math.random() * 0.7;
      star.opacity = 0.3 + Math.random() * 0.4;
    } else {
      star.r = 1.5 + Math.random() * 2.0;
      star.opacity = 0.4 + Math.random() * 0.4;
    }
    
    star.color = bandColors[Math.floor(Math.random() * bandColors.length)];
    // Tăng tốc độ nhấp nháy gốc lên một chút (từ 0.0012-0.0028 lên 0.0025-0.0055)
    star.twinkleSpeed = 0.0025 + Math.random() * 0.003; 
    star.phase = Math.random() * Math.PI * 2;
    star.twinkles = true;
    
    stars.push(star);
  }

  const candidates = stars.filter(s => s.r > 1.2); 
  // Giảm số lượng sao chữ thập xuống còn 120
  for (let i = 0; i < 120 && candidates.length > 0; i++) {
    const idx = Math.floor(Math.random() * candidates.length);
    candidates[idx].sparkle = true;
    // Tốc độ lấp lánh của sao chữ thập cũng tăng nhẹ để đồng bộ
    candidates[idx].twinkleSpeed = 0.0012 + Math.random() * 0.0015;
    candidates.splice(idx, 1);
  }
  return stars;
}

export function drawStar(ctx, s, time, audioData) {
  ctx.save();
  let opacity = s.opacity;

  if (s.twinkles) {
    const factor = 0.7 + 0.3 * Math.sin(time * s.twinkleSpeed + s.phase);
    opacity *= factor;
  }
  ctx.globalAlpha = Math.min(1, opacity);
  ctx.fillStyle = s.color;
  
  if (s.sparkle) {
    // Hiệu ứng lấp lánh (Sparkle) tĩnh: KHÔNG xoay, KHÔNG phập phồng kích thước
    const pulse = 1.0; 

    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 6 * pulse);
    g.addColorStop(0, `rgba(225, 245, 255, ${opacity * 0.5})`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 6 * pulse, 0, Math.PI * 2); ctx.fill();

    ctx.save();
    ctx.translate(s.x, s.y);
    // Đã xóa ctx.rotate theo yêu cầu - Ngôi sao chữ thập sẽ đứng yên
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = opacity * 0.8;
    const len = s.r * 5 * pulse;
    ctx.beginPath();
    ctx.moveTo(-len, 0); ctx.lineTo(len, 0);
    ctx.moveTo(0, -len); ctx.lineTo(0, len);
    ctx.stroke();
    ctx.restore();
    
    ctx.fillStyle = s.color;
    ctx.globalAlpha = opacity;
  }

  ctx.beginPath();
  ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
