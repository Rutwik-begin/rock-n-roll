import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Check, UserCheck, Music2, Plus, AlertCircle, Search, User } from 'lucide-react';
import { getUserPreferences, saveUserPreferences } from '../services/usageTracker';

// Comprehensive catalog of top global, Indian, and regional music artists
const GLOBAL_ARTIST_DATABASE = [
  'Arijit Singh', 'Sid Sriram', 'A.R. Rahman', 'Anirudh Ravichander', 'Taylor Swift',
  'Devi Sri Prasad (DSP)', 'Shreya Ghoshal', 'AP Dhillon', 'Kendrick Lamar', 'Lady Gaga',
  'Billie Eilish', 'Bruno Mars', 'Armaan Malik', 'Jubin Nautiyal', 'The Weeknd',
  'Ed Sheeran', 'S.S. Thaman', 'Diljit Dosanjh', 'Post Malone', 'Dua Lipa',
  'Justin Bieber', 'Drake', 'Adele', 'Coldplay', 'Ariana Grande', 'Eminem',
  'Rihanna', 'Katy Perry', 'Selena Gomez', 'Shawn Mendes', 'Charlie Puth',
  'Maroon 5', 'Beyoncé', 'Imagine Dragons', 'Avicii', 'Alan Walker',
  'The Chainsmokers', 'Martin Garrix', 'David Guetta', 'Snoop Dogg', 'Badshah',
  'Yo Yo Honey Singh', 'Guru Randhawa', 'Atif Aslam', 'Sonu Nigam', 'Lata Mangeshkar',
  'S.P. Balasubrahmanyam', 'Sunidhi Chauhan', 'Jonita Gandhi', 'Jasleen Royal',
  'Harrdy Sandhu', 'Neha Kakkar', 'Vishal-Shekhar', 'Pritam', 'G.V. Prakash',
  'Santhosh Narayanan', 'Hesham Abdul Wahab', 'K.S. Chithra', 'S.Jeyachandran',
  'BTS', 'BLACKPINK', 'Zayn', 'Harry Styles', 'Olivia Rodrigo', 'Lorde',
  'Khalid', 'Camila Cabello', 'Usher', 'Kesha', 'Pitbull', 'Wiz Khalifa',
  'Travis Scott', 'Twenty One Pilots', 'Linkin Park', 'Michael Jackson', 'Ludovico Einaudi'
];

const GENRE_OPTIONS = [
  'Telugu Cinema Hits', 'Bollywood Beats', 'English Pop', 'Lo-Fi Chill',
  'Hip-Hop / Rap', 'Rock Classics', 'EDM Party', 'Synthwave / Retro'
];

