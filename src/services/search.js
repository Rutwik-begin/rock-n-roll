/**
 * Music Search Service
 * Uses Piped API (YouTube search) to find tracks.
 * Returns clean track objects with videoId for YouTube playback.
 */

const PIPED_MIRRORS = [
  'https://api.piped.private.coffee',
  'https://pipedapi.lunar.icu',
  'https://pipedapi.official-unhinged.de',
  'https://pipedapi.privacy.com.de',
  'https://pipedapi.drgns.space',
];

function parseDuration(dur) {
  // Piped returns duration in seconds (integer)
  if (typeof dur === 'number') return dur;
  return 0;
}

function cleanTitle(title) {
  if (!title) return 'Unknown Track';
  return title
    .replace(/\(Official\s*(Music\s*)?Video\)/gi, '')
    .replace(/\(Official\s*Audio\)/gi, '')
    .replace(/\[Official\s*(Music\s*)?Video\]/gi, '')
    .replace(/\(Lyrics?\)/gi, '')
    .replace(/\[Lyrics?\]/gi, '')
    .replace(/\(Audio\)/gi, '')
    .replace(/\|.*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function cleanArtist(name) {
  if (!name) return 'Unknown Artist';
  return name.replace(/\s*-\s*Topic$/, '').replace(/VEVO$/i, '').trim();
}

function extractVideoId(url) {
  if (!url) return null;
  // Piped returns /watch?v=XXXX
  const match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export function parseYouTubeUrl(input) {
  if (!input) return null;
  const s = input.trim();
  // Raw 11-char video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  // URL patterns
  const m = s.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=)|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

async function pipedSearch(query, filter = 'all') {
  const q = encodeURIComponent(query);
  const filterParam = filter ? `&filter=${filter}` : '';
  for (const mirror of PIPED_MIRRORS) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(`${mirror}/search?q=${q}${filterParam}`, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('json')) continue;
      const data = await res.json();
      if (data.items && data.items.length > 0) return data.items;
    } catch {
      // try next mirror
    }
  }
  return [];
}

export async function searchTracks(query, limit = 25) {
  if (!query || !query.trim()) return [];

  const input = query.trim();

  // Direct YouTube URL or video ID
  const directId = parseYouTubeUrl(input);
  if (directId) {
    return [{
      id: directId,
      videoId: directId,
      title: 'YouTube Track',
      artist: 'YouTube',
      duration: 0,
      thumbnail: `https://i.ytimg.com/vi/${directId}/hqdefault.jpg`,
    }];
  }

  // Search without restrictive music filters so full anime OSTs, 30+ min compilations, movie soundtracks & TV show songs all appear
  const items = await pipedSearch(input, 'all');
  const tracks = [];

  for (const item of items) {
    if (tracks.length >= limit) break;
    const videoId = extractVideoId(item.url);
    if (!videoId) continue;
    const dur = parseDuration(item.duration);

    // Skip only tiny YouTube shorts (< 15s)
    if (dur > 0 && dur < 15) continue;

    tracks.push({
      id: videoId,
      videoId,
      title: cleanTitle(item.title) || 'Unknown Track',
      artist: cleanArtist(item.uploaderName),
      duration: dur,
      thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    });
  }

  return tracks;
}

const MIX_PATTERNS = /\b(mashup|jukebox|compilation|full album|album|nonstop|non-stop|party mix|dj mix|top 10|top 20|top 50|top 100|jukeboxes|audio jukebox|video jukebox|full songs|all songs|best of|collection|playlist|medley|remix mashup|party mashup|mega mix|megamix|lofi mix|chill mix)\b/i;

function isSingleTrack(title, duration) {
  // Single song must be between 60s (1 min) and 480s (8 mins)
  if (duration > 0 && (duration < 60 || duration > 480)) return false;
  // Title pattern check: filter out mashups, jukeboxes, compilations, mixes
  if (title && MIX_PATTERNS.test(title)) return false;
  return true;
}

const apiCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCached(key) {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.time < CACHE_TTL) return cached.data;
  return null;
}

function setCached(key, data) {
  apiCache.set(key, { data, time: Date.now() });
}

