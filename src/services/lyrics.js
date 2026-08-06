const lyricsCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function parseSyncedLyrics(lrcString) {
  if (!lrcString) return null;
  const lines = lrcString.split('\n');
  const parsed = [];
  
  // Handles [mm:ss], [m:ss.xx], [mm:ss.xxx], etc.
  const timeRegex = /\[(\d{1,3}):(\d{2})(?:\.(\d{1,3}))?\](.*)/;

  for (const line of lines) {
    const match = timeRegex.exec(line);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const fraction = match[3] ? parseFloat('0.' + match[3]) : 0;
      const text = match[4].trim();
      const timeInSeconds = minutes * 60 + seconds + fraction;
      
      parsed.push({ 
        time: timeInSeconds, 
        text: text || '♪',
        words: (text || '♪').split(' ')
      });
    }
  }

  return parsed.length > 0 ? parsed : null;
}

export async function fetchLyrics(trackName, artistName) {
  if (!trackName || !artistName) return null;

  // Clean names to improve search hit rate
  const cleanTrack = trackName
    .replace(/\(Official.*?\)/gi, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\(feat.*?\)/gi, '')
    .split('|')[0]
    .trim();
    
  const cleanArtist = artistName
    .replace(/ - Topic$/i, '')
    .replace(/VEVO$/i, '')
    .trim();

  const cacheKey = `${cleanTrack.toLowerCase()}||${cleanArtist.toLowerCase()}`;
  if (lyricsCache.has(cacheKey)) {
    const cached = lyricsCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
    lyricsCache.delete(cacheKey);
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);

    // 1. Try direct exact match first
    const getUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTrack)}&artist_name=${encodeURIComponent(cleanArtist)}`;
    let res = await fetch(getUrl, { signal: ctrl.signal });
    let data = null;

    if (res.ok) {
      data = await res.json();
    } else {
      // 2. Fallback to fuzzy search query
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(cleanTrack + ' ' + cleanArtist)}`;
      const searchRes = await fetch(searchUrl, { signal: ctrl.signal });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (Array.isArray(searchData) && searchData.length > 0) {
          // Prefer item with syncedLyrics if available
          data = searchData.find(item => item.syncedLyrics) || searchData[0];
        }
      }
    }

    clearTimeout(timer);
    if (!data) return null;
    
    const result = {
      synced: parseSyncedLyrics(data.syncedLyrics),
      plain: data.plainLyrics || null,
      artist: data.artistName || cleanArtist,
      track: data.name || cleanTrack,
    };

    lyricsCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.warn('Lyrics fetch failed:', err);
    return null;
  }
}
