import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { Music, Home, Search, Headphones, Library, User } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Player from './components/Player';

// Lazy loaded views to reduce initial JS bundle size
const HomeView = lazy(() => import('./components/HomeView'));
const SearchView = lazy(() => import('./components/SearchView'));
const LibraryView = lazy(() => import('./components/LibraryView'));
const PodcastView = lazy(() => import('./components/PodcastView'));
const LyricsView = lazy(() => import('./components/LyricsView'));
const LoginView = lazy(() => import('./components/LoginView'));
const ProfileView = lazy(() => import('./components/ProfileView'));

import AuthModal from './components/AuthModal';
import Toast from './components/Toast';
import CustomModal from './components/CustomModal';
import QueueDrawer from './components/QueueDrawer';
import MovieAlbumModal from './components/MovieAlbumModal';
import OnboardingModal from './components/OnboardingModal';
import RockBotWidget from './components/RockBotWidget';
import { yt } from './services/youtube';
import { storage } from './services/storage';
import { searchTracks, getTrendingTelugu, getTrendingHindi, getTrendingEnglish, getTopGlobal, getTopIndia, resolveChartTrack } from './services/search';
import { getCurrentUser, onAuthStateChange, signOut as supabaseSignOut, fetchUserData, syncUserData } from './services/supabase';
import { getUserPreferences } from './services/usageTracker';