async function fetchTrendingBySearch(query, fallback) {
  const cacheKey = `trending-${query}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const items = await pipedSearch(query, 'music_songs');
  const tracks = [];
  for (const item of items) {
    if (tracks.length >= 10) break;
    const videoId = extractVideoId(item.url);
    if (!videoId) continue;
    const dur = parseDuration(item.duration);
    const cleanedTitle = cleanTitle(item.title);

    // Skip compilations, jukeboxes, party mashups, and videos outside 60s-480s range
    if (!isSingleTrack(item.title, dur) || !isSingleTrack(cleanedTitle, dur)) continue;

    tracks.push({
      id: videoId,
      videoId,
      title: cleanedTitle,
      artist: cleanArtist(item.uploaderName),
      duration: dur || 210,
      thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    });
  }
  const result = tracks.length > 0 ? tracks : fallback;
  setCached(cacheKey, result);
  return result;
}

// ─── Apple Music RSS (Live Charts) ───────────────────────────────────────────

/**
 * In-memory cache for resolved YouTube videoIds.
 * Key: "title|artist", Value: { videoId, duration }
 */
const videoIdCache = new Map();

/**
 * Search YouTube for a single song and return a videoId, or null on failure.
 * Results are cached so repeat lookups are instant.
 */
async function findVideoId(songName, artistName) {
  const cacheKey = `${songName}|${artistName}`.toLowerCase();
  if (videoIdCache.has(cacheKey)) return videoIdCache.get(cacheKey);

  const queries = [
    `${songName} ${artistName} official audio`,
    `${songName} ${artistName}`,
    `${songName} audio`
  ];

  for (const q of queries) {
    const items = await pipedSearch(q);
    for (const item of items) {
      const vid = extractVideoId(item.url);
      if (vid) {
        const result = { videoId: vid, duration: parseDuration(item.duration) || 210 };
        videoIdCache.set(cacheKey, result);
        return result;
      }
    }
  }
  return null;
}

/**
 * Resolve a chart track's YouTube videoId on-demand (when user clicks play).
 * Returns the track with videoId filled in, or null if lookup fails.
 */
export async function resolveChartTrack(track) {
  // Already has a videoId — return as-is
  if (track.videoId) return track;

  const result = await findVideoId(track.title, track.artist);
  if (!result) return null;

  return {
    ...track,
    id: result.videoId,
    videoId: result.videoId,
    duration: result.duration,
  };
}

// ─── Apple Music / iTunes Live Charts ────────────────────────────────────────

const FALLBACK_TOP_GLOBAL_20 = [
  { id: 'f8B8w_D62Yg', videoId: 'f8B8w_D62Yg', title: 'Die With A Smile', artist: 'Lady Gaga & Bruno Mars', duration: 251, thumbnail: 'https://i.ytimg.com/vi/f8B8w_D62Yg/hqdefault.jpg', rank: 1, isChart: true },
  { id: 'eVli-tstM5E', videoId: 'eVli-tstM5E', title: 'Espresso', artist: 'Sabrina Carpenter', duration: 175, thumbnail: 'https://i.ytimg.com/vi/eVli-tstM5E/hqdefault.jpg', rank: 2, isChart: true },
  { id: 'V9PVRfjEBTI', videoId: 'V9PVRfjEBTI', title: 'BIRDS OF A FEATHER', artist: 'Billie Eilish', duration: 198, thumbnail: 'https://i.ytimg.com/vi/V9PVRfjEBTI/hqdefault.jpg', rank: 3, isChart: true },
  { id: 'Py_9Yv1VbQc', videoId: 'Py_9Yv1VbQc', title: 'Taste', artist: 'Sabrina Carpenter', duration: 157, thumbnail: 'https://i.ytimg.com/vi/Py_9Yv1VbQc/hqdefault.jpg', rank: 4, isChart: true },
  { id: 'cE2vwCqicmM', videoId: 'cE2vwCqicmM', title: 'Please Please Please', artist: 'Sabrina Carpenter', duration: 186, thumbnail: 'https://i.ytimg.com/vi/cE2vwCqicmM/hqdefault.jpg', rank: 5, isChart: true },
  { id: 'NPn5sC20l3U', videoId: 'NPn5sC20l3U', title: 'Not Like Us', artist: 'Kendrick Lamar', duration: 274, thumbnail: 'https://i.ytimg.com/vi/NPn5sC20l3U/hqdefault.jpg', rank: 6, isChart: true },
  { id: '1RKqOmSKgfo', videoId: '1RKqOmSKgfo', title: 'Good Luck, Babe!', artist: 'Chappell Roan', duration: 218, thumbnail: 'https://i.ytimg.com/vi/1RKqOmSKgfo/hqdefault.jpg', rank: 7, isChart: true },
  { id: 'Oa_RSwwpPaA', videoId: 'Oa_RSwwpPaA', title: 'Beautiful Things', artist: 'Benson Boone', duration: 180, thumbnail: 'https://i.ytimg.com/vi/Oa_RSwwpPaA/hqdefault.jpg', rank: 8, isChart: true },
  { id: 'tD4hcXgDQCg', videoId: 'tD4hcXgDQCg', title: 'I Had Some Help', artist: 'Post Malone ft. Morgan Wallen', duration: 178, thumbnail: 'https://i.ytimg.com/vi/tD4hcXgDQCg/hqdefault.jpg', rank: 9, isChart: true },
  { id: 't7bQwwqW-Hc', videoId: 't7bQwwqW-Hc', title: 'A Bar Song (Tipsy)', artist: 'Shaboozey', duration: 171, thumbnail: 'https://i.ytimg.com/vi/t7bQwwqW-Hc/hqdefault.jpg', rank: 10, isChart: true },
  { id: 'V77nN5Pex_E', videoId: 'V77nN5Pex_E', title: 'Too Sweet', artist: 'Hozier', duration: 251, thumbnail: 'https://i.ytimg.com/vi/V77nN5Pex_E/hqdefault.jpg', rank: 11, isChart: true },
  { id: 'ic8j13U5Z6A', videoId: 'ic8j13U5Z6A', title: 'Cruel Summer', artist: 'Taylor Swift', duration: 178, thumbnail: 'https://i.ytimg.com/vi/ic8j13U5Z6A/hqdefault.jpg', rank: 12, isChart: true },
  { id: '4NRXx6U8ABQ', videoId: '4NRXx6U8ABQ', title: 'Blinding Lights', artist: 'The Weeknd', duration: 200, thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg', rank: 13, isChart: true },
  { id: '34Na4j8AVgA', videoId: '34Na4j8AVgA', title: 'Starboy', artist: 'The Weeknd ft. Daft Punk', duration: 230, thumbnail: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg', rank: 14, isChart: true },
  { id: 'H5v3kku4y6Q', videoId: 'H5v3kku4y6Q', title: 'As It Was', artist: 'Harry Styles', duration: 167, thumbnail: 'https://i.ytimg.com/vi/H5v3kku4y6Q/hqdefault.jpg', rank: 15, isChart: true },
  { id: 'kTJczUoc56U', videoId: 'kTJczUoc56U', title: 'Stay', artist: 'The Kid LAROI & Justin Bieber', duration: 141, thumbnail: 'https://i.ytimg.com/vi/kTJczUoc56U/hqdefault.jpg', rank: 16, isChart: true },
  { id: 'G7KNmW9a75Y', videoId: 'G7KNmW9a75Y', title: 'Flowers', artist: 'Miley Cyrus', duration: 200, thumbnail: 'https://i.ytimg.com/vi/G7KNmW9a75Y/hqdefault.jpg', rank: 17, isChart: true },
  { id: 'JGwWNGJdvx8', videoId: 'JGwWNGJdvx8', title: 'Shape of You', artist: 'Ed Sheeran', duration: 233, thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg', rank: 18, isChart: true },
  { id: 'zABLecsR5UE', videoId: 'zABLecsR5UE', title: 'Someone You Loved', artist: 'Lewis Capaldi', duration: 182, thumbnail: 'https://i.ytimg.com/vi/zABLecsR5UE/hqdefault.jpg', rank: 19, isChart: true },
  { id: 'ApXoWvfEYVU', videoId: 'ApXoWvfEYVU', title: 'Sunflower', artist: 'Post Malone, Swae Lee', duration: 158, thumbnail: 'https://i.ytimg.com/vi/ApXoWvfEYVU/hqdefault.jpg', rank: 20, isChart: true },
];

const FALLBACK_TOP_INDIA_20 = [
  { id: 'NzA_3E_hQEQ', videoId: 'NzA_3E_hQEQ', title: 'Tauba Tauba', artist: 'Badshah & Karan Aujla', duration: 204, thumbnail: 'https://i.ytimg.com/vi/NzA_3E_hQEQ/hqdefault.jpg', rank: 1, isChart: true },
  { id: 'cW8VLC9U8ac', videoId: 'cW8VLC9U8ac', title: 'Softly', artist: 'Karan Aujla', duration: 155, thumbnail: 'https://i.ytimg.com/vi/cW8VLC9U8ac/hqdefault.jpg', rank: 2, isChart: true },
  { id: 'vX2cDW8LUWk', videoId: 'vX2cDW8LUWk', title: 'Winning Speech', artist: 'Karan Aujla', duration: 210, thumbnail: 'https://i.ytimg.com/vi/vX2cDW8LUWk/hqdefault.jpg', rank: 3, isChart: true },
  { id: 'Q_0R3n-vUv8', videoId: 'Q_0R3n-vUv8', title: 'Soulmate', artist: 'Badshah & Arijit Singh', duration: 213, thumbnail: 'https://i.ytimg.com/vi/Q_0R3n-vUv8/hqdefault.jpg', rank: 4, isChart: true },
  { id: 'HUgBq269JMo', videoId: 'HUgBq269JMo', title: 'Aaj Ki Raat', artist: 'Stree 2 / Sachin-Jigar', duration: 228, thumbnail: 'https://i.ytimg.com/vi/HUgBq269JMo/hqdefault.jpg', rank: 5, isChart: true },
  { id: 'gB3tV_K3u1Y', videoId: 'gB3tV_K3u1Y', title: 'Husn', artist: 'Anuv Jain', duration: 217, thumbnail: 'https://i.ytimg.com/vi/gB3tV_K3u1Y/hqdefault.jpg', rank: 6, isChart: true },
  { id: 'WMweEpGlu_U', videoId: 'WMweEpGlu_U', title: 'O Maahi', artist: 'Dunki / Arijit Singh', duration: 233, thumbnail: 'https://i.ytimg.com/vi/WMweEpGlu_U/hqdefault.jpg', rank: 7, isChart: true },
  { id: '80p_r64qXy4', videoId: '80p_r64qXy4', title: 'Ve Kamleya', artist: 'Arijit Singh & Shreya Ghoshal', duration: 246, thumbnail: 'https://i.ytimg.com/vi/80p_r64qXy4/hqdefault.jpg', rank: 8, isChart: true },
  { id: 'Urdlvw0HKNU', videoId: 'Urdlvw0HKNU', title: 'Kesariya', artist: 'Brahmastra / Arijit Singh', duration: 268, thumbnail: 'https://i.ytimg.com/vi/Urdlvw0HKNU/hqdefault.jpg', rank: 9, isChart: true },
  { id: 'TFHCxlRwkOA', videoId: 'TFHCxlRwkOA', title: 'Chaleya', artist: 'Jawan / Arijit Singh', duration: 234, thumbnail: 'https://i.ytimg.com/vi/TFHCxlRwkOA/hqdefault.jpg', rank: 10, isChart: true },
  { id: 'cYOB941gyXI', videoId: 'cYOB941gyXI', title: 'Apna Bana Le', artist: 'Bhediya / Arijit Singh', duration: 275, thumbnail: 'https://i.ytimg.com/vi/cYOB941gyXI/hqdefault.jpg', rank: 11, isChart: true },
  { id: 'sAZVz2-6Z6g', videoId: 'sAZVz2-6Z6g', title: 'Satranga', artist: 'Animal / Arijit Singh', duration: 271, thumbnail: 'https://i.ytimg.com/vi/sAZVz2-6Z6g/hqdefault.jpg', rank: 12, isChart: true },
  { id: 'p_2q8eW3pVE', videoId: 'p_2q8eW3pVE', title: 'Tum Se', artist: 'Raghav & Varun Jain', duration: 260, thumbnail: 'https://i.ytimg.com/vi/p_2q8eW3pVE/hqdefault.jpg', rank: 13, isChart: true },
  { id: 'p5j3Rj6t7h8', videoId: 'p5j3Rj6t7h8', title: 'Naina', artist: 'Crew / Diljit Dosanjh', duration: 180, thumbnail: 'https://i.ytimg.com/vi/p5j3Rj6t7h8/hqdefault.jpg', rank: 14, isChart: true },
  { id: '9P6_bQ_f_60', videoId: '9P6_bQ_f_60', title: 'Peehle Bhi Main', artist: 'Animal / Vishal Mishra', duration: 250, thumbnail: 'https://i.ytimg.com/vi/9P6_bQ_f_60/hqdefault.jpg', rank: 15, isChart: true },
  { id: 'y16-63Z8cQ8', videoId: 'y16-63Z8cQ8', title: 'Arjan Vailly', artist: 'Animal / Bhupinder Babbal', duration: 182, thumbnail: 'https://i.ytimg.com/vi/y16-63Z8cQ8/hqdefault.jpg', rank: 16, isChart: true },
  { id: 'k4yXQvL1vjA', videoId: 'k4yXQvL1vjA', title: 'One Love', artist: 'Shubh', duration: 158, thumbnail: 'https://i.ytimg.com/vi/k4yXQvL1vjA/hqdefault.jpg', rank: 17, isChart: true },
  { id: '4tywp87m3vQ', videoId: '4tywp87m3vQ', title: 'Cheques', artist: 'Shubh', duration: 183, thumbnail: 'https://i.ytimg.com/vi/4tywp87m3vQ/hqdefault.jpg', rank: 18, isChart: true },
  { id: '2U-k1P4-JgA', videoId: '2U-k1P4-JgA', title: 'Still Rollin', artist: 'Shubh', duration: 174, thumbnail: 'https://i.ytimg.com/vi/2U-k1P4-JgA/hqdefault.jpg', rank: 19, isChart: true },
  { id: 'k_g7wP5x5Xo', videoId: 'k_g7wP5x5Xo', title: 'Elevator', artist: 'Shubh', duration: 160, thumbnail: 'https://i.ytimg.com/vi/k_g7wP5x5Xo/hqdefault.jpg', rank: 20, isChart: true },
];

/**
 * Fetch live Top 20 songs from Apple/iTunes RSS charts.
 */
async function fetchAppleMusicChart(storefront, limit = 20) {
  const cacheKey = `apple-chart-${storefront}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const urls = [
    `https://itunes.apple.com/${storefront}/rss/topsongs/limit=${limit}/json`,
    `https://rss.applemarketingtools.com/api/v2/${storefront}/music/most-played/${limit}/songs.json`
  ];

  for (const url of urls) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = await res.json();

      // Format 1: iTunes RSS (data.feed.entry)
      if (data?.feed?.entry && data.feed.entry.length > 0) {
        const result = data.feed.entry.slice(0, limit).map((e, index) => {
          const title = e['im:name']?.label || 'Unknown';
          const artist = e['im:artist']?.label || 'Unknown';
          const rawArt = e['im:image']?.[2]?.label || e['im:image']?.[0]?.label || '';
          const artwork = rawArt.replace(/\/\d+x\d+bb/, '/400x400bb');
          return {
            id: `apple-${storefront}-${index}`,
            videoId: null,
            title,
            artist,
            duration: 0,
            thumbnail: artwork,
            rank: index + 1,
            isChart: true,
          };
        });
        setCached(cacheKey, result);
        return result;
      }

      // Format 2: Apple Marketing Tools RSS (data.feed.results)
      if (data?.feed?.results && data.feed.results.length > 0) {
        const result = data.feed.results.slice(0, limit).map((song, index) => {
          const artwork = (song.artworkUrl100 || '').replace('100x100bb', '400x400bb');
          return {
            id: `apple-${storefront}-${index}`,
            videoId: null,
            title: song.name,
            artist: song.artistName,
            duration: 0,
            thumbnail: artwork,
            rank: index + 1,
            isChart: true,
          };
        });
        setCached(cacheKey, result);
        return result;
      }
    } catch {
      // try next endpoint
    }
  }
  return [];
}

