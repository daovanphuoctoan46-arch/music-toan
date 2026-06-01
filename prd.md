# PRD — Cosmic Aura Player
**Product Requirements Document**
Version 1.1 | Ngày: 20/05/2026

---

## 1. Tổng Quan Sản Phẩm

### 1.1 Mô tả
Cosmic Aura Player là một trình nghe nhạc web-based chạy hoàn toàn trên trình duyệt, không cần backend. Người dùng kéo thả file MP3 từ máy tính vào, ứng dụng tự động đọc metadata, extract màu từ ảnh bìa và hiển thị các hiệu ứng hình ảnh phản ứng real-time theo âm nhạc.

Điểm đặc biệt: ứng dụng có **Theme System** — người dùng chọn giao diện từ một gallery các theme, mỗi theme có thể khác nhau hoàn toàn về layout, hiệu ứng visual lẫn typography. Hệ thống được thiết kế để dễ dàng thêm theme mới trong tương lai.

### 1.2 Mục tiêu
- Tạo trải nghiệm nghe nhạc trực quan, đẹp mắt như một ứng dụng thương mại
- Chạy mượt 60fps trên mọi thiết bị tầm trung trở lên
- Không yêu cầu cài đặt, không cần tài khoản, hoàn toàn offline sau khi build
- Hệ thống theme extensible — thêm theme mới không cần sửa core code

### 1.3 Đối tượng người dùng
Người dùng yêu âm nhạc, quan tâm đến thẩm mỹ, muốn có một trình nghe nhạc cá nhân đẹp và độc đáo — có thể tuỳ chỉnh giao diện theo sở thích.

---

## 2. Tech Stack

| Hạng mục | Công cụ | Version | Lý do chọn |
|---|---|---|---|
| Build tool | **Vite** | 8.0.13 | Dev server nhanh, ESM native, zero config |
| Audio engine | **Tone.js** | 15.1.22 | Abstraction cao hơn Web Audio API thuần, scheduling chính xác |
| Feature extraction | **Meyda** | 5.6.3 | Real-time: RMS, spectral centroid, chroma, energy |
| Beat detection | **web-audio-beat-detector** | 8.2.36 | Thư viện chuyên dụng, chính xác hơn tự implement |
| Metadata (ID3) | **jsmediatags** | 3.9.7 | Đọc tên bài, nghệ sĩ, ảnh bìa nhúng trực tiếp từ File object |
| Màu sắc | **ColorThief** | 3.3.1 | Hỗ trợ OKLCH color space, extract palette chính xác |
| Renderer 2D/WebGL | **PixiJS** | 8.18.1 | WebGL 2, nhanh hơn Canvas 2D 5–10x, object pooling built-in |
| Animation UI | **GSAP** | 3.15.0 | Animation engine chuyên nghiệp, timeline control, ease phong phú |
| Web Workers | **Comlink** | 4.4.2 | FFT analysis off main thread, tránh jank |

---

## 3. Kiến Trúc Hệ Thống

### 3.1 Cấu trúc thư mục

