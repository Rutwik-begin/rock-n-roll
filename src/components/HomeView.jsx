import React, { useState } from 'react';
import { Flame, ListPlus, Check, Plus, Music } from 'lucide-react';
import EqualizerIcon from './EqualizerIcon';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDur(s) {
  if (!s) return '';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

// ─── Add to Playlist Popup ─────────────────────────────────────────────────────
function AddToPlaylistMenu({ track, playlists, onAddToPlaylist }) {
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(null);
  const ref = React.useRef(null);

  React.useEffect(() => {
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

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function TrendingGridSkeleton() {
  return (
    <div className="trending-skeleton-grid">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="trending-skeleton-card">
          <div className="trending-skeleton-rank skeleton" />
          <div className="trending-skeleton-art skeleton" />
          <div className="trending-skeleton-lines">
            <div className="trending-skeleton-line1 skeleton" />
            <div className="trending-skeleton-line2 skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Trending Track List Sub-component (legacy, for Telugu/Hindi/English) ────
function TrendingSection({ title, accentColor, tracks, currentTrack, isPlaying, onPlayTrack, playlists, onAddToPlaylist }) {
  if (!tracks || tracks.length === 0) return null;

  return (
    <div className="trending-section">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 4, height: 24, borderRadius: 2,
          background: accentColor,
        }} />
        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700,
          color: 'var(--text-primary)', margin: 0,
        }}>
          {title}
        </h3>
        <span style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          background: accentColor, color: '#fff', padding: '2px 8px',
          borderRadius: 4, letterSpacing: 0.5,
        }}>
          TOP 5
        </span>
      </div>
      <div className="track-list">
        {tracks.slice(0, 5).map((track, i) => {
          const isActive = currentTrack && currentTrack.id === track.id;
          return (
            <div
              key={track.id}
              className={`track-row ${isActive ? 'playing' : ''}`}
              onClick={() => onPlayTrack(track, tracks)}
            >
              <div className="track-num" style={{ fontWeight: 700, color: i < 3 ? accentColor : 'var(--text-muted)' }}>
                {isActive && isPlaying ? (
                  <div className="playing-bars">
                    <span /><span /><span /><span />
                  </div>
                ) : (
                  `#${i + 1}`
                )}
              </div>
              <img className="track-thumb" src={track.thumbnail} alt="" />
              <div className="track-info">
                <div className="track-title">{track.title}</div>
                <div className="track-artist">{track.artist}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
  );
}

// ─── Category definitions ────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'global',
    icon: '🌍',
    title: 'Top 20 Global',
    subtitle: 'Apple Music Charts',
    gradient: 'linear-gradient(135deg, #1db954, #34d399)',
    accent: '#1db954',
    glowRgb: '29, 185, 84',
  },
  {
    id: 'india',
    icon: '🇮🇳',
    title: 'Top 20 India',
    subtitle: 'Apple Music Charts',
    gradient: 'linear-gradient(135deg, #f97316, #fbbf24)',
    accent: '#f97316',
    glowRgb: '249, 115, 22',
  },
  {
    id: 'telugu',
    icon: '🎵',
    title: 'Telugu Trending',
    subtitle: 'YouTube Trending',
    gradient: 'linear-gradient(135deg, #f97316, #fb923c)',
    accent: '#f97316',
    glowRgb: '249, 115, 22',
  },
  {
    id: 'hindi',
    icon: '🎵',
    title: 'Hindi Trending',
    subtitle: 'YouTube Trending',
    gradient: 'linear-gradient(135deg, #ec4899, #f472b6)',
    accent: '#ec4899',
    glowRgb: '236, 72, 153',
  },
  {
    id: 'english',
    icon: '🎵',
    title: 'English Trending',
    subtitle: 'YouTube Trending',
    gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
    accent: '#3b82f6',
    glowRgb: '59, 130, 246',
  },
];

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function HomeView({
  recentTracks = [],
  topGlobal = [],
  topIndia = [],
  trendingTelugu = [],
  trendingHindi = [],
  trendingEnglish = [],
  topGlobalLoading = true,
  topIndiaLoading = true,
  onPlayTrack,
  currentTrack,
  isPlaying,
  playlists,
  onAddToPlaylist
}) {
  const [activeCategory, setActiveCategory] = useState('global');

  // Map category id → tracks + loading state
  const categoryData = {
    global:  { tracks: topGlobal,       loading: topGlobalLoading },
    india:   { tracks: topIndia,        loading: topIndiaLoading },
    telugu:  { tracks: trendingTelugu,  loading: false },
    hindi:   { tracks: trendingHindi,   loading: false },
    english: { tracks: trendingEnglish, loading: false },
  };

  const activeCat = CATEGORIES.find(c => c.id === activeCategory);
  const { tracks: activeTracks, loading: activeLoading } = categoryData[activeCategory];

  return (
    <div>
      <h1 className="greeting">{getGreeting()}</h1>

      {/* ═══════ SECTION 1: TOP TRENDING SONGS ═══════ */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          <h2 className="section-title" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Flame size={24} color="var(--accent)" /> Top Trending Songs
          </h2>
          {activeLoading && (
            <div className="trending-loading-badge">
              Loading charts
              <div className="dot-pulse"><span /><span /><span /></div>
            </div>
          )}
          {!activeLoading && activeTracks.length > 0 && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {activeTracks.length} tracks • {activeCat?.title}
            </span>
          )}
        </div>

        {/* ── Category Selector Boxes ── */}
        <div className="category-boxes">
          {CATEGORIES.map(cat => (
            <div
              key={cat.id}
              className={`category-box ${activeCategory === cat.id ? 'active' : ''}`}
              style={{
                '--cat-gradient': cat.gradient,
                '--cat-accent': cat.accent,
                '--cat-glow-rgb': cat.glowRgb,
              }}
              onClick={() => setActiveCategory(cat.id)}
            >
              <div className="category-box-icon">{cat.icon}</div>
              <div className="category-box-text">
                <div className="category-box-title">{cat.title}</div>
                <div className="category-box-subtitle">{cat.subtitle}</div>
              </div>
              <div className="category-box-count">
                {categoryData[cat.id].loading ? '…' : `${categoryData[cat.id].tracks.length}`}
              </div>
            </div>
          ))}
        </div>

        {/* ── Song Grid or Skeleton ── */}
        {activeLoading ? (
          <TrendingGridSkeleton />
        ) : activeTracks.length > 0 ? (
          <div className="trending-grid">
            {activeTracks.map((track, i) => {
              const isActive = currentTrack && currentTrack.id === track.id;
              const rank = track.rank || i + 1;
              return (
                <div
                  key={track.id + '-' + i}
                  className={`trending-card ${isActive ? 'playing' : ''}`}
                  onClick={() => onPlayTrack(track, activeTracks)}
                >
                  <div className={`trending-card-rank ${rank <= 3 ? 'top-3' : ''}`}>
                    {isActive && isPlaying ? (
                      <EqualizerIcon size={16} color="var(--accent)" />
                    ) : (
                      rank
                    )}
                  </div>
                  <img
                    className="trending-card-artwork"
                    src={track.thumbnail}
                    alt=""
                    loading="lazy"
                  />
                  <div className="trending-card-info">
                    <div className="trending-card-title">{track.title}</div>
                    <div className="trending-card-artist">{track.artist}</div>
                  </div>
                  <div className="trending-card-actions">
                    <AddToPlaylistMenu
                      track={track}
                      playlists={playlists}
                      onAddToPlaylist={onAddToPlaylist}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <Music size={36} />
            <p>No tracks available for this category yet.</p>
          </div>
        )}
      </div>

      {/* ═══════ SECTION 2: RECENTLY PLAYED ═══════ */}
      {recentTracks.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h2 className="section-title">Recently Played</h2>
          <div className="recent-grid">
            {recentTracks.slice(0, 6).map(track => (
              <div
                key={track.id}
                className="recent-card"
                onClick={() => onPlayTrack(track, recentTracks)}
              >
                <img src={track.thumbnail} alt="" />
                <span className="recent-title">{track.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