export default function App() {
  const [activeView, setActiveView] = useState('login');
  const [authLoading, setAuthLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState([]);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLyrics, setShowLyrics] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [likedTracks, setLikedTracks] = useState(() => storage.getLiked());
  const [playlists, setPlaylists] = useState(() => storage.getPlaylists());
  const [recentTracks, setRecentTracks] = useState(() => storage.getRecent());
  const [trendingTelugu, setTrendingTelugu] = useState([]);
  const [trendingHindi, setTrendingHindi] = useState([]);
  const [trendingEnglish, setTrendingEnglish] = useState([]);
  const [topGlobal, setTopGlobal] = useState([]);
  const [topIndia, setTopIndia] = useState([]);
  const [topGlobalLoading, setTopGlobalLoading] = useState(true);
  const [topIndiaLoading, setTopIndiaLoading] = useState(true);

  // --- Polish Infrastructure State ---
  const [toasts, setToasts] = useState([]);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState(null);
  const [sleepTimerTimeLeft, setSleepTimerTimeLeft] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [movieAlbumTrack, setMovieAlbumTrack] = useState(null);
  const [isMovieAlbumOpen, setIsMovieAlbumOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const handleOpenMovieAlbum = useCallback((track) => {
    if (!track) return;
    setMovieAlbumTrack(track);
    setIsMovieAlbumOpen(true);
  }, []);

  // Custom Glass Modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    config: {},
    onConfirm: () => {},
  });

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const openInputModal = useCallback(({ title, placeholder, initialValue, confirmText, onConfirm }) => {
    setModalState({
      isOpen: true,
      config: { type: 'input', title, placeholder, initialValue, confirmText: confirmText || 'Create' },
      onConfirm
    });
  }, []);

  const openConfirmModal = useCallback(({ title, message, confirmText, isDanger, onConfirm }) => {
    setModalState({
      isOpen: true,
      config: { type: 'confirm', title, message, confirmText: confirmText || 'Confirm', isDanger },
      onConfirm
    });
  }, []);

  const currentTrackRef = useRef(currentTrack);
  const queueRef = useRef(queue);
  const shuffleRef = useRef(shuffle);
  const repeatRef = useRef(repeat);

  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);

  // Helper to completely stop audio playback and reset user data on sign out
  const stopPlaybackAndClearUser = useCallback(() => {
    try {
      yt.pause();
    } catch (e) {
      console.warn('Error pausing audio on signout:', e);
    }
    setCurrentTrack(null);
    setIsPlaying(false);
    setQueue([]);
    setShowLyrics(false);

    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = null;
      } catch (e) {}
    }

    setLikedTracks([]); storage.saveLiked([]);
    setPlaylists([]); storage.savePlaylists([]);
    setRecentTracks([]); storage.saveRecent([]);
  }, []);

  // Supabase Auth listener & cloud data sync
  useEffect(() => {
    let unsubscribe = () => {};

    async function initAuth() {
      try {
        const initialUser = await getCurrentUser();
        setUser(initialUser);

        if (initialUser) {
          const cloudData = await fetchUserData(initialUser.id);
          if (cloudData) {
            if (cloudData.likedTracks) { setLikedTracks(cloudData.likedTracks); storage.saveLiked(cloudData.likedTracks); }
            if (cloudData.playlists) { setPlaylists(cloudData.playlists); storage.savePlaylists(cloudData.playlists); }
            if (cloudData.recentTracks) { setRecentTracks(cloudData.recentTracks); storage.saveRecent(cloudData.recentTracks); }
          }
          setActiveView('home');

          const prefs = getUserPreferences();
          if (!prefs.artists || prefs.artists.length < 3) {
            setIsOnboardingOpen(true);
          }
        } else {
          setActiveView('login');
        }
      } catch (err) {
        console.error('Failed to initialize auth state:', err);
        setActiveView('login');
      } finally {
        setAuthLoading(false);
      }

      unsubscribe = onAuthStateChange(async (event, sessionUser) => {
        setUser(sessionUser);
        if (sessionUser) {
          const cloudData = await fetchUserData(sessionUser.id);
          if (cloudData) {
            if (cloudData.likedTracks) { setLikedTracks(cloudData.likedTracks); storage.saveLiked(cloudData.likedTracks); }
            if (cloudData.playlists) { setPlaylists(cloudData.playlists); storage.savePlaylists(cloudData.playlists); }
            if (cloudData.recentTracks) { setRecentTracks(cloudData.recentTracks); storage.saveRecent(cloudData.recentTracks); }
          }
          const prefs = getUserPreferences();
          if (!prefs.artists || prefs.artists.length < 3) {
            setIsOnboardingOpen(true);
          }
        } else if (event === 'SIGNED_OUT') {
          stopPlaybackAndClearUser();
          setActiveView('login');
        }
      });
    }

    initAuth();
    return () => unsubscribe();
  }, [stopPlaybackAndClearUser]);

  // Helper to push updates to Supabase cloud if logged in
  const triggerCloudSync = useCallback((updatedLiked, updatedPlaylists, updatedRecent) => {
    if (user) {
      syncUserData(user.id, {
        likedTracks: updatedLiked !== undefined ? updatedLiked : likedTracks,
        playlists: updatedPlaylists !== undefined ? updatedPlaylists : playlists,
        recentTracks: updatedRecent !== undefined ? updatedRecent : recentTracks,
      });
    }
  }, [user, likedTracks, playlists, recentTracks]);

  // Load trending tracks on startup (all languages + Apple Music charts in parallel)
  useEffect(() => {
    getTrendingTelugu().then(tracks => setTrendingTelugu(tracks));
    getTrendingHindi().then(tracks => setTrendingHindi(tracks));
    getTrendingEnglish().then(tracks => setTrendingEnglish(tracks));
    getTopGlobal().then(tracks => { setTopGlobal(tracks); setTopGlobalLoading(false); }).catch(() => setTopGlobalLoading(false));
    getTopIndia().then(tracks => { setTopIndia(tracks); setTopIndiaLoading(false); }).catch(() => setTopIndiaLoading(false));
  }, []);

  // Initialize YouTube engine
  useEffect(() => {
    yt.init();
    yt.setVolume(storage.getVolume());
  }, []);

  const handleNextRef = useRef(null);

  // Sync YouTube state changes
  useEffect(() => {
    yt.onStateChange = (state) => {
      if (state === 'playing') setIsPlaying(true);
      else if (state === 'paused') setIsPlaying(false);
    };
    yt.onError = (code) => {
      console.warn('Playback error code:', code);
      if (handleNextRef.current) handleNextRef.current();
    };
    return () => { yt.onStateChange = null; yt.onError = null; };
  }, []);

  // MediaSession
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      artwork: [{ src: currentTrack.thumbnail, sizes: '512x512', type: 'image/jpeg' }]
    });
    navigator.mediaSession.setActionHandler('play', () => handlePlayPause());
    navigator.mediaSession.setActionHandler('pause', () => handlePlayPause());
    navigator.mediaSession.setActionHandler('nexttrack', () => handleNext());
    navigator.mediaSession.setActionHandler('previoustrack', () => handlePrev());
  }, [currentTrack]);

  // Space to play/pause
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentTrack, isPlaying]);

  // --- Playback ---
  const playTrack = useCallback(async (track, trackList, isUserClick = true) => {
    if (!track) return;

    // If this is a chart track without a videoId, resolve it on-demand
    let resolvedTrack = track;
    if (track.isChart && !track.videoId) {
      // Show the track info immediately (title/art) while resolving
      setCurrentTrack({ ...track, resolving: true, isUserClick });
      setIsPlaying(false);
      if (trackList) setQueue(trackList);

      resolvedTrack = await resolveChartTrack(track);
      if (!resolvedTrack) {
        console.error('Could not find YouTube video for:', track.title);
        setCurrentTrack(null);
        return;
      }

      // Update the track in the queue with the resolved videoId
      if (trackList) {
        const updatedQueue = trackList.map(t =>
          t.id === track.id ? resolvedTrack : t
        );
        setQueue(updatedQueue);
      }
    }

    const trackWithFlag = { ...resolvedTrack, isUserClick };
    setCurrentTrack(trackWithFlag);
    setIsPlaying(true);
    if (trackList && !track.isChart) setQueue(trackList);
    yt.play(resolvedTrack.videoId);

    // Update recently played
    const updated = storage.addRecent(resolvedTrack);
    setRecentTracks(updated);
    triggerCloudSync(undefined, undefined, updated);

    // Media session
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: resolvedTrack.title,
        artist: resolvedTrack.artist,
        artwork: [{ src: resolvedTrack.thumbnail, sizes: '512x512', type: 'image/jpeg' }]
      });
    }
  }, [triggerCloudSync]);

  const handlePlayPause = useCallback(() => {
    if (!currentTrackRef.current) return;
    if (isPlaying) {
      yt.pause();
      setIsPlaying(false);
    } else {
      yt.resume();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleNext = useCallback(() => {
    const q = queueRef.current;
    const cur = currentTrackRef.current;
    if (!q.length) return;

    if (repeatRef.current && cur) {
      yt.play(cur.videoId);
      setIsPlaying(true);
      return;
    }

    const idx = cur ? q.findIndex(t => t.id === cur.id) : -1;
    let next;
    if (shuffleRef.current) {
      next = q[Math.floor(Math.random() * q.length)];
    } else {
      next = q[(idx + 1) % q.length];
    }
    playTrack(next, q, false);
  }, [playTrack]);

  useEffect(() => { handleNextRef.current = handleNext; }, [handleNext]);

  const handlePrev = useCallback(() => {
    const q = queueRef.current;
    const cur = currentTrackRef.current;
    if (!q.length || !cur) return;

    // If more than 3s in, restart current track
    if (yt.getCurrentTime() > 3) {
      yt.seekTo(0);
      return;
    }

    const idx = q.findIndex(t => t.id === cur.id);
    const prev = q[(idx - 1 + q.length) % q.length];
    playTrack(prev, q, false);
  }, [playTrack]);

  // --- Sleep Timer Countdown Effect ---
  useEffect(() => {
    if (sleepTimerTimeLeft === null) return;
    if (sleepTimerTimeLeft <= 0) {
      try { yt.pause(); } catch (e) {}
      setIsPlaying(false);
      setSleepTimerMinutes(null);
      setSleepTimerTimeLeft(null);
      addToast('Sleep timer ended. Playback paused.', 'info');
      return;
    }

    const timer = setInterval(() => {
      setSleepTimerTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepTimerTimeLeft, addToast]);

  const handleSetSleepTimer = useCallback((mins) => {
    if (mins === null) {
      setSleepTimerMinutes(null);
      setSleepTimerTimeLeft(null);
      addToast('Sleep timer turned off', 'info');
    } else {
      setSleepTimerMinutes(mins);
      setSleepTimerTimeLeft(mins * 60);
      addToast(`Sleep timer set for ${mins} minutes`, 'success');
    }
  }, [addToast]);

  const handleCycleSpeed = useCallback(() => {
    const speeds = [1, 1.25, 1.5, 2, 0.8];
    const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    addToast(`Playback speed set to ${nextSpeed}x`, 'info');
  }, [playbackSpeed, addToast]);

  // --- Likes ---
  const isCurrentLiked = currentTrack ? storage.isLiked(currentTrack.id) : false;

  const handleToggleLike = useCallback(() => {
    if (!currentTrackRef.current) return;
    const track = currentTrackRef.current;
    const wasLiked = storage.isLiked(track.id);
    const updated = storage.toggleLike(track);
    setLikedTracks(updated);
    triggerCloudSync(updated, undefined, undefined);
    addToast(wasLiked ? `Removed "${track.title}" from Liked Songs` : `Saved "${track.title}" to Liked Songs`, wasLiked ? 'info' : 'success');
  }, [triggerCloudSync, addToast]);

  // --- Playlists ---
  const handleCreatePlaylist = useCallback(() => {
    openInputModal({
      title: 'Create New Playlist',
      placeholder: 'My Favorite Songs...',
      confirmText: 'Create Playlist',
      onConfirm: (name) => {
        const updated = storage.createPlaylist(name);
        setPlaylists(updated);
        triggerCloudSync(undefined, updated, undefined);
        addToast(`Created playlist "${name}"`, 'success');
      }
    });
  }, [openInputModal, triggerCloudSync, addToast]);

  const handleDeletePlaylist = useCallback((plId) => {
    const pl = playlists.find(p => p.id === plId);
    openConfirmModal({
      title: 'Delete Playlist',
      message: `Are you sure you want to delete "${pl?.name || 'this playlist'}"? This action cannot be undone.`,
      confirmText: 'Delete',
      isDanger: true,
      onConfirm: () => {
        const updated = storage.deletePlaylist(plId);
        setPlaylists(updated);
        setActiveView('library');
        triggerCloudSync(undefined, updated, undefined);
        addToast(`Deleted playlist "${pl?.name || ''}"`, 'warning');
      }
    });
  }, [playlists, openConfirmModal, triggerCloudSync, addToast]);

  const handleAddToPlaylist = useCallback((plId, track) => {
    const pl = playlists.find(p => p.id === plId);
    const updated = storage.addToPlaylist(plId, track);
    setPlaylists(updated);
    triggerCloudSync(undefined, updated, undefined);
    addToast(`Added "${track.title}" to ${pl?.name || 'playlist'}`, 'success');
  }, [playlists, triggerCloudSync, addToast]);

  const handleRemoveFromPlaylist = useCallback((plId, trackId) => {
    const updated = storage.removeFromPlaylist(plId, trackId);
    setPlaylists(updated);
    triggerCloudSync(undefined, updated, undefined);
    addToast('Removed track from playlist', 'info');
  }, [triggerCloudSync, addToast]);

  // --- Podcast playback ---
  const handleStartPodcast = useCallback(async (query) => {
    const tracks = await searchTracks(query, 30);
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  }, [playTrack]);


  // --- Render view ---
  if (authLoading) {
    return (
      <div style={{
        height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: '#121212', color: '#fff', gap: 16
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 18,
          background: 'linear-gradient(135deg, var(--accent, #1db954), #10b981)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 30px rgba(29, 185, 84, 0.4)'
        }}>
          <Music size={30} color="#000" />
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '0.5px' }}>
          Loading Rock 'N Roll...
        </div>
      </div>
    );
  }

  if (activeView === 'login') {
    return (
      <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Loading...</div>}>
        <LoginView
          onAuthSuccess={async (signedInUser) => {
            setUser(signedInUser);
            if (signedInUser) {
              const cloudData = await fetchUserData(signedInUser.id);
              if (cloudData) {
                if (cloudData.likedTracks) { setLikedTracks(cloudData.likedTracks); storage.saveLiked(cloudData.likedTracks); }
                if (cloudData.playlists) { setPlaylists(cloudData.playlists); storage.savePlaylists(cloudData.playlists); }
                if (cloudData.recentTracks) { setRecentTracks(cloudData.recentTracks); storage.saveRecent(cloudData.recentTracks); }
              } else {
                // If it's a completely new account, push their current guest data to the cloud
                syncUserData(signedInUser.id, {
                  likedTracks, playlists, recentTracks
                });
              }
            }
            setActiveView('home');
          }}
          onGuestContinue={() => setActiveView('home')}
        />
      </Suspense>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar
        activeView={activeView}
        setActiveView={(view) => {
          if (view === 'search') setSearchQuery('');
          setActiveView(view);
        }}
        playlists={playlists}
        onCreatePlaylist={handleCreatePlaylist}
        user={user}
        onOpenAuth={() => setActiveView('login')}
        onSignOut={async () => {
          await supabaseSignOut();
          setUser(null);
          stopPlaybackAndClearUser();
          setActiveView('login');
        }}
      />

      <main className="main-content" style={{ position: 'relative' }}>
        {/* Mobile Top Header */}
        <div className="mobile-header">
          <div className="sidebar-brand" style={{ padding: 0, fontSize: 18 }}>Rock 'N Roll</div>
          {user ? (
            <button
              onClick={() => setActiveView('profile')}
              style={{
                width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)',
                border: 'none', color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="View Profile"
            >
              {(user.user_metadata?.display_name || user.email || 'U')[0].toUpperCase()}
            </button>
          ) : (
            <button
              onClick={() => setActiveView('login')}
              style={{
                padding: '6px 12px', borderRadius: 20, background: 'var(--accent)',
                border: 'none', color: '#000', fontWeight: 700, fontSize: 12, cursor: 'pointer'
              }}
            >
              Sign In
            </button>
          )}
        </div>

        {/* Top Gradient */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 300,
          background: 'linear-gradient(to bottom, rgba(29, 185, 84, 0.15) 0%, transparent 100%)',
          pointerEvents: 'none', zIndex: 0
        }} />

        <Suspense fallback={<div className="loading-state">Loading View...</div>}>
          {activeView === 'search' && (
            <SearchView
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onPlayTrack={playTrack}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              playlists={playlists}
              onAddToPlaylist={handleAddToPlaylist}
              onOpenMovieAlbum={handleOpenMovieAlbum}
            />
          )}
          {activeView === 'library' && (
            <LibraryView
              view={activeView}
              setActiveView={setActiveView}
              likedTracks={likedTracks}
              playlists={playlists}
              recentTracks={recentTracks}
              onPlayTrack={playTrack}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onRemoveFromPlaylist={handleRemoveFromPlaylist}
              onDeletePlaylist={handleDeletePlaylist}
              onCreatePlaylist={handleCreatePlaylist}
              onAddToPlaylist={handleAddToPlaylist}
            />
          )}
          {activeView === 'liked' && (
            <LibraryView
              view={activeView}
              setActiveView={setActiveView}
              likedTracks={likedTracks}
              playlists={playlists}
              recentTracks={recentTracks}
              onPlayTrack={playTrack}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onRemoveFromPlaylist={handleRemoveFromPlaylist}
              onDeletePlaylist={handleDeletePlaylist}
              onCreatePlaylist={handleCreatePlaylist}
              onAddToPlaylist={handleAddToPlaylist}
            />
          )}
          {activeView.startsWith('playlist-') && (
            <LibraryView
              view={activeView}
              setActiveView={setActiveView}
              likedTracks={likedTracks}
              playlists={playlists}
              recentTracks={recentTracks}
              onPlayTrack={playTrack}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onRemoveFromPlaylist={handleRemoveFromPlaylist}
              onDeletePlaylist={handleDeletePlaylist}
              onCreatePlaylist={handleCreatePlaylist}
              onAddToPlaylist={handleAddToPlaylist}
            />
          )}
          {activeView === 'podcasts' && (
            <PodcastView
              onStartPodcast={handleStartPodcast}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              playlists={playlists}
              onAddToPlaylist={handleAddToPlaylist}
            />
          )}
          {activeView === 'profile' && (
            <ProfileView
              user={user}
              setUser={setUser}
              onSignOut={async () => {
                await supabaseSignOut();
                setUser(null);
                stopPlaybackAndClearUser();
                setActiveView('login');
              }}
              likedTracks={likedTracks}
              playlists={playlists}
              recentTracks={recentTracks}
              onOpenOnboarding={() => setIsOnboardingOpen(true)}
              setActiveView={setActiveView}
            />
          )}
          {activeView === 'home' && (
            <HomeView
              onPlayTrack={playTrack}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              playlists={playlists}
              onAddToPlaylist={handleAddToPlaylist}
              recentTracks={recentTracks}
              trendingTelugu={trendingTelugu}
              trendingHindi={trendingHindi}
              trendingEnglish={trendingEnglish}
              topGlobal={topGlobal}
              topIndia={topIndia}
              topGlobalLoading={topGlobalLoading}
              topIndiaLoading={topIndiaLoading}
              onOpenMovieAlbum={handleOpenMovieAlbum}
            />
          )}
        </Suspense>

        {showLyrics && (
          <Suspense fallback={null}>
            <LyricsView 
              track={currentTrack} 
              onClose={() => setShowLyrics(false)} 
            />
          </Suspense>
        )}
      </main>

      <Player
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrev={handlePrev}
        shuffle={shuffle}
        onToggleShuffle={() => setShuffle(s => !s)}
        repeat={repeat}
        onToggleRepeat={() => setRepeat(r => !r)}
        isLiked={isCurrentLiked}
        onToggleLike={handleToggleLike}
        playlists={playlists}
        onAddToPlaylist={handleAddToPlaylist}
        onToggleLyrics={() => setShowLyrics(prev => !prev)}
        showLyrics={showLyrics}
        onToggleQueue={() => setIsQueueOpen(q => !q)}
        onOpenSleepTimer={() => {
          openConfirmModal({
            title: 'Sleep Timer',
            message: sleepTimerMinutes
              ? `Sleep timer currently set for ${sleepTimerMinutes}m (${Math.ceil((sleepTimerTimeLeft || 0) / 60)}m remaining). Select an option:`
              : 'Automatically pause music after a set duration:',
            confirmText: sleepTimerMinutes ? 'Turn Off Timer' : 'Set 30 Mins',
            isDanger: !!sleepTimerMinutes,
            onConfirm: () => {
              if (sleepTimerMinutes) handleSetSleepTimer(null);
              else handleSetSleepTimer(30);
            }
          });
        }}
        sleepTimerActive={sleepTimerTimeLeft ? Math.ceil(sleepTimerTimeLeft / 60) : null}
        playbackSpeed={playbackSpeed}
        onChangeSpeed={handleCycleSpeed}
        onOpenMovieAlbum={handleOpenMovieAlbum}
      />

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-item ${activeView === 'home' ? 'active' : ''}`}
          onClick={() => setActiveView('home')}
        >
          <Home size={20} />
          <span>Home</span>
        </button>
        <button
          className={`mobile-nav-item ${activeView === 'search' ? 'active' : ''}`}
          onClick={() => { setSearchQuery(''); setActiveView('search'); }}
        >
          <Search size={20} />
          <span>Search</span>
        </button>
        <button
          className={`mobile-nav-item ${activeView === 'podcasts' ? 'active' : ''}`}
          onClick={() => setActiveView('podcasts')}
        >
          <Headphones size={20} />
          <span>Podcasts</span>
        </button>
        <button
          className={`mobile-nav-item ${(activeView === 'library' || activeView === 'liked' || activeView.startsWith('playlist-')) ? 'active' : ''}`}
          onClick={() => setActiveView('library')}
        >
          <Library size={20} />
          <span>Library</span>
        </button>
        <button
          className={`mobile-nav-item ${activeView === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveView(user ? 'profile' : 'login')}
        >
          <User size={20} />
          <span>{user ? 'Profile' : 'Account'}</span>
        </button>
      </nav>

      {/* Polish UI Components */}
      <Toast toasts={toasts} onDismiss={removeToast} />
      <CustomModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        modalConfig={modalState.config}
      />
      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        queue={queue}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayTrack={playTrack}
        onClearQueue={() => {
          setQueue([]);
          addToast('Queue cleared', 'info');
        }}
      />
      <MovieAlbumModal
        isOpen={isMovieAlbumOpen}
        onClose={() => setIsMovieAlbumOpen(false)}
        track={movieAlbumTrack}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayTrack={playTrack}
        playlists={playlists}
        onAddToPlaylist={handleAddToPlaylist}
        onShowToast={addToast}
      />
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSave={() => addToast('Music preferences saved!', 'success')}
      />
      <RockBotWidget
        onPlayTrack={playTrack}
        onShowToast={addToast}
      />
    </div>
  );
}