```
cosmic-aura-player/
│
├── index.html
├── vite.config.js
├── package.json
│
├── src/
│   ├── main.js                        # Entry point, khởi động app + ThemeManager
│   │
│   ├── audio/
│   │   ├── AudioEngine.js             # Tone.js: load, decode, play/pause/seek
│   │   ├── FeatureExtractor.js        # Meyda: RMS, spectral centroid, chroma
│   │   ├── BeatDetector.js            # web-audio-beat-detector wrapper + event emitter
│   │   └── MetadataReader.js          # jsmediatags: đọc ID3 từ File object
│   │
│   ├── core/
│   │   ├── ThemeManager.js            # Load/switch theme, quản lý lifecycle
│   │   ├── ThemeContract.js           # Interface chuẩn mọi theme phải implement
│   │   ├── AudioBus.js                # Event bus: phân phát audio data cho theme
│   │   └── ThemeGallery.js            # UI gallery chọn theme (overlay)
│   │
│   ├── themes/
│   │   ├── cosmic-aura/               # Theme mặc định
│   │   │   ├── index.js               # Entry, export class CosmicAuraTheme
│   │   │   ├── manifest.json          # Tên, mô tả, preview thumbnail
│   │   │   ├── renderer.js            # PixiJS setup riêng của theme này
│   │   │   ├── layers/
│   │   │   │   ├── AuraLayer.js
│   │   │   │   ├── VisualizerLayer.js
│   │   │   │   ├── ParticleLayer.js
│   │   │   │   └── BackgroundLayer.js
│   │   │   ├── layout.css             # CSS layout riêng của theme
│   │   │   └── preview.jpg            # Ảnh thumbnail hiển thị trong gallery
│   │   │
│   │   └── _template/                 # Template để tạo theme mới
│   │       ├── index.js               # Boilerplate có comment hướng dẫn
│   │       ├── manifest.json          # Schema mẫu
│   │       └── README.md              # Hướng dẫn tạo theme
│   │
│   ├── color/
│   │   └── PaletteEngine.js           # ColorThief → OKLCH normalize → CSS vars
│   │
│   ├── ui/
│   │   ├── PlayerControls.js          # GSAP: play/pause, progress bar, volume
│   │   ├── TrackInfo.js               # Tên bài, nghệ sĩ, ảnh bìa xoay
│   │   └── FileDropZone.js            # Drag & drop + file picker fallback
│   │
│   ├── workers/
│   │   └── audio.worker.js            # Comlink: FFT nặng off main thread
│   │
│   └── assets/
│       ├── tracks/                    # 3 bài nhạc mẫu royalty-free
│       └── covers/                    # Ảnh bìa mẫu tương ứng
│
└── public/
    └── fonts/                         # Self-hosted fonts
```

### 3.2 Luồng dữ liệu

```
[User kéo file MP3]
        │
        ▼
[MetadataReader] ──► tên bài, nghệ sĩ, album art
        │
        ▼
[PaletteEngine] ──► OKLCH palette ──► CSS custom properties
        │                                      │
        │                              [GSAP animate màu toàn trang]
        ▼
[AudioEngine / Tone.js] ──► AudioBuffer
        │
        ├──► [Comlink Worker] ──► FFT array (mỗi frame)
        │
        ├──► [FeatureExtractor / Meyda] ──► RMS, spectral, chroma
        │
        └──► [BeatDetector] ──► beat events
                    │
                    ▼
             [AudioBus] ──── phân phát audio data ────►
                    │                                  │
                    ▼                                  ▼
           [ThemeManager]                    [PlayerControls / UI]
                    │
                    ▼
        [Theme đang active (vd: CosmicAura)]
         ┌──────────────────────────────┐
         │  layout.css (mount/unmount)  │
         │  renderer.js (PixiJS riêng)  │
         │  ┌──────────────────────┐    │
         │  │  BackgroundLayer     │◄───┤ RMS
         │  │  AuraLayer           │◄───┤ beat
         │  │  VisualizerLayer     │◄───┤ FFT array
         │  │  ParticleLayer       │◄───┤ spectral centroid
         │  └──────────────────────┘    │
         └──────────────────────────────┘

[User mở Theme Gallery → chọn theme khác]
        │
        ▼
[ThemeManager.switch(newTheme)]
  └── destroy() theme cũ (cleanup PixiJS, remove CSS)
  └── mount() theme mới (inject CSS, init renderer)
  └── GSAP transition 600ms giữa hai theme
```

---

## 4. Tính Năng Chi Tiết

### 4.1 Tính năng cốt lõi

#### F-01: Drag & Drop File Nhạc
- Người dùng kéo file MP3/WAV/FLAC vào vùng drop hoặc click để chọn file
- Fallback: nút "Choose file" cho thiết bị không hỗ trợ drag & drop
- Validate định dạng file trước khi load, hiện thông báo lỗi rõ ràng nếu sai định dạng
- Hỗ trợ nhiều file → tạo playlist tạm thời

