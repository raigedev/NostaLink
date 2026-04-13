export type MusicProvider = "youtube" | "soundcloud" | "spotify" | "direct" | "unknown";

export interface MusicSource {
  provider: MusicProvider;
  /** Embed-ready iframe src URL, or null for direct-audio / unknown sources */
  embedUrl: string | null;
  originalUrl: string;
}

/**
 * Detect the music provider from a URL and return the embed-ready URL where
 * applicable.
 *
 * Supported providers:
 *  - YouTube  (youtube.com/watch?v=…, youtu.be/…, music.youtube.com/…)
 *  - SoundCloud (soundcloud.com/…)
 *  - Spotify  (open.spotify.com/track|album|playlist/…)
 *  - Direct audio (.mp3, .ogg, .wav, .flac, .aac, .m4a, .opus)
 *
 * Returns provider "unknown" for anything else so the player can hide itself.
 */
export function detectMusicSource(url: string): MusicSource {
  const trimmed = url?.trim() ?? "";
  if (!trimmed) return { provider: "unknown", embedUrl: null, originalUrl: url };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { provider: "unknown", embedUrl: null, originalUrl: url };
  }

  const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();

  // ── YouTube ───────────────────────────────────────────────────────────────
  if (
    hostname === "youtube.com" ||
    hostname === "music.youtube.com" ||
    hostname === "m.youtube.com"
  ) {
    const videoId = parsed.searchParams.get("v");
    if (videoId && /^[\w-]{11}$/.test(videoId)) {
      return {
        provider: "youtube",
        embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0`,
        originalUrl: trimmed,
      };
    }
  }
  if (hostname === "youtu.be") {
    const videoId = parsed.pathname.slice(1).split("?")[0];
    if (videoId && /^[\w-]{11}$/.test(videoId)) {
      return {
        provider: "youtube",
        embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0`,
        originalUrl: trimmed,
      };
    }
  }

  // ── SoundCloud ────────────────────────────────────────────────────────────
  if (hostname === "soundcloud.com") {
    return {
      provider: "soundcloud",
      embedUrl: [
        "https://w.soundcloud.com/player/?url=",
        encodeURIComponent(trimmed),
        "&color=%23ff5500&auto_play=false&hide_related=true",
        "&show_comments=false&show_user=true&show_reposts=false",
        "&show_teaser=false&visual=false",
      ].join(""),
      originalUrl: trimmed,
    };
  }

  // ── Spotify ───────────────────────────────────────────────────────────────
  if (hostname === "open.spotify.com") {
    // /track/…, /album/…, /playlist/… → /embed/track/…, etc.
    const match = parsed.pathname.match(/^\/(track|album|playlist|episode)\/([\w]+)/);
    if (match) {
      return {
        provider: "spotify",
        embedUrl: `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`,
        originalUrl: trimmed,
      };
    }
  }

  // ── Direct audio ──────────────────────────────────────────────────────────
  const ext = parsed.pathname.split(".").pop()?.toLowerCase() ?? "";
  if (["mp3", "ogg", "wav", "flac", "aac", "m4a", "opus"].includes(ext)) {
    return { provider: "direct", embedUrl: null, originalUrl: trimmed };
  }

  // Supabase / CDN-style storage URLs commonly lack an extension — treat them
  // as direct audio if they already look like blob / CDN links that were
  // previously accepted by the upload path.
  if (
    (hostname.endsWith(".supabase.co") || hostname.endsWith(".supabase.in")) &&
    parsed.pathname.includes("/storage/")
  ) {
    return { provider: "direct", embedUrl: null, originalUrl: trimmed };
  }

  return { provider: "unknown", embedUrl: null, originalUrl: trimmed };
}

/**
 * Validate a music URL entered by the user.
 * Returns `{ valid: true }` or `{ valid: false, error: "…" }`.
 */
export function validateMusicUrl(url: string): { valid: boolean; error?: string } {
  if (!url || url.trim() === "") {
    return { valid: false, error: "Please enter a URL." };
  }

  try {
    new URL(url.trim());
  } catch {
    return { valid: false, error: "That doesn't look like a valid URL." };
  }

  const { provider } = detectMusicSource(url);

  if (provider === "unknown") {
    return {
      valid: false,
      error:
        "Unsupported link. Paste a YouTube, SoundCloud, or Spotify link, or a direct audio file URL (.mp3, .ogg, etc.).",
    };
  }

  return { valid: true };
}

/** Human-readable provider name for display in the widget. */
export const PROVIDER_NAMES: Record<MusicProvider, string> = {
  youtube: "YouTube",
  soundcloud: "SoundCloud",
  spotify: "Spotify",
  direct: "Audio",
  unknown: "Music",
};