export async function getTopGlobal() {
  const live = await fetchAppleMusicChart('us', 20);
  return live.length > 0 ? live : FALLBACK_TOP_GLOBAL_20;
}

export async function getTopIndia() {
  const live = await fetchAppleMusicChart('in', 20);
  return live.length > 0 ? live : FALLBACK_TOP_INDIA_20;
}

export async function getTrendingTelugu() {
  return fetchTrendingBySearch('telugu latest official audio song 2025', [
    { id: 'bIcKtiRJVmc', videoId: 'bIcKtiRJVmc', title: 'Pushpa Pushpa', artist: 'Allu Arjun / DSP', duration: 220, thumbnail: 'https://i.ytimg.com/vi/bIcKtiRJVmc/hqdefault.jpg' },
    { id: 'mGNqEGBMwPY', videoId: 'mGNqEGBMwPY', title: 'Angaaron', artist: 'Pushpa 2 / DSP', duration: 230, thumbnail: 'https://i.ytimg.com/vi/mGNqEGBMwPY/hqdefault.jpg' },
    { id: 'gJMFut2GPJY', videoId: 'gJMFut2GPJY', title: 'Kurchi Madathapetti', artist: 'Guntur Kaaram / Mahesh Babu', duration: 248, thumbnail: 'https://i.ytimg.com/vi/gJMFut2GPJY/hqdefault.jpg' },
    { id: 'IqGN-XX7jz4', videoId: 'IqGN-XX7jz4', title: 'Aa Roje', artist: 'SP Balasubrahmanyam', duration: 318, thumbnail: 'https://i.ytimg.com/vi/IqGN-XX7jz4/hqdefault.jpg' },
    { id: 'vTIBDLRGhTQ', videoId: 'vTIBDLRGhTQ', title: 'Oo Antava', artist: 'Pushpa / Indravathi Chauhan', duration: 225, thumbnail: 'https://i.ytimg.com/vi/vTIBDLRGhTQ/hqdefault.jpg' },
    { id: 'P6L2_Ao4kXI', videoId: 'P6L2_Ao4kXI', title: 'Samajavaragamana', artist: 'Ala Vaikunthapurramuloo / Sid Sriram', duration: 286, thumbnail: 'https://i.ytimg.com/vi/P6L2_Ao4kXI/hqdefault.jpg' },
    { id: 'FYMubFAdnNE', videoId: 'FYMubFAdnNE', title: 'Buttabomma', artist: 'Ala Vaikunthapurramuloo / Armaan Malik', duration: 252, thumbnail: 'https://i.ytimg.com/vi/FYMubFAdnNE/hqdefault.jpg' },
    { id: 'sYgrnamKHn4', videoId: 'sYgrnamKHn4', title: 'Ramuloo Ramulaa', artist: 'Ala Vaikunthapurramuloo / Anurag Kulkarni', duration: 268, thumbnail: 'https://i.ytimg.com/vi/sYgrnamKHn4/hqdefault.jpg' },
    { id: '9RIRSiSp2Ks', videoId: '9RIRSiSp2Ks', title: 'Inkem Inkem Kavale', artist: 'Geetha Govindam / Sid Sriram', duration: 301, thumbnail: 'https://i.ytimg.com/vi/9RIRSiSp2Ks/hqdefault.jpg' },
    { id: 'BddP6PYo2gs', videoId: 'BddP6PYo2gs', title: 'Butta Bomma', artist: 'Ala Vaikunthapurramuloo', duration: 240, thumbnail: 'https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg' },
  ]);
}

