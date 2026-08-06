import { createClient } from '@supabase/supabase-js';

const STORAGE_KEYS = {
  URL: 'aura_supabase_url',
  KEY: 'aura_supabase_anon_key',
};

// Retrieve configuration (Environment variables first, then localStorage)
export function getSupabaseConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const localUrl = localStorage.getItem(STORAGE_KEYS.URL);
  const localKey = localStorage.getItem(STORAGE_KEYS.KEY);

  const url = (localUrl || envUrl || '').trim();
  const key = (localKey || envKey || '').trim();

  const isValid = url.startsWith('http') && key.length > 10 && !url.includes('your-supabase-project');

  return { url, key, isValid };
}

export function saveSupabaseConfig(url, key) {
  if (url) localStorage.setItem(STORAGE_KEYS.URL, url.trim());
  else localStorage.removeItem(STORAGE_KEYS.URL);

  if (key) localStorage.setItem(STORAGE_KEYS.KEY, key.trim());
  else localStorage.removeItem(STORAGE_KEYS.KEY);

  initSupabaseClient();
}

let supabase = null;

function initSupabaseClient() {
  const { url, key, isValid } = getSupabaseConfig();
  if (isValid) {
    try {
      supabase = createClient(url, key);
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      supabase = null;
    }
  } else {
    supabase = null;
  }
  return supabase;
}

// Initial instance setup
initSupabaseClient();

export function isConfigured() {
  return !!supabase;
}

// --- Auth API ---

export async function signUp(email, password, displayName = '') {
  if (!supabase) throw new Error('Supabase is not configured yet. Please enter your Supabase URL & Anon Key.');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || email.split('@')[0]
      }
    }
  });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  if (!supabase) throw new Error('Supabase is not configured yet. Please enter your Supabase URL & Anon Key.');
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function updateUserProfile(displayName) {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.updateUser({
    data: { display_name: displayName }
  });
  if (error) throw error;
  return data.user;
}

export async function updateUserPassword(newPassword) {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) console.warn('Sign out warning:', error);
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
}

export function onAuthStateChange(callback) {
  if (!supabase) return () => {};
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session?.user || null);
  });
  return () => subscription.unsubscribe();
}

// --- Data Synchronization API ---

export async function syncUserData(userId, userData) {
  if (!supabase || !userId) return null;

  try {
    const payload = {
      user_id: userId,
      liked_tracks: userData.likedTracks || [],
      playlists: userData.playlists || [],
      recent_tracks: userData.recentTracks || [],
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_data')
      .upsert(payload, { onConflict: 'user_id' })
      .select();

    if (error) {
      console.warn('Supabase cloud sync error (Make sure user_data table exists):', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Sync failed:', err);
    return null;
  }
}

export async function fetchUserData(userId) {
  if (!supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return {
      likedTracks: data.liked_tracks || [],
      playlists: data.playlists || [],
      recentTracks: data.recent_tracks || [],
    };
  } catch (err) {
    console.warn('Fetch user data failed:', err);
    return null;
  }
}
