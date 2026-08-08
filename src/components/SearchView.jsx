import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, ListPlus, Check, Clock, X, Trash2, Disc3, Play } from 'lucide-react';
import { searchTracks, searchAlbumsAndTracks } from '../services/search';
import { storage } from '../services/storage';
import EqualizerIcon from './EqualizerIcon';

const GENRES = [
  { name: 'Pop Hits', query: 'top pop hits 2024', color: '#ec4899' },
  { name: 'Hip Hop', query: 'hip hop trending', color: '#f59e0b' },
  { name: 'Lo-Fi Chill', query: 'lofi hip hop chill beats', color: '#8b5cf6' },
  { name: 'Rock', query: 'rock classics playlist', color: '#ef4444' },
  { name: 'EDM', query: 'edm dance music', color: '#3b82f6' },
  { name: 'R&B Soul', query: 'r&b soul music', color: '#10b981' },
  { name: 'Bollywood', query: 'bollywood hits 2024', color: '#f97316' },
  { name: 'Anime', query: 'anime openings best', color: '#6366f1' },
  { name: 'K-Pop', query: 'kpop trending 2024', color: '#e11d48' },
  { name: 'Classical', query: 'classical music relaxing', color: '#14b8a6' },
  { name: 'Jazz', query: 'smooth jazz playlist', color: '#a855f7' },
  { name: 'Synthwave', query: 'synthwave retrowave', color: '#d946ef' },
];

