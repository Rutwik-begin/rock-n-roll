import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat,
  Volume2, VolumeX, Heart, ListPlus, Plus, Check, Mic2,
  ChevronDown, Maximize2
} from 'lucide-react';
import { yt } from '../services/youtube';
import { storage } from '../services/storage';

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
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
        <ListPlus size={18} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', left: 0, bottom: '100%', marginBottom: 8,
          background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-md)', padding: '6px 0', minWidth: 180,
          zIndex: 2000, boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
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

// Extracted Timeline component
function PlayerTimeline({ onNext }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const seekRef = useRef(false);

  useEffect(() => {
    const handleTimeUpdate = (cur, dur) => {
      if (!seekRef.current) {
        setCurrentTime(cur);
        if (dur > 0) setDuration(dur);
      }
    };
    
    yt.addTimeListener(handleTimeUpdate);
    yt.onEnded = () => { if (onNext) onNext(); };
    
    return () => {
      yt.removeTimeListener(handleTimeUpdate);
      yt.onEnded = null;
    };
  }, [onNext]);

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    seekRef.current = true;
  };

  const handleSeekEnd = (e) => {
    const val = parseFloat(e.target.value);
    yt.seekTo(val);
    seekRef.current = false;
  };

  const seekProgress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="player-timeline">
      <span className="time-label">{formatTime(currentTime)}</span>
      <input
        type="range" min="0" max={duration || 100} step="0.5"
        value={currentTime}
        onChange={handleSeek}
        onMouseUp={handleSeekEnd}
        onTouchEnd={handleSeekEnd}
        style={{ '--progress': `${seekProgress}%` }}
      />
      <span className="time-label">{formatTime(duration)}</span>
    </div>
  );
}

