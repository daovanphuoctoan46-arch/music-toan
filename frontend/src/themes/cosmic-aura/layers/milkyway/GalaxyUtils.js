/**
 * GalaxyUtils.js
 * Shared utility functions for galaxy geometry.
 */

export function getAxisX(py, W, H) {
  const t = py / H;
  // Sử dụng Bezier bậc 3 để uốn lượn mượt mà hơn (từ galaxy.html)
  // P0 (trên), P1, P2, P3 (dưới)
  const p0x = 0.8; 
  const p1x = 0.8; // Đẩy điểm uốn P1 ra phải và cao hơn để tạo cung uốn đẹp ở trên
  const p2x = 0.2; 
  const p3x = 0.2; 

  const u = 1 - t;
  const x = (u*u*u*p0x + 3*u*u*t*p1x + 3*u*t*t*p2x + t*t*t*p3x) * W;
  return x;
}

/**
 * Tính toán độ phình/độ sáng không đều dọc theo dải thiên hà
 * Tạo ra 1-2 điểm nhấn chính (Galactic Bulges)
 */
export function getBulgeFactor(t) {
  // Giảm mạnh cường độ phình để đạt độ rộng đồng nhất (To Đều)
  // Chỉ giữ lại một chút biến thiên để dải mây không bị "đơ"
  const bulge1 = Math.exp(-Math.pow(t - 0.38, 2) / 0.015) * 0.25;
  const bulge2 = Math.exp(-Math.pow(t - 0.72, 2) / 0.02) * 0.15;
  
  // Tổng độ chênh lệch chỉ còn khoảng 25-40% thay vì 120-220% như trước
  return (1.0 + bulge1 + bulge2);
}
