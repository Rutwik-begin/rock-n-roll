import React, { useState } from 'react';
import { LogIn, UserPlus, CheckCircle, AlertCircle, Loader, Music, ArrowRight } from 'lucide-react';
import { signIn, signUp } from '../services/supabase';

export default function LoginView({ onAuthSuccess, onGuestContinue }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify your password.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        const data = await signIn(email, password);
        setSuccess('Signed in successfully!');
        if (onAuthSuccess) await onAuthSuccess(data.user);
      } else if (mode === 'signup') {
        const data = await signUp(email, password, displayName);
        setSuccess('Account created! Logging you in...');
        if (onAuthSuccess && data.user) {
          await onAuthSuccess(data.user);
        } else {
          setTimeout(() => setMode('signin'), 2000);
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-view-container" style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 30%, rgba(29, 185, 84, 0.15), rgba(18, 18, 18, 1) 70%)',
      position: 'relative',
      overflow: 'hidden',
      padding: 24
    }}>
      {/* Background Decorative Glows */}
      <div style={{
        position: 'absolute', top: '-10%', left: '20%', width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(29, 185, 84, 0.2) 0%, transparent 70%)',
        filter: 'blur(80px)', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '20%', width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
        filter: 'blur(80px)', pointerEvents: 'none'
      }} />

      {/* Main Login Card */}
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'rgba(24, 24, 24, 0.75)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 24,
        boxShadow: '0 30px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 10,
        animation: 'fadeIn 0.4s ease'
      }}>
        {/* Brand Hero Banner */}
        <div style={{
          textAlign: 'center', padding: '36px 32px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'linear-gradient(135deg, var(--accent), #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', color: '#000',
            boxShadow: '0 10px 30px rgba(29, 185, 84, 0.4)'
          }}>
            <Music size={32} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Rock 'N Roll
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>
            {mode === 'signin' && 'Sign in to access your cloud playlists & likes'}
            {mode === 'signup' && 'Create your free account for cross-device sync'}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex', padding: '12px 32px 0', gap: 8,
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          background: 'rgba(0,0,0,0.2)'
        }}>
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
            style={{
              flex: 1, padding: '12px 0', border: 'none', background: 'none',
              fontSize: 14, fontWeight: 700,
              color: mode === 'signin' ? 'var(--accent)' : 'rgba(255,255,255,0.5)',
              borderBottom: mode === 'signin' ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
            style={{
              flex: 1, padding: '12px 0', border: 'none', background: 'none',
              fontSize: 14, fontWeight: 700,
              color: mode === 'signup' ? 'var(--accent)' : 'rgba(255,255,255,0.5)',
              borderBottom: mode === 'signup' ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '28px 32px 32px' }}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 12, padding: '12px 16px', marginBottom: 20,
              display: 'flex', alignItems: 'flex-start', gap: 10, color: '#fca5a5', fontSize: 13
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 12, padding: '12px 16px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 10, color: '#86efac', fontSize: 13
            }}>
              <CheckCircle size={18} style={{ flexShrink: 0 }} />
              <div>{success}</div>
            </div>
          )}

          {mode === 'signup' && (
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 8, letterSpacing: '0.5px' }}>
                DISPLAY NAME (NICKNAME)
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Music"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', fontSize: 14, outline: 'none'
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 8, letterSpacing: '0.5px' }}>
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 12,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', fontSize: 14, outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: mode === 'signup' ? 18 : 26 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 8, letterSpacing: '0.5px' }}>
              PASSWORD
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 12,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', fontSize: 14, outline: 'none'
              }}
            />
          </div>

          {mode === 'signup' && (
            <div style={{ marginBottom: 26 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 8, letterSpacing: '0.5px' }}>
                CONFIRM PASSWORD
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', fontSize: 14, outline: 'none'
                }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '16px', borderRadius: 14, border: 'none',
              background: 'var(--accent)', color: '#000', fontWeight: 800, fontSize: 15,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 8px 25px rgba(29, 185, 84, 0.3)', transition: 'transform 0.2s'
            }}
          >
            {loading ? (
              <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
            ) : mode === 'signin' ? (
              <> <LogIn size={18} /> Sign In to Account </>
            ) : (
              <> <UserPlus size={18} /> Register Account </>
            )}
          </button>

          {onGuestContinue && (
            <button
              type="button"
              onClick={onGuestContinue}
              style={{
                width: '100%', marginTop: 16, padding: '12px', background: 'none',
                border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
            >
              Continue as Guest <ArrowRight size={14} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