export default function Player({
  currentTrack, isPlaying,
  onPlayPause, onNext, onPrev,
  shuffle, onToggleShuffle,
  repeat, onToggleRepeat,
  isLiked, onToggleLike,
  playlists, onAddToPlaylist,
  onToggleLyrics, showLyrics
}) {
  const [volume, setVolume] = useState(() => storage.getVolume());
  const [muted, setMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const prevTrackIdRef = useRef(null);

  // Auto-expand to full screen ONLY when the user explicitly clicks a song to play
  useEffect(() => {
    if (currentTrack?.id && currentTrack.id !== prevTrackIdRef.current) {
      if (currentTrack.isUserClick !== false) {
        setIsExpanded(true);
      }
      prevTrackIdRef.current = currentTrack.id;
    }
  }, [currentTrack?.id, currentTrack?.isUserClick]);

  // Init volume
  useEffect(() => {
    yt.setVolume(muted ? 0 : volume);
  }, [volume, muted]);

  const handleVolume = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    storage.setVolume(v);
    if (muted && v > 0) setMuted(false);
  };

  const toggleMute = () => {
    setMuted(m => {
      yt.setVolume(!m ? 0 : volume);
      return !m;
    });
  };

  const volProgress = muted ? 0 : volume;

  if (!currentTrack) {
    return (
      <footer className="player-bar" style={{ opacity: 0.5 }}>
        <div className="player-track-info">
          <div style={{ width: 56, height: 56, borderRadius: 6, background: 'var(--bg-elevated)' }} />
          <div className="player-track-meta">
            <div className="ptm-title" style={{ color: 'var(--text-muted)' }}>No track selected</div>
            <div className="ptm-artist">Search for a song to play</div>
          </div>
        </div>
        <div className="player-controls">
          <div className="player-buttons">
            <button className="player-btn" disabled><Shuffle size={16} /></button>
            <button className="player-btn" disabled><SkipBack size={18} /></button>
            <button className="player-btn-play" disabled><Play size={18} /></button>
            <button className="player-btn" disabled><SkipForward size={18} /></button>
            <button className="player-btn" disabled><Repeat size={16} /></button>
          </div>
          <div className="player-timeline">
            <span className="time-label">0:00</span>
            <input type="range" min="0" max="100" value="0" disabled style={{ '--progress': '0%' }} />
            <span className="time-label">0:00</span>
          </div>
        </div>
        <div className="player-right" />
      </footer>
    );
  }

  // --- Expanded Full Screen Player View ---
  if (isExpanded) {
    return (
      <div className="expanded-player-overlay" style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 1500,
        background: 'radial-gradient(circle at 50% 30%, rgba(29, 185, 84, 0.22), rgba(18, 18, 18, 0.98) 75%)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '28px 36px 40px',
        animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        color: '#fff',
        overflowY: 'auto'
      }}>
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 720, margin: '0 auto' }}>
          <button
            onClick={() => setIsExpanded(false)}
            title="Collapse to Mini Player"
            style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >
            <ChevronDown size={24} />
          </button>

          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>
            Now Playing
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className={`like-btn ${isLiked ? 'liked' : ''}`}
              onClick={onToggleLike}
              title={isLiked ? 'Remove from Liked' : 'Save to Liked'}
              style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
            </button>
            {playlists && onAddToPlaylist && (
              <AddToPlaylistMenu track={currentTrack} playlists={playlists} onAddToPlaylist={onAddToPlaylist} />
            )}
          </div>
        </div>

        {/* Center Artwork & Metadata */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', margin: 'auto 0', padding: '20px 0' }}>
          <div style={{ position: 'relative', marginBottom: 28 }}>
            <img
              src={currentTrack.thumbnail}
              alt=""
              style={{
                width: 'min(340px, 68vw)',
                height: 'min(340px, 68vw)',
                objectFit: 'cover',
                borderRadius: 24,
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(29, 185, 84, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            />
          </div>

          <div style={{ maxWidth: 560, width: '100%', padding: '0 16px' }}>
            <h2 style={{ fontSize: 'clamp(20px, 3.5vw, 32px)', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.2 }}>
              {currentTrack.title}
            </h2>
            <p style={{ fontSize: 'clamp(14px, 2vw, 18px)', color: 'rgba(255,255,255,0.6)', marginTop: 8, fontWeight: 500 }}>
              {currentTrack.resolving ? (
                <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Finding track…</span>
              ) : currentTrack.artist}
            </p>
          </div>
        </div>

        {/* Controls & Progress */}
        <div style={{ width: '100%', maxWidth: 680, margin: '0 auto' }}>
          <PlayerTimeline onNext={onNext} />

          {/* Main Controls Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, margin: '20px 0 16px' }}>
            <button className={`player-btn ${shuffle ? 'active' : ''}`} onClick={onToggleShuffle} title="Shuffle" style={{ width: 44, height: 44 }}>
              <Shuffle size={20} />
            </button>
            <button className="player-btn" onClick={onPrev} title="Previous" style={{ width: 48, height: 48 }}>
              <SkipBack size={24} />
            </button>
            <button
              className="player-btn-play"
              onClick={onPlayPause}
              title={isPlaying ? 'Pause' : 'Play'}
              style={{ width: 64, height: 64, boxShadow: '0 10px 30px rgba(29, 185, 84, 0.4)' }}
            >
              {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" style={{ marginLeft: 3 }} />}
            </button>
            <button className="player-btn" onClick={onNext} title="Next" style={{ width: 48, height: 48 }}>
              <SkipForward size={24} />
            </button>
            <button className={`player-btn ${repeat ? 'active' : ''}`} onClick={onToggleRepeat} title="Repeat" style={{ width: 44, height: 44 }}>
              <Repeat size={20} />
            </button>
          </div>

          {/* Bottom Controls Row: Volume & Lyrics */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            {onToggleLyrics ? (
              <button
                className={`player-btn ${showLyrics ? 'active' : ''}`}
                onClick={onToggleLyrics}
                title="Lyrics"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                  borderRadius: 20, background: showLyrics ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                  color: showLyrics ? '#000' : '#fff', fontWeight: 700, fontSize: 13, border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Mic2 size={16} /> Lyrics
              </button>
            ) : <div />}

            <div className="volume-slider" style={{ gap: 8 }}>
              <button className="player-btn" onClick={toggleMute}>
                {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range" min="0" max="100" step="1"
                value={muted ? 0 : volume}
                onChange={handleVolume}
                style={{ '--progress': `${volProgress}%`, width: 100 }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Mini Player Bar View ---
  return (
    <footer className="player-bar">
      {/* Left: Track Info (Clicking expands to full screen) */}
      <div className="player-track-info" onClick={() => setIsExpanded(true)} style={{ cursor: 'pointer' }} title="Expand Now Playing">
        <img src={currentTrack.thumbnail} alt="" />
        <div className="player-track-meta">
          <div className="ptm-title truncate">{currentTrack.title}</div>
          <div className="ptm-artist truncate">
            {currentTrack.resolving ? (
              <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Finding track…</span>
            ) : currentTrack.artist}
          </div>
        </div>
        <button
          className={`like-btn ${isLiked ? 'liked' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleLike(); }}
          title={isLiked ? 'Remove from Liked' : 'Save to Liked'}
        >
          <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
        {playlists && onAddToPlaylist && (
          <AddToPlaylistMenu
            track={currentTrack}
            playlists={playlists}
            onAddToPlaylist={onAddToPlaylist}
          />
        )}
      </div>

      {/* Center: Controls + Timeline */}
      <div className="player-controls">
        <div className="player-buttons">
          <button className={`player-btn ${shuffle ? 'active' : ''}`} onClick={onToggleShuffle} title="Shuffle">
            <Shuffle size={16} />
          </button>
          <button className="player-btn" onClick={onPrev} title="Previous">
            <SkipBack size={18} />
          </button>
          <button className="player-btn-play" onClick={onPlayPause} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" style={{ marginLeft: 2 }} />}
          </button>
          <button className="player-btn" onClick={onNext} title="Next">
            <SkipForward size={18} />
          </button>
          <button className={`player-btn ${repeat ? 'active' : ''}`} onClick={onToggleRepeat} title="Repeat">
            <Repeat size={16} />
          </button>
        </div>
        <PlayerTimeline onNext={onNext} />
      </div>

      {/* Right: Volume, Lyrics & Fullscreen Expand button */}
      <div className="player-right">
        {onToggleLyrics && (
          <button 
            className={`player-btn ${showLyrics ? 'active' : ''}`} 
            onClick={onToggleLyrics} 
            title="Lyrics"
            style={{ marginRight: 8, color: showLyrics ? 'var(--accent)' : 'inherit' }}
          >
            <Mic2 size={18} />
          </button>
        )}
        <div className="volume-slider" style={{ marginRight: 12 }}>
          <button className="player-btn" onClick={toggleMute}>
            {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range" min="0" max="100" step="1"
            value={muted ? 0 : volume}
            onChange={handleVolume}
            style={{ '--progress': `${volProgress}%` }}
          />
        </div>
        <button
          className="player-btn"
          onClick={() => setIsExpanded(true)}
          title="Open Full Screen Player"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Maximize2 size={18} />
        </button>
      </div>
    </footer>
  );
}
