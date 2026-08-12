/**
 * YouTube IFrame Player API Wrapper
 * Single clean engine for full-length audio playback via hidden YouTube iframe.
 */

// Silent 1-second WAV audio stream to keep mobile OS background audio service active when screen is turned off / locked
const SILENT_AUDIO_URI = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

class YouTube {
  constructor() {
    this.player = null;
    this.ready = false;
    this.queued = null;
    this.ticker = null;
    this.silentAudio = null;

    this.timeListeners = new Set();
    this.onEnded = null;       // () => void
    this.onStateChange = null; // (state) => void  — 'playing' | 'paused' | 'buffering' | 'ended'
    this.onError = null;       // (errorCode) => void
  }

  _startSilentKeepAlive() {
    if (typeof window === 'undefined') return;
    try {
      if (!this.silentAudio) {
        this.silentAudio = new Audio(SILENT_AUDIO_URI);
        this.silentAudio.loop = true;
        this.silentAudio.volume = 0.001;
      }
      this.silentAudio.play().catch(() => {});
    } catch (e) {}
  }

  _stopSilentKeepAlive() {
    if (this.silentAudio) {
      try {
        this.silentAudio.pause();
      } catch (e) {}
    }
  }

  init() {
    if (typeof window === 'undefined') return;
    if (window.YT && window.YT.Player) {
      this._createPlayer();
      return;
    }

    if (!document.getElementById('yt-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'yt-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prev) prev();
      this._createPlayer();
    };
  }

  _createPlayer() {
    if (this.player) return;

    let box = document.getElementById('yt-container');
    if (!box) {
      box = document.createElement('div');
      box.id = 'yt-container';
      Object.assign(box.style, {
        position: 'fixed', bottom: '0', right: '0',
        width: '200px', height: '200px',
        zIndex: '-9999', opacity: '0.001',
        pointerEvents: 'none', overflow: 'hidden'
      });
      document.body.appendChild(box);
      const el = document.createElement('div');
      el.id = 'yt-player';
      box.appendChild(el);
    }

    this.player = new window.YT.Player('yt-player', {
      width: 200, height: 200,
      playerVars: {
        autoplay: 1, controls: 0, disablekb: 1, fs: 0,
        modestbranding: 1, playsinline: 1, rel: 0,
        enablejsapi: 1, origin: window.location.origin
      },
      events: {
        onReady: () => {
          this.ready = true;
          if (this.queued) {
            const id = this.queued;
            this.queued = null;
            this.play(id);
          }
        },
        onStateChange: (e) => this._handleState(e.data),
        onError: (e) => {
          console.warn('YT error:', e.data);
          this._stopTicker();
          if (this.onError) this.onError(e.data);
        }
      }
    });
  }

  _handleState(state) {
    if (!window.YT) return;
    const YT = window.YT.PlayerState;

    if (state === YT.PLAYING) {
      this._startSilentKeepAlive();
      this._startTicker();
      if (this.onStateChange) this.onStateChange('playing');
    } else if (state === YT.PAUSED) {
      this._stopSilentKeepAlive();
      this._stopTicker();
      if (this.onStateChange) this.onStateChange('paused');
    } else if (state === YT.ENDED) {
      this._stopSilentKeepAlive();
      this._stopTicker();
      if (this.onStateChange) this.onStateChange('ended');
      if (this.onEnded) this.onEnded();
    } else if (state === YT.BUFFERING) {
      if (this.onStateChange) this.onStateChange('buffering');
    }
  }

  _startTicker() {
    this._stopTicker();
    this.ticker = setInterval(() => {
      if (!this.player || typeof this.player.getCurrentTime !== 'function') return;
      const cur = this.player.getCurrentTime() || 0;
      const dur = this.player.getDuration() || 0;
      this.timeListeners.forEach(listener => listener(cur, dur));
    }, 500);
  }

  _stopTicker() {
    if (this.ticker) { clearInterval(this.ticker); this.ticker = null; }
  }

  // --- Public API ---
  
  addTimeListener(listener) {
    this.timeListeners.add(listener);
  }

  removeTimeListener(listener) {
    this.timeListeners.delete(listener);
  }

  play(videoId) {
    if (!videoId) return;
    this._startSilentKeepAlive();
    if (this.ready && this.player && typeof this.player.loadVideoById === 'function') {
      this.player.loadVideoById(videoId);
    } else {
      this.queued = videoId;
      this.init();
    }
  }

  resume() {
    this._startSilentKeepAlive();
    if (this.player && typeof this.player.playVideo === 'function') this.player.playVideo();
  }

  pause() {
    this._stopSilentKeepAlive();
    this._stopTicker();
    if (this.player && typeof this.player.pauseVideo === 'function') this.player.pauseVideo();
  }

  seekTo(seconds) {
    if (this.player && typeof this.player.seekTo === 'function') this.player.seekTo(seconds, true);
  }

  setVolume(v) {
    // v is 0-100
    if (this.player && typeof this.player.setVolume === 'function') {
      this.player.setVolume(Math.max(0, Math.min(100, v)));
    }
  }

  getCurrentTime() {
    return (this.player && typeof this.player.getCurrentTime === 'function') ? this.player.getCurrentTime() || 0 : 0;
  }

  getDuration() {
    return (this.player && typeof this.player.getDuration === 'function') ? this.player.getDuration() || 0 : 0;
  }
}

export const yt = new YouTube();
