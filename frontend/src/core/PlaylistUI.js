import { playlistManager } from './PlaylistManager.js';

export class PlaylistUI {
  constructor(app) {
    this.app = app;
    this.init();
  }

  init() {
    this.createUI();
    this.bindEvents();
    this.render();
  }

  createUI() {
    // Tạo panel danh sách phát
    this.panel = document.createElement('div');
    this.panel.id = 'playlist-panel';
    this.panel.className = 'playlist-panel';
    this.panel.innerHTML = `
      <div class="playlist-header">
        <h3>DANH SÁCH PHÁT</h3>
        <button id="close-playlist" class="close-btn">×</button>
      </div>
      <div class="playlist-items" id="playlist-items">
        <!-- Items go here -->
      </div>
    `;
    document.body.appendChild(this.panel);

    // Thêm CSS cho playlist
    const style = document.createElement('style');
    style.textContent = `
      .playlist-panel {
        position: fixed;
        right: -400px;
        top: 0;
        width: 350px;
        height: 100vh;
        background: rgba(10, 10, 15, 0.95);
        backdrop-filter: blur(20px);
        border-left: 1px solid rgba(255, 255, 255, 0.1);
        z-index: 1000;
        transition: right 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        padding: 24px;
        display: flex;
        flex-direction: column;
        color: white;
      }
      .playlist-panel.open {
        right: 0;
      }
      .playlist-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        letter-spacing: 2px;
      }
      .playlist-header h3 { font-size: 1.2rem; font-weight: 300; }
      .close-btn { 
        background: none; border: none; color: white; font-size: 2rem; 
        cursor: pointer; opacity: 0.6; transition: 0.3s;
      }
      .close-btn:hover { opacity: 1; transform: rotate(90deg); }
      
      .playlist-items {
        flex: 1;
        overflow-y: auto;
        padding-right: 8px;
      }
      .playlist-items::-webkit-scrollbar { width: 4px; }
      .playlist-items::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

      .playlist-item {
        display: flex;
        align-items: center;
        padding: 12px;
        margin-bottom: 12px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 12px;
        cursor: pointer;
        transition: 0.3s;
        border: 1px solid transparent;
        position: relative;
      }
      .playlist-item:hover {
        background: rgba(255, 255, 255, 0.07);
        transform: translateX(-5px);
      }
      .playlist-item.active {
        background: rgba(0, 255, 255, 0.1);
        border-color: rgba(0, 255, 255, 0.3);
      }
      .playlist-item img {
        width: 48px; height: 48px;
        border-radius: 8px;
        margin-right: 15px;
        object-fit: cover;
      }
      .item-info { flex: 1; min-width: 0; }
      .item-title { 
        font-size: 0.9rem; margin-bottom: 4px; 
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .item-artist { font-size: 0.75rem; opacity: 0.5; }
      
      .offline-badge {
        font-size: 0.6rem;
        background: #00ffcc;
        color: black;
        padding: 2px 6px;
        border-radius: 4px;
        margin-left: 8px;
        font-weight: bold;
      }

      /* Nút thêm vào playlist trong kết quả tìm kiếm (Inject) */
      .add-to-playlist-btn {
        background: rgba(255,255,255,0.1);
        border: none;
        color: white;
        padding: 5px 10px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 0.8rem;
        margin-top: 5px;
        transition: 0.3s;
      }
      .add-to-playlist-btn:hover { background: rgba(0,255,255,0.2); }
    `;
    document.head.appendChild(style);
  }

