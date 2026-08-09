import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, UserCheck, Music2, Plus, AlertCircle } from 'lucide-react';
import { getUserPreferences, saveUserPreferences } from '../services/usageTracker';

const DEFAULT_ARTIST_OPTIONS = [
  'Arijit Singh', 'Sid Sriram', 'A.R. Rahman', 'Anirudh Ravichander',
  'Taylor Swift', 'Devi Sri Prasad (DSP)', 'Shreya Ghoshal', 'AP Dhillon',
  'Kendrick Lamar', 'Lady Gaga', 'Billie Eilish', 'Bruno Mars',
  'Armaan Malik', 'Jubin Nautiyal', 'The Weeknd', 'Ed Sheeran',
  'S.S. Thaman', 'Diljit Dosanjh', 'Post Malone', 'Dua Lipa'
];

const GENRE_OPTIONS = [
  'Telugu Cinema Hits', 'Bollywood Beats', 'English Pop', 'Lo-Fi Chill',
  'Hip-Hop / Rap', 'Rock Classics', 'EDM Party', 'Synthwave / Retro'
];

export default function OnboardingModal({ isOpen, onClose, onSave }) {
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [customArtistInput, setCustomArtistInput] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const prefs = getUserPreferences();
      setSelectedArtists(prefs.artists || []);
      setSelectedGenres(prefs.genres || []);
      setValidationError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleArtist = (artist) => {
    setValidationError('');
    setSelectedArtists(prev =>
      prev.includes(artist) ? prev.filter(a => a !== artist) : [...prev, artist]
    );
  };

  const addCustomArtist = (e) => {
    e.preventDefault();
    const trimmed = customArtistInput.trim();
    if (!trimmed) return;
    if (selectedArtists.some(a => a.toLowerCase() === trimmed.toLowerCase())) {
      setCustomArtistInput('');
      return;
    }
    setSelectedArtists(prev => [...prev, trimmed]);
    setCustomArtistInput('');
    setValidationError('');
  };

  const toggleGenre = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const isValid = selectedArtists.length >= 3;
  const remainingNeeded = Math.max(0, 3 - selectedArtists.length);

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
      <div className="onboarding-modal glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680, width: '92%' }}>
        <div className="onboarding-header">
          <div className="onboarding-title-wrap">
            <Sparkles className="text-accent" size={26} />
            <div>
              <h2>Personalize Your Music AI</h2>
              <p>Select **at least 3 favorite artists** so Rock Bot AI can tailor music recommendations for you!</p>
            </div>
          </div>
          {isValid && (
            <button className="modal-close-btn" onClick={onClose} title="Close modal">
              <X size={20} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="onboarding-body" style={{ padding: '20px 24px' }}>
          {/* Artists Section */}
          <div className="onboarding-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
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

            <div className="onboarding-pills-grid">
              {DEFAULT_ARTIST_OPTIONS.map(artist => {
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

              {/* Render custom user added artists */}
              {selectedArtists.filter(a => !DEFAULT_ARTIST_OPTIONS.includes(a)).map(artist => (
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

            {/* Custom Artist Add Input */}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <input
                type="text"
                value={customArtistInput}
                onChange={e => setCustomArtistInput(e.target.value)}
                placeholder="+ Add another favorite artist (e.g. Post Malone)"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none'
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomArtist(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={addCustomArtist}
                style={{
                  padding: '10px 16px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Plus size={16} /> Add
              </button>
            </div>
          </div>

          {/* Genres Section */}
          <div className="onboarding-section" style={{ marginTop: 24 }}>
            <h4 className="onboarding-section-title" style={{ marginBottom: 12 }}>
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

          <div className="onboarding-footer" style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
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