#### F-02: Đọc Metadata (ID3 Tags)
- Dùng **jsmediatags** đọc trực tiếp từ `File` object, không qua network
- Trích xuất: tên bài, tên nghệ sĩ, album, năm phát hành, ảnh bìa nhúng trong file
- Fallback nếu thiếu ảnh bìa: tự generate **gradient artwork** từ tên bài qua Canvas API
- Fallback nếu thiếu tên: hiển thị tên file (bỏ phần mở rộng)

#### F-03: Audio Engine
- **Tone.js** load và decode AudioBuffer
- Chức năng: play, pause, seek (click vào progress bar), volume, loop
- **AudioWorklet** (nếu browser hỗ trợ) hoặc fallback ScriptProcessor cho Meyda
- Xử lý lỗi decode (file corrupt, unsupported codec) với thông báo thân thiện

#### F-04: Beat Detection
- **web-audio-beat-detector** kết nối vào Tone.js audio graph
- Emit event `beat` mỗi khi phát hiện beat
- Cooldown tối thiểu 150ms giữa hai beat liên tiếp (tránh double-trigger)
- Sensitivity tự điều chỉnh theo 30 giây đầu của bài (adaptive warm-up)

#### F-05: Real-time Feature Extraction
- **Meyda** chạy mỗi 512 samples (≈ 11ms ở 44.1kHz)
- Các feature được extract:
  - `rms` — năng lượng tổng thể → điều khiển độ sáng nền
  - `spectralCentroid` — độ sáng âm thanh → tốc độ particles
  - `chroma` — thông tin harmonic → màu sắc visualizer
  - `energy` — theo dải bass/mid/treble riêng biệt

### 4.2 Hiệu ứng Hình Ảnh

#### V-01: Background Layer
- Nền tối (deep black `#080810`)
- Noise texture tĩnh overlay với opacity thấp
- Blur wave: gradient radial chuyển động chậm, amplitude theo `rms`
- Màu wave lấy từ palette OKLCH của ảnh bìa

#### V-02: Album Cover
- Hình tròn, clip-path circle, đổ bóng glow
- Xoay liên tục khi đang phát (1 vòng / 20 giây)
- Dừng xoay (giữ nguyên góc) khi pause — transition smooth qua GSAP

#### V-03: Aura Layer
- Vòng tròn glow bao quanh album, shader blur gaussian qua PixiJS filter
- **Pulse animation**: scale từ 1.0 → 1.15 → 1.0 mỗi khi có beat (easeOut 200ms)
- Opacity dao động theo `rms` (min 0.4, max 1.0)
- Màu lấy từ accent color trong palette OKLCH

#### V-04: Frequency Visualizer
- 128 bar xếp thành vòng cung 270° bao quanh album
- Chiều cao mỗi bar = giá trị FFT tương ứng (normalized 0–1)
- Màu bar: gradient từ base color (bass) → accent color (treble)
- Bar mượt mà: lerp giữa giá trị frame trước và frame hiện tại (factor 0.7)

#### V-05: Particle System
- Pool cố định **500 PixiJS Sprite** (không tạo mới, không garbage collect)
- Mỗi particle: vị trí ngẫu nhiên, opacity, tốc độ, kích thước
- Tốc độ particle tỉ lệ thuận với `spectralCentroid`
- Khi có beat: burst 20–30 particle từ trung tâm ra ngoài
- Particle bay ra ngoài viewport → reset về vị trí ngẫu nhiên gần tâm

### 4.3 Palette Engine

#### C-01: Extract màu từ ảnh bìa
1. Vẽ ảnh lên OffscreenCanvas 50×50px (giảm chi phí tính toán)
2. **ColorThief** trả về top 5 màu dạng RGB
3. Convert sang **OKLCH** color space

#### C-02: Normalize OKLCH
- Clamp `L` (lightness) về dải `[0.45, 0.65]` — đủ sáng nhưng không chói
- Clamp `C` (chroma) về `[0.08, 0.20]` — bão hòa màu vừa phải
- Loại bỏ màu quá gần nhau (delta < 0.05)

