# 🎸 Rock 'N Roll - Premium Web Music Streaming & PWA App

![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-5.1-646CFF?style=for-the-badge&logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Database-3ECF8E?style=for-the-badge&logo=supabase)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Rock 'N Roll** is a modern, high-fidelity web music player and Progressive Web App (PWA) inspired by Spotify and Apple Music. Built with React, Vite, Supabase, and YouTube Audio Engine, it delivers seamless cloud sync, real-time karaoke lyrics, custom playlist management, podcasts, and mobile responsiveness.

---

## ✨ Features

- 🎵 **High-Fidelity Audio Streaming**: Powered by YouTube Audio Engine with resolution for regional and global charts.
- 🎤 **Live Karaoke Lyrics**: Synced real-time scrolling lyrics with word-by-word karaoke highlighting.
- 📱 **Mobile PWA Ready**: Installable on Android & iOS devices with native bottom navigation and media notification controls.
- ☁️ **Supabase Cloud Sync**: Instant synchronization of user authentication, liked tracks, playlists, and listening history across all devices.
- 📻 **Podcast Streaming Engine**: Built-in podcast search and buffer-free playback support.
- 🎨 **Glassmorphism Dark Theme**: Modern dark aesthetic with smooth ambient color glows and micro-animations.
- 🔐 **Profile & Password Management**: Self-serve nickname updates, email management, and secure password updates.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Modern Vanilla CSS Design System, Glassmorphism
- **Backend & Database**: Supabase (Auth, PostgreSQL, Row Level Security)
- **Audio & Lyrics**: YouTube IFrame Player API, LrcLib API
- **Deployment**: Vercel & PWA Manifest

---

## ⚖️ Disclaimer & Content Attribution

- **Content Ownership**: All music, audio streams, song titles, artist names, album artwork, and lyrics belong exclusively to their respective original copyright holders, artists, and record labels.
- **YouTube Platform Integration**: All audio streaming is powered via official YouTube APIs. All play counts, views, and engagement accrue directly to the original content creators on YouTube.
- **Non-Commercial & Educational**: This project is built solely for educational, personal, and non-commercial portfolio purposes. The application does not host, store, download, or sell any copyright-protected audio files.

---

## 🚀 Quick Start (Local Setup)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Rutwik-begin/rock-n-roll.git
   cd rock-n-roll
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.
