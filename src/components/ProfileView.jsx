import React, { useState } from 'react';
import { User, Key, LogOut, CheckCircle, AlertCircle, Loader, ShieldCheck, Heart, Music, ListMusic, Sparkles, Edit3 } from 'lucide-react';
import { updateUserProfile, updateUserPassword } from '../services/supabase';

export default function ProfileView({ user, setUser, onSignOut, likedTracks = [], playlists = [], recentTracks = [] }) {
  const initialDisplayName = user?.user_metadata?.display_name || (user?.email ? user.email.split('@')[0] : 'Music Fan');
  
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage({ text: '', type: '' });
    if (!displayName.trim()) {
      setProfileMessage({ text: 'Display name cannot be empty.', type: 'error' });
      return;
    }
    setProfileLoading(true);

    try {
      const updatedUser = await updateUserProfile(displayName.trim());
      if (updatedUser) {
        setUser(updatedUser);
      }
      setProfileMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setProfileMessage({ text: err.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ text: '', type: '' });

    if (!newPassword || newPassword.length < 6) {
      setPasswordMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'Passwords do not match.', type: 'error' });
      return;
    }

    setPasswordLoading(true);

    try {
      await updateUserPassword(newPassword);
      setPasswordMessage({ text: 'Password changed successfully!', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMessage({ text: err.message || 'Failed to update password.', type: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const avatarInitial = (displayName || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="profile-view-container" style={{
      maxWidth: 900,
      margin: '0 auto',
      padding: '32px 24px 80px',
      color: '#fff'
    }}>
      {/* Header Banner */}
      <div className="profile-header-card">
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent, #1db954), #10b981)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000',
          fontSize: 34,
          fontWeight: 900,
          boxShadow: '0 0 30px rgba(29, 185, 84, 0.4)',
          flexShrink: 0
        }}>
          {avatarInitial}
        </div>

        <div className="profile-header-info" style={{ flex: 1, minWidth: 0 }}>
          <div className="profile-name-row" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.5px', wordBreak: 'break-word' }}>
              {displayName}
            </h1>
            <span style={{
              background: 'rgba(29, 185, 84, 0.2)',
              border: '1px solid rgba(29, 185, 84, 0.4)',
              color: '#86efac',
              fontSize: 12,
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: 20,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}>
              <ShieldCheck size={14} /> Cloud Active
            </span>
          </div>
          <p className="profile-user-email" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 6, wordBreak: 'break-all' }}>
            {user?.email || 'Logged in user'}
          </p>
        </div>

        <button
          onClick={onSignOut}
          className="profile-signout-btn"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '12px 20px',
            borderRadius: 14,
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s',
            flexShrink: 0
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
            e.currentTarget.style.color = '#fca5a5';
          }}
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>

      {/* Overview Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 20,
        marginBottom: 36
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 20,
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{ padding: 12, borderRadius: 14, background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
            <Heart size={24} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{likedTracks.length}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Liked Tracks</div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 20,
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{ padding: 12, borderRadius: 14, background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <ListMusic size={24} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{playlists.length}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Playlists</div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 20,
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{ padding: 12, borderRadius: 14, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Music size={24} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{recentTracks.length}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Recent History</div>
          </div>
        </div>
      </div>

      {/* Settings Sections Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 28 }}>
        
        {/* Profile / Nickname Card */}
        <div style={{
          background: 'rgba(24, 24, 24, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 24,
          padding: '28px',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <User size={20} color="var(--accent)" />
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Display Name & Profile</h2>
          </div>

          {profileMessage.text && (
            <div style={{
              background: profileMessage.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: profileMessage.type === 'success' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              color: profileMessage.type === 'success' ? '#86efac' : '#fca5a5',
              padding: '12px 14px', borderRadius: 12, fontSize: 13, marginBottom: 18,
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              {profileMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {profileMessage.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 8, letterSpacing: '0.5px' }}>
                DISPLAY NAME / NICKNAME
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your Nickname"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', fontSize: 14, outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 8, letterSpacing: '0.5px' }}>
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.5)', fontSize: 14, cursor: 'not-allowed'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: 'var(--accent)', color: '#000', fontWeight: 800, fontSize: 14,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 6px 20px rgba(29, 185, 84, 0.3)'
              }}
            >
              {profileLoading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <><Edit3 size={16} /> Save Profile Details</>}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div style={{
          background: 'rgba(24, 24, 24, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 24,
          padding: '28px',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Key size={20} color="var(--accent)" />
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Security & Password</h2>
          </div>

          {passwordMessage.text && (
            <div style={{
              background: passwordMessage.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: passwordMessage.type === 'success' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              color: passwordMessage.type === 'success' ? '#86efac' : '#fca5a5',
              padding: '12px 14px', borderRadius: 12, fontSize: 13, marginBottom: 18,
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              {passwordMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {passwordMessage.text}
            </div>
          )}

          <form onSubmit={handleUpdatePassword}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 8, letterSpacing: '0.5px' }}>
                NEW PASSWORD
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', fontSize: 14, outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 8, letterSpacing: '0.5px' }}>
                CONFIRM NEW PASSWORD
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', fontSize: 14, outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 800, fontSize: 14,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              {passwordLoading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <><Key size={16} /> Change Password</>}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
