/**
 * Local Storage Service
 * Manages liked songs, playlists, recently played, and volume.
 */

const KEY = {
  LIKED: 'aura_liked',
  PLAYLISTS: 'aura_playlists',
  RECENT: 'aura_recent',
  SEARCH_HISTORY: 'aura_search_history',
  VOLUME: 'aura_volume',
};

function get(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function set(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  // --- Liked Tracks (stored as full track objects) ---
  getLiked() {
    return get(KEY.LIKED, []);
  },

  saveLiked(tracks) {
    set(KEY.LIKED, tracks || []);
    return tracks || [];
  },

  isLiked(videoId) {
    return this.getLiked().some(t => t.id === videoId);
  },

  toggleLike(track) {
    const liked = this.getLiked();
    const exists = liked.findIndex(t => t.id === track.id);
    let updated;
    if (exists >= 0) {
      updated = liked.filter((_, i) => i !== exists);
    } else {
      updated = [track, ...liked];
    }
    set(KEY.LIKED, updated);
    return updated;
  },

  // --- Recently Played (stored as full track objects, max 20) ---
  getRecent() {
    return get(KEY.RECENT, []);
  },

  saveRecent(tracks) {
    set(KEY.RECENT, tracks || []);
    return tracks || [];
  },

  addRecent(track) {
    const current = this.getRecent().filter(t => t.id !== track.id);
    const updated = [track, ...current].slice(0, 20);
    set(KEY.RECENT, updated);
    return updated;
  },

  // --- Search History (stored track objects, max 15) ---
  getSearchHistory() {
    return get(KEY.SEARCH_HISTORY, []);
  },

  addSearchHistory(track) {
    if (!track || (!track.id && !track.videoId) || !track.title) return this.getSearchHistory();
    const id = track.id || track.videoId;
    const current = this.getSearchHistory().filter(item => (item.id || item.videoId) !== id);
    const updated = [{
      id: id,
      videoId: track.videoId || id,
      title: track.title,
      artist: track.artist || 'Unknown Artist',
      thumbnail: track.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      duration: track.duration || 0
    }, ...current].slice(0, 15);
    set(KEY.SEARCH_HISTORY, updated);
    return updated;
  },

  removeSearchHistory(trackId) {
    const updated = this.getSearchHistory().filter(item => (item.id || item.videoId) !== trackId);
    set(KEY.SEARCH_HISTORY, updated);
    return updated;
  },

  clearSearchHistory() {
    set(KEY.SEARCH_HISTORY, []);
    return [];
  },

  // --- Playlists ---
  getPlaylists() {
    const raw = get(KEY.PLAYLISTS, []);
    if (!Array.isArray(raw)) return [];
    
    // Filter out legacy empty void playlists like 'My Hi-Fi Favorites', 'Late Night Chill & Focus'
    const clean = raw
      .filter(p => p && p.id && p.name && !['My Hi-Fi Favorites', 'Late Night Chill & Focus'].includes(p.name))
      .map(p => ({
        ...p,
        tracks: Array.isArray(p.tracks) ? p.tracks : []
      }));
    return clean;
  },

  savePlaylists(playlists) {
    const clean = (playlists || [])
      .filter(p => p && p.id && p.name && !['My Hi-Fi Favorites', 'Late Night Chill & Focus'].includes(p.name))
      .map(p => ({
        ...p,
        tracks: Array.isArray(p.tracks) ? p.tracks : []
      }));
    set(KEY.PLAYLISTS, clean);
    return clean;
  },

  createPlaylist(name) {
    const playlists = this.getPlaylists();
    const pl = {
      id: `pl-${Date.now()}`,
      name,
      tracks: [],
      createdAt: Date.now(),
    };
    const updated = [pl, ...playlists];
    set(KEY.PLAYLISTS, updated);
    return updated;
  },

  deletePlaylist(plId) {
    const updated = this.getPlaylists().filter(p => p.id !== plId);
    set(KEY.PLAYLISTS, updated);
    return updated;
  },

  addToPlaylist(plId, track) {
    const playlists = this.getPlaylists().map(p => {
      if (p.id === plId && !p.tracks.some(t => t.id === track.id)) {
        return { ...p, tracks: [...p.tracks, track] };
      }
      return p;
    });
    set(KEY.PLAYLISTS, playlists);
    return playlists;
  },

  removeFromPlaylist(plId, trackId) {
    const playlists = this.getPlaylists().map(p => {
      if (p.id === plId) {
        return { ...p, tracks: p.tracks.filter(t => t.id !== trackId) };
      }
      return p;
    });
    set(KEY.PLAYLISTS, playlists);
    return playlists;
  },

  // --- Volume ---
  getVolume() {
    const v = localStorage.getItem(KEY.VOLUME);
    return v !== null ? parseFloat(v) : 80;
  },

  setVolume(v) {
    localStorage.setItem(KEY.VOLUME, String(v));
  },
};