  bindEvents() {
    // Mở playlist từ nút menu trên giao diện chính
    const listBtn = document.querySelector('.control-btn.list');
    if (listBtn) {
      listBtn.addEventListener('click', () => {
        this.panel.classList.add('open');
      });
    }

    document.getElementById('close-playlist').addEventListener('click', () => {
      this.panel.classList.remove('open');
    });

    // Sự kiện khi click vào bài hát trong playlist
    document.getElementById('playlist-items').addEventListener('click', async (e) => {
      const item = e.target.closest('.playlist-item');
      if (item) {
        const id = item.getAttribute('data-id');
        this.playTrackById(id);
      }
    });
    
    // Điều khiển từ giao diện chính
    const nextBtn = document.querySelector('.control-btn.next');
    const prevBtn = document.querySelector('.control-btn.prev');
    const shuffleBtn = document.querySelector('.control-btn.shuffle');
    const repeatBtn = document.querySelector('.control-btn.repeat');
    
    if (nextBtn) nextBtn.addEventListener('click', () => this.playNext());
    if (prevBtn) prevBtn.addEventListener('click', () => this.playPrev());
    
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => {
        const isShuffle = playlistManager.toggleShuffle();
        this.updateModeUI();
      });
    }
    
    if (repeatBtn) {
      repeatBtn.addEventListener('click', () => {
        const mode = playlistManager.toggleRepeat();
        this.updateModeUI();
      });
    }

    // Khởi tạo trạng thái ban đầu
    this.updateModeUI();
  }

  updateModeUI() {
    const shuffleBtn = document.querySelector('.control-btn.shuffle');
    const repeatBtn = document.querySelector('.control-btn.repeat');

    if (shuffleBtn) {
      if (playlistManager.isShuffle) {
        shuffleBtn.style.color = 'var(--color-base, #00f2ff)';
        shuffleBtn.style.opacity = '1';
      } else {
        shuffleBtn.style.color = '';
        shuffleBtn.style.opacity = '0.6';
      }
    }

    if (repeatBtn) {
      const modes = ['🔁', '🔁', '🔂']; // 0: None, 1: All, 2: One
      repeatBtn.innerHTML = `<span class="icon">${modes[playlistManager.repeatMode]}</span>`;
      if (playlistManager.repeatMode > 0) {
        repeatBtn.style.color = 'var(--color-base, #00f2ff)';
        repeatBtn.style.opacity = '1';
      } else {
        repeatBtn.style.color = '';
        repeatBtn.style.opacity = '0.6';
      }
    }
  }

  async playTrackById(id) {
    playlistManager.setCurrentIndexById(id);
    const track = playlistManager.playlist[playlistManager.currentIndex];
    if (track) {
      await this.loadAndPlay(track);
    }
  }

  async playNext() {
    const track = playlistManager.getNextTrack();
    if (track) await this.loadAndPlay(track);
  }

  async playPrev() {
    const track = playlistManager.getPrevTrack();
    if (track) await this.loadAndPlay(track);
  }

  async loadAndPlay(track) {
    this.render(); // Update active state
    
    // Kiểm tra offline trước
    const offlineData = await playlistManager.getOfflineTrack(track.id);
    if (offlineData) {
      console.log('[Offline] Phát từ bộ nhớ local');
      const blobUrl = URL.createObjectURL(offlineData.blob);
      this.app.playTrack({
        item: track,
        mp3: { mp3: blobUrl },
        lrc: { lrc: offlineData.lrc }
      });
    } else {
      // Phát online
      this.app.playTrack({
        item: track,
        mp3: { mp3: track.mp3Url },
        lrc: { lrc: track.lrcData }
      });
    }
  }

  render() {
    const container = document.getElementById('playlist-items');
    container.innerHTML = playlistManager.playlist.map((t, i) => `
      <div class="playlist-item ${playlistManager.currentIndex === i ? 'active' : ''}" data-id="${t.id}">
        <img src="${t.thumbnail}" alt="">
        <div class="item-info">
          <div class="item-title">${this.app.escapeHtml(t.title)}</div>
          <div class="item-artist">${this.app.escapeHtml(t.artist)}</div>
        </div>
      </div>
    `).join('');
  }

  // Tiện ích: Lưu bài hát hiện tại xuống offline
  async downloadCurrent() {
    const current = this.app.currentTrackData; // Cần update main.js để lưu lại cái này
    if (!current || !current.mp3?.mp3) return;

    try {
      console.log('[Offline] Đang tải bài hát...');
      const response = await fetch(current.mp3.mp3);
      const blob = await response.blob();
      
      await playlistManager.saveTrackOffline(
        current.item.id,
        blob,
        current.lrc?.lrc || "",
        current.item
      );
      alert('Đã lưu bài hát để nghe offline!');
      this.render();
    } catch (e) {
      console.error('[Offline err]', e);
    }
  }
}
