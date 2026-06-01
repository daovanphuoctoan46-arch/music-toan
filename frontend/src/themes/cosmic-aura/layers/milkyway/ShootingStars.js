/**
 * ShootingStars.js
 * Logic for spawning and drawing shooting stars with organic trajectories.
 */

export function handleShootingStars(ctx, shootingStars, W, H, now) {
  // Spawn logic
  if (shootingStars.length < 3 && Math.random() < 0.02) {
     const capacity = 3 - shootingStars.length;
     const burstCount = Math.floor(Math.random() * capacity) + 1; 
     for (let k = 0; k < burstCount; k++) {
       const angle = (20 + Math.random() * 50) * Math.PI / 180; 
       const speed = 0.4 + Math.random() * 0.5; // Tốc độ bay chậm mượt
       shootingStars.push({
         startX: (0.05 + Math.random() * 0.9) * W,
         startY: -50,
         vx: Math.cos(angle) * speed,
         vy: Math.sin(angle) * speed,
         ax: 0, 
         ay: 0, 
         thickness: 2.5 + Math.random() * 2.5, // Tăng kích thước tổng thể (2.5 - 5.0)
         startTime: now + (k * 800),
         tailLen: (150 + Math.random() * 200) // Đuôi vẫn giữ độ dài ngẫu nhiên
       });
     }
  }

  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const ss = shootingStars[i];
    const elapsed = now - ss.startTime;
    if (elapsed < 0) continue;

    const x = ss.startX + ss.vx * (elapsed / 16);
    const y = ss.startY + ss.vy * (elapsed / 16);

    // Kiểm tra ranh giới
    const padding = ss.tailLen + 150;
    if (x < -padding || x > W + padding || y < -padding || y > H + padding) {
      shootingStars.splice(i, 1);
      continue;
    }
    
    const moveAngle = Math.atan2(ss.vy, ss.vx);
    
    ctx.save();
    ctx.globalAlpha = 1.0; 
    
    const dx = Math.cos(moveAngle);
    const dy = Math.sin(moveAngle);
    const op = 1.0; 
    
    // Đuôi sao băng
    const tailEndX = x - dx * ss.tailLen;
    const tailEndY = y - dy * ss.tailLen;
    const gradient = ctx.createLinearGradient(x, y, tailEndX, tailEndY);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${op})`);
    gradient.addColorStop(0.2, `rgba(255, 255, 255, ${op * 0.85})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = ss.thickness;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(tailEndX, tailEndY);
    ctx.stroke();

    // Đầu sao băng: Dấu cộng (+) xoay mờ gọn
    ctx.save();
    ctx.translate(x, y);
    
    // Tâm sáng mờ ảo
    const headRadius = ss.thickness * 2.5;
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, headRadius);
    g.addColorStop(0, 'rgba(255, 255, 255, 0.6)'); 
    g.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, headRadius, 0, Math.PI * 2); ctx.fill();

    // Vẽ dấu cộng (+) xoay với các cánh được THU NGẮN lại
    const rotation = now * 0.0025; 
    ctx.rotate(rotation);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; 
    ctx.lineWidth = ss.thickness / 2.5; 
    const flareLen = ss.thickness * 2.5; // Thu ngắn cánh dấu cộng lại rất gọn
    
    ctx.beginPath();
    ctx.moveTo(-flareLen, 0); ctx.lineTo(flareLen, 0); 
    ctx.moveTo(0, -flareLen); ctx.lineTo(0, flareLen); 
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  }
}