export default function OnboardingModal({ isOpen, onClose, onSave }) {
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [validationError, setValidationError] = useState('');

  const searchContainerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const prefs = getUserPreferences();
      setSelectedArtists(prefs.artists || []);
      setSelectedGenres(prefs.genres || []);
      setValidationError('');
      setSearchQuery('');
    }
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const toggleArtist = (artist) => {
    setValidationError('');
    setSelectedArtists(prev =>
      prev.includes(artist) ? prev.filter(a => a !== artist) : [...prev, artist]
    );
  };

  const addCustomArtist = (nameToAdd) => {
    const target = nameToAdd || searchQuery;
    const trimmed = target.trim();
    if (!trimmed) return;

    if (!selectedArtists.some(a => a.toLowerCase() === trimmed.toLowerCase())) {
      setSelectedArtists(prev => [...prev, trimmed]);
    }
    setSearchQuery('');
    setIsDropdownOpen(false);
    setValidationError('');
  };

  const toggleGenre = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const isValid = selectedArtists.length >= 3;
  const remainingNeeded = Math.max(0, 3 - selectedArtists.length);

  // Search Engine Filter Logic
  const trimmedQuery = searchQuery.trim().toLowerCase();
  
  const searchResults = trimmedQuery
    ? GLOBAL_ARTIST_DATABASE.filter(artist =>
        artist.toLowerCase().includes(trimmedQuery)
      )
    : [];

  const exactMatchExists = searchResults.some(
    a => a.toLowerCase() === trimmedQuery
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) {
      setValidationError(`Please select at least 3 favorite artists (you currently have ${selectedArtists.length}).`);
      return;
    }
    const prefs = { artists: selectedArtists, genres: selectedGenres };
    saveUserPreferences(prefs);
    if (onSave) onSave(prefs);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={() => { if (isValid) onClose(); }}>
      <div className="onboarding-modal glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720, width: '94%', overflow: 'visible' }}>
        <div className="onboarding-header">
          <div className="onboarding-title-wrap">
            <Sparkles className="text-accent" size={26} />
            <div>
              <h2>Personalize Your Music AI</h2>
              <p>Search & select **at least 3 favorite artists** so Rock Bot AI can tailor recommendations!</p>
            </div>
          </div>
          {isValid && (
            <button className="modal-close-btn" onClick={onClose} title="Close modal">
              <X size={20} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="onboarding-body" style={{ padding: '20px 24px' }}>
          
          {/* Selected Artists Counter & Selected Badges Summary */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              <h4 className="onboarding-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserCheck size={18} className="text-accent" /> Favorite Artists
                <span style={{ fontSize: 13, opacity: 0.7 }}>(Minimum 3 Required)</span>
              </h4>

              <span style={{
                fontSize: 12,
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: 20,
                background: isValid ? 'rgba(34, 197, 94, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                border: isValid ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                color: isValid ? '#86efac' : '#fca5a5',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}>
                {isValid ? <Check size={14} /> : <AlertCircle size={14} />}
                {selectedArtists.length} / 3 Selected
              </span>
            </div>

            {/* Selected Artists Pills Summary */}
            {selectedArtists.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 14px', borderRadius: 14, background: 'rgba(29, 185, 84, 0.08)', border: '1px solid rgba(29, 185, 84, 0.2)', marginBottom: 14 }}>
                {selectedArtists.map(artist => (
                  <span
                    key={artist}
                    style={{
                      background: 'var(--accent, #1db954)',
                      color: '#000',
                      fontSize: 13,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 16,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    {artist}
                    <X
                      size={14}
                      style={{ cursor: 'pointer', opacity: 0.8 }}
                      onClick={() => toggleArtist(artist)}
                      title={`Remove ${artist}`}
                    />
                  </span>
                ))}
              </div>
            )}

            {validationError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                padding: '10px 14px',
                borderRadius: 12,
                fontSize: 13,
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <AlertCircle size={16} />
                {validationError}
              </div>
            )}

            {/* Live Search Engine Bar with Autocomplete Dropdown */}
            <div ref={searchContainerRef} style={{ position: 'relative', marginBottom: 18 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                borderRadius: 14,
                background: 'rgba(255, 255, 255, 0.07)',
                border: isDropdownOpen ? '1px solid var(--accent, #1db954)' : '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: isDropdownOpen ? '0 0 16px rgba(29, 185, 84, 0.25)' : 'none',
                transition: 'all 0.2s'
              }}>
                <Search size={18} style={{ color: 'var(--accent, #1db954)', flexShrink: 0 }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Search any artist worldwide (e.g. Justin Bieber, Adele, Taylor Swift)..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none'
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (searchResults.length > 0) {
                        addCustomArtist(searchResults[0]);
                      } else {
                        addCustomArtist(searchQuery);
                      }
                    }
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 2 }}
                  >
                    <X size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => addCustomArtist(searchQuery)}
                  disabled={!searchQuery.trim()}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    background: searchQuery.trim() ? 'var(--accent, #1db954)' : 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: searchQuery.trim() ? '#000' : 'rgba(255,255,255,0.4)',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: searchQuery.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Plus size={15} /> Add
                </button>
              </div>

              {/* Autocomplete Suggestions Dropdown */}
              {isDropdownOpen && trimmedQuery && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: 6,
                  background: 'rgba(18, 18, 24, 0.95)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 16,
                  maxHeight: 280,
                  overflowY: 'auto',
                  zIndex: 999,
                  boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
                  padding: 8
                }}>
                  <div style={{ padding: '6px 12px 8px', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Artist Search Results ({searchResults.length})
                  </div>

                  {searchResults.map((artist) => {
                    const isSelected = selectedArtists.includes(artist);
                    return (
                      <div
                        key={artist}
                        onClick={() => {
                          toggleArtist(artist);
                          setIsDropdownOpen(false);
                        }}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(29, 185, 84, 0.15)' : 'transparent',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            fontWeight: 800,
                            color: 'var(--accent, #1db954)'
                          }}>
                            {artist.charAt(0)}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                            {artist}
                          </span>
                        </div>

                        <button
                          type="button"
                          style={{
                            padding: '4px 10px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            border: 'none',
                            background: isSelected ? 'rgba(239, 68, 68, 0.2)' : 'var(--accent, #1db954)',
                            color: isSelected ? '#fca5a5' : '#000',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          {isSelected ? <X size={12} /> : <Plus size={12} />}
                          {isSelected ? 'Remove' : 'Select'}
                        </button>
                      </div>
                    );
                  })}

                  {!exactMatchExists && searchQuery.trim() && (
                    <div
                      onClick={() => addCustomArtist(searchQuery)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        cursor: 'pointer',
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px dashed rgba(59, 130, 246, 0.4)',
                        marginTop: 4
                      }}
                    >
                      <Plus size={16} style={{ color: '#60a5fa' }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#93c5fd' }}>
                        Add custom artist: "{searchQuery.trim()}"
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Popular Artist Option Pills Grid */}
            <div className="onboarding-pills-grid" style={{ maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
              {GLOBAL_ARTIST_DATABASE
                .filter(artist => !trimmedQuery || artist.toLowerCase().includes(trimmedQuery))
                .map(artist => {
                  const isSelected = selectedArtists.includes(artist);
                  return (
                    <button
                      key={artist}
                      type="button"
                      className={`onboarding-pill ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleArtist(artist)}
                    >
                      {isSelected ? <Check size={14} /> : <Music2 size={14} />}
                      <span>{artist}</span>
                    </button>
                  );
                })}

              {/* User Added Custom Artists that are not in the main database */}
              {selectedArtists.filter(a => !GLOBAL_ARTIST_DATABASE.includes(a)).map(artist => (
                <button
                  key={artist}
                  type="button"
                  className="onboarding-pill selected"
                  onClick={() => toggleArtist(artist)}
                >
                  <Check size={14} />
                  <span>{artist}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Genres Section */}
          <div className="onboarding-section" style={{ marginTop: 20 }}>
            <h4 className="onboarding-section-title" style={{ marginBottom: 10 }}>
              <Sparkles size={16} className="text-purple" /> Favorite Genres & Languages (Optional)
            </h4>
            <div className="onboarding-pills-grid">
              {GENRE_OPTIONS.map(genre => {
                const isSelected = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    className={`onboarding-pill ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleGenre(genre)}
                  >
                    {isSelected ? <Check size={14} /> : <Sparkles size={14} />}
                    <span>{genre}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="onboarding-footer" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="submit"
              disabled={!isValid}
              className="btn-primary onboarding-save-btn"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 14,
                fontWeight: 800,
                fontSize: 15,
                opacity: isValid ? 1 : 0.5,
                cursor: isValid ? 'pointer' : 'not-allowed',
                background: isValid ? 'var(--accent, #1db954)' : 'rgba(255,255,255,0.1)',
                color: isValid ? '#000' : 'rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: isValid ? '0 6px 20px rgba(29, 185, 84, 0.35)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {isValid ? (
                <>Save Preferences & Start Listening 🎵</>
              ) : (
                <>Select {remainingNeeded} More Artist{remainingNeeded > 1 ? 's' : ''} to Continue</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
