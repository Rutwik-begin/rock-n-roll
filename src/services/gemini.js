/**
 * Gemini 1.5 Flash AI Service
 * Direct REST API client for Google Gemini 1.5 Flash.
 * Runs 100% free within 1,500 requests/day quota limit.
 */

import { getDailyQuotaStats, incrementUsage, getUserPreferences } from './usageTracker';

// Demo fallback API key or user-provided env key
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function chatWithRockBot(userMessage, chatHistory = []) {
  const quota = getDailyQuotaStats();
  if (quota.remainingToday <= 0) {
    return {
      text: "I've hit my daily 1,500 free AI requests limit for today! I'll be refreshed at midnight UTC, but you can still use manual search and listen to music as usual! 🎵",
      recommendations: []
    };
  }

  const prefs = getUserPreferences();
  const favoriteArtistsText = prefs.artists && prefs.artists.length > 0
    ? `The user's favorite artists are: ${prefs.artists.join(', ')}.`
    : '';
  const favoriteGenresText = prefs.genres && prefs.genres.length > 0
    ? `The user's favorite genres/languages are: ${prefs.genres.join(', ')}.`
    : '';

  const systemInstruction = `
You are "Rock Bot", a friendly, knowledgeable, and energetic AI Music Assistant for the Rock 'N Roll Music App.
${favoriteArtistsText}
${favoriteGenresText}

Your goal:
1. Provide a concise, engaging response (2-3 sentences max).
2. Recommend 2 to 4 specific songs or music search keywords matching the user's prompt or taste.
3. At the end of your response, output a valid JSON block containing an array of song search keywords under the key "recommendations". Example:
\`\`\`json
{
  "recommendations": ["Kesariya Brahmastra", "Samajavaragamana Sid Sriram", "Tum Hi Ho Arijit Singh"]
}
\`\`\`
  `;

  const contents = [
    { role: 'user', parts: [{ text: systemInstruction }] },
    ...chatHistory.map(msg => ({
      role: msg.sender === 'bot' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    })),
    { role: 'user', parts: [{ text: userMessage }] }
  ];

  try {
    // If no API key configured, provide smart fallback recommendations
    if (!API_KEY) {
      incrementUsage();
      return getSmartFallbackResponse(userMessage, prefs);
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    if (!response.ok) {
      incrementUsage();
      return getSmartFallbackResponse(userMessage, prefs);
    }

    const data = await response.json();
    incrementUsage();

    const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extract JSON recommendations block if present
    let recommendations = [];
    const jsonMatch = textOutput.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
          recommendations = parsed.recommendations;
        }
      } catch (e) {}
    }

    // Clean markdown code blocks from visible text
    const cleanText = textOutput.replace(/```json[\s\S]*?```/gi, '').trim();

    return {
      text: cleanText || "Here are some awesome track recommendations for you! 🎧",
      recommendations
    };
  } catch (err) {
    console.warn('Gemini API call failed, using smart fallback:', err);
    incrementUsage();
    return getSmartFallbackResponse(userMessage, prefs);
  }
}

function getSmartFallbackResponse(userMessage, prefs) {
  const msgLower = userMessage.toLowerCase();
  let text = "Here are some top recommended tracks tailored for your music taste! 🎵";
  let recommendations = ["Kesariya Brahmastra", "Samajavaragamana Sid Sriram", "Tum Hi Ho Arijit Singh"];

  if (prefs.artists && prefs.artists.length > 0) {
    const artist = prefs.artists[Math.floor(Math.random() * prefs.artists.length)];
    text = `Based on your favorite artist **${artist}**, check out these amazing tracks! 🎧`;
    recommendations = [`${artist} latest top hits`, `${artist} best songs`, "Pushpa 2 songs"];
  }

  if (msgLower.includes('chill') || msgLower.includes('relax') || msgLower.includes('lofi')) {
    text = "Here are some relaxing chill & lo-fi vibes for your mood! ☕✨";
    recommendations = ["lofi hip hop chill beats", "Arijit Singh acoustic chill", "Sid Sriram melodies"];
  } else if (msgLower.includes('party') || msgLower.includes('dance') || msgLower.includes('hype')) {
    text = "Let's turn up the volume! Here are high-energy party and dance tracks! 🎉🔥";
    recommendations = ["Kurchi Madathapetti Guntur Kaaram", "Naatu Naatu RRR", "Not Like Us Kendrick Lamar"];
  }

  return { text, recommendations };
}

/**
 * AI Movie Album Verification Agent
 * Uses Gemini AI to review raw YouTube candidate tracks, filter out sequels (e.g. Pushpa 2 when searching Pushpa 1),
 * filter out wrong language dubs (e.g. Bengali/Tamil), and return ONLY the valid tracks for the target movie.
 */
export async function verifyMovieAlbumWithAI(movieTitle, candidateTracks = []) {
  if (!candidateTracks || candidateTracks.length === 0) return candidateTracks;

  const quota = getDailyQuotaStats();
  if (quota.remainingToday <= 0) return candidateTracks;

  const trackListSummary = candidateTracks.map((t, idx) => ({
    index: idx,
    id: t.id,
    title: t.title,
    artist: t.artist
  }));

  const prompt = `
You are a precision AI Music Discography Verification Agent.
Target Movie: "${movieTitle}"

Candidate Tracks list:
${JSON.stringify(trackListSummary, null, 2)}

Instructions:
1. Identify the exact movie part/title (e.g., if target movie is "Pushpa" or "Pushpa 1", exclude "Pushpa 2 The Rule" or sequels unless requested).
2. Exclude songs dubbed in secondary languages (e.g., Bengali, Tamil, Malayalam, Hindi) if the movie is originally Telugu/Hindi, unless the query explicitly specifies that language.
3. Exclude duplicate songs or trailer audio.
4. Select ONLY the valid song indices from the candidate list that truly belong to the movie "${movieTitle}".
5. Output ONLY a valid JSON array of valid indices in order. Example:
\`\`\`json
[0, 1, 3, 5]
\`\`\`
  `;

  try {
    if (!API_KEY) return null; // Fallback to client-side filter

    const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    incrementUsage();

    const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = textOutput.match(/```json\s*([\s\S]*?)\s*```/);
    
    if (jsonMatch && jsonMatch[1]) {
      const validIndices = JSON.parse(jsonMatch[1]);
      if (Array.isArray(validIndices) && validIndices.length > 0) {
        return validIndices
          .map(i => candidateTracks[i])
          .filter(Boolean);
      }
    }
  } catch (err) {
    console.warn('Gemini album verification failed, using client filter fallback:', err);
  }

  return null;
}

