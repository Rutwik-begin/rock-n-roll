import React, { useState, useEffect, useRef } from 'react';
import { Bot, Sparkles, X, Send, Play, Loader, RefreshCw } from 'lucide-react';
import { chatWithRockBot } from '../services/gemini';
import { searchTracks } from '../services/search';

export default function RockBotWidget({ onPlayTrack, onShowToast }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Hey! I'm Rock Bot 🤖, your AI Music Assistant. Ask me for recommendations, playlist ideas, or music trivia!",
      recommendations: []
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackCardsMap, setTrackCardsMap] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputQuery.trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setLoading(true);

    try {
      const response = await chatWithRockBot(text, messages);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: response.text,
        recommendations: response.recommendations || []
      };
      setMessages(prev => [...prev, botMsg]);

      // If bot returned search keywords, fetch track details for direct play buttons
      if (response.recommendations && response.recommendations.length > 0) {
        for (const recKw of response.recommendations.slice(0, 3)) {
          searchTracks(recKw, 1).then(found => {
            if (found && found.length > 0) {
              setTrackCardsMap(prev => ({ ...prev, [recKw]: found[0] }));
            }
          });
        }
      }
    } catch (err) {
      console.warn('Bot error:', err);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        className={`rock-bot-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Chat with Rock Bot AI Assistant"
      >
        <Bot size={24} />
        <span className="rock-bot-badge">AI</span>
      </button>

      {/* Chat Window Drawer */}
      {isOpen && (
        <div className="rock-bot-window glass-card">
          <div className="rock-bot-header">
            <div className="rock-bot-header-title">
              <div className="rock-bot-avatar">
                <Bot size={20} color="#000" />
              </div>
              <div>
                <h3>Rock Bot AI Assistant</h3>
                <span className="rock-bot-subtitle">Powered by Gemini 1.5 • 100% Free</span>
              </div>
            </div>
            <button className="modal-close-btn" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="rock-bot-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`rock-bot-msg-row ${msg.sender}`}>
                <div className={`rock-bot-bubble ${msg.sender}`}>
                  <p>{msg.text}</p>

                  {/* Recommendation Cards inside Chat */}
                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="bot-rec-container">
                      <div className="bot-rec-title">
                        <Sparkles size={13} className="text-accent" /> Recommended Songs:
                      </div>
                      <div className="bot-rec-list">
                        {msg.recommendations.map((kw, idx) => {
                          const track = trackCardsMap[kw];
                          return (
                            <div key={idx} className="bot-rec-card">
                              <div className="bot-rec-info">
                                <span className="bot-rec-kw">{track ? track.title : kw}</span>
                                {track && <span className="bot-rec-artist">{track.artist}</span>}
                              </div>
                              <button
                                className="bot-rec-play-btn"
                                onClick={async () => {
                                  let targetTrack = track;
                                  if (!targetTrack) {
                                    const results = await searchTracks(kw, 1);
                                    if (results.length > 0) targetTrack = results[0];
                                  }
                                  if (targetTrack) {
                                    onPlayTrack(targetTrack);
                                    if (onShowToast) onShowToast(`Playing: ${targetTrack.title}`, 'success');
                                  }
                                }}
                              >
                                <Play size={12} fill="#000" /> Play
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="rock-bot-msg-row bot">
                <div className="rock-bot-bubble bot loading">
                  <Loader size={16} className="spin text-accent" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="rock-bot-prompts-row">
            <button onClick={() => handleSendMessage("Recommend upbeat workout hits")}>
              🔥 Workout Hits
            </button>
            <button onClick={() => handleSendMessage("Play chill acoustic songs")}>
              ☕ Chill Acoustics
            </button>
            <button onClick={() => handleSendMessage("Surprise me based on my favorite artists")}>
              ✨ My Fav Artists
            </button>
          </div>

          {/* Input Form */}
          <form
            className="rock-bot-input-form"
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          >
            <input
              type="text"
              className="rock-bot-input"
              placeholder="Ask Rock Bot for music recommendations..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
            />
            <button type="submit" className="rock-bot-send-btn" disabled={!inputQuery.trim() || loading}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
