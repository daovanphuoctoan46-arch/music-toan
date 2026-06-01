# Cosmic Aura Player 🌌

Cosmic Aura Player là một trình nghe nhạc web-based chạy hoàn toàn trên trình duyệt, không cần backend. Người dùng kéo thả file MP3 từ máy tính vào, ứng dụng tự động đọc metadata, trích xuất màu từ ảnh bìa và hiển thị các hiệu ứng hình ảnh phản ứng real-time theo âm nhạc.

![Cosmic Aura Preview](https://via.placeholder.com/1024x768.png?text=Cosmic+Aura+Player+Preview)

## 🚀 Tính năng chính

- **F-01: Drag & Drop File Nhạc**: Kéo thả file MP3/WAV/FLAC để phát nhạc tức thì.
- **F-02: Đọc Metadata (ID3 Tags)**: Tự động trích xuất tên bài, nghệ sĩ và ảnh bìa.
- **F-03: Audio Engine (Tone.js)**: Xử lý âm thanh chất lượng cao, hỗ trợ seek, volume và loop.
- **F-04: Beat Detection**: Phát hiện nhịp điệu chính xác để đồng bộ hóa hiệu ứng hình ảnh.
- **F-05: Real-time Feature Extraction**: Trích xuất dữ liệu RMS, Spectral Centroid, Chroma và Energy ở 60fps.
- **Theme System**: Hệ thống theme linh hoạt, dễ dàng thay đổi giao diện và tạo theme mới.

## 🛠️ Tech Stack

| Hạng mục | Công cụ | Phiên bản |
|---|---|---|
| Build tool | **Vite** | ^6.0.0 |
| Audio engine | **Tone.js** | ^15.1.22 |
| Renderer | **PixiJS** | ^8.18.1 |
| Animation | **GSAP** | ^3.15.0 |
| Audio Features | **Meyda** | ^5.6.3 |
| Beat Detection | **web-audio-beat-detector** | ^8.2.36 |
| Metadata | **jsmediatags** | ^3.9.7 |
| Worker | **Comlink** | ^4.4.2 |

## 📦 Cài đặt

Yêu cầu hệ thống: **Node.js 18+** và trình duyệt hiện đại hỗ trợ Web Audio API.

1. Clone repository:
   ```bash
   git clone https://github.com/your-repo/cosmic-aura-player.git
   cd cosmic-aura-player
   ```

2. Cài đặt dependency:
   ```bash
   npm install
   ```

3. Chạy môi trường development:
   ```bash
   npm run dev
   ```

4. Build sản phẩm:
   ```bash
   npm run build
   ```

## 🎮 Cách sử dụng

1. Mở ứng dụng trong trình duyệt.
2. Kéo và thả file nhạc (.mp3, .wav, .flac) vào vùng chỉ định.
3. Sử dụng các nút điều khiển phía dưới để Play/Pause, chuyển bài hoặc chỉnh âm lượng.
4. Click vào icon theme ở góc màn hình để mở **Theme Gallery** và thay đổi giao diện.

## 🎨 Tạo Theme mới

Bạn có thể tự tạo theme cho riêng mình chỉ trong 6 bước đơn giản. Xem hướng dẫn chi tiết tại: [src/themes/_template/README.md](./src/themes/_template/README.md)

## 📈 Hiệu năng & Hỗ trợ

- **FPS**: Mục tiêu ổn định 60fps trên các GPU tầm trung.
- **Memory**: Tối ưu hóa bộ nhớ, không gây leak khi chạy lâu dài.
- **Trình duyệt hỗ trợ**: Chrome 100+, Firefox 100+, Safari 16+, Edge 100+.

## 📄 License

Dự án này được phát hành dưới bản quyền **MIT**.

---
*Created with ❤️ by Gemini CLI*
