#!/usr/bin/env python3
"""
Cosmic Aura Backend — YouTube Engine (Enhanced Debugging)
"""

from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import urllib.request
import json, ssl, time, threading, os, mimetypes, shutil

# Lấy PORT từ môi trường (Render/Heroku cấp phát), mặc định 8765
PORT = int(os.environ.get("PORT", 8765))

# Cache stream URL
_cache = {}
_cache_lock = threading.Lock()
CACHE_TTL = 4 * 3600

try:
    import yt_dlp
    YT_OK = True
    print(f"[Init] yt-dlp version: {yt_dlp.version.__version__}", flush=True)
except ImportError:
    YT_OK = False
    print("[!] yt-dlp not found! Run: pip install yt-dlp", flush=True)

# ── Utils ─────────────────────────────────────────────────────────────────────

import re as _re

def safe_print(msg):
    try:
        print(msg, flush=True)
    except:
        pass

def parse_yt_title(raw_title, uploader=""):
    suffixes = [
        r"\(official\s*(music\s*)?video\)", r"\(official\s*mv\)",
        r"\(official\s*audio\)", r"\(lyrics?\s*(video)?\)",
        r"\(lyric\s*video\)", r"\(audio\)", r"\(official\)",
        r"\[official.*?\]", r"\(mv\)", r"\(full.*?\)",
        r"\|\s*official.*", r"//\s*official.*",
        r"\(\d{4}\)", r"\(ft\..*?\)", r"\(feat\..*?\)",
    ]
    title = raw_title
    for s in suffixes:
        title = _re.sub(s, "", title, flags=_re.IGNORECASE).strip()
    title = _re.sub(r"\s*\|\s*$", "", title).strip()

    artist = ""
    if " - " in title or " \u2013 " in title:
        sep = " - " if " - " in title else " \u2013 "
        parts = title.split(sep, 1)
        if len(parts[0]) < len(parts[1]) + 20:
            artist = parts[0].strip()
            title  = parts[1].strip()
    if not artist and uploader and uploader.lower() not in ("youtube", "topic", "vevo", "auto-generated"):
        artist = _re.sub(r"\s*-\s*(topic|official|vevo).*$", "", uploader, flags=_re.IGNORECASE).strip()

    title  = _re.sub(r"\s+", " ", title).strip(" -\u2013|/")
    artist = _re.sub(r"\s+", " ", artist).strip(" -\u2013|/")
    return title, artist

def search_youtube(q):
    if not YT_OK: return []
    safe_print(f"[Search] {q}")
    opts = {"quiet": True, "no_warnings": True, "extract_flat": True, "default_search": "ytsearch12"}
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(f"ytsearch12:{q}", download=False)
        results = []
        for e in info.get("entries", []):
            if not e or not e.get("id"): continue
            dur = int(e.get("duration") or 0)
            if dur > 600: continue
            raw_title = e.get("title", "")
            uploader  = e.get("uploader", "")
            clean_title, clean_artist = parse_yt_title(raw_title, uploader)
            results.append({
                "id": f"yt:{e['id']}",
                "title": clean_title or raw_title,
                "artist": clean_artist or uploader,
                "thumbnail": e.get("thumbnail") or f"https://i.ytimg.com/vi/{e['id']}/mqdefault.jpg",
                "duration": dur,
                "source": "youtube",
                "hasSyncedLyrics": False,
            })
        safe_print(f"  -> Found {len(results)} results")
        return results
    except Exception as e:
        safe_print(f"  [Search Error] {e}")
        return []

def get_stream_url(video_id):
    with _cache_lock:
        if video_id in _cache:
            url, exp = _cache[video_id]
            if time.time() < exp:
                safe_print(f"  [Cache hit] {video_id}")
                return url
    if not YT_OK: return ""
    safe_print(f"[Stream URL] Fetching for {video_id}")
    opts = {"quiet": True, "no_warnings": True, "format": "bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio/best"}
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
        url = info.get("url", "")
        if url:
            with _cache_lock:
                _cache[video_id] = (url, time.time() + CACHE_TTL)
            safe_print(f"  -> URL obtained")
        return url
    except Exception as e:
        safe_print(f"  [Stream URL Error] {e}")
        return ""

# ── HTTP Handler ───────────────────────────────────────────────────────────────

