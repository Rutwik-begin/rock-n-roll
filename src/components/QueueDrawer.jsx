import React from 'react';
import { X, Play, Trash2, ListMusic, Music } from 'lucide-react';
import EqualizerIcon from './EqualizerIcon';

export default function QueueDrawer({
  isOpen,
  onClose,
  queue = [],
  currentTrack,
  isPlaying,
  onPlayTrack,
  onClearQueue
}) {
  if (!isOpen) return null;

  const currentTrackIndex = currentTrack ? queue.findIndex(t => t.id === currentTrack.id) : -1;
  const upNextTracks = currentTrackIndex >= 0 ? queue.slice(currentTrackIndex + 1) : queue;

  return (
    <div className="queue-overlay" onClick={onClose}>
      <div className="queue-drawer glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="queue-header">
          <div className="queue-title">
            <ListMusic size={22} className="text-accent" />
            <h3>Play Queue</h3>
            <span className="queue-badge">{queue.length} tracks</span>
          </div>
          <div className="queue-actions">
            {queue.length > 0 && (
              <button
                className="queue-clear-btn"
                onClick={onClearQueue}
                title="Clear Queue"
              >
                <Trash2 size={16} />
                <span>Clear</span>
              </button>
            )}
            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="queue-content">
          {/* Currently Playing Section */}
          {currentTrack && (
            <div className="queue-section">
              <h4 className="queue-section-title">Now Playing</h4>
              <div className="queue-item active">
                <div className="queue-item-thumb">
                  <img src={currentTrack.thumbnail} alt={currentTrack.title} />
                  {isPlaying ? (
                    <div className="queue-eq-overlay">
                      <EqualizerIcon size={16} color="var(--accent)" />
                    </div>
                  ) : (
                    <div className="queue-play-overlay">
                      <Play size={14} fill="#fff" />
                    </div>
                  )}
                </div>
                <div className="queue-item-info">
                  <div className="queue-item-title text-accent">{currentTrack.title}</div>
                  <div className="queue-item-artist">{currentTrack.artist}</div>
                </div>
              </div>
            </div>
          )}

          {/* Up Next Section */}
          <div className="queue-section">
            <h4 className="queue-section-title">Up Next</h4>
            {upNextTracks.length === 0 ? (
              <div className="queue-empty">
                <Music size={32} style={{ opacity: 0.3 }} />
                <p>No upcoming tracks in queue</p>
              </div>
            ) : (
              <div className="queue-list">
                {upNextTracks.map((track, idx) => (
                  <div
                    key={`${track.id}-${idx}`}
                    className="queue-item"
                    onClick={() => onPlayTrack(track, queue)}
                  >
                    <div className="queue-item-thumb">
                      <img src={track.thumbnail} alt={track.title} />
                      <div className="queue-play-overlay">
                        <Play size={14} fill="#fff" />
                      </div>
                    </div>
                    <div className="queue-item-info">
                      <div className="queue-item-title">{track.title}</div>
                      <div className="queue-item-artist">{track.artist}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