function AddToPlaylistMenu({ track, playlists, onAddToPlaylist }) {
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const handleAdd = (plId) => {
    onAddToPlaylist(plId, track);
    setAdded(plId);
    setTimeout(() => { setAdded(null); setOpen(false); }, 600);
  };

  if (!playlists || playlists.length === 0) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="player-btn"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        title="Add to playlist"
        style={{ color: 'var(--text-muted)' }}
      >
        <ListPlus size={16} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 4,
          background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-md)', padding: '6px 0', minWidth: 180,
          zIndex: 100, boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
        }}>
          <div style={{ padding: '6px 12px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            Add to playlist
          </div>
          {playlists.map(pl => (
            <button
              key={pl.id}
              onClick={(e) => { e.stopPropagation(); handleAdd(pl.id); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '8px 12px', background: 'none', border: 'none',
                color: added === pl.id ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 13, cursor: 'pointer', textAlign: 'left',
                transition: 'all 150ms',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              {added === pl.id ? <Check size={14} /> : <Plus size={14} />}
              <span className="truncate">{pl.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const TYPE_FILTERS = [
  { id: 'all', label: 'All Results', icon: '✨' },
  { id: 'songs', label: 'Songs & Music', icon: '🎵' },
  { id: 'podcasts', label: 'Podcasts & Shows', icon: '🎙️' },
];

const DURATION_FILTERS = [
  { id: 'all', label: 'All Durations', icon: '⏱️' },
  { id: 'short', label: '< 6 mins (Songs)', icon: '⚡' },
  { id: 'medium', label: '6 - 20 mins', icon: '🎶' },
  { id: 'long', label: '20+ mins (Compilations / OSTs / Episodes)', icon: '🎧' },
];

const PODCAST_KEYWORDS = /\b(podcast|episode|ep\s*\d+|show|talk|interview|audiobook|discussion|story|commentary|radio|stream|hub|talkshow)\b/i;

const SONG_EXCLUDE_PATTERNS = /\b(mashup|jukebox|compilation|full album|album|nonstop|non-stop|party mix|dj mix|top 10|top 20|top 50|top 100|jukeboxes|audio jukebox|video jukebox|full songs|all songs|best of|collection|playlist|medley|remix mashup|party mashup|mega mix|megamix|lofi mix|chill mix)\b/i;

function isPodcastTrack(track) {
  if (!track) return false;
  const title = track.title || '';
  const artist = track.artist || '';
  return PODCAST_KEYWORDS.test(title) || PODCAST_KEYWORDS.test(artist);
}

function isPureSong(track) {
  if (!track) return false;
  const dur = track.duration || 0;
  // Standard song length must not exceed 7.5 minutes (450s)
  if (dur > 450) return false;
  const title = track.title || '';
  if (SONG_EXCLUDE_PATTERNS.test(title)) return false;
  if (isPodcastTrack(track)) return false;
  return true;
}

export default function SearchView({ onPlayTrack, currentTrack, isPlaying, playlists, onAddToPlaylist, onOpenMovieAlbum, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [detectedAlbum, setDetectedAlbum] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [durationFilter, setDurationFilter] = useState('all');
  const [history, setHistory] = useState(() => storage.getSearchHistory());
  const debounceRef = useRef(null);

  const doSearch = useCallback(async (q, overrideType) => {
    if (!q.trim()) { setResults([]); setDetectedAlbum(null); return; }
    setLoading(true);
    try {
      const activeType = overrideType || typeFilter;
      const searchQuery = activeType === 'podcasts' ? `${q} podcast` : q;
      const data = await searchAlbumsAndTracks(searchQuery);
      setResults(data.tracks || []);
      setDetectedAlbum(data.album || null);
    } catch (err) {
      console.warn('Search error:', err);
    }
    setLoading(false);
  }, [typeFilter]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      doSearch(initialQuery);
    }
  }, [initialQuery, doSearch]);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 400);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    doSearch(query);
  };

  const handleGenreClick = (genre) => {
    setQuery(genre.query);
    doSearch(genre.query);
  };

  const handleTypeFilterChange = (newType) => {
    setTypeFilter(newType);
    if (query.trim()) {
      doSearch(query, newType);
    }
  };

  const handlePlayTrackAndSaveHistory = (track, trackQueue) => {
    if (track) {
      const updatedHistory = storage.addSearchHistory(track);
      setHistory(updatedHistory);
    }
    onPlayTrack(track, trackQueue);
  };

  const handleRemoveHistoryItem = (e, trackId) => {
    e.stopPropagation();
    const updated = storage.removeSearchHistory(trackId);
    setHistory(updated);
  };

  const handleClearHistory = () => {
    const updated = storage.clearSearchHistory();
    setHistory(updated);
  };

  const formatDur = (s) => {
    if (!s) return '';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const filteredResults = results.filter(track => {
    // 1. Content Type Filter
    if (typeFilter === 'songs') {
      if (!isPureSong(track)) return false;
    } else if (typeFilter === 'podcasts') {
      if (!isPodcastTrack(track) && (track.duration && track.duration < 300)) return false;
    }

    // 2. Duration Filter
    if (durationFilter === 'all') return true;
    const durMins = (track.duration || 0) / 60;
    if (durationFilter === 'short') return durMins > 0 && durMins < 6;
    if (durationFilter === 'medium') return durMins >= 6 && durMins <= 20;
    if (durationFilter === 'long') return durMins > 20 || durMins === 0;
    return true;
  });

  return (
    <div>
      <h1 className="section-title" style={{ marginBottom: 20 }}>Search</h1>

      <form onSubmit={handleSubmit} className="search-container">
        <Search size={18} className="search-icon" />
        <input
          className="search-input"
          type="text"
          placeholder="What do you want to listen to?"
          value={query}
          onChange={handleChange}
          autoFocus
        />
      </form>

      {/* FILTER CONTROLS (CATEGORY & DURATION) */}
      {query.trim() && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '18px 0 24px 0' }}>
          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, minWidth: 72 }}>
              Category:
            </span>
            {TYPE_FILTERS.map(t => {
              const active = typeFilter === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTypeFilterChange(t.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: active ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
                    background: active ? 'var(--accent)' : 'var(--glass-bg)',
                    color: active ? '#000' : 'var(--text-primary)',
                    boxShadow: active ? '0 0 15px rgba(29, 185, 84, 0.3)' : 'none',
                    transition: 'all 200ms ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Duration Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, minWidth: 72 }}>
              Duration:
            </span>
            {DURATION_FILTERS.map(f => {
              const active = durationFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setDurationFilter(f.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: active ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
                    background: active ? 'var(--accent)' : 'var(--glass-bg)',
                    color: active ? '#000' : 'var(--text-primary)',
                    boxShadow: active ? '0 0 15px rgba(29, 185, 84, 0.3)' : 'none',
                    transition: 'all 200ms ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* RICH SEARCH HISTORY SECTION */}
      {history.length > 0 && !query && (
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={16} /> Recent Searches
            </h3>
            <button
              onClick={handleClearHistory}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--red)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <Trash2 size={13} /> Clear History
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 12
          }}>
            {history.map(item => {
              const itemId = item.id || item.videoId;
              const isActive = currentTrack && (currentTrack.id === itemId || currentTrack.videoId === itemId);
              return (
                <div
                  key={itemId}
                  className="recent-card"
                  style={{
                    position: 'relative',
                    paddingRight: 36,
                    border: isActive ? '1px solid var(--accent)' : '1px solid var(--glass-border)'
                  }}
                  onClick={() => handlePlayTrackAndSaveHistory(item, history)}
                >
                  <img src={item.thumbnail} alt="" style={{ width: 64, height: 64, objectFit: 'cover' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="recent-title" style={{ fontSize: 13, fontWeight: 600, color: isActive ? 'var(--accent)' : '#fff' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }} className="truncate">
                      {item.artist}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleRemoveHistoryItem(e, itemId)}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 6,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--red)';
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.background = 'none';
                    }}
                    title="Remove from search history"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BROWSE GENRES (shown when no query is active) */}
      {!query && !loading && (
        <div style={{ marginBottom: 32 }}>
          <h2 className="section-title" style={{ fontSize: 20 }}>Browse Genres</h2>
          <div className="genre-grid">
            {GENRES.map(g => (
              <div
                key={g.name}
                className="genre-card"
                style={{ background: `linear-gradient(135deg, ${g.color}, ${g.color}88)` }}
                onClick={() => handleGenreClick(g)}
              >
                {g.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="track-list">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="track-row" style={{ pointerEvents: 'none' }}>
              <div className="track-num" />
              <div className="skeleton" style={{ width: 44, height: 44 }} />
              <div className="track-info">
                <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 6 }} />
                <div className="skeleton" style={{ width: '40%', height: 12 }} />
              </div>
              <div />
              <div className="skeleton" style={{ width: 32, height: 12 }} />
            </div>
          ))}
        </div>
      )}

      {/* ═══════ SECTION 1: INDIVIDUAL SONGS & TRACKS ═══════ */}
      {!loading && filteredResults.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--text-muted)', marginBottom: 14 }}>
            🎵 Songs & Tracks
          </h3>
          <div className="track-list">
            {filteredResults.map((track, i) => {
              const isActive = currentTrack && currentTrack.id === track.id;
              return (
                <div
                  key={track.id}
                  className={`track-row ${isActive ? 'playing' : ''}`}
                  onClick={() => handlePlayTrackAndSaveHistory(track, filteredResults)}
                >
                  <div className="track-num">
                    {isActive && isPlaying ? (
                      <EqualizerIcon size={14} color="var(--accent)" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <img className="track-thumb" src={track.thumbnail} alt="" />
                  <div className="track-info">
                    <div className="track-title">{track.title}</div>
                    <div className="track-artist">{track.artist}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <AddToPlaylistMenu
                      track={track}
                      playlists={playlists}
                      onAddToPlaylist={onAddToPlaylist}
                    />
                  </div>
                  <div className="track-duration">{formatDur(track.duration)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════ SECTION 2: DEDICATED MOVIE ALBUMS & SOUNDTRACKS ═══════ */}
      {!loading && detectedAlbum && detectedAlbum.tracks && detectedAlbum.tracks.length > 0 && (
        <div className="movie-album-section">
          <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--text-muted)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Disc3 size={18} className="text-accent spin-slow" /> Movie Albums & Soundtracks
          </h3>

          <div className="search-album-card-full">
            <div className="search-album-header-row">
              <img className="search-album-poster" src={detectedAlbum.coverArt} alt="" />
              <div className="search-album-info">
                <span className="search-album-tag">
                  <Disc3 size={14} /> FULL MOVIE SOUNDTRACK
                </span>
                <div className="search-album-title">{detectedAlbum.movieTitle}</div>
                <div className="search-album-sub">
                  {detectedAlbum.tracks.length} Songs in Sequential Order
                </div>
              </div>
              <div className="search-album-actions">
                <button
                  className="search-album-play-btn"
                  onClick={() => onPlayTrack(detectedAlbum.tracks[0], detectedAlbum.tracks)}
                >
                  <Play size={16} fill="#000" /> Play Full Album
                </button>
              </div>
            </div>

            {/* ORDERED MOVIE SONGS LIST */}
            <div className="search-album-ordered-title">
              Movie Tracklist (In Order)
            </div>
            <div className="search-album-ordered-list">
              {detectedAlbum.tracks.map((albumTrack, idx) => {
                const isActive = currentTrack && currentTrack.id === albumTrack.id;
                return (
                  <div
                    key={albumTrack.id + '-' + idx}
                    className={`search-album-ordered-item ${isActive ? 'active' : ''}`}
                    onClick={() => handlePlayTrackAndSaveHistory(albumTrack, detectedAlbum.tracks)}
                  >
                    <div className="search-album-item-num">
                      {isActive && isPlaying ? (
                        <EqualizerIcon size={14} color="var(--accent)" />
                      ) : (
                        `${idx + 1}.`
                      )}
                    </div>
                    <div className="search-album-item-info">
                      <div className={`search-album-item-title ${isActive ? 'text-accent' : ''}`}>
                        {albumTrack.title}
                      </div>
                      <div className="search-album-item-artist">{albumTrack.artist}</div>
                    </div>
                    <div className="search-album-item-dur">{formatDur(albumTrack.duration)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!loading && query && results.length > 0 && filteredResults.length === 0 && (
        <div className="empty-state">
          <Clock size={36} style={{ color: 'var(--text-muted)' }} />
          <p>No tracks found matching the selected duration filter</p>
          <button
            onClick={() => setDurationFilter('all')}
            style={{
              marginTop: 12,
              padding: '8px 18px',
              borderRadius: 20,
              background: 'var(--accent)',
              border: 'none',
              color: '#000',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Show All Durations
          </button>
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <div className="empty-state">
          <Search />
          <p>No results found for &ldquo;{query}&rdquo;</p>
          <p style={{ fontSize: 13 }}>Try a different search, or paste a YouTube link</p>
        </div>
      )}
    </div>
  );
}