class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def send_json(self, obj):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        path   = parsed.path
        kv     = {k: v[0] for k, v in parse_qs(parsed.query).items()}

        # ── API Routes ────────────────────────────────────────────────────────
        if path == "/api/search":
            q = kv.get("q", "").strip()
            self.send_json({"results": search_youtube(q)})
            return

        if path == "/api/mp3":
            song_id = kv.get("id", ""); query = kv.get("q", ""); video_id = thumb = ""
            if song_id.startswith("yt:"): video_id = song_id[3:]
            elif query:
                res = search_youtube(query)
                if res: video_id = res[0]["id"][3:]; thumb = res[0]["thumbnail"]
            
            if video_id:
                url = get_stream_url(video_id)
                if url:
                    self.send_json({
                        "mp3": f"/api/stream?id={video_id}", 
                        "thumbnail": thumb or f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg"
                    })
                    return
            
            safe_print(f"  [API MP3] Failed to get video_id or URL for {song_id} / {query}")
            self.send_json({"mp3": "", "thumbnail": "", "error": "Lỗi lấy link"})
            return

        if path == "/api/stream":
            video_id = kv.get("id", "")
            if not video_id:
                self.send_error(400)
                return
            
            stream_url = get_stream_url(video_id)
            if not stream_url:
                safe_print(f"  [Stream] No URL for {video_id}")
                self.send_error(404)
                return

            safe_print(f"[Proxy] Streaming {video_id}")
            try:
                hdrs = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Referer": "https://www.youtube.com/"
                }
                if rng := self.headers.get("Range"):
                    hdrs["Range"] = rng
                    safe_print(f"  [Proxy] Range request: {rng}")

                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                
                req = urllib.request.Request(stream_url, headers=hdrs)
                with urllib.request.urlopen(req, context=ctx, timeout=20) as resp:
                    # Chuyển tiếp status code (200 hoặc 206 Partial Content)
                    self.send_response(resp.status)
                    
                    # Xác định Content-Type
                    ct = resp.headers.get("Content-Type", "audio/webm")
                    if "text/plain" in ct or "application/octet-stream" in ct:
                        ct = "audio/webm" # YouTube fallback
                    
                    self.send_header("Content-Type", ct)
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.send_header("Accept-Ranges", "bytes")
                    
                    # Copy quan trọng nhất là Content-Length và Content-Range
                    for h in ["Content-Length", "Content-Range", "Cache-Control"]:
                        if val := resp.headers.get(h):
                            self.send_header(h, val)
                    
                    self.end_headers()
                    
                    # Streaming data
                    try:
                        shutil.copyfileobj(resp, self.wfile, length=128*1024)
                    except (ConnectionResetError, BrokenPipeError):
                        # Người dùng dừng hoặc tua nhạc, chuyện bình thường
                        pass
            except Exception as ex:
                safe_print(f"  [Proxy Error] {ex}")
                if not self.wfile.closed:
                    try: self.send_error(502)
                    except: pass
            return

        if path == "/api/status" or path == "/health":
            self.send_json({"ok": True, "backend": "youtube", "yt_dlp": YT_OK})
            return

        # ── Static Files (Dành cho Production) ────────────────────────────────
        base_dir = os.path.dirname(os.path.abspath(__file__))
        dist_dir = os.path.join(os.path.dirname(base_dir), "frontend", "dist")
        
        target_path = path[1:] if path.startswith("/") else path
        if not target_path or target_path == "index.html":
            target_path = "index.html"
            
        file_to_serve = os.path.join(dist_dir, target_path)
        
        if os.path.exists(file_to_serve) and os.path.isfile(file_to_serve):
            mime_type, _ = mimetypes.guess_type(file_to_serve)
            if target_path.endswith(".js"): mime_type = "application/javascript"
            if target_path.endswith(".css"): mime_type = "text/css"
            
            self.send_response(200)
            self.send_header("Content-Type", mime_type or "application/octet-stream")
            self.end_headers()
            with open(file_to_serve, "rb") as f:
                self.wfile.write(f.read())
            return

        # Fallback cho SPA
        index_file = os.path.join(dist_dir, "index.html")
        if os.path.exists(index_file):
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            with open(index_file, "rb") as f:
                self.wfile.write(f.read())
            return

        self.send_response(404)
        self.end_headers()
        self.wfile.write("404 Not Found".encode())

# ── Main ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    safe_print(f"--- Cosmic Aura Backend Starting ---")
    safe_print(f"Port: {PORT}")
    safe_print(f"Binding: 0.0.0.0")
    try:
        httpd = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
        safe_print(f"Server is LIVE at http://0.0.0.0:{PORT}")
        httpd.serve_forever()
    except Exception as e:
        safe_print(f"FATAL ERROR: {e}")