#### C-03: Generate palette
Từ màu chủ đạo → tạo ra:
- `--color-base`: màu chính (dùng cho aura, bars)
- `--color-accent`: hue +30° → màu nhấn (dùng cho particles, progress bar)
- `--color-bg-glow`: base với L giảm 40% → màu nền glow
- `--color-text`: base với L tăng lên 0.9 → màu chữ đọc được

#### C-04: Transition khi đổi bài
- GSAP animate tất cả CSS custom properties trong 800ms (easeInOut)
- Không bị nhảy màu đột ngột

### 4.4 Player Controls

#### U-01: Progress Bar
- Custom HTML range input, styled hoàn toàn qua CSS
- Thumb phát sáng (box-shadow animated) theo `--color-accent`
- Hiển thị thời gian đã phát / tổng thời gian

#### U-02: Play / Pause Button
- Hình tròn lớn ở trung tâm controls
- Pulse animation (ripple) khi đang phát
- Icon morphing play → pause qua SVG path animation (GSAP)

#### U-03: Volume
- Slider dọc hoặc ngang, glow theo palette màu
- Lưu vào `localStorage`, khôi phục khi mở lại

#### U-04: Track Info
- Tên bài: font display lớn, gradient text theo palette
- Tên nghệ sĩ: font nhỏ hơn, opacity 0.7
- Marquee animation nếu text quá dài

---

## 5. Theme System

### 5.1 Triết lý thiết kế

Core app (audio engine, beat detector, metadata, UI controls) hoàn toàn **tách biệt** khỏi visual. Mỗi theme là một module độc lập, tự quản lý renderer, layout, CSS riêng. ThemeManager chỉ biết gọi các method chuẩn — không quan tâm bên trong theme làm gì.

### 5.2 ThemeContract — Interface bắt buộc

Mọi theme **phải** implement đủ các method sau. Đây là "hợp đồng" giữa theme và core app:

```js
class BaseTheme {
  // Gọi 1 lần khi theme được chọn lần đầu
  // Khởi tạo renderer, inject CSS, tạo DOM elements
  async mount(container) {}

  // Gọi mỗi frame — nhận audio data từ AudioBus
  // Đây là nơi theme update visual theo nhạc
  onAudioFrame({ fft, rms, spectralCentroid, chroma, energy }) {}

  // Gọi mỗi khi có beat
  onBeat() {}

  // Gọi khi PaletteEngine có palette mới từ ảnh bìa
  onPaletteChange(palette) {}

  // Gọi khi user switch sang theme khác
  // Phải cleanup toàn bộ: destroy PixiJS app, remove CSS, remove DOM
  destroy() {}
}
```

### 5.3 Theme Manifest

Mỗi theme có file `manifest.json` mô tả thông tin hiển thị trong gallery:

```json
{
  "id": "cosmic-aura",
  "name": "Cosmic Aura",
  "description": "Hiệu ứng vũ trụ, aura phát sáng theo nhịp",
  "author": "dev",
  "version": "1.0.0",
  "preview": "./preview.jpg",
  "tags": ["dark", "particles", "glow"]
}
```

### 5.4 ThemeManager — Lifecycle

```
mount(theme)
  ├── inject theme's layout.css vào <head>
  ├── gọi theme.mount(container)
  └── bắt đầu pipe audio data qua AudioBus → theme

switch(newTheme)
  ├── GSAP fade out current theme (300ms)
  ├── gọi currentTheme.destroy()
  │     ├── remove CSS khỏi <head>
  │     ├── destroy PixiJS app
  │     └── remove DOM elements
  ├── mount(newTheme)
  └── GSAP fade in new theme (300ms)
```

### 5.5 AudioBus — Phân phát dữ liệu âm thanh

AudioBus là trung gian giữa audio pipeline và theme. Mỗi frame nó gọi `theme.onAudioFrame()` với đủ data cần thiết. Theme không cần quan tâm Web Audio API hoạt động thế nào.

