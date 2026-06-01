import { ThemeManager } from './core/ThemeManager.js';
import CosmicAuraTheme from './themes/cosmic-aura/index.js';
import { playlistManager } from './core/PlaylistManager.js';
import { PlaylistUI } from './core/PlaylistUI.js';

const LRCLIB = 'https://lrclib.net';

// Helper for string normalization
const VI_MAP = {
  à:'a',á:'a',â:'a',ã:'a',ä:'a',å:'a',ā:'a',è:'e',é:'e',ê:'e',ë:'e',ē:'e',ì:'i',í:'i',î:'i',ï:'i',ī:'i',ò:'o',ó:'o',ô:'o',õ:'o',ö:'o',ō:'o',ù:'u',ú:'u',û:'u',ü:'u',ū:'u',ý:'y',ÿ:'y',ă:'a',ắ:'a',ằ:'a',ẳ:'a',ẵ:'a',ặ:'a',â:'a',ấ:'a',ầ:'a',ẩ:'a',ẫ:'a',ậ:'a',đ:'d',ê:'e',ế:'e',ề:'e',ể:'e',ễ:'e',ệ:'e',ơ:'o',ớ:'o',ờ:'o',ở:'o',ỡ:'o',ợ:'o',ô:'o',ố:'o',ồ:'o',ổ:'o',ỗ:'o',ộ:'o',ư:'u',ứ:'u',ừ:'u',ử:'u',ữ:'u',ự:'u',ỳ:'y',ỵ:'y',ỷ:'y',ỹ:'y',ạ:'a',ả:'a',ẹ:'e',ẻ:'e',ẽ:'e',ị:'i',ỉ:'i',ọ:'o',ỏ:'o',ụ:'u',ủ:'u',À:'a',Á:'a',Â:'a',Ã:'a',Ä:'a',Å:'a',Ā:'a',È:'e',É:'e',Ê:'e',Ë:'e',Ē:'e',Ì:'i',Í:'i',Î:'i',Ï:'i',Ī:'i',Ò:'o',Ó:'o',Ô:'o',Õ:'o',Ö:'o',Ō:'o',Ù:'u',Ú:'u',Û:'u',Ü:'u',Ū:'u',Ý:'y',Ÿ:'y',Ă:'a',Ắ:'a',Ằ:'a',ẳ:'a',ẵ:'a',ặ:'a',Â:'a',Ấ:'a',Ầ:'a',ẩ:'a',ẫ:'a',ậ:'a',Đ:'d',Ê:'e',ế:'e',ề:'e',ể:'e',ễ:'e',ệ:'e',Ơ:'o',ớ:'o',ờ:'o',ở:'o',ỡ:'o',ợ:'o',Ô:'o',ố:'o',ồ:'o',ổ:'o',ỗ:'o',ộ:'o',Ư:'u',ứ:'u',ừ:'u',ử:'u',ữ:'u',ự:'u',Ỳ:'y',ỵ:'y',ỷ:'y',ỹ:'y',Ạ:'a',Ả:'a',Ẹ:'e',ẻ:'e',ẽ:'e',Ị:'i',ỉ:'i',Ọ:'o',ỏ:'o',Ụ:'u',ủ:'u',
};

