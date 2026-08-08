import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, UserCheck, Music2 } from 'lucide-react';
import { getUserPreferences, saveUserPreferences } from '../services/usageTracker';

const ARTIST_OPTIONS = [
  'Arijit Singh', 'Sid Sriram', 'A.R. Rahman', 'Anirudh Ravichander',
  'Taylor Swift', 'Devi Sri Prasad (DSP)', 'Shreya Ghoshal', 'AP Dhillon',
  'Kendrick Lamar', 'Lady Gaga', 'Billie Eilish', 'Bruno Mars',
  'Armaan Malik', 'Jubin Nautiyal', 'The Weeknd', 'Ed Sheeran'
];

const GENRE_OPTIONS = [
  'Telugu Cinema Hits', 'Bollywood Beats', 'English Pop', 'Lo-Fi Chill',
  'Hip-Hop / Rap', 'Rock Classics', 'EDM Party', 'Synthwave / Retro'
];

export default function OnboardingModal({ isOpen, onClose, onSave }) {
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const prefs = getUserPreferences();
      setSelectedArtists(prefs.artists || []);
      setSelectedGenres(prefs.genres || []);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleArtist = (artist) => {
    setSelectedArtists(prev =>
      prev.includes(artist) ? prev.filter(a => a !== artist) : [...prev, artist]
    );
  };

  const toggleGenre = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const prefs = { artists: selectedArtists, genres: selectedGenres };
    saveUserPreferences(prefs);
    if (onSave) onSave(prefs);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="onboarding-modal glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="onboarding-header">
          <div className="onboarding-title-wrap">
            <Sparkles className="text-accent" size={24} />
            <div>
              <h2>Personalize Your Music Experience</h2>
              <p>Select your favorite artists & genres so Rock Bot AI can tailor recommendations for you!</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="onboarding-body">
          {/* Artists Section */}
          <div className="onboarding-section">
            <h4 className="onboarding-section-title">
              <UserCheck size={16} className="text-accent" /> Favorite Artists
            </h4>
            <div className="onboarding-pills-grid">
              {ARTIST_OPTIONS.map(artist => {
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
            </div>
          </div>

          {/* Genres Section */}
          <div className="onboarding-section">
            <h4 className="onboarding-section-title">
              <Sparkles size={16} className="text-purple" /> Favorite Genres & Languages
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

          <div className="onboarding-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Skip for Now
            </button>
            <button type="submit" className="btn-primary onboarding-save-btn">
              Save Preferences & Start Listening
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
