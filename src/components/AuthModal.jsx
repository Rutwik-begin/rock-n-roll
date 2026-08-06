import React, { useState, useEffect } from 'react';
import { X, LogIn, UserPlus, Settings, Key, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { signIn, signUp, getSupabaseConfig, saveSupabaseConfig, isConfigured } from '../services/supabase';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'config'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Custom API configuration state
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setUrl(config.url);
      setAnonKey(config.key);
      setError('');
      setSuccess('');
      if (!config.isValid) {
        setMode('config');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'config') {
        saveSupabaseConfig(url, anonKey);
        setSuccess('Supabase credentials saved successfully!');
        setTimeout(() => setMode('signin'), 1000);
      } else if (mode === 'signin') {
        const data = await signIn(email, password);
        setSuccess('Signed in successfully!');
        if (onAuthSuccess) onAuthSuccess(data.user);
        setTimeout(onClose, 800);
      } else if (mode === 'signup') {
        const data = await signUp(email, password);
        setSuccess('Account created! Check your email to confirm registration or sign in.');
        if (onAuthSuccess && data.user) onAuthSuccess(data.user);
        setTimeout(() => setMode('signin'), 2000);
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const configured = isConfigured();

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 2000,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        width: '100%', maxWidth: 440,
        background: 'var(--bg-card, #181818)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 28px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {mode === 'config' ? <Settings size={22} color="var(--accent)" /> : <LogIn size={22} color="var(--accent)" />}
            <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
              {mode === 'signin' && 'Sign In to Rock \'N Roll'}
              {mode === 'signup' && 'Create Rock \'N Roll Account'}
              {mode === 'config' && 'Supabase Configuration'}
            </span>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none',
            width: 34, height: 34, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', cursor: 'pointer'
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{
          display: 'flex', padding: '12px 28px 0', gap: 8,
          borderBottom: '1px solid rgba(255,255,255,0.04)'
        }}>
          <button
            type="button"
            disabled={!configured}
            onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
            style={{
              flex: 1, padding: '10px 0', border: 'none', background: 'none',
              fontSize: 14, fontWeight: 600,
              color: mode === 'signin' ? 'var(--accent)' : 'rgba(255,255,255,0.5)',
              borderBottom: mode === 'signin' ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: configured ? 'pointer' : 'not-allowed',
              opacity: configured ? 1 : 0.4
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            disabled={!configured}
            onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
            style={{
              flex: 1, padding: '10px 0', border: 'none', background: 'none',
              fontSize: 14, fontWeight: 600,
              color: mode === 'signup' ? 'var(--accent)' : 'rgba(255,255,255,0.5)',
              borderBottom: mode === 'signup' ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: configured ? 'pointer' : 'not-allowed',
              opacity: configured ? 1 : 0.4
            }}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => { setMode('config'); setError(''); setSuccess(''); }}
            style={{
              padding: '10px 14px', border: 'none', background: 'none',
              fontSize: 14, fontWeight: 600,
              color: mode === 'config' ? 'var(--accent)' : 'rgba(255,255,255,0.5)',
              borderBottom: mode === 'config' ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <Settings size={15} /> Keys
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px 28px' }}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 10, padding: '12px 14px', marginBottom: 20,
              display: 'flex', alignItems: 'flex-start', gap: 10, color: '#fca5a5', fontSize: 13
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 10, padding: '12px 14px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 10, color: '#86efac', fontSize: 13
            }}>
              <CheckCircle size={18} style={{ flexShrink: 0 }} />
              <div>{success}</div>
            </div>
          )}

          {mode === 'config' ? (
            <>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 16, lineHeight: 1.5 }}>
                Enter your Supabase credentials to enable cloud sync and user accounts. You can find these in your Supabase Project Settings &gt; API.
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                  SUPABASE PROJECT URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://xyz.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: 14, outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                  SUPABASE ANON KEY
                </label>
                <input
                  type="password"
                  required
                  placeholder="eyJhbGciOi..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: 14, outline: 'none'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                  background: 'var(--accent)', color: '#000', fontWeight: 700, fontSize: 15,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Save Credentials'}
              </button>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: 14, outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
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
                    width: '100%', padding: '12px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: 14, outline: 'none'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                  background: 'var(--accent)', color: '#000', fontWeight: 700, fontSize: 15,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                {loading ? (
                  <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                ) : mode === 'signin' ? (
                  <> <LogIn size={18} /> Sign In </>
                ) : (
                  <> <UserPlus size={18} /> Create Account </>
                )}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