function normStr(s) {
  return (s || '').toLowerCase().replace(/./g, c => VI_MAP[c] || c).replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function bigrams(s) {
  const bg = new Set();
  for (let i = 0; i < s.length - 1; i++) {
    if (s[i] !== ' ' && s[i+1] !== ' ') bg.add(s[i] + s[i+1]);
  }
  return bg;
}

function diceSim(a, b) {
  if (!a || !b) return 0;
  const ba = bigrams(a), bb = bigrams(b);
  if (!ba.size || !bb.size) return 0;
  let inter = 0;
  for (const g of ba) if (bb.has(g)) inter++;
  return (2 * inter) / (ba.size + bb.size);
}

function jaccardSim(a, b) {
  const wa = new Set(a.split(/\s+/).filter(Boolean));
  const wb = new Set(b.split(/\s+/).filter(Boolean));
  if (!wa.size || !wb.size) return 0;
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter++;
  return inter / (wa.size + wb.size - inter);
}

function strScore(a, b) {
  const na = normStr(a), nb = normStr(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  return diceSim(na, nb) * 0.6 + jaccardSim(na, nb) * 0.4;
}

class App {
  constructor() {
    this.container = document.body;
    
    // Player State
    this.isPlaying = false;
    this.currentLyricIndex = -1;
    this.lrcLines = [];
    this.audio = new Audio();
    this.currentTrackData = null;

    this.initCore();
    this.bindPlayerUI();
    this.initPlayerEvents();
    this.initEvents();
    
    this.playlistUI = new PlaylistUI(this);
    console.log('Cosmic Aura fully integrated');
  }

  initCore() {
    this.themeManager = new ThemeManager(this.container);
    this.themeManager.registerTheme('cosmic-aura', CosmicAuraTheme);
    const savedTheme = localStorage.getItem('selectedTheme') || 'cosmic-aura';
    this.themeManager.mount(savedTheme);
  }

  bindPlayerUI() {
    this.playerGlass = document.getElementById('player-glass');
    this.playBtn = document.getElementById('playPauseBtn');
    this.mainTitle = document.getElementById('mainTitle');
    this.mainArtist = document.getElementById('mainArtist');
    this.progressFill = document.getElementById('progressFill');
    this.progressTrack = document.getElementById('progressTrack');
    this.timeNow = document.getElementById('timeNow');
    this.timeTotal = document.getElementById('timeTotal');
    this.lyricsScroll = document.getElementById('lyricsScroll');
    this.lyricsContainer = document.querySelector('.lyrics-container');
    this.searchInput = document.getElementById('searchInput');
    this.searchBtnUI = document.getElementById('searchBtnUI');
    this.volTrack = document.getElementById('volTrack');
    this.volFill = document.getElementById('volFill');

    // Create Tooltip for Progress Bar
    this.progressTooltip = document.createElement('div');
    this.progressTooltip.className = 'progress-tooltip';
    this.progressTrack.appendChild(this.progressTooltip);
  }

  initPlayerEvents() {
    if (!this.playBtn) return;

    this.playBtn.addEventListener('click', () => this.togglePlay());
    
    this.searchBtnUI.addEventListener('click', () => {
      if (this.searchInput.value.trim()) this.doSearch(this.searchInput.value.trim());
    });

    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.searchInput.value.trim()) {
        this.doSearch(this.searchInput.value.trim());
      }
    });

    // Hover logic for progress bar
    this.progressTrack.addEventListener('mousemove', (e) => {
      if (!this.audio.duration) return;
      const rect = this.progressTrack.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      const hoverTime = pos * this.audio.duration;
      
      this.progressTooltip.textContent = this.formatTime(hoverTime);
      this.progressTooltip.style.left = `${pos * 100}%`;
    });

    this.lyricsScroll.addEventListener('click', (e) => {
      const line = e.target.closest('.lyric-line');
      if (line && this.audio.src) {
        const index = parseInt(line.getAttribute('data-index'));
        if (!isNaN(index) && this.lrcLines[index]) {
          this.audio.currentTime = this.lrcLines[index].time;
          if (this.audio.paused) this.audio.play().catch(() => {});
        }
      }
    });

    this.audio.addEventListener('timeupdate', () => this.handleTimeUpdate());
    this.audio.addEventListener('loadedmetadata', () => {
      this.timeTotal.textContent = this.formatTime(this.audio.duration);
    });
    
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      if (this.playerGlass) this.playerGlass.classList.add('is-playing');
      this.playBtn.innerHTML = '<span class="icon">⏸</span>';
    });
    
    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      if (this.playerGlass) this.playerGlass.classList.remove('is-playing');
      this.playBtn.innerHTML = '<span class="icon">▶</span>';
    });

    this.audio.addEventListener('ended', () => {
      this.playlistUI.playNext();
    });

    const favBtn = document.querySelector('.control-btn.fav');
    if (favBtn) {
      favBtn.addEventListener('click', () => {
        this.playlistUI.downloadCurrent();
      });
    }

    this.progressTrack.addEventListener('click', (e) => {
      if (!this.audio.duration) return;
      const rect = this.progressTrack.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      this.audio.currentTime = pos * this.audio.duration;
    });

    this.volTrack.addEventListener('click', (e) => {
      const rect = this.volTrack.getBoundingClientRect();
      const vol = (e.clientX - rect.left) / rect.width;
      this.audio.volume = Math.max(0, Math.min(1, vol));
      this.volFill.style.width = `${this.audio.volume * 100}%`;
    });
  }

  async doSearch(q) {
    this.mainTitle.textContent = "Đang tìm kiếm...";
    this.mainArtist.textContent = q;
    this.lyricsScroll.innerHTML = '<div class="lyric-line active">Đang quét dải ngân hà tìm bài hát...</div>';
    
    const searchWrapper = document.querySelector('.search-wrapper');
    if (searchWrapper) searchWrapper.classList.add('searching');

    try {
      const fetchYT = fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .catch(() => ({ results: [], error: "offline" }));

      const [ytResponse, lrcCandidates] = await Promise.all([
        fetchYT,
        this.fetchLRCCandidates(q)
      ]);

      if (ytResponse.error === "offline") {
        this.mainTitle.textContent = "Hệ thống chưa sẵn sàng";
        this.mainArtist.textContent = "Vui lòng kiểm tra lại server";
        this.lyricsScroll.innerHTML = `
          <div class="lyric-line active">KHÔNG THỂ KẾT NỐI VỚI BACKEND</div>
          <div class="lyric-line near">Đang thử khởi động lại kết nối...</div>
        `;
        return;
      }

      const ytItems = ytResponse.results || [];
      if (!ytItems.length && !lrcCandidates.length) {
        this.mainTitle.textContent = "Không tìm thấy";
        this.lyricsScroll.innerHTML = '<div class="lyric-line active">Hư vô... Không tìm thấy bài hát này</div>';
        return;
      }

      const TOP = Math.min(ytItems.length, 5);

      // Dùng item.duration từ YouTube search (đã có sẵn, không cần probe)
      // Probe gọi /api/stream 5 lần → URL YouTube bị "tiêu" trước khi phát thật
      let bestMatch = null, bestScore = -Infinity;
      for (const item of ytItems.slice(0, TOP)) {
        const dur = item.duration || null;
        const lrc = this.pickBestLRC(lrcCandidates, item.title, item.artist, dur);
        const txtScore = strScore(q, item.title) + strScore(q, item.artist) * 0.3;
        let durScore = 0;
        if (dur && lrc?.duration) {
          const diff = Math.abs(dur - lrc.duration);
          durScore = diff < 2 ? 1.0 : diff < 5 ? 0.7 : diff < 10 ? 0.4 : 0;
        }
        const total = txtScore + durScore * 1.5 + (lrc?.lrc ? 0.5 : 0);
        if (total > bestScore) {
          bestScore = total;
          bestMatch = { item, mp3: null, lrc, dur };
        }
      }

      // Chỉ fetch mp3 cho 1 bài tốt nhất
      if (bestMatch) {
        try {
          const mp3 = await this.fetchMP3Data(bestMatch.item.id);
          bestMatch.mp3 = mp3?.mp3 ? mp3 : null;
        } catch (_) {}
        this.playTrack(bestMatch);
      } else if (lrcCandidates.length) {
        const bestLrc = this.pickBestLRC(lrcCandidates, q, '', null);
        this.playTrack({ item: { title: bestLrc.trackName || q, artist: '' }, mp3: null, lrc: bestLrc });
      }

    } catch (e) {
      console.error(e);
      this.mainTitle.textContent = "Lỗi kết nối";
    } finally {
      if (searchWrapper) searchWrapper.classList.remove('searching');
    }
  }

  async playTrack(match) {
    this.currentTrackData = match;
    const { item, mp3, lrc } = match;
    this.mainTitle.textContent = item.title;
    this.mainArtist.textContent = item.artist;
    
    const lrcText = lrc?.lrc || lrc?.syncedLyrics || lrc?.plainLyrics || "";
    this.lrcLines = this.parseLRC(lrcText);
    this.renderLyrics();

    this.audio.pause();
    if (mp3 && mp3.mp3) {
      this.audio.src = mp3.mp3;
      this.audio.play().catch(() => {});

      playlistManager.addTrack({
        id: item.id,
        title: item.title,
        artist: item.artist,
        thumbnail: item.thumbnail,
        mp3Url: mp3.mp3,
        lrcData: lrcText
      });
      playlistManager.setCurrentIndexById(item.id);
      this.playlistUI.render();
    } else {
      this.audio.src = "";
    }
  }

  async fetchLRCCandidates(title) {
    try {
      const queries = [...new Set([title, normStr(title)].filter(Boolean))];
      let results = [];
      for (const q of queries) {
        try {
          const r = await fetch(`${LRCLIB}/api/search?q=${encodeURIComponent(q)}`);
          const data = await r.json();
          results = results.concat(data || []);
        } catch (_) {}
      }
      return results;
    } catch { return []; }
  }

  pickBestLRC(allResults, title, artist, audioDuration) {
    if (!allResults?.length) return { lrc: "" };

    const scored = allResults.map(it => {
      // 1. Calculate text similarity (Base score)
      let textScore = strScore(title, it.trackName || '') + strScore(artist, it.artistName || '') * 0.5;
      
      // 2. Duration factor (Decisive factor)
      let timeWeight = 0;
      if (audioDuration && it.duration) {
        const diff = Math.abs(audioDuration - it.duration);
        // High penalty for time mismatch, high reward for closeness
        if (diff < 2) timeWeight = 10.0;       // Almost perfect match
        else if (diff < 5) timeWeight = 5.0;   // Good match
        else if (diff < 10) timeWeight = 2.0;  // Acceptable
        else if (diff > 30) timeWeight = -5.0; // Likely wrong version
      }

      // 3. Synced priority
      const syncBonus = it.syncedLyrics ? 1.0 : 0;

      // Total score: Time is now the heavy hitter
      const totalScore = textScore + timeWeight + syncBonus;
      
      return { it, score: totalScore, diff: Math.abs(audioDuration - (it.duration || 0)) };
    });

    // Sort by score primarily, then by the smallest time difference as a tie-breaker
    scored.sort((a, b) => {
      if (Math.abs(b.score - a.score) > 0.1) return b.score - a.score;
      return a.diff - b.diff;
    });

    const best = scored[0]?.it;
    return { 
      lrc: best?.syncedLyrics || best?.plainLyrics || "", 
      trackName: best?.trackName, 
      duration: best?.duration 
    };
  }

  async fetchMP3Data(id) {
    const r = await fetch(`/api/mp3?id=${encodeURIComponent(id)}`);
    return await r.json();
  }

  probeAudioDuration(src) {
    return new Promise(resolve => {
      const tmp = new Audio();
      tmp.src = src;
      const timer = setTimeout(() => { tmp.src = ''; resolve(null); }, 5000);
      tmp.addEventListener('loadedmetadata', () => { clearTimeout(timer); resolve(tmp.duration); }, { once: true });
      tmp.addEventListener('error', () => { clearTimeout(timer); resolve(null); }, { once: true });
    });
  }

  parseLRC(raw) {
    if (!raw) return [];
    const lines = [];
    const re = /\[(\d{1,3}):(\d{2})\.?(\d{0,3})\](.*)/g;
    let m;
    while ((m = re.exec(raw)) !== null) {
      const time = parseInt(m[1])*60 + parseInt(m[2]) + (m[3] ? parseInt(m[3].padEnd(3,'0'))/1000 : 0);
      const text = m[4].trim();
      if (text) lines.push({ time, text });
    }
    if (!lines.length) return raw.split('\n').filter(l => l.trim()).map((text, i) => ({ time: i * 3, text }));
    return lines.sort((a,b) => a.time - b.time);
  }

  renderLyrics() {
    this.lyricsScroll.innerHTML = this.lrcLines.length
      ? this.lrcLines.map((l, i) => `<div class="lyric-line" id="ll_${i}" data-index="${i}">${this.escapeHtml(l.text)}</div>`).join('')
      : '<div class="lyric-line active">Giai điệu không có lời</div>';
    this.currentLyricIndex = -1;
    this.lyricsScroll.style.transform = `translateY(0)`;
  }

  handleTimeUpdate() {
    const t = this.audio.currentTime;
    const dur = this.audio.duration || 0;
    if (this.progressFill) this.progressFill.style.width = (dur ? (t / dur) * 100 : 0) + '%';
    if (this.timeNow) this.timeNow.textContent = this.formatTime(t);

    if (this.lrcLines.length) {
      let idx = -1;
      for (let i = 0; i < this.lrcLines.length; i++) {
        if (t >= this.lrcLines[i].time) idx = i; else break;
      }
      if (idx !== this.currentLyricIndex && idx !== -1) {
        this.currentLyricIndex = idx;
        this.updateLyricsUI();
      }
    }
  }

  updateLyricsUI() {
    const lines = this.lyricsScroll.querySelectorAll('.lyric-line');
    let activeLine = null;
    lines.forEach((line) => {
      const idx = parseInt(line.getAttribute('data-index'));
      line.classList.remove('active', 'near');
      if (idx === this.currentLyricIndex) {
        line.classList.add('active');
        activeLine = line;
      } else if (Math.abs(idx - this.currentLyricIndex) === 1) {
        line.classList.add('near');
      }
    });

    if (activeLine && this.lyricsContainer) {
      const offset = (this.lyricsContainer.offsetHeight / 2) - activeLine.offsetTop - (activeLine.offsetHeight / 2);
      this.lyricsScroll.style.transform = `translateY(${offset}px)`;
    }
  }

  togglePlay() {
    if (!this.audio.src) return;
    this.audio.paused ? this.audio.play() : this.audio.pause();
  }

  formatTime(s) {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
  }

  escapeHtml(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  initEvents() {
    this._resizeTimeout = null;
    this._resizeHandler = () => {
      clearTimeout(this._resizeTimeout);
      this._resizeTimeout = setTimeout(() => {
        const theme = this.themeManager.getCurrent();
        if (theme && theme.resize) theme.resize();
        this.updateLyricsUI();
      }, 250);
    };
    window.addEventListener('resize', this._resizeHandler);
  }
}

new App();