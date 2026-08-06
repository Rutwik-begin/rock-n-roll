import React, { useState, useEffect, useRef } from 'react';
import { Headphones, Plus, ListPlus, Check, Sparkles, Flame, Radio, ArrowLeft, Play, Calendar, Clock } from 'lucide-react';
import { getTrendingPodcasts, fetchPodcastEpisodes } from '../services/podcastEngine';

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

const CATEGORY_TABS = [
  { id: 'global', label: 'Global Top Charts', icon: '🌍' },
  { id: 'india', label: 'India Top Charts', icon: '🇮🇳' },
  { id: 'telugu', label: 'Telugu Podcasts', icon: '🎵' },
  { id: 'hindi', label: 'Hindi Podcasts', icon: '🇮🇳' },
];

export default function PodcastView({
  onStartPodcast,
  currentTrack,
  isPlaying,
  playlists,
  onAddToPlaylist
}) {
  const [activeTab, setActiveTab] = useState('global');
  const [podcastsData, setPodcastsData] = useState({ global: [], india: [], telugu: [], hindi: [] });
  const [loading, setLoading] = useState(true);
  
  // Episode Explorer States
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  useEffect(() => {
    let mounted = true;
    getTrendingPodcasts().then(data => {
      if (mounted) {
        setPodcastsData(data);
        setLoading(false);
      }
    }).catch(err => {
      console.warn('Failed to load live podcasts:', err);
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const handleSelectPodcast = async (podcast) => {
    setSelectedPodcast(podcast);
    setLoadingEpisodes(true);
    setEpisodes([]);
    try {
      const eps = await fetchPodcastEpisodes(podcast.name);
      setEpisodes(eps);
    } catch (err) {
      console.warn('Error fetching podcast episodes:', err);
    }
    setLoadingEpisodes(false);
  };

  const handlePlayEpisode = async (episode) => {
    if (onStartPodcast) {
      await onStartPodcast(episode.query || episode.title);
    }
  };

  const formatDur = (sec) => {
    if (!sec) return '';
    const mins = Math.round(sec / 60);
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}h ${m}m`;
    }
    return `${mins} mins`;
  };

  // ─── EPISODE EXPLORER VIEW ────────────────────────────────────────────────
  if (selectedPodcast) {
    return (
      <div>
        {/* Back Button */}
        <button
          onClick={() => setSelectedPodcast(null)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 20,
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            color: 'var(--text-primary)', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', marginBottom: 24, transition: 'all 150ms ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--glass-bg)'}
        >
          <ArrowLeft size={16} /> Back to All Podcasts
        </button>

        {/* Podcast Header Banner */}
        <div className="glass-card" style={{
          padding: 24, borderRadius: 16, display: 'flex', gap: 20, alignItems: 'center',
          flexWrap: 'wrap', marginBottom: 32, border: '1px solid var(--glass-border)',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), var(--glass-bg))'
        }}>
          <img
            src={selectedPodcast.image}
            alt=""
            style={{ width: 110, height: 110, borderRadius: 16, objectFit: 'cover', flexShrink: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
          />

          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                background: 'var(--accent)', color: '#000', padding: '2px 8px', borderRadius: 6
              }}>
                {selectedPodcast.source || 'SHOW'}
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Flame size={13} fill="var(--accent)" /> {selectedPodcast.score || 95}/100 Popularity
              </span>
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 6px 0' }}>
              {selectedPodcast.name}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 8px 0', fontWeight: 600 }}>
              {selectedPodcast.artist}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
              {selectedPodcast.desc}
            </p>
          </div>
        </div>

        {/* Episodes Section Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>
            Recent & Popular Episodes
          </h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
            {episodes.length} episodes available
          </span>
        </div>

        {/* Episodes List */}
        {loadingEpisodes ? (
          <div className="track-list">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="track-row" style={{ pointerEvents: 'none' }}>
                <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 8 }} />
                <div className="track-info">
                  <div className="skeleton" style={{ width: '70%', height: 14, marginBottom: 6 }} />
                  <div className="skeleton" style={{ width: '40%', height: 12 }} />
                </div>
              </div>
            ))}
          </div>
        ) : episodes.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {episodes.map((ep, idx) => {
              const isActive = currentTrack && (currentTrack.title === ep.title || currentTrack.query === ep.query);
              return (
                <div
                  key={ep.id || idx}
                  className="glass-card"
                  style={{
                    padding: 16, borderRadius: 12, display: 'flex', gap: 16, alignItems: 'center',
                    cursor: 'pointer', transition: 'all 150ms ease',
                    border: isActive ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
                    background: isActive ? 'rgba(29, 185, 84, 0.14)' : 'var(--glass-bg)'
                  }}
                  onClick={() => handlePlayEpisode(ep)}
                >
                  {/* Episode Number Tag */}
                  <div style={{
                    width: 50, height: 50, borderRadius: 10, background: 'rgba(255,255,255,0.06)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, border: '1px solid var(--glass-border)'
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--accent)' }}>
                      {ep.epNum}
                    </span>
                  </div>

                  {/* Episode Metadata */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: isActive ? 'var(--accent)' : '#fff', marginBottom: 4 }} className="truncate">
                      {ep.title}
                    </h4>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, lineClamp: 2 }} className="truncate">
                      {ep.desc}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: 'var(--text-secondary)' }}>
                      {ep.releaseDate && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} /> {ep.releaseDate}
                        </span>
                      )}
                      {ep.duration > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> {formatDur(ep.duration)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Play Action */}
                  <button
                    style={{
                      width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)',
                      border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0, color: '#000', boxShadow: '0 4px 14px rgba(29, 185, 84, 0.4)'
                    }}
                    onClick={(e) => { e.stopPropagation(); handlePlayEpisode(ep); }}
                    title="Play this episode"
                  >
                    <Play size={18} fill="#000" style={{ marginLeft: 2 }} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <Radio size={36} />
            <p>No individual episodes found for this show right now.</p>
            <button
              onClick={() => handlePlayEpisode({ title: selectedPodcast.name, query: selectedPodcast.query })}
              style={{ marginTop: 12, padding: '8px 18px', borderRadius: 20, background: 'var(--accent)', border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer' }}
            >
              Play Latest Show Episode
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── MAIN PODCAST DIRECTORY VIEW ──────────────────────────────────────────
  const activeList = podcastsData[activeTab] || [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 8 }}>
        <h1 className="greeting" style={{
          background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: 0
        }}>
          🎙️ Live Podcast Engine
        </h1>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(29, 185, 84, 0.12)', border: '1px solid rgba(29, 185, 84, 0.3)',
          borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: 'var(--accent)'
        }}>
          <Sparkles size={14} /> Multi-Platform Popularity Score Powered
        </div>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Click any podcast show to explore all episodes with episode numbers & full audio streaming
      </p>

      {/* CATEGORY TAB PILLS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
        {CATEGORY_TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 18px',
                borderRadius: 24,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                border: active ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
                background: active ? 'var(--accent)' : 'var(--glass-bg)',
                color: active ? '#000' : 'var(--text-primary)',
                boxShadow: active ? '0 0 16px rgba(29, 185, 84, 0.35)' : 'none',
                transition: 'all 200ms ease',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* PODCASTS GRID */}
      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16
        }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card" style={{ height: 110, padding: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
              <div className="skeleton" style={{ width: 70, height: 70, borderRadius: 12, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: '70%', height: 16, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: '50%', height: 12, marginBottom: 6 }} />
                <div className="skeleton" style={{ width: '40%', height: 10 }} />
              </div>
            </div>
          ))}
        </div>
      ) : activeList.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 16,
        }}>
          {activeList.map((podcast, idx) => {
            const isPodcastActive = selectedPodcast && selectedPodcast.id === podcast.id;
            const rank = podcast.rank || idx + 1;
            const score = podcast.score || 85;

            return (
              <div
                key={podcast.id || idx}
                className="glass-card"
                style={{
                  position: 'relative',
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'all 200ms ease',
                  border: isPodcastActive ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
                  background: isPodcastActive ? 'rgba(29, 185, 84, 0.14)' : 'var(--glass-bg)'
                }}
                onClick={() => handleSelectPodcast(podcast)}
              >
                {/* Rank Badge */}
                <div style={{
                  position: 'absolute', top: 8, left: 8, zIndex: 2,
                  background: rank <= 3 ? 'var(--accent)' : 'rgba(0,0,0,0.6)',
                  color: rank <= 3 ? '#000' : '#fff',
                  fontSize: 10, fontWeight: 900, borderRadius: 6, padding: '2px 6px'
                }}>
                  #{rank}
                </div>

                {/* Podcast Image */}
                <div style={{ width: 72, height: 72, borderRadius: 12, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                  <img src={podcast.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Headphones size={20} color="#fff" />
                  </div>
                </div>

                {/* Podcast Meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                      background: 'rgba(139, 92, 246, 0.25)', color: '#a78bfa',
                      padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(139, 92, 246, 0.4)'
                    }}>
                      {podcast.source || 'PODCAST'}
                    </span>

                    {/* Score Badge */}
                    <span style={{
                      fontSize: 10, fontWeight: 800, color: 'var(--accent)',
                      display: 'flex', alignItems: 'center', gap: 3
                    }}>
                      <Flame size={12} fill="var(--accent)" /> {score}/100
                    </span>
                  </div>

                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }} className="truncate">
                    {podcast.name}
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }} className="truncate">
                    {podcast.artist}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, fontWeight: 700 }}>
                    Click to view all episodes &rarr;
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Radio size={36} />
          <p>No podcasts available for this section right now.</p>
        </div>
      )}
    </div>
  );
}
