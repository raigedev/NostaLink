"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  src: string;
  title: string;
}

export default function MusicPlayer({ src, title }: Props) {
  const [playing, setPlaying] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Attempt autoplay on mount; gracefully handle browser autoplay blocks
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.play().then(() => setPlaying(true)).catch(() => {
      // Browser blocked autoplay — user must interact to start playback
      setPlaying(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }

  function handleTimeUpdate() {
    if (!audioRef.current) return;
    const pct = (audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100;
    setProgress(pct);
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    if (!audioRef.current) return;
    const t = (parseFloat(e.target.value) / 100) * audioRef.current.duration;
    audioRef.current.currentTime = t;
  }

  return (
    <div className="fp-music-bar">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setPlaying(false)}
      />
      {/* Single compact row — label · play · [progress · volume when expanded] · toggle */}
      <div className="fp-music-row">
        <span className="fp-music-label">🎵 {title}&apos;s song</span>
        <button onClick={togglePlay} className="fp-music-btn" title={playing ? "Pause" : "Play"}>
          {playing ? "⏸" : "▶"}
        </button>
        {!collapsed && (
          <>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={handleSeek}
              className="fp-music-progress"
              title="Seek"
            />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolumeChange}
              className="fp-music-vol"
              title="Volume"
            />
          </>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="fp-music-min"
          title={collapsed ? "Expand controls" : "Collapse controls"}
        >
          {collapsed ? "▶▶" : "▼"}
        </button>
      </div>
    </div>
  );
}
