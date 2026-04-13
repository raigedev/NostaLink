"use client";

import { useState, useRef } from "react";

interface Props {
  src: string;
  title: string;
}

export default function MusicPlayer({ src, title }: Props) {
  const [playing, setPlaying] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
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
      <div className="fp-music-header">
        🎵 Profile Music
      </div>
      <div className="fp-music-body">
        <button onClick={togglePlay} className="fp-music-btn" title={playing ? "Pause" : "Play"}>
          {playing ? "⏸" : "▶"}
        </button>
        {!minimized && (
          <>
            <div className="fp-music-info">
              <div className="fp-music-title">{title}&apos;s song</div>
              <input
                type="range"
                min={0}
                max={100}
                value={progress}
                onChange={handleSeek}
                className="fp-music-progress"
              />
            </div>
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
          onClick={() => setMinimized(!minimized)}
          className="fp-music-min"
          title={minimized ? "Expand" : "Collapse"}
        >
          {minimized ? "▲" : "▼"}
        </button>
      </div>
    </div>
  );
}
