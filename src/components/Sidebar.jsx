import React from 'react';
import { Home, Search, Library, Plus, Heart, Music, Headphones, User, LogIn, LogOut } from 'lucide-react';

export default function Sidebar({ activeView, setActiveView, playlists, onCreatePlaylist, user, onOpenAuth, onSignOut }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">Rock 'N Roll</div>

      <button
        className={`nav-item ${activeView === 'home' ? 'active' : ''}`}
        onClick={() => setActiveView('home')}
      >
        <Home /> Home
      </button>

      <button
        className={`nav-item ${activeView === 'search' ? 'active' : ''}`}
        onClick={() => setActiveView('search')}
      >
        <Search /> Search
      </button>

      <button
        className={`nav-item ${activeView === 'podcasts' ? 'active' : ''}`}
        onClick={() => setActiveView('podcasts')}
      >
        <Headphones /> Podcasts
      </button>

      <button
        className={`nav-item ${activeView === 'library' ? 'active' : ''}`}
        onClick={() => setActiveView('library')}
      >
        <Library /> Your Library
      </button>

      <div className="sidebar-divider" />

      <button
        className={`nav-item ${activeView === 'liked' ? 'active' : ''}`}
        onClick={() => setActiveView('liked')}
      >
        <Heart /> Liked Songs
      </button>

      <button
        className={`nav-item ${activeView === 'profile' ? 'active' : ''}`}
        onClick={() => setActiveView('profile')}
      >
        <User /> {user ? 'Profile & Settings' : 'My Account'}
      </button>

      <div className="sidebar-divider" />

      <div className="sidebar-section-title">Playlists</div>

      <button className="create-playlist-btn" onClick={onCreatePlaylist}>
        <Plus size={16} /> Create Playlist
      </button>

      {(playlists || []).filter(pl => pl && pl.id && pl.name && !['My Hi-Fi Favorites', 'Late Night Chill & Focus'].includes(pl.name)).map(pl => (
        <button
          key={pl.id}
          className="playlist-item"
          onClick={() => setActiveView(`playlist-${pl.id}`)}
        >
          <Music size={16} />
          <span className="truncate">{pl.name}</span>
        </button>
      ))}

      {/* User Auth Section */}
      <div style={{ marginTop: 'auto', paddingTop: 16 }}>
        <div className="sidebar-divider" />
        {user ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', borderRadius: 12, background: activeView === 'profile' ? 'rgba(29, 185, 84, 0.15)' : 'rgba(255,255,255,0.04)',
            border: activeView === 'profile' ? '1px solid rgba(29, 185, 84, 0.4)' : '1px solid transparent',
            transition: 'all 0.2s'
          }}>
            <div
              onClick={() => setActiveView('profile')}
              style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', cursor: 'pointer', flex: 1 }}
              title="View Profile & Settings"
            >
              <div style={{
                width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#000', fontWeight: 700, fontSize: 13, flexShrink: 0
              }}>
                {(user.user_metadata?.display_name || user.email || 'U')[0].toUpperCase()}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }} className="truncate">
                {user.user_metadata?.display_name || (user.email ? user.email.split('@')[0] : 'User')}
              </div>
            </div>
            <button
              onClick={onSignOut}
              title="Sign Out"
              style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#ff5555'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            className="nav-item"
            onClick={onOpenAuth}
            style={{ color: 'var(--accent)', fontWeight: 600 }}
          >
            <LogIn size={18} /> Sign In / Cloud Sync
          </button>
        )}
      </div>
    </aside>
  );
}
