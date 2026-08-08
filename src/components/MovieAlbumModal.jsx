import React, { useState, useEffect } from 'react';
import { X, Play, Disc3, Plus, Check, Loader, Music, ListPlus } from 'lucide-react';
import { fetchMovieAlbum } from '../services/search';
import EqualizerIcon from './EqualizerIcon';

export default function MovieAlbumModal({
  isOpen,
  onClose,
  track,
  currentTrack,
  isPlaying,
  onPlayTrack,
  playlists,
  onAddToPlaylist,
  onShowToast
}) {
  const [albumData, setAlbumData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !track) return;
    let isMounted = true;
    setLoading(true);
    setAlbumData(null);

    async function loadAlbum() {
      const data = await fetchMovieAlbum(track);
      if (isMounted) {
        setAlbumData(data);
        setLoading(false);
      }
    }
    loadAlbum();

    return () => { isMounted = false; };
  }, [isOpen, track]);

  if (!isOpen) return null;

  const handlePlayAll = () => {
    if (albumData && albumData.tracks && albumData.tracks.length > 0) {
      onPlayTrack(albumData.tracks[0], albumData.tracks);
      if (onShowToast) onShowToast(`Playing full movie album: ${albumData.movieTitle}`, 'success');
      onClose();
    }
  };

  const handleAddAllToPlaylist = (plId) => {
    if (albumData && albumData.tracks) {
      albumData.tracks.forEach(t => onAddToPlaylist(plId, t));
      const pl = playlists?.find(p => p.id === plId);
      if (onShowToast) onShowToast(`Added ${albumData.tracks.length} movie tracks to ${pl?.name || 'playlist'}`, 'success');
    }
  };

  const formatDur = (s) => {
    if (!s) return '';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="movie-album-modal glass-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="movie-album-header">
          <div className="movie-album-hero-bg" style={{ backgroundImage: `url(${track?.thumbnail})` }} />
          <button className="modal-close-btn movie-album-close" onClick={onClose}>
            <X size={20} />
          </button>
          
          <div className="movie-album-info-row">
            <img className="movie-album-cover" src={track?.thumbnail} alt="" />
            <div className="movie-album-meta">
              <span className="movie-album-badge">
                <Disc3 size={14} className="spin-slow" /> MOVIE ALBUM / SOUNDTRACK
              </span>
              <h2 className="movie-album-title">{albumData?.movieTitle || track?.title}</h2>
              <div className="movie-album-sub">
                {loading ? 'Searching movie soundtrack...' : `${albumData?.tracks?.length || 0} Movie Songs`}
              </div>

              {!loading && albumData?.tracks?.length > 0 && (
                <div className="movie-album-btn-row">
                  <button className="btn-primary movie-play-all-btn" onClick={handlePlayAll}>
                    <Play size={16} fill="#000" /> Play Full Album
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content / Tracklist */}
        <div className="movie-album-body">
          {loading ? (
            <div className="movie-album-loading">
              <Loader size={32} color="var(--accent)" className="spin" />
              <p>Fetching full movie songs...</p>
            </div>
          ) : albumData?.tracks?.length > 0 ? (
            <div className="track-list">
              {albumData.tracks.map((t, idx) => {
                const isActive = currentTrack && currentTrack.id === t.id;
                return (
                  <div
                    key={t.id + '-' + idx}
                    className={`track-row ${isActive ? 'playing' : ''}`}
                    onClick={() => {
                      onPlayTrack(t, albumData.tracks);
                      onClose();
                    }}
                  >
                    <div className="track-num">
                      {isActive && isPlaying ? (
                        <EqualizerIcon size={14} color="var(--accent)" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <img className="track-thumb" src={t.thumbnail} alt="" />
                    <div className="track-info">
                      <div className="track-title">{t.title}</div>
                      <div className="track-artist">{t.artist}</div>
                    </div>
                    <div className="track-duration">{formatDur(t.duration)}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <Music size={32} />
              <p>No full movie songs found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
