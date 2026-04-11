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
    <div className="fixed bottom-16 md:bottom-4 left-4 z-50 bg-gray-900 text-white rounded-xl shadow-2xl overflow-hidden">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setPlaying(false)}
      />
      <div className="flex items-center gap-2 px-3 py-2">
        <button onClick={togglePlay} className="text-xl w-8 h-8 flex items-center justify-center">
          {playing ? "⏸" : "▶️"}
        </button>
        {!minimized && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{title}</p>
              <input
                type="range"
                min={0}
                max={100}
                value={progress}
                onChange={handleSeek}
                className="w-full h-1 mt-1 accent-indigo-400"
              />
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolumeChange}
              className="w-12 h-1 accent-indigo-400"
            />
          </>
        )}
        <button
          onClick={() => setMinimized(!minimized)}
          className="text-xs text-gray-400 hover:text-white ml-1"
        >
          {minimized ? "⬆" : "⬇"}
        </button>
      </div>
    </div>
  );
}
