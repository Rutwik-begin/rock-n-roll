/**
 * Usage Tracker & System Health Service
 * Monitors Gemini API daily free-tier quota (1,500 calls/day) and Piped API mirrors.
 */

const QUOTA_STORAGE_KEY = 'rock_gemini_quota_usage';
const PREFS_STORAGE_KEY = 'rock_user_music_preferences';
const MAX_DAILY_QUOTA = 1500;
const MAX_RPM = 15;

const PIPED_MIRRORS = [
  'https://api.piped.private.coffee',
  'https://pipedapi.lunar.icu',
  'https://pipedapi.official-unhinged.de',
  'https://pipedapi.privacy.com.de',
  'https://pipedapi.drgns.space',
];

function getTodayDateString() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

export function getDailyQuotaStats() {
  if (typeof window === 'undefined') {
    return { usedToday: 0, maxDaily: MAX_DAILY_QUOTA, remainingToday: MAX_DAILY_QUOTA, rpmCount: 0 };
  }

  try {
    const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
    const today = getTodayDateString();
    if (!raw) {
      return { usedToday: 0, maxDaily: MAX_DAILY_QUOTA, remainingToday: MAX_DAILY_QUOTA, rpmCount: 0, date: today };
    }

    const data = JSON.parse(raw);
    if (data.date !== today) {
      // Reset for new day
      const resetData = { date: today, count: 0, rpmWindow: [] };
      localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(resetData));
      return { usedToday: 0, maxDaily: MAX_DAILY_QUOTA, remainingToday: MAX_DAILY_QUOTA, rpmCount: 0, date: today };
    }

    const now = Date.now();
    // Filter RPM window timestamps from last 60 seconds
    const recentRpm = (data.rpmWindow || []).filter(ts => now - ts < 60000);
    const usedToday = data.count || 0;
    const remainingToday = Math.max(0, MAX_DAILY_QUOTA - usedToday);

    return {
      usedToday,
      maxDaily: MAX_DAILY_QUOTA,
      remainingToday,
      rpmCount: recentRpm.length,
      date: today,
    };
  } catch {
    return { usedToday: 0, maxDaily: MAX_DAILY_QUOTA, remainingToday: MAX_DAILY_QUOTA, rpmCount: 0 };
  }
}

export function incrementUsage() {
  if (typeof window === 'undefined') return;
  try {
    const today = getTodayDateString();
    const now = Date.now();
    const stats = getDailyQuotaStats();

    const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
    let data = raw ? JSON.parse(raw) : { date: today, count: 0, rpmWindow: [] };
    if (data.date !== today) {
      data = { date: today, count: 0, rpmWindow: [] };
    }

    data.count = (data.count || 0) + 1;
    data.rpmWindow = [...(data.rpmWindow || []).filter(ts => now - ts < 60000), now];

    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(data));
    return getDailyQuotaStats();
  } catch (err) {
    console.warn('Error updating usage tracker:', err);
  }
}

export async function checkMirrorsHealth() {
  const results = [];
  for (const url of PIPED_MIRRORS) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 2500);
      const res = await fetch(`${url}/search?q=test`, { signal: ctrl.signal });
      clearTimeout(timer);
      results.push({ url, status: res.ok ? 'online' : 'offline' });
    } catch {
      results.push({ url, status: 'offline' });
    }
  }
  return results;
}

export function getUserPreferences() {
  if (typeof window === 'undefined') return { artists: [], genres: [] };
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { artists: [], genres: [] };
  } catch {
    return { artists: [], genres: [] };
  }
}

export function saveUserPreferences(prefs) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('Error saving preferences:', e);
  }
}
