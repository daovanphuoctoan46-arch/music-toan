/**
 * @interface ThemeContract
 * Interface chuẩn cho mọi theme trong Cosmic Aura Player.
 * Mọi theme mới phải thừa kế từ class BaseTheme.
 */
export class BaseTheme {
  /**
   * Khởi tạo theme, tạo các phần tử DOM, canvas và bắt đầu renderer.
   * @param {HTMLElement} container - DOM element chứa theme.
   */
  async mount(container) {
    throw new Error('Method "mount" must be implemented');
  }

  /**
   * Được gọi khi PaletteEngine trích xuất màu mới.
   * @param {Object} palette - {base, accent, bgGlow, text}.
   */
  onPaletteChange(palette) {
    // Optional: override to handle color changes
  }

  /**
   * Dọn dẹp tài nguyên khi theme bị hủy (ví dụ: switch theme).
   * Phải xóa bỏ canvas, stop animation, gỡ bỏ sự kiện...
   */
  destroy() {
    throw new Error('Method "destroy" must be implemented');
  }
}