export async function getTrendingHindi() {
  return fetchTrendingBySearch('hindi latest official audio song 2025', [
    { id: 'vGJTaP6anOU', videoId: 'vGJTaP6anOU', title: 'Tum Hi Ho', artist: 'Arijit Singh', duration: 261, thumbnail: 'https://i.ytimg.com/vi/vGJTaP6anOU/hqdefault.jpg' },
    { id: 'Urdlvw0HKNU', videoId: 'Urdlvw0HKNU', title: 'Kesariya', artist: 'Arijit Singh / Brahmastra', duration: 268, thumbnail: 'https://i.ytimg.com/vi/Urdlvw0HKNU/hqdefault.jpg' },
    { id: 'cYOB941gyXI', videoId: 'cYOB941gyXI', title: 'Apna Bana Le', artist: 'Arijit Singh / Bhediya', duration: 275, thumbnail: 'https://i.ytimg.com/vi/cYOB941gyXI/hqdefault.jpg' },
    { id: 'TFHCxlRwkOA', videoId: 'TFHCxlRwkOA', title: 'Chaleya', artist: 'Arijit Singh / Jawan', duration: 234, thumbnail: 'https://i.ytimg.com/vi/TFHCxlRwkOA/hqdefault.jpg' },
    { id: 'ElcNFXpYMzs', videoId: 'ElcNFXpYMzs', title: 'With You', artist: 'AP Dhillon', duration: 195, thumbnail: 'https://i.ytimg.com/vi/ElcNFXpYMzs/hqdefault.jpg' },
    { id: 'JF8BRvqGCNs', videoId: 'JF8BRvqGCNs', title: 'Raataan Lambiyan', artist: 'Jubin Nautiyal / Shershaah', duration: 237, thumbnail: 'https://i.ytimg.com/vi/JF8BRvqGCNs/hqdefault.jpg' },
    { id: 'YR12Z8f1Dh8', videoId: 'YR12Z8f1Dh8', title: 'Tere Vaaste', artist: 'Varun Jain / Zara Hatke Zara Bachke', duration: 224, thumbnail: 'https://i.ytimg.com/vi/YR12Z8f1Dh8/hqdefault.jpg' },
    { id: 'caAkVnBpkEY', videoId: 'caAkVnBpkEY', title: 'Tera Ban Jaunga', artist: 'Akhil Sachdeva / Kabir Singh', duration: 233, thumbnail: 'https://i.ytimg.com/vi/caAkVnBpkEY/hqdefault.jpg' },
    { id: 'Fp18xTJhkGQ', videoId: 'Fp18xTJhkGQ', title: 'Maan Meri Jaan', artist: 'King', duration: 195, thumbnail: 'https://i.ytimg.com/vi/Fp18xTJhkGQ/hqdefault.jpg' },
    { id: 'wjKT6gq1jW0', videoId: 'wjKT6gq1jW0', title: 'Phir Aur Kya Chahiye', artist: 'Arijit Singh / Zara Hatke Zara Bachke', duration: 256, thumbnail: 'https://i.ytimg.com/vi/wjKT6gq1jW0/hqdefault.jpg' },
  ]);
}

