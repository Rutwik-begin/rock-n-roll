import React, { useState, useEffect, useRef } from 'react';
import { X, Mic2, AlertCircle, Loader } from 'lucide-react';
import { fetchLyrics } from '../services/lyrics';
import { yt } from '../services/youtube';

export default function LyricsView({ track, onClose }) {
  const [lyricsData, setLyricsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const containerRef = useRef(null);
  const activeLineRef = useRef(null);

  // Fetch lyrics
  useEffect(() => {
    if (!track) return;
    let isMounted = true;
    
    setLoading(true);
    setError(false);
    setLyricsData(null);

    async function loadLyrics() {
      const data = await fetchLyrics(track.title, track.artist);
      if (!isMounted) return;
      if (!data) {
        setError(true);
      } else {
        setLyricsData(data);
      }
      setLoading(false);
    }
    loadLyrics();

    return () => { isMounted = false; };
  }, [track]);

  // Hook into YouTube time updates
  useEffect(() => {
    const handleTime = (cur) => setCurrentTime(cur);
    yt.addTimeListener(handleTime);
    return () => yt.removeTimeListener(handleTime);
  }, []);

  // Find currently active line index
  let activeLineIndex = -1;
  if (lyricsData && lyricsData.synced) {
    for (let i = lyricsData.synced.length - 1; i >= 0; i--) {
      if (currentTime >= lyricsData.synced[i].time) {
        activeLineIndex = i;
        break;
      }
    }
  }

  // Auto-scroll to active line ONLY when line index changes
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeLineIndex, lyricsData]);

  const hasSynced = lyricsData && lyricsData.synced && lyricsData.synced.length > 0;

  return (
    <div className="lyrics-overlay" style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 2500,
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(45px)',
      WebkitBackdropFilter: 'blur(45px)',
      animation: 'fadeIn 0.3s ease',
      overflow: 'hidden'
    }}>
      {/* Dynamic Background */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%', right: '-10%', bottom: '-10%',
        backgroundImage: `url(${track?.thumbnail})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(80px) brightness(0.3) saturate(1.5)',
        zIndex: -1,
        opacity: 0.6
      }} />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src={track?.thumbnail} alt="" style={{ width: 56, height: 56, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{track?.title}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{track?.artist}</div>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none',
          width: 40, height: 40, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', cursor: 'pointer', transition: 'all 0.2s'
        }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
           onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
          <X size={24} />
        </button>
      </div>

      {/* Lyrics Content */}
      <div ref={containerRef} style={{
        flex: 1, overflowY: 'auto', padding: '40px 10%',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)'
      }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, margin: 'auto' }}>
            <Loader size={32} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
            <div style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Searching for lyrics...</div>
          </div>
        )}

        {!loading && error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, margin: 'auto', textAlign: 'center' }}>
            <Mic2 size={48} color="rgba(255,255,255,0.2)" />
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 20, fontWeight: 700 }}>No Synced Lyrics Found</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 420 }}>
              We couldn't automatically find synced lyrics for "{track?.title}". It might be an instrumental, remix, or listed under a different title.
            </div>
          </div>
        )}

        {!loading && !error && hasSynced && (
          <div style={{ width: '100%', maxWidth: 800, paddingBottom: '50vh' }}>
            {lyricsData.synced.map((line, i) => {
              // Find if this is the currently active line
              const isPast = currentTime >= line.time;
              const nextLine = lyricsData.synced[i + 1];
              const isCurrent = isPast && (!nextLine || currentTime < nextLine.time);

              // Calculate progressive fill for the current line
              let progress = 0;
              if (isCurrent && nextLine) {
                const duration = nextLine.time - line.time;
                const elapsed = currentTime - line.time;
                progress = Math.min(100, Math.max(0, (elapsed / duration) * 100));
              } else if (isPast && !isCurrent) {
                progress = 100;
              }

              // Calculate how many words should be highlighted based on progress
              const words = line.words || [line.text || '♪'];
              const activeWordIndex = isCurrent 
                ? Math.floor((progress / 100) * words.length)
                : (isPast ? words.length : -1);

              return (
                <div
                  key={i}
                  ref={isCurrent ? activeLineRef : null}
                  style={{
                    width: '100%',
                    fontSize: isCurrent ? 36 : 28,
                    fontWeight: isCurrent ? 800 : 700,
                    margin: '16px 0',
                    transition: 'font-size 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.4s',
                    textAlign: 'center',
                    transform: isCurrent ? 'scale(1.05)' : 'scale(1)'
                  }}
                >
                  {words.map((word, wIdx) => {
                    const isWordActive = wIdx <= activeWordIndex;
                    return (
                      <span key={wIdx} style={{
                        color: isWordActive ? '#ffffff' : 'rgba(255,255,255,0.3)',
                        transition: 'color 0.2s ease',
                        marginRight: '0.25em'
                      }}>
                        {word}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && !hasSynced && lyricsData?.plain && (
          <div style={{
            width: '100%', maxWidth: 800, paddingBottom: 60,
            color: 'rgba(255,255,255,0.8)', fontSize: 22, lineHeight: 1.8,
            fontWeight: 500, textAlign: 'center', whiteSpace: 'pre-wrap'
          }}>
            {lyricsData.plain}
          </div>
        )}
      </div>
    </div>
  );
}
