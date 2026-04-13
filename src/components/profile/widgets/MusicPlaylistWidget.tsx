"use client";

import { useState } from "react";

interface Track { title: string; artist: string; duration: string; }

const SAMPLE: Track[] = [
  { title: "Digital Love", artist: "Daft Punk", duration: "4:58" },
  { title: "Around the World", artist: "Daft Punk", duration: "7:10" },
  { title: "One More Time", artist: "Daft Punk", duration: "5:20" },
];

export default function MusicPlaylistWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fp-section">
      <button
        className="fp-section-header blue fp-music-playlist-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        🎵 My Playlist <span className="fp-music-playlist-chevron">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="fp-section-body">
          {SAMPLE.map((t, i) => (
            <div key={i} className="fp-music-playlist-row">
              <span className="fp-music-playlist-num">{i + 1}</span>
              <div className="fp-music-playlist-info">
                <span className="fp-music-playlist-title">{t.title}</span>
                <span className="fp-music-playlist-artist">{t.artist}</span>
              </div>
              <span className="fp-music-playlist-dur">{t.duration}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