export async function getTrendingEnglish() {
  return fetchTrendingBySearch('english latest official audio song 2025', [
    { id: 'f8B8w_D62Yg', videoId: 'f8B8w_D62Yg', title: 'Die With A Smile', artist: 'Lady Gaga & Bruno Mars', duration: 251, thumbnail: 'https://i.ytimg.com/vi/f8B8w_D62Yg/hqdefault.jpg' },
    { id: 'eVli-tstM5E', videoId: 'eVli-tstM5E', title: 'Espresso', artist: 'Sabrina Carpenter', duration: 175, thumbnail: 'https://i.ytimg.com/vi/eVli-tstM5E/hqdefault.jpg' },
    { id: 'V9PVRfjEBTI', videoId: 'V9PVRfjEBTI', title: 'BIRDS OF A FEATHER', artist: 'Billie Eilish', duration: 198, thumbnail: 'https://i.ytimg.com/vi/V9PVRfjEBTI/hqdefault.jpg' },
    { id: '4NRXx6U8ABQ', videoId: '4NRXx6U8ABQ', title: 'Blinding Lights', artist: 'The Weeknd', duration: 200, thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg' },
    { id: 'NPn5sC20l3U', videoId: 'NPn5sC20l3U', title: 'Not Like Us', artist: 'Kendrick Lamar', duration: 274, thumbnail: 'https://i.ytimg.com/vi/NPn5sC20l3U/hqdefault.jpg' },
    { id: 'tD4hcXgDQCg', videoId: 'tD4hcXgDQCg', title: 'I Had Some Help', artist: 'Post Malone ft. Morgan Wallen', duration: 178, thumbnail: 'https://i.ytimg.com/vi/tD4hcXgDQCg/hqdefault.jpg' },
    { id: 'ic8j13U5Z6A', videoId: 'ic8j13U5Z6A', title: 'Cruel Summer', artist: 'Taylor Swift', duration: 178, thumbnail: 'https://i.ytimg.com/vi/ic8j13U5Z6A/hqdefault.jpg' },
    { id: 'JGwWNGJdvx8', videoId: 'JGwWNGJdvx8', title: 'Shape of You', artist: 'Ed Sheeran', duration: 233, thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg' },
    { id: 'L3wKzyIN1yk', videoId: 'L3wKzyIN1yk', title: 'Levitating', artist: 'Dua Lipa', duration: 203, thumbnail: 'https://i.ytimg.com/vi/L3wKzyIN1yk/hqdefault.jpg' },
    { id: '09R8_2nJtjg', videoId: '09R8_2nJtjg', title: 'Sugar', artist: 'Maroon 5', duration: 235, thumbnail: 'https://i.ytimg.com/vi/09R8_2nJtjg/hqdefault.jpg' },
  ]);
}
