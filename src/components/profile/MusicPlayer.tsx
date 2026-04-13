"use client";

import { useState, useRef, useEffect } from "react";
import { detectMusicSource, PROVIDER_NAMES } from "@/lib/musicProvider";

/**
 * LocalStorage key used to remember that the visitor has previously interacted
 * with profile music on this site.  When this flag is set we:
 *  - reveal provider embeds without requiring an extra click, and
 *  - attempt best-effort autoplay for direct-audio sources.
 *
 * It is set only after a deliberate user action (clicking "Play Profile Music"
 * or the play button), so it is never written on the first visit silently.
 */
const CONSENT_KEY = "nostalink_music_consent";

interface Props {
  src: string;
  title: string;
}

export default function MusicPlayer({ src, title }: Props) {
  const source = detectMusicSource(src);
  const isEmbed =
    source.provider !== "direct" &&
    source.provider !== "unknown" &&
    source.embedUrl !== null;

  // For embed-based sources (YouTube / SoundCloud / Spotify) we show a
  // "Play Profile Music" reveal button on first visit and skip it for
  // returning visitors who have already interacted with music here.
  const [revealed, setRevealed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Direct-audio state
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // On mount: check whether the visitor has previously interacted with music.
  // If so, pre-reveal embeds and attempt best-effort autoplay for direct audio.
  useEffect(() => {
    let hasConsent = false;
    try {
      hasConsent = localStorage.getItem(CONSENT_KEY) === "true";
    } catch {
      // localStorage may be unavailable (private mode, SSR, etc.)
    }

    if (!hasConsent) return;

    if (isEmbed) {
      setRevealed(true);
    } else {
      // Direct audio — best-effort autoplay; silently fail if browser blocks it.
      const audio = audioRef.current;
      if (!audio) return;
      audio.volume = 0.5;
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  // isEmbed is stable (derived from the src prop which does not change)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Persist that this visitor has intentionally interacted with music. */
  function saveConsent() {
    try {
      localStorage.setItem(CONSENT_KEY, "true");
    } catch {
      // ignore
    }
  }

  // ── Embed handlers ─────────────────────────────────────────────────────────

  function handleRevealEmbed() {
    setRevealed(true);
    saveConsent();
  }

  // ── Direct-audio handlers ──────────────────────────────────────────────────

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio
        .play()
        .then(() => {
          setPlaying(true);
          saveConsent();
        })
        .catch(() => setPlaying(false));
    }
  }

  function handleTimeUpdate() {
    if (!audioRef.current) return;
    setProgress(
      (audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100
    );
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    if (!audioRef.current) return;
    audioRef.current.currentTime =
      (parseFloat(e.target.value) / 100) * (audioRef.current.duration || 0);
  }

  // Hide the widget entirely for unrecognised URLs.
  if (source.provider === "unknown") return null;

  const providerLabel = PROVIDER_NAMES[source.provider];

  return (
    <div className="fp-music-bar">
      {/* ── Header row ─────────────────────────────────────────────── */}
      <div className="fp-music-row">
        <span className="fp-music-label">🎵 {title}&apos;s song</span>
        <span className="fp-music-provider-badge">{providerLabel}</span>

        {/* Inline play/pause button for direct audio */}
        {!isEmbed && (
          <button
            onClick={togglePlay}
            className="fp-music-btn"
            title={playing ? "Pause" : "Play"}
          >
            {playing ? "⏸" : "▶"}
          </button>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="fp-music-min"
          aria-label={collapsed ? "Expand music player" : "Collapse music player"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "▼" : "▲"}
        </button>
      </div>

      {/* ── Expandable body ────────────────────────────────────────── */}
      {!collapsed && (
        <div className="fp-music-body">
          {isEmbed ? (
            revealed && source.embedUrl ? (
              /* Provider embed (YouTube / SoundCloud / Spotify) */
              <div className="fp-music-embed">
                <iframe
                  src={source.embedUrl}
                  width="100%"
                  height={source.provider === "spotify" ? "80" : "120"}
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  title={`${title}'s profile music`}
                  loading="lazy"
                />
              </div>
            ) : (
              /* First-visit reveal button */
              <div className="fp-music-reveal">
                <button
                  onClick={handleRevealEmbed}
                  className="fp-music-reveal-btn"
                >
                  ▶ Play Profile Music
                </button>
                <p className="fp-music-hint">
                  Your play preference will be remembered for future visits.
                </p>
              </div>
            )
          ) : (
            /* Direct-audio controls */
            <div className="fp-music-controls">
              <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setPlaying(false)}
              />
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
