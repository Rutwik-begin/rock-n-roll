import React, { useState, useEffect, useRef } from 'react';
import { Heart, Music, Trash2, ListPlus, Plus, Check } from 'lucide-react';

function formatDur(s) {
  if (!s) return '';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

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

function TrackList({ tracks = [], onPlayTrack, currentTrack, isPlaying, emptyMessage, playlists, onAddToPlaylist, onRemoveFromPlaylist }) {
  const validTracks = (tracks || []).filter(t => t && t.id && t.title);

  if (validTracks.length === 0) {
    return (
      <div className="empty-state">
        <Music size={32} />
        <p style={{ marginTop: 8 }}>{emptyMessage || 'No tracks yet'}</p>
      </div>
    );
  }

  return (
    <div className="track-list">
      {validTracks.map((track, i) => {
        const isActive = currentTrack && currentTrack.id === track.id;
        return (
          <div
            key={track.id + '-' + i}
            className={`track-row ${isActive ? 'playing' : ''}`}
            onClick={() => onPlayTrack(track, validTracks)}
          >
            <div className="track-num">
              {isActive && isPlaying ? (
                <div className="playing-bars">
                  <span /><span /><span /><span />
                </div>
              ) : (
                i + 1
              )}
            </div>
            <img className="track-thumb" src={track.thumbnail} alt="" />
            <div className="track-info">
              <div className="track-title">{track.title}</div>
              <div className="track-artist">{track.artist}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
              {onRemoveFromPlaylist && (
                <button
                  className="player-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFromPlaylist(track.id);
                  }}
                  title="Remove from playlist"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Trash2 size={16} />
                </button>
              )}
              {playlists && onAddToPlaylist && (
                <AddToPlaylistMenu
                  track={track}
                  playlists={playlists}
                  onAddToPlaylist={onAddToPlaylist}
                />
              )}
            </div>
            <div className="track-duration">{formatDur(track.duration)}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function LibraryView({
  view, setActiveView, likedTracks = [], playlists = [], onPlayTrack, currentTrack, isPlaying, onDeletePlaylist, onAddToPlaylist, onRemoveFromPlaylist
}) {
  // Liked Songs view
  if (view === 'liked') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 8,
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Heart size={28} fill="white" color="white" />
          </div>
          <div>
            <h1 className="section-title" style={{ marginBottom: 2 }}>Liked Songs</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{likedTracks.length} songs</p>
          </div>
        </div>
        <TrackList
          tracks={likedTracks}
          onPlayTrack={onPlayTrack}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          emptyMessage="Songs you like will appear here"
          playlists={playlists}
          onAddToPlaylist={onAddToPlaylist}
        />
      </div>
    );
  }

  // Playlist view
  if (view.startsWith('playlist-')) {
    const plId = view.replace('playlist-', '');
    const playlist = playlists.find(p => p.id === plId);
    if (!playlist) {
      return (
        <div className="empty-state">
          <Music size={32} />
          <p style={{ marginTop: 8 }}>Playlist not found or deleted.</p>
        </div>
      );
    }

    const playlistTracks = Array.isArray(playlist.tracks) ? playlist.tracks : [];

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 8,
            background: 'linear-gradient(135deg, #3b82f6, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Music size={28} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 className="section-title" style={{ marginBottom: 2 }}>{playlist.name}</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{playlistTracks.length} {playlistTracks.length === 1 ? 'song' : 'songs'}</p>
          </div>
          <button
            className="player-btn"
            onClick={() => onDeletePlaylist(playlist.id)}
            title="Delete Playlist"
            style={{ color: 'var(--red)' }}
          >
            <Trash2 size={18} />
          </button>
        </div>
        <TrackList
          tracks={playlistTracks}
          onPlayTrack={onPlayTrack}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          emptyMessage="Add songs to this playlist from search results or home page"
          onRemoveFromPlaylist={(trackId) => onRemoveFromPlaylist(playlist.id, trackId)}
        />
      </div>
    );
  }

  // Library overview
  return (
    <div>
      <h1 className="section-title">Your Library</h1>

      <div style={{ marginBottom: 32 }}>
        <h2 className="section-title" style={{ fontSize: 18 }}>Liked Songs ({likedTracks.length})</h2>
        <TrackList
          tracks={likedTracks.slice(0, 5)}
          onPlayTrack={onPlayTrack}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          emptyMessage="Songs you like will appear here"
          playlists={playlists}
          onAddToPlaylist={onAddToPlaylist}
        />
      </div>

      {playlists.length > 0 && (
        <div>
          <h2 className="section-title" style={{ fontSize: 18 }}>Your Playlists</h2>
          <div className="genre-grid">
            {playlists.map(pl => {
              const count = Array.isArray(pl?.tracks) ? pl.tracks.length : 0;
              return (
                <div
                  key={pl.id}
                  className="genre-card"
                  onClick={() => setActiveView && setActiveView(`playlist-${pl.id}`)}
                  style={{
                    background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-hover))',
                    border: '1px solid var(--glass-border)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{pl.name}</span>
                  <span style={{ fontSize: 12, opacity: 0.6 }}>{count} {count === 1 ? 'song' : 'songs'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