```js
// Dữ liệu AudioBus cung cấp mỗi frame
{
  fft: Float32Array(128),       // Frequency data đã normalize 0–1
  rms: Number,                  // Năng lượng tổng 0–1
  spectralCentroid: Number,     // Độ sáng âm 0–1
  chroma: Float32Array(12),     // 12 nốt nhạc
  energy: {
    bass: Number,               // 20–200Hz
    mid: Number,                // 200–2000Hz
    treble: Number              // 2000–20000Hz
  }
}
```

### 5.6 Theme Gallery UI

- Nút mở gallery nằm ở góc màn hình, luôn hiển thị
- Overlay full-screen với grid các theme card
- Mỗi card: thumbnail tĩnh (preview.jpg) + tên + tags
- Click chọn → ThemeManager.switch() → overlay đóng lại
- Theme đang dùng được highlight
- Lưu lựa chọn vào `localStorage`, khôi phục khi mở lại

### 5.7 Các Theme Đầu Tiên (v1.0)

| ID | Tên | Layout | Visual style |
|---|---|---|---|
| `cosmic-aura` | Cosmic Aura | Album giữa màn hình, controls phía dưới | Particles + aura glow + frequency bars vòng cung |
| `_template` | *(boilerplate)* | — | Chỉ dùng để dev tạo theme mới |

> Các theme tiếp theo sẽ được thêm sau khi core và theme đầu tiên hoàn chỉnh.

### 5.8 Hướng dẫn Tạo Theme Mới

Quy trình đơn giản cho developer:

```
1. Copy thư mục src/themes/_template/ → đặt tên mới (vd: ocean-wave/)
2. Sửa manifest.json (id, name, description, tags)
3. Implement 5 method trong index.js theo ThemeContract
4. Viết layout.css cho layout riêng
5. Thêm preview.jpg (bất kỳ screenshot nào)
6. Đăng ký trong ThemeManager.registerTheme('ocean-wave', OceanWaveTheme)
→ Theme xuất hiện ngay trong gallery
```

---

## 6. Xử Lý Thách Thức Kỹ Thuật

### 6.1 CORS
| Tình huống | Giải pháp |
|---|---|
| File local (drag & drop) | Đọc qua `File` API → zero CORS |
| Nhạc mẫu bundled | Đặt trong `src/assets/` → Vite bundle → zero CORS |
| URL ngoài | Không hỗ trợ chính thức; hiển thị thông báo rõ ràng nếu user thử |

### 6.2 Beat Detection Accuracy
- Thư viện **web-audio-beat-detector** dùng thuật toán energy-based với adaptive threshold
- Warm-up 30 giây đầu để calibrate ngưỡng theo bài cụ thể
- Cooldown 150ms tránh double-trigger
- Kết hợp với `energy` từ Meyda để filter false positive ở đoạn nhạc lặng

### 6.3 Performance
| Vấn đề | Giải pháp |
|---|---|
| FFT nặng trên main thread | Comlink Web Worker riêng |
| Tạo/xóa nhiều particle | Object pool 500 sprites cố định |
| Canvas 2D chậm | PixiJS WebGL 2 renderer |
| Redraw toàn bộ mỗi frame | Layer separation, chỉ dirty-mark layer cần update |
| Máy yếu | Adaptive: giảm particle count nếu FPS < 45 |

### 6.4 Màu Xấu Từ Ảnh Bìa
- OKLCH color space cảm nhận đồng đều hơn RGB/HSL
- Normalize pipeline đảm bảo màu luôn đủ sáng, đủ bão hòa
- Loại bỏ màu quá tối (L < 0.3) và quá nhạt (C < 0.04) trước khi dùng

---

## 7. Yêu Cầu Phi Chức Năng

| Tiêu chí | Mục tiêu |
|---|---|
| FPS | ≥ 60fps trên GPU tầm trung (GTX 1050 / Intel Iris Xe) |
| Thời gian load nhạc | < 2 giây cho file 10MB |
| Beat detection accuracy | ≥ 85% với nhạc có beat rõ |
| Memory usage | < 200MB RAM sau 30 phút chạy |
| Browser support | Chrome 100+, Firefox 100+, Safari 16+, Edge 100+ |
| Offline | Hoạt động hoàn toàn offline sau khi build |

