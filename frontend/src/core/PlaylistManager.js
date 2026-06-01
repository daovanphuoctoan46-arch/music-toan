/**
 * PlaylistManager.js
 * Quản lý danh sách phát và lưu trữ offline sử dụng IndexedDB.
 */

class PlaylistManager {
  constructor() {
    this.playlist = [];
    this.currentIndex = -1;
    this.db = null;
    this.dbName = 'CosmicAuraDB';
    this.storeName = 'offlineTracks';
    
    // Playback Modes
    this.isShuffle = false;
    this.repeatMode = 0; // 0: Off, 1: Repeat All, 2: Repeat One
  }

  async init() {
    this.loadFromLocalStorage();
    try {
      await this.initDB();
    } catch (e) {
      console.error('[DB] Không thể khởi tạo IndexedDB:', e);
    }
  }

  // --- Persistence ---
  loadFromLocalStorage() {
    const saved = localStorage.getItem('cosmic_playlist');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.playlist = data.playlist || [];
        this.isShuffle = !!data.isShuffle;
        this.repeatMode = data.repeatMode || 0;
      } catch (e) {
        this.playlist = [];
      }
    }
  }

  saveToLocalStorage() {
    localStorage.setItem('cosmic_playlist', JSON.stringify({
      playlist: this.playlist,
      isShuffle: this.isShuffle,
      repeatMode: this.repeatMode
    }));
  }

  // --- IndexedDB cho Offline ---
  initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve();
      };
      request.onerror = (e) => reject(e);
    });
  }

  async saveTrackOffline(trackId, audioBlob, lrcData, metadata) {
    if (!this.db) return;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.put({
        id: trackId,
        blob: audioBlob,
        lrc: lrcData,
        metadata: metadata,
        timestamp: Date.now()
      });
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e);
    });
  }

  async getOfflineTrack(trackId) {
    if (!this.db) return null;
    return new Promise((resolve) => {
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(trackId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  }

  // --- Playlist Logic ---
  addTrack(track) {
    const exists = this.playlist.find(t => t.id === track.id);
    if (!exists) {
      this.playlist.push(track);
      this.saveToLocalStorage();
      return true;
    }
    return false;
  }

  removeTrack(trackId) {
    this.playlist = this.playlist.filter(t => t.id !== trackId);
    this.saveToLocalStorage();
  }

  getNextTrack() {
    if (this.playlist.length === 0) return null;

    if (this.repeatMode === 2) { // Repeat One
      return this.playlist[this.currentIndex];
    }

    if (this.isShuffle) {
      let nextIdx = Math.floor(Math.random() * this.playlist.length);
      if (this.playlist.length > 1 && nextIdx === this.currentIndex) {
        nextIdx = (nextIdx + 1) % this.playlist.length;
      }
      this.currentIndex = nextIdx;
    } else {
      this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    }
    return this.playlist[this.currentIndex];
  }

  getPrevTrack() {
    if (this.playlist.length === 0) return null;
    this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    return this.playlist[this.currentIndex];
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    // Nếu bật Shuffle, tắt Repeat
    if (this.isShuffle) {
      this.repeatMode = 0;
    }
    this.saveToLocalStorage();
    return this.isShuffle;
  }

  toggleRepeat() {
    this.repeatMode = (this.repeatMode + 1) % 3;
    // Nếu đang bật Repeat (All hoặc One), tắt Shuffle
    if (this.repeatMode > 0) {
      this.isShuffle = false;
    }
    this.saveToLocalStorage();
    return this.repeatMode;
  }

  setCurrentIndexById(id) {
    this.currentIndex = this.playlist.findIndex(t => t.id === id);
  }
}

export const playlistManager = new PlaylistManager();
await playlistManager.init();