---

## 8. Nhạc Mẫu

3 bài nhạc royalty-free bundled sẵn để demo:

| Bài | Thể loại | Mục đích test |
|---|---|---|
| Bài 1 | Ambient / Chill | Test aura pulse nhẹ nhàng, màu cool tone |
| Bài 2 | Electronic / EDM | Test beat detection mạnh, visualizer cao |
| Bài 3 | Lo-fi Hip-hop | Test màu warm tone, particle tốc độ trung bình |

---

## 9. Thứ Tự Implementation

```
Phase 1 — Foundation
  [1]  Vite project setup + package.json
  [2]  index.html + global style.css (CSS vars, font, reset)
  [3]  FileDropZone.js (drag & drop + file picker)
  [4]  MetadataReader.js (jsmediatags)

Phase 2 — Audio Core
  [5]  AudioEngine.js (Tone.js load + play/pause/seek)
  [6]  audio.worker.js + Comlink (FFT off main thread)
  [7]  FeatureExtractor.js (Meyda)
  [8]  BeatDetector.js (web-audio-beat-detector)
  [9]  AudioBus.js (phân phát audio data)

Phase 3 — Theme System Core
  [10] ThemeContract.js (interface + BaseTheme boilerplate)
  [11] ThemeManager.js (mount/switch/destroy lifecycle)
  [12] ThemeGallery.js (overlay UI chọn theme)
  [13] src/themes/_template/ (boilerplate + README)

Phase 4 — Theme: Cosmic Aura
  [14] cosmic-aura/renderer.js (PixiJS setup)
  [15] cosmic-aura/layers/BackgroundLayer.js
  [16] cosmic-aura/layers/AuraLayer.js
  [17] cosmic-aura/layers/VisualizerLayer.js
  [18] cosmic-aura/layers/ParticleLayer.js
  [19] cosmic-aura/layout.css + manifest.json + preview.jpg

Phase 5 — Color & UI Polish
  [20] PaletteEngine.js (ColorThief + OKLCH + GSAP transition)
  [21] PlayerControls.js (GSAP UI)
  [22] TrackInfo.js

Phase 6 — Integration & Optimization
  [23] main.js (kết nối toàn bộ modules)
  [24] Adaptive FPS + performance tuning
  [25] Test cross-browser
  [26] Vite build + tối ưu bundle size
```

---

## 10. Tiêu Chí Hoàn Thành (Definition of Done)

- [ ] Drag & drop MP3 bất kỳ, tự đọc metadata và hiển thị ảnh bìa
- [ ] Tất cả hiệu ứng phản ứng real-time theo nhạc (không hardcode)
- [ ] Màu giao diện tự thay đổi mượt mà theo ảnh bìa mỗi bài
- [ ] Beat detection đúng ≥ 85% với 3 bài nhạc mẫu
- [ ] 60fps ổn định trong suốt quá trình phát nhạc
- [ ] Không có memory leak sau 30 phút chạy liên tục
- [ ] Theme gallery hiển thị, chọn và switch theme mượt không giật
- [ ] Sau khi switch theme: không còn object nào của theme cũ tồn tại (kiểm tra DevTools)
- [ ] Tạo theme mới từ `_template` hoạt động chỉ với 6 bước trong README
- [ ] Lựa chọn theme được lưu và khôi phục khi reload trang
- [ ] Build ra thư mục `dist/` static, deploy được không cần server
- [ ] Chạy được trên Chrome, Firefox, Safari, Edge phiên bản mới nhất

---

*PRD này là tài liệu sống — cập nhật khi có thay đổi yêu cầu hoặc phát hiện constraint kỹ thuật mới trong quá trình implementation.*

---
*v1.0 — Foundation*
*v1.1 — Thêm Theme System (ThemeContract, ThemeManager, AudioBus, ThemeGallery, _template)*